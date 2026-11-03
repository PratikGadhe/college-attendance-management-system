"""Faculty router for lecture management and teaching assignment retrieval."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_faculty
from app.models.users import User
from app.schemas.faculty_lectures import (
    FacultyLectureListResponse,
    FacultyTeachingAssignmentListResponse,
    LectureCreateRequest,
    LectureDetailResponse,
    LectureUpdateRequest,
)
from app.services.faculty_lecture_service import (
    cancel_lecture,
    create_lecture,
    get_lecture_details,
    list_my_lectures,
    list_my_teaching_assignments,
    update_lecture,
)

router = APIRouter(dependencies=[Depends(require_faculty)])


@router.get(
    "/teaching-assignments",
    response_model=FacultyTeachingAssignmentListResponse,
    summary="List my teaching assignments",
    description="Returns teaching assignments belonging to the authenticated faculty member.",
)
def get_my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Retrieve assignments for the current faculty member."""
    return list_my_teaching_assignments(db=db, faculty_user_id=current_user.user_id)


@router.post(
    "/lectures",
    response_model=LectureDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new draft lecture",
    description="Creates a lecture in DRAFT status for an assigned subject and class.",
)
def add_lecture(
    request: LectureCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Create a new draft lecture."""
    return create_lecture(
        db=db, faculty_user_id=current_user.user_id, request=request
    )


@router.get(
    "/lectures",
    response_model=FacultyLectureListResponse,
    summary="List my lectures",
    description="Returns paginated list of lectures belonging to the authenticated faculty member.",
)
def get_lectures(
    assignment_id: Optional[int] = Query(
        None, description="Filter lectures by teaching assignment ID"
    ),
    lecture_date: Optional[date] = Query(
        None, description="Filter lectures by specific date"
    ),
    status: Optional[str] = Query(
        None, description="Filter lectures by status (DRAFT, SUBMITTED, CANCELLED)"
    ),
    start_date: Optional[date] = Query(
        None, description="Filter lectures on or after this date"
    ),
    end_date: Optional[date] = Query(
        None, description="Filter lectures on or before this date"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        20, ge=1, le=100, description="Maximum number of records to return"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """List lectures with optional filters and pagination."""
    return list_my_lectures(
        db=db,
        faculty_user_id=current_user.user_id,
        assignment_id=assignment_id,
        lecture_date=lecture_date,
        status_filter=status,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/lectures/{lecture_id}",
    response_model=LectureDetailResponse,
    summary="Get lecture details",
    description="Returns detailed lecture information and attendance counts for an assigned lecture.",
)
def get_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Retrieve detailed lecture information."""
    return get_lecture_details(
        db=db, faculty_user_id=current_user.user_id, lecture_id=lecture_id
    )


@router.put(
    "/lectures/{lecture_id}",
    response_model=LectureDetailResponse,
    summary="Update draft lecture",
    description="Updates date or time of a DRAFT lecture. SUBMITTED or CANCELLED lectures cannot be modified.",
)
def edit_lecture(
    lecture_id: int,
    request: LectureUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Update date or times of a draft lecture."""
    return update_lecture(
        db=db,
        faculty_user_id=current_user.user_id,
        lecture_id=lecture_id,
        request=request,
    )


@router.patch(
    "/lectures/{lecture_id}/cancel",
    response_model=LectureDetailResponse,
    summary="Cancel draft lecture",
    description="Cancels a DRAFT lecture. SUBMITTED or already CANCELLED lectures cannot be cancelled.",
)
def cancel_draft_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Cancel a draft lecture."""
    return cancel_lecture(
        db=db, faculty_user_id=current_user.user_id, lecture_id=lecture_id
    )

