"""Admin router for faculty management operations."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin_faculty import (
    FacultyCreateRequest,
    FacultyDetailResponse,
    FacultyListResponse,
    FacultyStatusUpdateRequest,
    FacultyUpdateRequest,
)
from app.services.admin_faculty_service import (
    create_faculty,
    get_faculty_by_id,
    list_faculty,
    update_faculty,
    update_faculty_status,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "",
    response_model=FacultyListResponse,
    summary="List faculty members with pagination and search",
    description="Returns a paginated list of faculty members with optional search (faculty name, username, email, department name) and account status filtering.",
)
def get_faculty_members(
    search: Optional[str] = Query(
        None,
        description="Search term matching faculty name, username, email, or department name",
    ),
    account_status: Optional[str] = Query(
        None, description="Filter by account status: ACTIVE or INACTIVE"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        20, ge=1, le=100, description="Maximum number of records to return"
    ),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List faculty members with search, status filtering, and pagination metadata."""
    return list_faculty(
        db=db,
        search=search,
        account_status=account_status,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{faculty_id}",
    response_model=FacultyDetailResponse,
    summary="Get faculty details by ID",
    description="Returns detailed profile, department info, and linked user credentials information for a specific faculty member.",
)
def get_faculty_member(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve a single faculty member by faculty_id."""
    return get_faculty_by_id(db=db, faculty_id=faculty_id)


@router.post(
    "",
    response_model=FacultyDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new faculty member",
    description="Creates a new faculty profile and linked user account with ACTIVE status and department assignment in a single transaction.",
)
def add_faculty_member(
    request: FacultyCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Create a new faculty member and associated user account."""
    return create_faculty(db=db, request=request)


@router.put(
    "/{faculty_id}",
    response_model=FacultyDetailResponse,
    summary="Update faculty details",
    description="Updates faculty profile, department assignment, and linked user credentials while preventing duplicate values.",
)
def edit_faculty_member(
    faculty_id: int,
    request: FacultyUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update faculty profile, department, and linked user information."""
    return update_faculty(db=db, faculty_id=faculty_id, request=request)


@router.patch(
    "/{faculty_id}/status",
    response_model=FacultyDetailResponse,
    summary="Activate or deactivate faculty account",
    description="Updates the linked user account status to ACTIVE or INACTIVE.",
)
def change_faculty_status(
    faculty_id: int,
    request: FacultyStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Activate or deactivate faculty account status."""
    return update_faculty_status(db=db, faculty_id=faculty_id, request=request)

