"""Admin router for student enrollment management operations."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_admin
from app.models.users import User
from app.schemas.admin_enrollments import (
    EnrollmentCreateRequest,
    EnrollmentDetailResponse,
    EnrollmentListResponse,
    EnrollmentStatusUpdateRequest,
)
from app.services.admin_enrollment_service import (
    create_enrollment,
    get_enrollment_by_id,
    list_enrollments,
    update_enrollment_status,
)

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "",
    response_model=EnrollmentListResponse,
    summary="List student enrollments with filters and pagination",
    description="Returns a paginated list of student enrollments with search (student name, roll number) and filters by class, department, and status.",
)
def get_enrollments(
    search: Optional[str] = Query(
        None, description="Search term matching student name or roll number"
    ),
    class_id: Optional[int] = Query(
        None, description="Filter enrollments by class ID"
    ),
    department_id: Optional[int] = Query(
        None, description="Filter enrollments by department ID"
    ),
    enrollment_status: Optional[str] = Query(
        None, description="Filter enrollments by status ('ACTIVE' or 'INACTIVE')"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        20, ge=1, le=100, description="Maximum number of records to return"
    ),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List student enrollments with search, filtering, and pagination metadata."""
    return list_enrollments(
        db=db,
        search=search,
        class_id=class_id,
        department_id=department_id,
        enrollment_status=enrollment_status,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{enrollment_id}",
    response_model=EnrollmentDetailResponse,
    summary="Get enrollment details by ID",
    description="Returns detailed enrollment information including student, class, and department details.",
)
def get_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieve a single enrollment record by enrollment_id."""
    return get_enrollment_by_id(db=db, enrollment_id=enrollment_id)


@router.post(
    "",
    response_model=EnrollmentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enroll a student in a class",
    description="Enrolls a student in a class with student/class existence and duplicate enrollment checks.",
)
def add_enrollment(
    request: EnrollmentCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Enroll a student in a class."""
    return create_enrollment(db=db, request=request)


@router.patch(
    "/{enrollment_id}/status",
    response_model=EnrollmentDetailResponse,
    summary="Update enrollment status",
    description="Updates enrollment status between ACTIVE and INACTIVE.",
)
def edit_enrollment_status(
    enrollment_id: int,
    request: EnrollmentStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update status of a student enrollment."""
    return update_enrollment_status(
        db=db, enrollment_id=enrollment_id, request=request
    )

