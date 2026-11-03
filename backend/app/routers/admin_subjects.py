"""Admin router for subject management operations."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin_subjects import (
    SubjectCreateRequest,
    SubjectDetailResponse,
    SubjectListResponse,
    SubjectUpdateRequest,
)
from app.services.admin_subject_service import (
    create_subject,
    get_subject_by_id,
    list_subjects,
    update_subject,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "",
    response_model=SubjectListResponse,
    summary="List subjects with filters and pagination",
    description="Returns a paginated list of subjects with search (by subject code or name) and filter by semester.",
)
def get_subjects(
    search: Optional[str] = Query(
        None, description="Search term matching subject code or name"
    ),
    semester: Optional[int] = Query(
        None, ge=1, le=8, description="Filter subjects by semester (1 to 8)"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        20, ge=1, le=100, description="Maximum number of records to return"
    ),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List subjects with search, semester filtering, and pagination metadata."""
    return list_subjects(
        db=db,
        search=search,
        semester=semester,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{subject_id}",
    response_model=SubjectDetailResponse,
    summary="Get subject details by ID",
    description="Returns detailed subject information.",
)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve a single subject by subject_id."""
    return get_subject_by_id(db=db, subject_id=subject_id)


@router.post(
    "",
    response_model=SubjectDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new subject",
    description="Creates a new academic subject with uniqueness and semester validation.",
)
def add_subject(
    request: SubjectCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Create a new academic subject."""
    return create_subject(db=db, request=request)


@router.put(
    "/{subject_id}",
    response_model=SubjectDetailResponse,
    summary="Update subject details",
    description="Updates subject details while enforcing subject code uniqueness and semester range.",
)
def edit_subject(
    subject_id: int,
    request: SubjectUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update an existing subject."""
    return update_subject(db=db, subject_id=subject_id, request=request)

