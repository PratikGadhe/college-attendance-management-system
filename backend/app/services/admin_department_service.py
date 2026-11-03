"""Admin department management service layer handling department queries and counts."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.classes import Class
from app.models.departments import Department
from app.models.faculty import Faculty
from app.schemas.admin_departments import (
    DepartmentCreateRequest,
    DepartmentDetailResponse,
    DepartmentListResponse,
    DepartmentUpdateRequest,
)


def _get_department_query_with_counts():
    """Construct a select query with independent subqueries for class and faculty counts."""
    classes_subquery = (
        select(func.count(Class.class_id))
        .where(Class.department_id == Department.department_id)
        .correlate(Department)
        .scalar_subquery()
    )
    faculty_subquery = (
        select(func.count(Faculty.faculty_id))
        .where(Faculty.department_id == Department.department_id)
        .correlate(Department)
        .scalar_subquery()
    )

    return select(
        Department,
        classes_subquery.label("total_classes"),
        faculty_subquery.label("total_faculty"),
    )


def list_departments(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> DepartmentListResponse:
    """Retrieve paginated list of departments with class and faculty counts."""
    query = _get_department_query_with_counts()
    count_query = select(func.count(Department.department_id))

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        search_filter = or_(
            Department.department_name.ilike(search_pattern),
            Department.department_code.ilike(search_pattern),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = db.scalar(count_query) or 0
    results = (
        db.execute(
            query.order_by(Department.department_id.asc())
            .offset(skip)
            .limit(limit)
        )
        .all()
    )

    items = [
        DepartmentDetailResponse(
            department_id=row[0].department_id,
            department_name=row[0].department_name,
            department_code=row[0].department_code,
            total_classes=row[1] or 0,
            total_faculty=row[2] or 0,
        )
        for row in results
    ]

    return DepartmentListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )


def get_department_by_id(
    db: Session, department_id: int
) -> DepartmentDetailResponse:
    """Retrieve detailed department information by department_id."""
    query = _get_department_query_with_counts().where(
        Department.department_id == department_id
    )
    row = db.execute(query).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {department_id} not found.",
        )

    dept = row[0]
    return DepartmentDetailResponse(
        department_id=dept.department_id,
        department_name=dept.department_name,
        department_code=dept.department_code,
        total_classes=row[1] or 0,
        total_faculty=row[2] or 0,
    )


def create_department(
    db: Session, request: DepartmentCreateRequest
) -> DepartmentDetailResponse:
    """Create a new academic department."""
    clean_code = request.department_code.strip().upper()
    existing_code = db.scalar(
        select(Department.department_id).where(
            Department.department_code == clean_code
        )
    )
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Department code '{clean_code}' is already in use.",
        )

    try:
        new_dept = Department(
            department_name=request.department_name.strip(),
            department_code=clean_code,
        )
        db.add(new_dept)
        db.commit()
        db.refresh(new_dept)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A unique constraint conflict occurred while creating the department.",
        )
    except Exception:
        db.rollback()
        raise

    return DepartmentDetailResponse(
        department_id=new_dept.department_id,
        department_name=new_dept.department_name,
        department_code=new_dept.department_code,
        total_classes=0,
        total_faculty=0,
    )


def update_department(
    db: Session, department_id: int, request: DepartmentUpdateRequest
) -> DepartmentDetailResponse:
    """Update department name or code with conflict check."""
    dept = db.scalars(
        select(Department).where(Department.department_id == department_id)
    ).first()

    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {department_id} not found.",
        )

    if request.department_code is not None and request.department_code.strip():
        new_code = request.department_code.strip().upper()
        if new_code != dept.department_code:
            dup = db.scalar(
                select(Department.department_id).where(
                    Department.department_code == new_code,
                    Department.department_id != department_id,
                )
            )
            if dup:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Department code '{new_code}' is already in use.",
                )
            dept.department_code = new_code

    if request.department_name is not None and request.department_name.strip():
        dept.department_name = request.department_name.strip()

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict updating department.",
        )
    except Exception:
        db.rollback()
        raise

    return get_department_by_id(db, department_id)

