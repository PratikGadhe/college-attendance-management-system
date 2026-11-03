"""Admin class management service layer handling class queries and enrollment counts."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.classes import Class
from app.models.departments import Department
from app.models.enrollments import Enrollment
from app.schemas.admin_classes import (
    ClassCreateRequest,
    ClassDetailResponse,
    ClassListResponse,
    ClassUpdateRequest,
)


def _get_class_query_with_details():
    """Construct select query for classes with linked department name and enrollment count."""
    enrollment_subquery = (
        select(func.count(Enrollment.enrollment_id))
        .where(Enrollment.class_id == Class.class_id)
        .correlate(Class)
        .scalar_subquery()
    )

    return select(
        Class,
        Department.department_name,
        enrollment_subquery.label("total_enrolled_students"),
    ).join(Department, Class.department_id == Department.department_id)


def list_classes(
    db: Session,
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
) -> ClassListResponse:
    """Retrieve paginated list of classes with optional search and filters."""
    query = _get_class_query_with_details()
    count_query = select(func.count(Class.class_id)).join(
        Department, Class.department_id == Department.department_id
    )

    conditions = []

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Class.class_name.ilike(search_pattern),
                Class.academic_year.ilike(search_pattern),
                Class.division.ilike(search_pattern),
            )
        )

    if department_id is not None:
        conditions.append(Class.department_id == department_id)

    if semester is not None:
        conditions.append(Class.semester == semester)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    results = (
        db.execute(
            query.order_by(Class.class_id.asc()).offset(skip).limit(limit)
        )
        .all()
    )

    items = [
        ClassDetailResponse(
            class_id=row[0].class_id,
            department_id=row[0].department_id,
            department_name=row[1],
            class_name=row[0].class_name,
            academic_year=row[0].academic_year,
            division=row[0].division,
            semester=row[0].semester,
            total_enrolled_students=row[2] or 0,
        )
        for row in results
    ]

    return ClassListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )


def get_class_by_id(db: Session, class_id: int) -> ClassDetailResponse:
    """Retrieve detailed class information by class_id."""
    query = _get_class_query_with_details().where(Class.class_id == class_id)
    row = db.execute(query).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found.",
        )

    cls = row[0]
    return ClassDetailResponse(
        class_id=cls.class_id,
        department_id=cls.department_id,
        department_name=row[1],
        class_name=cls.class_name,
        academic_year=cls.academic_year,
        division=cls.division,
        semester=cls.semester,
        total_enrolled_students=row[2] or 0,
    )


def create_class(
    db: Session, request: ClassCreateRequest
) -> ClassDetailResponse:
    """Create a new academic class with department existence and uniqueness checks."""
    # 1. Verify department exists
    dept = db.scalars(
        select(Department).where(
            Department.department_id == request.department_id
        )
    ).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {request.department_id} not found.",
        )

    # 2. Validate semester constraint (1-8)
    if not (1 <= request.semester <= 8):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Semester must be between 1 and 8.",
        )

    # 3. Check duplicate composite unique constraint
    clean_name = request.class_name.strip()
    clean_year = request.academic_year.strip()
    clean_div = request.division.strip().upper()

    existing = db.scalar(
        select(Class.class_id).where(
            Class.department_id == request.department_id,
            Class.academic_year == clean_year,
            Class.class_name == clean_name,
            Class.division == clean_div,
            Class.semester == request.semester,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A class with this department, academic year, class name, division, and semester already exists.",
        )

    try:
        new_class = Class(
            department_id=request.department_id,
            class_name=clean_name,
            academic_year=clean_year,
            division=clean_div,
            semester=request.semester,
        )
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A unique constraint conflict occurred while creating the class.",
        )
    except Exception:
        db.rollback()
        raise

    return ClassDetailResponse(
        class_id=new_class.class_id,
        department_id=new_class.department_id,
        department_name=dept.department_name,
        class_name=new_class.class_name,
        academic_year=new_class.academic_year,
        division=new_class.division,
        semester=new_class.semester,
        total_enrolled_students=0,
    )


def update_class(
    db: Session, class_id: int, request: ClassUpdateRequest
) -> ClassDetailResponse:
    """Update class details with department validation and composite conflict checks."""
    cls = db.scalars(
        select(Class).where(Class.class_id == class_id)
    ).first()

    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found.",
        )

    # Verify new department if provided
    new_dept_id = cls.department_id
    if request.department_id is not None:
        dept = db.scalar(
            select(Department.department_id).where(
                Department.department_id == request.department_id
            )
        )
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Department with ID {request.department_id} not found.",
            )
        new_dept_id = request.department_id

    # Validate semester if provided
    new_semester = cls.semester
    if request.semester is not None:
        if not (1 <= request.semester <= 8):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Semester must be between 1 and 8.",
            )
        new_semester = request.semester

    new_name = (
        request.class_name.strip()
        if request.class_name is not None
        else cls.class_name
    )
    new_year = (
        request.academic_year.strip()
        if request.academic_year is not None
        else cls.academic_year
    )
    new_div = (
        request.division.strip().upper()
        if request.division is not None
        else cls.division
    )

    # Check composite unique conflict with another class
    dup = db.scalar(
        select(Class.class_id).where(
            Class.department_id == new_dept_id,
            Class.academic_year == new_year,
            Class.class_name == new_name,
            Class.division == new_div,
            Class.semester == new_semester,
            Class.class_id != class_id,
        )
    )
    if dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A class with this department, academic year, class name, division, and semester already exists.",
        )

    cls.department_id = new_dept_id
    cls.class_name = new_name
    cls.academic_year = new_year
    cls.division = new_div
    cls.semester = new_semester

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict updating class details.",
        )
    except Exception:
        db.rollback()
        raise

    return get_class_by_id(db, class_id)

