"""Admin router for lecture oversight and student attendance roster inspection."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin_lectures import (
    AdminLectureAttendanceRosterResponse,
    AdminLectureDetailResponse,
    AdminLectureListResponse,
)
from app.services.admin_lecture_service import (
    get_admin_lecture_attendance,
    get_admin_lecture_details,
    list_admin_lectures,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "/lectures",
    response_model=AdminLectureListResponse,
    summary="List all lectures (Admin oversight)",
    description="Returns paginated list of all college lectures with extensive filtering.",
)
def get_all_lectures(
    faculty_id: Optional[int] = Query(None, description="Filter by faculty ID"),
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
    class_id: Optional[int] = Query(None, description="Filter by class ID"),
    status: Optional[str] = Query(
        None, description="Filter by status (DRAFT, SUBMITTED, CANCELLED)"
    ),
    start_date: Optional[date] = Query(
        None, description="Filter lectures on or after date"
    ),
    end_date: Optional[date] = Query(
        None, description="Filter lectures on or before date"
    ),
    skip: int = Query(0, ge=0, description="Records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List lectures across the institution."""
    return list_admin_lectures(
        db=db,
        faculty_id=faculty_id,
        subject_id=subject_id,
        class_id=class_id,
        lecture_status=status,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/lectures/{lecture_id}",
    response_model=AdminLectureDetailResponse,
    summary="Get lecture details (Admin oversight)",
    description="Returns detailed lecture metadata, class, subject, faculty, and attendance summary metrics.",
)
def get_lecture_admin(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve detailed lecture overview."""
    return get_admin_lecture_details(db=db, lecture_id=lecture_id)


@router.get(
    "/attendance/lectures/{lecture_id}",
    response_model=AdminLectureAttendanceRosterResponse,
    summary="Get lecture attendance roster (Admin oversight)",
    description="Returns full student roster and attendance marks for any lecture in the system.",
)
def get_lecture_attendance_admin(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve complete attendance roster for a lecture."""
    return get_admin_lecture_attendance(db=db, lecture_id=lecture_id)

