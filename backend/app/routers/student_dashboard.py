"""Student dashboard router providing personal attendance summaries, subject breakdowns, and trends."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_student
from app.models.users import User
from app.schemas.student_dashboard import (
    StudentAttendanceTrendsResponse,
    StudentDashboardSummaryResponse,
    StudentSubjectPerformanceResponse,
)
from app.services.student_dashboard_service import (
    get_student_attendance_trends,
    get_student_dashboard_summary,
    get_student_subject_performance,
)

router = APIRouter(dependencies=[Depends(require_student)])


@router.get(
    "/summary",
    response_model=StudentDashboardSummaryResponse,
    summary="Get student dashboard summary",
    description="Returns personal executive attendance metrics, enrolled class details, subject counts, and correction request totals.",
)
def student_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Retrieve personal attendance summary and metrics for authenticated student."""
    return get_student_dashboard_summary(db=db, student_user_id=current_user.user_id)


@router.get(
    "/subject-performance",
    response_model=StudentSubjectPerformanceResponse,
    summary="Get subject-wise attendance performance",
    description="Returns detailed subject attendance percentages, attended counts, and total submitted lectures.",
)
def student_subject_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Retrieve detailed subject performance breakdown for the authenticated student."""
    return get_student_subject_performance(db=db, student_user_id=current_user.user_id)


@router.get(
    "/attendance-trends",
    response_model=StudentAttendanceTrendsResponse,
    summary="Get personal attendance trends",
    description="Returns personal chronological attendance trends grouped by daily, weekly, or monthly periods.",
)
def student_attendance_trends(
    period: str = Query("daily", description="Time granularity: 'daily', 'weekly', or 'monthly'"),
    start_date: Optional[date] = Query(None, description="Optional start date filter (inclusive)"),
    end_date: Optional[date] = Query(None, description="Optional end date filter (inclusive)"),
    subject_id: Optional[int] = Query(None, description="Optional subject filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Retrieve personal attendance trends over time for the authenticated student."""
    return get_student_attendance_trends(
        db=db,
        student_user_id=current_user.user_id,
        period=period,
        start_date=start_date,
        end_date=end_date,
        subject_id=subject_id,
    )

