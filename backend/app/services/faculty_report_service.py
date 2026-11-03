"""Faculty report service layer handling faculty dashboard summary, course performance, and student tracking."""

from datetime import date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, case, distinct, func, or_, select
from sqlalchemy.orm import Session

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
from app.schemas.faculty_dashboard import (
    FacultyAttendanceTrendItem,
    FacultyAttendanceTrendsResponse,
    FacultyDashboardSummaryResponse,
    FacultyPerformanceReportItem,
    FacultyPerformanceReportResponse,
    FacultyStudentAttendanceItem,
    FacultyStudentAttendanceResponse,
)
from app.services.faculty_lecture_service import get_faculty_profile


def get_faculty_dashboard_summary(
    db: Session, faculty_user_id: int
) -> FacultyDashboardSummaryResponse:
    """Compute executive dashboard metrics for authenticated faculty member."""
    faculty = get_faculty_profile(db, faculty_user_id)
    dept = db.scalar(
        select(Department).where(Department.department_id == faculty.department_id)
    )

    # 1. Total teaching assignments
    assignments = db.scalars(
        select(TeachingAssignment).where(
            TeachingAssignment.faculty_id == faculty.faculty_id
        )
    ).all()
    total_assignments = len(assignments)
    assigned_class_ids = [a.class_id for a in assignments]
    assigned_ids = [a.assignment_id for a in assignments]

    # 2. Total active students across assigned classes
    total_students = 0
    if assigned_class_ids:
        total_students = (
            db.scalar(
                select(func.count(distinct(Enrollment.student_id))).where(
                    Enrollment.class_id.in_(assigned_class_ids),
                    Enrollment.enrollment_status == "ACTIVE",
                )
            )
            or 0
        )

    # 3. Lectures metrics
    total_lectures = 0
    submitted_lectures = 0
    draft_lectures = 0
    cancelled_lectures = 0
    submitted_ids = []

    if assigned_ids:
        lectures = db.scalars(
            select(Lecture).where(Lecture.assignment_id.in_(assigned_ids))
        ).all()
        total_lectures = len(lectures)
        submitted_lectures = sum(1 for l in lectures if l.lecture_status == "SUBMITTED")
        draft_lectures = sum(1 for l in lectures if l.lecture_status == "DRAFT")
        cancelled_lectures = sum(1 for l in lectures if l.lecture_status == "CANCELLED")
        submitted_ids = [l.lecture_id for l in lectures if l.lecture_status == "SUBMITTED"]

    # 4. Attendance metrics (SUBMITTED lectures only)
    present_count = 0
    absent_count = 0
    if submitted_ids:
        counts = db.execute(
            select(
                func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)),
                func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)),
            ).where(AttendanceRecord.lecture_id.in_(submitted_ids))
        ).first()
        if counts:
            present_count = int(counts[0] or 0)
            absent_count = int(counts[1] or 0)

    total_marks = present_count + absent_count
    overall_attendance_percentage = (
        round((present_count / total_marks) * 100.0, 2)
        if total_marks > 0
        else 0.0
    )

    # 5. Pending correction requests for faculty's lectures
    pending_corrections = 0
    if assigned_ids:
        pending_corrections = (
            db.scalar(
                select(func.count(CorrectionRequest.request_id))
                .join(
                    AttendanceRecord,
                    CorrectionRequest.attendance_id == AttendanceRecord.attendance_id,
                )
                .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
                .where(
                    Lecture.assignment_id.in_(assigned_ids),
                    CorrectionRequest.request_status == "PENDING",
                )
            )
            or 0
        )

    return FacultyDashboardSummaryResponse(
        faculty_id=faculty.faculty_id,
        faculty_name=faculty.faculty_name,
        department_name=dept.department_name if dept else "Unknown",
        total_teaching_assignments=total_assignments,
        total_lectures=total_lectures,
        submitted_lectures=submitted_lectures,
        draft_lectures=draft_lectures,
        cancelled_lectures=cancelled_lectures,
        total_students_across_active_classes=total_students,
        pending_correction_requests=pending_corrections,
        present_count=present_count,
        absent_count=absent_count,
        overall_attendance_percentage=overall_attendance_percentage,
    )


def get_faculty_attendance_trends(
    db: Session,
    faculty_user_id: int,
    period: str = "daily",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    assignment_id: Optional[int] = None,
) -> FacultyAttendanceTrendsResponse:
    """Calculate attendance trends strictly for lectures assigned to the authenticated faculty member."""
    faculty = get_faculty_profile(db, faculty_user_id)

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

    if assignment_id is not None:
        assign = db.scalar(
            select(TeachingAssignment).where(
                TeachingAssignment.assignment_id == assignment_id
            )
        )
        if not assign or assign.faculty_id != faculty.faculty_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This teaching assignment does not belong to you.",
            )

    fmt_map = {"daily": "%Y-%m-%d", "weekly": "%x-W%v", "monthly": "%Y-%m"}
    period_col = func.date_format(Lecture.lecture_date, fmt_map[clean_period]).label("period")

    stmt = (
        select(
            period_col,
            func.count(distinct(Lecture.lecture_id)).label("submitted_lectures"),
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label("present_count"),
            func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)).label("absent_count"),
        )
        .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
        .join(AttendanceRecord, Lecture.lecture_id == AttendanceRecord.lecture_id)
        .where(
            TeachingAssignment.faculty_id == faculty.faculty_id,
            Lecture.lecture_status == "SUBMITTED",
        )
    )

    if assignment_id is not None:
        stmt = stmt.where(TeachingAssignment.assignment_id == assignment_id)
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
            FacultyAttendanceTrendItem(
                period=str(r[0]),
                submitted_lectures=int(r[1] or 0),
                present_count=p_cnt,
                absent_count=a_cnt,
                attendance_percentage=pct,
            )
        )

    return FacultyAttendanceTrendsResponse(
        period_type=clean_period,
        total_periods=len(items),
        items=items,
    )


def get_faculty_performance_report(
    db: Session,
    faculty_user_id: int,
    assignment_id: Optional[int] = None,
    class_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 20,
) -> FacultyPerformanceReportResponse:
    """Calculate course-level attendance performance across faculty's teaching assignments."""
    faculty = get_faculty_profile(db, faculty_user_id)

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be later than end_date.",
        )

    if assignment_id is not None:
        assign = db.scalar(
            select(TeachingAssignment).where(
                TeachingAssignment.assignment_id == assignment_id
            )
        )
        if not assign or assign.faculty_id != faculty.faculty_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This teaching assignment does not belong to you.",
            )

    query = (
        select(
            TeachingAssignment,
            Subject.subject_name,
            Subject.subject_code,
            Class.class_name,
            Class.division,
        )
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .where(TeachingAssignment.faculty_id == faculty.faculty_id)
    )

    conditions = []
    if assignment_id is not None:
        conditions.append(TeachingAssignment.assignment_id == assignment_id)
    if class_id is not None:
        conditions.append(TeachingAssignment.class_id == class_id)
    if subject_id is not None:
        conditions.append(TeachingAssignment.subject_id == subject_id)

    if conditions:
        query = query.where(and_(*conditions))

    assignments = db.execute(query.order_by(TeachingAssignment.assignment_id.asc())).all()

    items = []
    for row in assignments:
        ta: TeachingAssignment = row[0]
        sub_name = row[1]
        sub_code = row[2]
        cls_name = row[3]
        div = row[4]

        # Active enrolled students in class
        total_students = (
            db.scalar(
                select(func.count(Enrollment.enrollment_id)).where(
                    Enrollment.class_id == ta.class_id,
                    Enrollment.enrollment_status == "ACTIVE",
                )
            )
            or 0
        )

        # Submitted lectures
        lec_query = select(Lecture.lecture_id).where(
            Lecture.assignment_id == ta.assignment_id,
            Lecture.lecture_status == "SUBMITTED",
        )
        if start_date:
            lec_query = lec_query.where(Lecture.lecture_date >= start_date)
        if end_date:
            lec_query = lec_query.where(Lecture.lecture_date <= end_date)

        lec_ids = db.scalars(lec_query).all()
        total_submitted = len(lec_ids)

        present_count = 0
        absent_count = 0
        if lec_ids:
            counts = db.execute(
                select(
                    func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)),
                    func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)),
                ).where(AttendanceRecord.lecture_id.in_(lec_ids))
            ).first()
            if counts:
                present_count = int(counts[0] or 0)
                absent_count = int(counts[1] or 0)

        total_marks = present_count + absent_count
        pct = (
            round((present_count / total_marks) * 100.0, 2)
            if total_marks > 0
            else 0.0
        )

        items.append(
            FacultyPerformanceReportItem(
                assignment_id=ta.assignment_id,
                subject_name=sub_name,
                subject_code=sub_code,
                class_name=cls_name,
                division=div,
                total_submitted_lectures=total_submitted,
                total_students=total_students,
                present_count=present_count,
                absent_count=absent_count,
                attendance_percentage=pct,
            )
        )

    paginated_items = items[skip : skip + limit]
    return FacultyPerformanceReportResponse(
        total=len(items), skip=skip, limit=limit, items=paginated_items
    )


def get_faculty_student_attendance_report(
    db: Session,
    faculty_user_id: int,
    assignment_id: Optional[int] = None,
    class_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    search: Optional[str] = None,
    attendance_threshold: Optional[float] = None,
    skip: int = 0,
    limit: int = 20,
) -> FacultyStudentAttendanceResponse:
    """Calculate student attendance records for classes and assignments taught by authenticated faculty."""
    faculty = get_faculty_profile(db, faculty_user_id)

    if attendance_threshold is not None and not (0.0 <= attendance_threshold <= 100.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="attendance_threshold must be between 0.0 and 100.0.",
        )

    if assignment_id is not None:
        assign = db.scalar(
            select(TeachingAssignment).where(
                TeachingAssignment.assignment_id == assignment_id
            )
        )
        if not assign or assign.faculty_id != faculty.faculty_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This teaching assignment does not belong to you.",
            )

    # Teaching assignments belonging to this faculty
    assign_query = (
        select(
            TeachingAssignment,
            Subject.subject_name,
            Class.class_name,
        )
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .where(TeachingAssignment.faculty_id == faculty.faculty_id)
    )
    if assignment_id is not None:
        assign_query = assign_query.where(TeachingAssignment.assignment_id == assignment_id)
    if class_id is not None:
        assign_query = assign_query.where(TeachingAssignment.class_id == class_id)
    if subject_id is not None:
        assign_query = assign_query.where(TeachingAssignment.subject_id == subject_id)

    assignments = db.execute(assign_query).all()

    items = []
    for row in assignments:
        ta: TeachingAssignment = row[0]
        sub_name: str = row[1]
        cls_name: str = row[2]

        # Students actively enrolled in this assignment's class
        stud_query = (
            select(Student)
            .join(Enrollment, Student.student_id == Enrollment.student_id)
            .where(
                Enrollment.class_id == ta.class_id,
                Enrollment.enrollment_status == "ACTIVE",
            )
        )
        if search and search.strip():
            pat = f"%{search.strip()}%"
            stud_query = stud_query.where(
                or_(Student.student_name.ilike(pat), Student.roll_number.ilike(pat))
            )

        students = db.scalars(stud_query.order_by(Student.roll_number.asc())).all()

        # Submitted lectures for this assignment
        total_sub_lectures = (
            db.scalar(
                select(func.count(Lecture.lecture_id)).where(
                    Lecture.assignment_id == ta.assignment_id,
                    Lecture.lecture_status == "SUBMITTED",
                )
            )
            or 0
        )

        for st in students:
            # Attendance for this student in this assignment
            counts = db.execute(
                select(
                    func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)),
                    func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)),
                )
                .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
                .where(
                    Lecture.assignment_id == ta.assignment_id,
                    Lecture.lecture_status == "SUBMITTED",
                    AttendanceRecord.student_id == st.student_id,
                )
            ).first()

            present_cnt = int(counts[0] or 0) if counts else 0
            absent_cnt = int(counts[1] or 0) if counts else 0
            pct = (
                round((present_cnt / total_sub_lectures) * 100.0, 2)
                if total_sub_lectures > 0
                else 0.0
            )

            if attendance_threshold is not None and pct > attendance_threshold:
                continue

            items.append(
                FacultyStudentAttendanceItem(
                    student_id=st.student_id,
                    student_name=st.student_name,
                    roll_number=st.roll_number,
                    class_name=cls_name,
                    subject_name=sub_name,
                    total_submitted_lectures=total_sub_lectures,
                    present_count=present_cnt,
                    absent_count=absent_cnt,
                    attendance_percentage=pct,
                )
            )

    paginated_items = items[skip : skip + limit]
    return FacultyStudentAttendanceResponse(
        total=len(items), skip=skip, limit=limit, items=paginated_items
    )
