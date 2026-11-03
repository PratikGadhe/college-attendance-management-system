"""Admin router for faculty teaching assignment management operations."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin_teaching_assignments import (
    TeachingAssignmentCreateRequest,
    TeachingAssignmentDetailResponse,
    TeachingAssignmentListResponse,
    TeachingAssignmentUpdateRequest,
)
from app.services.admin_teaching_assignment_service import (
    create_teaching_assignment,
    delete_teaching_assignment,
    get_teaching_assignment_by_id,
    list_teaching_assignments,
    update_teaching_assignment,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "",
    response_model=TeachingAssignmentListResponse,
    summary="List teaching assignments with filters and pagination",
    description="Returns a paginated list of teaching assignments filtered by faculty, subject, class, or department.",
)
def get_teaching_assignments(
    faculty_id: Optional[int] = Query(
        None, description="Filter assignments by faculty ID"
    ),
    subject_id: Optional[int] = Query(
        None, description="Filter assignments by subject ID"
    ),
    class_id: Optional[int] = Query(
        None, description="Filter assignments by class ID"
    ),
    department_id: Optional[int] = Query(
        None, description="Filter assignments by department ID"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        20, ge=1, le=100, description="Maximum number of records to return"
    ),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List teaching assignments with relational filters and pagination metadata."""
    return list_teaching_assignments(
        db=db,
        faculty_id=faculty_id,
        subject_id=subject_id,
        class_id=class_id,
        department_id=department_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{assignment_id}",
    response_model=TeachingAssignmentDetailResponse,
    summary="Get teaching assignment details by ID",
    description="Returns detailed teaching assignment information including linked faculty, subject, class, and department details.",
)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve a single teaching assignment by assignment_id."""
    return get_teaching_assignment_by_id(db=db, assignment_id=assignment_id)


@router.post(
    "",
    response_model=TeachingAssignmentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a teaching assignment",
    description="Assigns a faculty member to teach a subject for a class, validating existence, department/semester alignment, and uniqueness.",
)
def add_assignment(
    request: TeachingAssignmentCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Create a new teaching assignment."""
    return create_teaching_assignment(db=db, request=request)


@router.put(
    "/{assignment_id}",
    response_model=TeachingAssignmentDetailResponse,
    summary="Update a teaching assignment",
    description="Updates teaching assignment references while validating existence, department/semester compatibility, and composite uniqueness.",
)
def edit_assignment(
    assignment_id: int,
    request: TeachingAssignmentUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update an existing teaching assignment."""
    return update_teaching_assignment(
        db=db, assignment_id=assignment_id, request=request
    )


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a teaching assignment",
    description="Deletes a teaching assignment if no dependent lecture records exist. Returns 409 Conflict if lectures exist.",
)
def remove_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Delete a teaching assignment."""
    delete_teaching_assignment(db=db, assignment_id=assignment_id)
    return None

