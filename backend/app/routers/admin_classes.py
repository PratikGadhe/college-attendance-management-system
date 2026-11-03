"""Admin router for class management operations."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin_classes import (
    ClassCreateRequest,
    ClassDetailResponse,
    ClassListResponse,
    ClassUpdateRequest,
)
from app.services.admin_class_service import (
    create_class,
    get_class_by_id,
    list_classes,
    update_class,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "",
    response_model=ClassListResponse,
    summary="List classes with filters and pagination",
    description="Returns a paginated list of classes with search (class name, academic year, division) and filters by department and semester.",
)
def get_classes(
    search: Optional[str] = Query(
        None, description="Search term matching class name, academic year, or division"
    ),
    department_id: Optional[int] = Query(
        None, description="Filter classes by department ID"
    ),
    semester: Optional[int] = Query(
        None, ge=1, le=8, description="Filter classes by semester (1 to 8)"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        20, ge=1, le=100, description="Maximum number of records to return"
    ),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List classes with search, department/semester filtering, and pagination metadata."""
    return list_classes(
        db=db,
        search=search,
        department_id=department_id,
        semester=semester,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{class_id}",
    response_model=ClassDetailResponse,
    summary="Get class details by ID",
    description="Returns detailed class information including department info and enrolled students count.",
)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve a single class by class_id."""
    return get_class_by_id(db=db, class_id=class_id)


@router.post(
    "",
    response_model=ClassDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new class",
    description="Creates a new academic class with department existence, semester, and composite uniqueness validation.",
)
def add_class(
    request: ClassCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Create a new academic class."""
    return create_class(db=db, request=request)


@router.put(
    "/{class_id}",
    response_model=ClassDetailResponse,
    summary="Update class details",
    description="Updates class details while enforcing department existence, semester range, and composite uniqueness.",
)
def edit_class(
    class_id: int,
    request: ClassUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update class details."""
    return update_class(db=db, class_id=class_id, request=request)

