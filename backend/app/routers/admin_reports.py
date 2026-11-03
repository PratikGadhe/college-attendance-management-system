"""Admin reports router providing institutional attendance analytics and breakdown reports."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin_reports import (
    ClassAttendanceReportResponse,
    DateRangeAttendanceReportResponse,
    DepartmentAttendanceReportResponse,
    FacultyAttendanceReportResponse,
    LectureReportResponse,
    LowAttendanceReportResponse,
    StudentAttendanceReportResponse,
    SubjectAttendanceReportResponse,
)
from app.services.admin_report_service import (
    get_attendance_performance_by_date_range,
    get_class_attendance_report,
    get_department_attendance_report,
    get_faculty_attendance_report,
    get_lecture_report,
    get_low_attendance_report,
    get_student_attendance_report,
    get_subject_attendance_report,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "/departments",
    response_model=DepartmentAttendanceReportResponse,
    summary="Department-wise attendance report",
    description="Returns aggregate attendance statistics and lecture metrics grouped by academic department.",
)
def department_attendance_report(
    search: Optional[str] = Query(None, description="Search by department name or code"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve department-wise attendance statistics."""
    return get_department_attendance_report(db, search=search, skip=skip, limit=limit)


@router.get(
    "/classes",
    response_model=ClassAttendanceReportResponse,
    summary="Class-wise attendance report",
    description="Returns aggregate attendance statistics and lecture metrics grouped by class and division.",
)
def class_attendance_report(
    department_id: Optional[int] = Query(None, description="Optional department filter"),
    search: Optional[str] = Query(None, description="Search by class name, academic year, or division"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve class-wise attendance statistics."""
    return get_class_attendance_report(
        db, department_id=department_id, search=search, skip=skip, limit=limit
    )


@router.get(
    "/subjects",
    response_model=SubjectAttendanceReportResponse,
    summary="Subject-wise attendance report",
    description="Returns aggregate attendance statistics and lecture metrics grouped by subject.",
)
def subject_attendance_report(
    department_id: Optional[int] = Query(None, description="Optional department filter"),
    search: Optional[str] = Query(None, description="Search by subject name or code"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve subject-wise attendance statistics."""
    return get_subject_attendance_report(
        db, department_id=department_id, search=search, skip=skip, limit=limit
    )


@router.get(
    "/faculty",
    response_model=FacultyAttendanceReportResponse,
    summary="Faculty teaching and attendance report",
    description="Returns teaching workload, conducted lectures count, and attendance statistics for each faculty member.",
)
def faculty_attendance_report(
    department_id: Optional[int] = Query(None, description="Optional department filter"),
    search: Optional[str] = Query(None, description="Search by faculty name"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve faculty workload and attendance statistics."""
    return get_faculty_attendance_report(
        db, department_id=department_id, search=search, skip=skip, limit=limit
    )


@router.get(
    "/students",
    response_model=StudentAttendanceReportResponse,
    summary="Student-wise attendance report",
    description="Returns cumulative attendance statistics across all enrolled subjects for each student.",
)
def student_attendance_report(
    class_id: Optional[int] = Query(None, description="Optional class filter"),
    search: Optional[str] = Query(None, description="Search by student name or roll number"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve student-wise attendance statistics."""
    return get_student_attendance_report(
        db, class_id=class_id, search=search, skip=skip, limit=limit
    )


@router.get(
    "/low-attendance",
    response_model=LowAttendanceReportResponse,
    summary="Low attendance warning report",
    description="Identifies students falling below the specified attendance threshold and calculates recovery lectures needed.",
)
def low_attendance_report(
    threshold: float = Query(75.0, ge=0.0, le=100.0, description="Attendance threshold percentage (0.0 to 100.0)"),
    class_id: Optional[int] = Query(None, description="Optional class filter"),
    subject_id: Optional[int] = Query(None, description="Optional subject filter"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve students with attendance below threshold along with recovery metrics."""
    return get_low_attendance_report(
        db,
        threshold=threshold,
        class_id=class_id,
        subject_id=subject_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/lectures",
    response_model=LectureReportResponse,
    summary="Institutional lecture report",
    description="Lists lectures with attendance headcounts and status, filterable by class, subject, faculty, status, or date range.",
)
def lecture_report(
    class_id: Optional[int] = Query(None, description="Optional class filter"),
    subject_id: Optional[int] = Query(None, description="Optional subject filter"),
    faculty_id: Optional[int] = Query(None, description="Optional faculty filter"),
    lecture_status: Optional[str] = Query(None, description="Optional lecture status filter ('DRAFT', 'SUBMITTED', 'CANCELLED')"),
    start_date: Optional[date] = Query(None, description="Optional start date filter (inclusive)"),
    end_date: Optional[date] = Query(None, description="Optional end date filter (inclusive)"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve paginated lecture report with attendance headcounts."""
    return get_lecture_report(
        db,
        class_id=class_id,
        subject_id=subject_id,
        faculty_id=faculty_id,
        lecture_status=lecture_status,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/attendance",
    response_model=DateRangeAttendanceReportResponse,
    summary="Date-range attendance performance report",
    description="Calculates overall attendance performance over a specified date range with lecture-level breakdowns.",
)
def attendance_performance_by_date_range(
    start_date: Optional[date] = Query(None, description="Start date filter (inclusive)"),
    end_date: Optional[date] = Query(None, description="End date filter (inclusive)"),
    class_id: Optional[int] = Query(None, description="Optional class filter"),
    subject_id: Optional[int] = Query(None, description="Optional subject filter"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve date range attendance performance metrics."""
    return get_attendance_performance_by_date_range(
        db,
        start_date=start_date,
        end_date=end_date,
        class_id=class_id,
        subject_id=subject_id,
    )

