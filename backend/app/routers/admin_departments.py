"""Admin router for department management operations."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin_departments import (
    DepartmentCreateRequest,
    DepartmentDetailResponse,
    DepartmentListResponse,
    DepartmentUpdateRequest,
)
from app.services.admin_department_service import (
    create_department,
    get_department_by_id,
    list_departments,
    update_department,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "",
    response_model=DepartmentListResponse,
    summary="List departments with class and faculty counts",
    description="Returns a paginated list of academic departments with search by name or code.",
)
def get_departments(
    search: Optional[str] = Query(
        None, description="Search term matching department name or code"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        20, ge=1, le=100, description="Maximum number of records to return"
    ),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List departments with class and faculty counts and pagination."""
    return list_departments(
        db=db,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{department_id}",
    response_model=DepartmentDetailResponse,
    summary="Get department details by ID",
    description="Returns detailed department information including total classes and faculty members.",
)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve a single department by department_id."""
    return get_department_by_id(db=db, department_id=department_id)


@router.post(
    "",
    response_model=DepartmentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new department",
    description="Creates a new academic department with unique department code validation.",
)
def add_department(
    request: DepartmentCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Create a new academic department."""
    return create_department(db=db, request=request)


@router.put(
    "/{department_id}",
    response_model=DepartmentDetailResponse,
    summary="Update department details",
    description="Updates department name or code with unique code validation.",
)
def edit_department(
    department_id: int,
    request: DepartmentUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update department details."""
    return update_department(db=db, department_id=department_id, request=request)

