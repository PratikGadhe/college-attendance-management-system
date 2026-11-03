"""Faculty router for attendance roster, bulk marking, and submission."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_faculty
from app.models.users import User
from app.schemas.faculty_attendance import (
    AttendanceMarkRequest,
    LectureAttendanceRosterResponse,
    LectureSubmissionResponse,
)
from app.services.faculty_attendance_service import (
    get_lecture_roster,
    mark_attendance,
    submit_attendance,
)

router = APIRouter(dependencies=[Depends(require_faculty)])


@router.get(
    "/lectures/{lecture_id}/roster",
    response_model=LectureAttendanceRosterResponse,
    summary="Get lecture attendance roster",
    description="Returns the active enrolled student roster and any existing attendance marks for an assigned lecture.",
)
def get_roster(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Retrieve attendance roster for a lecture."""
    return get_lecture_roster(
        db=db, faculty_user_id=current_user.user_id, lecture_id=lecture_id
    )


@router.put(
    "/lectures/{lecture_id}/attendance",
    response_model=LectureAttendanceRosterResponse,
    summary="Bulk mark attendance",
    description="Marks or updates attendance for actively enrolled students in a DRAFT lecture within a single transaction.",
)
def save_attendance(
    lecture_id: int,
    request: AttendanceMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Bulk mark student attendance."""
    return mark_attendance(
        db=db,
        faculty_user_id=current_user.user_id,
        lecture_id=lecture_id,
        request=request,
    )


@router.post(
    "/lectures/{lecture_id}/submit",
    response_model=LectureSubmissionResponse,
    summary="Submit final lecture attendance",
    description="Validates that all active students are marked, locks attendance, and marks the lecture as SUBMITTED.",
)
def finalize_attendance(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Submit complete attendance for a lecture."""
    return submit_attendance(
        db=db, faculty_user_id=current_user.user_id, lecture_id=lecture_id
    )

