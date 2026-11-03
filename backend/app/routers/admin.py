"""Admin router providing administrative dashboard and analytical endpoints."""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin import (
    DashboardSummaryResponse,
    PendingCorrectionResponse,
    RecentLectureResponse,
)
from app.schemas.admin_dashboard import (
    AttendanceDistributionResponse,
    AttendanceTrendsResponse,
)
from app.services.admin_service import (
    get_attendance_distribution,
    get_attendance_trends,
    get_dashboard_summary,
    get_pending_corrections,
    get_recent_lectures,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "/dashboard/summary",
    response_model=DashboardSummaryResponse,
    summary="Get admin dashboard metrics summary",
    description="Returns aggregate counts for students, faculty, academic structures, enrollments, lectures, and pending requests.",
)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve high-level dashboard metrics for college administrators."""
    return get_dashboard_summary(db)


@router.get(
    "/dashboard/recent-lectures",
    response_model=List[RecentLectureResponse],
    summary="Get recent lectures overview",
    description="Returns up to 10 latest lectures ordered by lecture date and creation timestamp.",
)
def recent_lectures(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve recent lectures overview with subject, faculty, and class details."""
    return get_recent_lectures(db, limit=10)


@router.get(
    "/dashboard/pending-corrections",
    response_model=List[PendingCorrectionResponse],
    summary="Get pending attendance correction requests",
    description="Returns up to 10 latest pending attendance correction requests awaiting review.",
)
def pending_corrections(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve pending attendance correction requests."""
    return get_pending_corrections(db, limit=10)


@router.get(
    "/dashboard/attendance-distribution",
    response_model=AttendanceDistributionResponse,
    summary="Get overall institutional attendance distribution",
    description="Returns present and absent counts and percentage shares across all submitted lectures.",
)
def attendance_distribution(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve aggregate present vs absent marks across all submitted lectures."""
    return get_attendance_distribution(db)


@router.get(
    "/dashboard/attendance-trends",
    response_model=AttendanceTrendsResponse,
    summary="Get institutional attendance trends",
    description="Returns aggregated attendance trends grouped chronologically by daily, weekly, or monthly periods.",
)
def attendance_trends(
    period: str = Query("daily", description="Time granularity: 'daily', 'weekly', or 'monthly'"),
    start_date: Optional[date] = Query(None, description="Optional start date filter (inclusive)"),
    end_date: Optional[date] = Query(None, description="Optional end date filter (inclusive)"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve chronological attendance trends for the institution."""
    return get_attendance_trends(
        db, period=period, start_date=start_date, end_date=end_date
    )


