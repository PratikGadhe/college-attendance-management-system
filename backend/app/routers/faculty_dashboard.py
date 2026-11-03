"""Faculty dashboard and reports router providing course analytics and student performance metrics."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_faculty
from app.models.users import User
from app.schemas.faculty_dashboard import (
    FacultyAttendanceTrendsResponse,
    FacultyDashboardSummaryResponse,
    FacultyPerformanceReportResponse,
    FacultyStudentAttendanceResponse,
)
from app.services.faculty_report_service import (
    get_faculty_attendance_trends,
    get_faculty_dashboard_summary,
    get_faculty_performance_report,
    get_faculty_student_attendance_report,
)

router = APIRouter(dependencies=[Depends(require_faculty)])


@router.get(
    "/dashboard/summary",
    response_model=FacultyDashboardSummaryResponse,
    summary="Get faculty dashboard summary",
    description="Returns aggregate teaching assignments, lecture counts, total students, pending corrections, and overall attendance percentage.",
)
def faculty_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Retrieve high-level teaching metrics for authenticated faculty."""
    return get_faculty_dashboard_summary(db=db, faculty_user_id=current_user.user_id)


@router.get(
    "/dashboard/attendance-trends",
    response_model=FacultyAttendanceTrendsResponse,
    summary="Get faculty attendance trends",
    description="Returns chronological attendance trends for the authenticated faculty member's lectures.",
)
def faculty_attendance_trends(
    period: str = Query("daily", description="Time granularity: 'daily', 'weekly', or 'monthly'"),
    start_date: Optional[date] = Query(None, description="Optional start date filter (inclusive)"),
    end_date: Optional[date] = Query(None, description="Optional end date filter (inclusive)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Retrieve chronological attendance trends for faculty lectures."""
    return get_faculty_attendance_trends(
        db=db,
        faculty_user_id=current_user.user_id,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/reports/performance",
    response_model=FacultyPerformanceReportResponse,
    summary="Get course-wise performance report",
    description="Returns attendance rates and metrics for each teaching assignment assigned to the authenticated faculty member.",
)
def faculty_performance_report(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Retrieve course performance breakdown for faculty teaching assignments."""
    return get_faculty_performance_report(
        db=db,
        faculty_user_id=current_user.user_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/reports/students",
    response_model=FacultyStudentAttendanceResponse,
    summary="Get student attendance report for faculty classes",
    description="Returns attendance performance for students enrolled in courses taught by the authenticated faculty member.",
)
def faculty_student_attendance_report(
    assignment_id: Optional[int] = Query(None, description="Optional teaching assignment filter"),
    class_id: Optional[int] = Query(None, description="Optional class filter"),
    subject_id: Optional[int] = Query(None, description="Optional subject filter"),
    search: Optional[str] = Query(None, description="Search by student name or roll number"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Retrieve student attendance breakdown for courses taught by current faculty."""
    return get_faculty_student_attendance_report(
        db=db,
        faculty_user_id=current_user.user_id,
        assignment_id=assignment_id,
        class_id=class_id,
        subject_id=subject_id,
        search=search,
        skip=skip,
        limit=limit,
    )

