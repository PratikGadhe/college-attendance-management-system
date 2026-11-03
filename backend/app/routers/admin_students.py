"""Admin router for student management operations."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin_students import (
    StudentCreateRequest,
    StudentDetailResponse,
    StudentListResponse,
    StudentStatusUpdateRequest,
    StudentUpdateRequest,
)
from app.services.admin_student_service import (
    create_student,
    get_student_by_id,
    list_students,
    update_student,
    update_student_status,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "",
    response_model=StudentListResponse,
    summary="List students with pagination and search",
    description="Returns a paginated list of students with optional search (name, roll number, username, email) and account status filtering.",
)
def get_students(
    search: Optional[str] = Query(
        None, description="Search term matching student name, roll number, username, or email"
    ),
    account_status: Optional[str] = Query(
        None, description="Filter by account status: ACTIVE or INACTIVE"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List students with search, status filtering, and pagination metadata."""
    return list_students(
        db=db,
        search=search,
        account_status=account_status,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{student_id}",
    response_model=StudentDetailResponse,
    summary="Get student details by ID",
    description="Returns detailed profile and linked user credentials information for a specific student.",
)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve a single student by student_id."""
    return get_student_by_id(db=db, student_id=student_id)


@router.post(
    "",
    response_model=StudentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new student",
    description="Creates a new student profile and linked user account with ACTIVE status in a single transaction.",
)
def add_student(
    request: StudentCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Create a new student and associated user account."""
    return create_student(db=db, request=request)


@router.put(
    "/{student_id}",
    response_model=StudentDetailResponse,
    summary="Update student details",
    description="Updates student profile and linked user credentials while preventing duplicate values.",
)
def edit_student(
    student_id: int,
    request: StudentUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update student profile and linked user information."""
    return update_student(db=db, student_id=student_id, request=request)


@router.patch(
    "/{student_id}/status",
    response_model=StudentDetailResponse,
    summary="Activate or deactivate student account",
    description="Updates the linked user account status to ACTIVE or INACTIVE.",
)
def change_student_status(
    student_id: int,
    request: StudentStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Activate or deactivate student account status."""
    return update_student_status(db=db, student_id=student_id, request=request)

