"""Student dashboard service layer handling personal executive summary, subject breakdown, and trends."""

from datetime import date
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, case, distinct, func, select
from sqlalchemy.orm import Session

from app.models.attendance_records import AttendanceRecord
from app.models.classes import Class
from app.models.correction_requests import CorrectionRequest
from app.models.departments import Department
from app.models.enrollments import Enrollment
from app.models.lectures import Lecture
from app.models.subjects import Subject
from app.models.teaching_assignments import TeachingAssignment
from app.schemas.student_dashboard import (
    StudentAttendanceTrendItem,
    StudentAttendanceTrendsResponse,
    StudentDashboardSummaryResponse,
    StudentSubjectPerformanceResponse,
)
from app.services.student_attendance_service import (
    get_my_attendance_summary,
    get_student_profile,
)


def get_student_dashboard_summary(
    db: Session, student_user_id: int
) -> StudentDashboardSummaryResponse:
    """Calculate executive dashboard metrics for authenticated student."""
    student = get_student_profile(db, student_user_id)

    # Active class and department
    active_enr = db.execute(
        select(Class.class_name, Department.department_name, Class.class_id)
        .select_from(Enrollment)
        .join(Class, Enrollment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
        .where(
            Enrollment.student_id == student.student_id,
            Enrollment.enrollment_status == "ACTIVE",
        )
    ).first()

    class_name = active_enr[0] if active_enr else "Not Enrolled"
    dept_name = active_enr[1] if active_enr else "Not Assigned"
    active_class_id = active_enr[2] if active_enr else None

    # Total subjects for student's class
    total_subjects = 0
    total_sub_lectures = 0
    if active_class_id:
        total_subjects = (
            db.scalar(
                select(func.count(distinct(TeachingAssignment.subject_id))).where(
                    TeachingAssignment.class_id == active_class_id
                )
            )
            or 0
        )

        total_sub_lectures = (
            db.scalar(
                select(func.count(Lecture.lecture_id))
                .join(
                    TeachingAssignment,
                    Lecture.assignment_id == TeachingAssignment.assignment_id,
                )
                .where(
                    TeachingAssignment.class_id == active_class_id,
                    Lecture.lecture_status == "SUBMITTED",
                )
            )
            or 0
        )

    # Present and Absent counts across submitted lectures
    counts = db.execute(
        select(
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)),
            func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)),
        )
        .select_from(AttendanceRecord)
        .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
        .where(
            AttendanceRecord.student_id == student.student_id,
            Lecture.lecture_status == "SUBMITTED",
        )
    ).first()

    present_count = int(counts[0] or 0) if counts else 0
    absent_count = int(counts[1] or 0) if counts else 0

    total_marks = present_count + absent_count
    overall_percentage = (
        round((present_count / total_marks) * 100.0, 2)
        if total_marks > 0
        else 0.0
    )

    # Correction requests breakdown
    pending_cr = (
        db.scalar(
            select(func.count(CorrectionRequest.request_id)).where(
                CorrectionRequest.student_id == student.student_id,
                CorrectionRequest.request_status == "PENDING",
            )
        )
        or 0
    )
    approved_cr = (
        db.scalar(
            select(func.count(CorrectionRequest.request_id)).where(
                CorrectionRequest.student_id == student.student_id,
                CorrectionRequest.request_status == "APPROVED",
            )
        )
        or 0
    )
    rejected_cr = (
        db.scalar(
            select(func.count(CorrectionRequest.request_id)).where(
                CorrectionRequest.student_id == student.student_id,
                CorrectionRequest.request_status == "REJECTED",
            )
        )
        or 0
    )

    return StudentDashboardSummaryResponse(
        student_id=student.student_id,
        student_name=student.student_name,
        roll_number=student.roll_number,
        active_class_name=class_name,
        department_name=dept_name,
        total_subjects=total_subjects,
        total_submitted_lectures=total_sub_lectures,
        present_count=present_count,
        absent_count=absent_count,
        overall_attendance_percentage=overall_percentage,
        pending_correction_requests=pending_cr,
        approved_correction_requests=approved_cr,
        rejected_correction_requests=rejected_cr,
    )


def get_student_subject_performance(
    db: Session, student_user_id: int
) -> StudentSubjectPerformanceResponse:
    """Retrieve detailed subject-wise attendance performance for student dashboard."""
    summary = get_my_attendance_summary(db, student_user_id)
    return StudentSubjectPerformanceResponse(
        student_id=summary.student_id,
        student_name=summary.student_name,
        roll_number=summary.roll_number,
        items=summary.subjects,
    )


def get_student_attendance_trends(
    db: Session,
    student_user_id: int,
    period: str = "daily",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    subject_id: Optional[int] = None,
) -> StudentAttendanceTrendsResponse:
    """Calculate chronological attendance trend for student's attended lectures."""
    student = get_student_profile(db, student_user_id)

    clean_period = period.strip().lower()
    if clean_period not in ("daily", "weekly", "monthly"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Period must be one of: 'daily', 'weekly', 'monthly'.",
        )

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be later than end_date.",
        )

    fmt_map = {"daily": "%Y-%m-%d", "weekly": "%x-W%v", "monthly": "%Y-%m"}
    period_col = func.date_format(Lecture.lecture_date, fmt_map[clean_period]).label("period")

    stmt = (
        select(
            period_col,
            func.count(distinct(Lecture.lecture_id)).label("total_lectures"),
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label("present_count"),
            func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)).label("absent_count"),
        )
        .select_from(AttendanceRecord)
        .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
        .join(
            TeachingAssignment,
            Lecture.assignment_id == TeachingAssignment.assignment_id,
        )
        .where(
            AttendanceRecord.student_id == student.student_id,
            Lecture.lecture_status == "SUBMITTED",
        )
    )

    if subject_id is not None:
        stmt = stmt.where(TeachingAssignment.subject_id == subject_id)
    if start_date:
        stmt = stmt.where(Lecture.lecture_date >= start_date)
    if end_date:
        stmt = stmt.where(Lecture.lecture_date <= end_date)

    stmt = stmt.group_by(period_col).order_by(period_col.asc())
    rows = db.execute(stmt).all()

    items = []
    for r in rows:
        p_cnt = int(r[2] or 0)
        a_cnt = int(r[3] or 0)
        tot = p_cnt + a_cnt
        pct = round((p_cnt / tot) * 100.0, 2) if tot > 0 else 0.0
        items.append(
            StudentAttendanceTrendItem(
                period=str(r[0]),
                total_lectures=int(r[1] or 0),
                present_count=p_cnt,
                absent_count=a_cnt,
                attendance_percentage=pct,
            )
        )

    return StudentAttendanceTrendsResponse(
        period_type=clean_period,
        total_periods=len(items),
        items=items,
    )
