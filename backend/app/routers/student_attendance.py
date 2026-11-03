"""Student router for attendance summaries, history, and individual record inquiry."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_student
from app.models.users import User
from app.schemas.student_attendance import (
    StudentAttendanceHistoryResponse,
    StudentAttendanceRecordDetailResponse,
    StudentAttendanceSummaryResponse,
)
from app.services.student_attendance_service import (
    get_my_attendance_history,
    get_my_attendance_record_detail,
    get_my_attendance_summary,
)

router = APIRouter(dependencies=[Depends(require_student)])


@router.get(
    "/summary",
    response_model=StudentAttendanceSummaryResponse,
    summary="Get my attendance summary",
    description="Returns subject-wise and overall attendance percentage using only SUBMITTED lectures.",
)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Retrieve subject-wise attendance percentages for authenticated student."""
    return get_my_attendance_summary(db=db, student_user_id=current_user.user_id)


@router.get(
    "/history",
    response_model=StudentAttendanceHistoryResponse,
    summary="Get my attendance history",
    description="Returns paginated attendance log for SUBMITTED lectures with optional filters.",
)
def get_history(
    subject_id: Optional[int] = Query(None, description="Filter history by subject ID"),
    attendance_status: Optional[str] = Query(
        None, description="Filter history by status ('PRESENT' or 'ABSENT')"
    ),
    start_date: Optional[date] = Query(
        None, description="Filter records on or after this date"
    ),
    end_date: Optional[date] = Query(
        None, description="Filter records on or before this date"
    ),
    skip: int = Query(0, ge=0, description="Records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """List attendance history items for authenticated student."""
    return get_my_attendance_history(
        db=db,
        student_user_id=current_user.user_id,
        subject_id=subject_id,
        attendance_status=attendance_status,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{attendance_id}",
    response_model=StudentAttendanceRecordDetailResponse,
    summary="Get attendance record details",
    description="Returns detailed attendance and lecture info for student's own record on a SUBMITTED lecture.",
)
def get_attendance_detail(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Retrieve detailed single attendance record."""
    return get_my_attendance_record_detail(
        db=db, student_user_id=current_user.user_id, attendance_id=attendance_id
    )

