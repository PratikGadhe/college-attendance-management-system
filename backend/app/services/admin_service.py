"""Admin dashboard service layer implementing read-only analytical and overview queries."""

from datetime import date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.attendance_records import AttendanceRecord
from app.models.classes import Class
from app.models.correction_requests import CorrectionRequest
from app.models.departments import Department
from app.models.enrollments import Enrollment
from app.models.faculty import Faculty
from app.models.lectures import Lecture
from app.models.students import Student
from app.models.subjects import Subject
from app.models.teaching_assignments import TeachingAssignment
from app.models.users import User
from app.schemas.admin import (
    DashboardSummaryResponse,
    PendingCorrectionResponse,
    RecentLectureResponse,
)
from app.schemas.admin_dashboard import (
    AttendanceDistributionResponse,
    AttendanceTrendItem,
    AttendanceTrendsResponse,
)


def get_dashboard_summary(db: Session) -> DashboardSummaryResponse:
    """Compute high-level counts and breakdown metrics for the admin dashboard.

    Uses independent aggregate queries to prevent count inflation caused by table joins.
    """
    # Student counts (profile vs user account status)
    total_students = db.scalar(select(func.count(Student.student_id))) or 0
    active_students = (
        db.scalar(
            select(func.count(Student.student_id))
            .join(User, Student.user_id == User.user_id)
            .where(User.account_status == "ACTIVE")
        )
        or 0
    )
    inactive_students = (
        db.scalar(
            select(func.count(Student.student_id))
            .join(User, Student.user_id == User.user_id)
            .where(User.account_status != "ACTIVE")
        )
        or 0
    )

    # Faculty counts (profile vs user account status)
    total_faculty = db.scalar(select(func.count(Faculty.faculty_id))) or 0
    active_faculty = (
        db.scalar(
            select(func.count(Faculty.faculty_id))
            .join(User, Faculty.user_id == User.user_id)
            .where(User.account_status == "ACTIVE")
        )
        or 0
    )
    inactive_faculty = (
        db.scalar(
            select(func.count(Faculty.faculty_id))
            .join(User, Faculty.user_id == User.user_id)
            .where(User.account_status != "ACTIVE")
        )
        or 0
    )

    # Academic structure metrics
    total_departments = db.scalar(select(func.count(Department.department_id))) or 0
    total_classes = db.scalar(select(func.count(Class.class_id))) or 0
    total_subjects = db.scalar(select(func.count(Subject.subject_id))) or 0

    # Enrollment metrics
    total_enrollments = db.scalar(select(func.count(Enrollment.enrollment_id))) or 0
    active_enrollments = (
        db.scalar(
            select(func.count(Enrollment.enrollment_id)).where(
                Enrollment.enrollment_status == "ACTIVE"
            )
        )
        or 0
    )

    # Teaching assignments
    total_teaching_assignments = (
        db.scalar(select(func.count(TeachingAssignment.assignment_id))) or 0
    )

    # Lecture metrics by status
    total_lectures = db.scalar(select(func.count(Lecture.lecture_id))) or 0
    submitted_lectures = (
        db.scalar(
            select(func.count(Lecture.lecture_id)).where(
                Lecture.lecture_status == "SUBMITTED"
            )
        )
        or 0
    )
    draft_lectures = (
        db.scalar(
            select(func.count(Lecture.lecture_id)).where(
                Lecture.lecture_status == "DRAFT"
            )
        )
        or 0
    )
    cancelled_lectures = (
        db.scalar(
            select(func.count(Lecture.lecture_id)).where(
                Lecture.lecture_status == "CANCELLED"
            )
        )
        or 0
    )

    # Attendance metrics for SUBMITTED lectures only
    sub_lectures_query = select(Lecture.lecture_id).where(
        Lecture.lecture_status == "SUBMITTED"
    )
    total_attendance_records_for_submitted_lectures = (
        db.scalar(
            select(func.count(AttendanceRecord.attendance_id)).where(
                AttendanceRecord.lecture_id.in_(sub_lectures_query)
            )
        )
        or 0
    )
    total_present = (
        db.scalar(
            select(func.count(AttendanceRecord.attendance_id)).where(
                AttendanceRecord.lecture_id.in_(sub_lectures_query),
                AttendanceRecord.status == "PRESENT",
            )
        )
        or 0
    )
    total_absent = (
        db.scalar(
            select(func.count(AttendanceRecord.attendance_id)).where(
                AttendanceRecord.lecture_id.in_(sub_lectures_query),
                AttendanceRecord.status == "ABSENT",
            )
        )
        or 0
    )
    overall_attendance_percentage = (
        round(
            (total_present / total_attendance_records_for_submitted_lectures) * 100.0,
            2,
        )
        if total_attendance_records_for_submitted_lectures > 0
        else 0.0
    )

    # Correction requests metrics
    total_correction_requests = (
        db.scalar(select(func.count(CorrectionRequest.request_id))) or 0
    )
    pending_correction_requests = (
        db.scalar(
            select(func.count(CorrectionRequest.request_id)).where(
                CorrectionRequest.request_status == "PENDING"
            )
        )
        or 0
    )
    approved_correction_requests = (
        db.scalar(
            select(func.count(CorrectionRequest.request_id)).where(
                CorrectionRequest.request_status == "APPROVED"
            )
        )
        or 0
    )
    rejected_correction_requests = (
        db.scalar(
            select(func.count(CorrectionRequest.request_id)).where(
                CorrectionRequest.request_status == "REJECTED"
            )
        )
        or 0
    )

    return DashboardSummaryResponse(
        total_students=total_students,
        active_students=active_students,
        inactive_students=inactive_students,
        total_faculty=total_faculty,
        active_faculty=active_faculty,
        inactive_faculty=inactive_faculty,
        total_departments=total_departments,
        total_classes=total_classes,
        total_subjects=total_subjects,
        total_enrollments=total_enrollments,
        active_enrollments=active_enrollments,
        total_teaching_assignments=total_teaching_assignments,
        total_lectures=total_lectures,
        submitted_lectures=submitted_lectures,
        draft_lectures=draft_lectures,
        cancelled_lectures=cancelled_lectures,
        total_attendance_records_for_submitted_lectures=total_attendance_records_for_submitted_lectures,
        total_present=total_present,
        total_absent=total_absent,
        overall_attendance_percentage=overall_attendance_percentage,
        total_correction_requests=total_correction_requests,
        pending_correction_requests=pending_correction_requests,
        approved_correction_requests=approved_correction_requests,
        rejected_correction_requests=rejected_correction_requests,
    )


def get_recent_lectures(db: Session, limit: int = 10) -> List[RecentLectureResponse]:
    """Retrieve the latest lectures ordered by lecture_date and creation timestamp with attendance counts."""
    stmt = (
        select(Lecture)
        .options(
            joinedload(Lecture.assignment).joinedload(TeachingAssignment.faculty),
            joinedload(Lecture.assignment).joinedload(TeachingAssignment.subject),
            joinedload(Lecture.assignment).joinedload(TeachingAssignment.class_),
        )
        .order_by(
            Lecture.lecture_date.desc(),
            Lecture.created_at.desc(),
            Lecture.lecture_id.desc(),
        )
        .limit(limit)
    )

    lectures = db.scalars(stmt).unique().all()

    # Calculate present/absent counts for these recent lectures
    lecture_ids = [l.lecture_id for l in lectures]
    counts_map = {}
    if lecture_ids:
        count_stmt = (
            select(
                AttendanceRecord.lecture_id,
                func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label("present"),
                func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)).label("absent"),
            )
            .where(AttendanceRecord.lecture_id.in_(lecture_ids))
            .group_by(AttendanceRecord.lecture_id)
        )
        count_rows = db.execute(count_stmt).all()
        for r in count_rows:
            counts_map[r[0]] = (int(r[1] or 0), int(r[2] or 0))

    return [
        RecentLectureResponse(
            lecture_id=l.lecture_id,
            subject_name=(
                l.assignment.subject.subject_name
                if l.assignment and l.assignment.subject
                else "Unknown"
            ),
            faculty_name=(
                l.assignment.faculty.faculty_name
                if l.assignment and l.assignment.faculty
                else "Unknown"
            ),
            class_name=(
                l.assignment.class_.class_name
                if l.assignment and l.assignment.class_
                else "Unknown"
            ),
            division=(
                l.assignment.class_.division
                if l.assignment and l.assignment.class_
                else ""
            ),
            lecture_date=l.lecture_date,
            start_time=l.start_time,
            end_time=l.end_time,
            lecture_status=l.lecture_status,
            present_count=counts_map.get(l.lecture_id, (0, 0))[0],
            absent_count=counts_map.get(l.lecture_id, (0, 0))[1],
        )
        for l in lectures
    ]


def get_pending_corrections(
    db: Session, limit: int = 10
) -> List[PendingCorrectionResponse]:
    """Retrieve the latest pending correction requests waiting for admin/faculty review."""
    stmt = (
        select(CorrectionRequest)
        .options(
            joinedload(CorrectionRequest.student),
            joinedload(CorrectionRequest.attendance_record)
            .joinedload(AttendanceRecord.lecture)
            .joinedload(Lecture.assignment)
            .joinedload(TeachingAssignment.subject),
        )
        .where(CorrectionRequest.request_status == "PENDING")
        .order_by(
            CorrectionRequest.created_at.desc(),
            CorrectionRequest.request_id.desc(),
        )
        .limit(limit)
    )

    requests = db.scalars(stmt).unique().all()

    return [
        PendingCorrectionResponse(
            request_id=r.request_id,
            student_name=r.student.student_name if r.student else "Unknown",
            roll_number=r.student.roll_number if r.student else "Unknown",
            subject_name=(
                r.attendance_record.lecture.assignment.subject.subject_name
                if r.attendance_record
                and r.attendance_record.lecture
                and r.attendance_record.lecture.assignment
                and r.attendance_record.lecture.assignment.subject
                else "Unknown"
            ),
            lecture_date=(
                r.attendance_record.lecture.lecture_date
                if r.attendance_record and r.attendance_record.lecture
                else date.min
            ),
            current_status=(
                r.attendance_record.status if r.attendance_record else "Unknown"
            ),
            requested_status=r.requested_status,
            reason=r.reason,
            created_at=r.created_at,
        )
        for r in requests
    ]


def get_attendance_distribution(db: Session) -> AttendanceDistributionResponse:
    """Calculate institutional attendance distribution across all SUBMITTED lectures."""
    sub_lectures = select(Lecture.lecture_id).where(
        Lecture.lecture_status == "SUBMITTED"
    )

    present_count = (
        db.scalar(
            select(func.count(AttendanceRecord.attendance_id)).where(
                AttendanceRecord.lecture_id.in_(sub_lectures),
                AttendanceRecord.status == "PRESENT",
            )
        )
        or 0
    )

    absent_count = (
        db.scalar(
            select(func.count(AttendanceRecord.attendance_id)).where(
                AttendanceRecord.lecture_id.in_(sub_lectures),
                AttendanceRecord.status == "ABSENT",
            )
        )
        or 0
    )

    total_marked = present_count + absent_count
    present_pct = (
        round((present_count / total_marked) * 100.0, 2) if total_marked > 0 else 0.0
    )
    absent_pct = (
        round((absent_count / total_marked) * 100.0, 2) if total_marked > 0 else 0.0
    )

    return AttendanceDistributionResponse(
        present_count=present_count,
        absent_count=absent_count,
        total_marked=total_marked,
        present_percentage=present_pct,
        absent_percentage=absent_pct,
    )


def get_attendance_trends(
    db: Session,
    period: str = "daily",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> AttendanceTrendsResponse:
    """Calculate chronological attendance trends grouped by period (SUBMITTED lectures only)."""
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

    fmt_map = {
        "daily": "%Y-%m-%d",
        "weekly": "%x-W%v",
        "monthly": "%Y-%m",
    }
    date_fmt = fmt_map[clean_period]
    period_col = func.date_format(Lecture.lecture_date, date_fmt).label("period")

    stmt = (
        select(
            period_col,
            func.count(func.distinct(Lecture.lecture_id)).label("total_lectures"),
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label("present_count"),
            func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)).label("absent_count"),
        )
        .join(AttendanceRecord, Lecture.lecture_id == AttendanceRecord.lecture_id)
        .where(Lecture.lecture_status == "SUBMITTED")
    )

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
            AttendanceTrendItem(
                period=str(r[0]),
                total_lectures=int(r[1] or 0),
                present_count=p_cnt,
                absent_count=a_cnt,
                attendance_percentage=pct,
            )
        )

    return AttendanceTrendsResponse(
        period_type=clean_period,
        total_periods=len(items),
        items=items,
    )
