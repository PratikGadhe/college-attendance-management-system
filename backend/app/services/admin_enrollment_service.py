"""Admin student enrollment service layer handling enrollment queries and status updates."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.classes import Class
from app.models.departments import Department
from app.models.enrollments import Enrollment
from app.models.students import Student
from app.schemas.admin_enrollments import (
    EnrollmentCreateRequest,
    EnrollmentDetailResponse,
    EnrollmentListResponse,
    EnrollmentStatusUpdateRequest,
)


def _get_enrollment_query():
    """Construct select query for enrollments with joined student, class, and department details."""
    return (
        select(
            Enrollment,
            Student.student_name,
            Student.roll_number,
            Class.class_name,
            Class.academic_year,
            Class.division,
            Department.department_name,
        )
        .join(Student, Enrollment.student_id == Student.student_id)
        .join(Class, Enrollment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
    )


def list_enrollments(
    db: Session,
    search: Optional[str] = None,
    class_id: Optional[int] = None,
    department_id: Optional[int] = None,
    enrollment_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> EnrollmentListResponse:
    """Retrieve paginated list of enrollments with optional search and filters."""
    query = _get_enrollment_query()
    count_query = (
        select(func.count(Enrollment.enrollment_id))
        .join(Student, Enrollment.student_id == Student.student_id)
        .join(Class, Enrollment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
    )

    conditions = []

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Student.student_name.ilike(search_pattern),
                Student.roll_number.ilike(search_pattern),
            )
        )

    if class_id is not None:
        conditions.append(Enrollment.class_id == class_id)

    if department_id is not None:
        conditions.append(Class.department_id == department_id)

    if enrollment_status and enrollment_status.strip():
        clean_status = enrollment_status.strip().upper()
        conditions.append(Enrollment.enrollment_status == clean_status)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    results = (
        db.execute(
            query.order_by(Enrollment.enrollment_id.asc()).offset(skip).limit(limit)
        )
        .all()
    )

    items = [
        EnrollmentDetailResponse(
            enrollment_id=row[0].enrollment_id,
            student_id=row[0].student_id,
            student_name=row[1],
            roll_number=row[2],
            class_id=row[0].class_id,
            class_name=row[3],
            academic_year=row[4],
            division=row[5],
            department_name=row[6],
            enrollment_date=row[0].enrollment_date,
            enrollment_status=row[0].enrollment_status,
        )
        for row in results
    ]

    return EnrollmentListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )


def get_enrollment_by_id(db: Session, enrollment_id: int) -> EnrollmentDetailResponse:
    """Retrieve detailed enrollment information by enrollment_id."""
    query = _get_enrollment_query().where(Enrollment.enrollment_id == enrollment_id)
    row = db.execute(query).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment with ID {enrollment_id} not found.",
        )

    enr = row[0]
    return EnrollmentDetailResponse(
        enrollment_id=enr.enrollment_id,
        student_id=enr.student_id,
        student_name=row[1],
        roll_number=row[2],
        class_id=enr.class_id,
        class_name=row[3],
        academic_year=row[4],
        division=row[5],
        department_name=row[6],
        enrollment_date=enr.enrollment_date,
        enrollment_status=enr.enrollment_status,
    )


def create_enrollment(
    db: Session, request: EnrollmentCreateRequest
) -> EnrollmentDetailResponse:
    """Enroll a student in a class with student/class existence and unique constraint checks."""
    # 1. Verify student exists
    student = db.scalar(
        select(Student).where(Student.student_id == request.student_id)
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {request.student_id} not found.",
        )

    # 2. Verify class exists
    cls = db.scalar(
        select(Class).where(Class.class_id == request.class_id)
    )
    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {request.class_id} not found.",
        )

    # 3. Check duplicate enrollment
    existing = db.scalar(
        select(Enrollment.enrollment_id).where(
            Enrollment.student_id == request.student_id,
            Enrollment.class_id == request.class_id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this class.",
        )

    try:
        new_enrollment = Enrollment(
            student_id=request.student_id,
            class_id=request.class_id,
            enrollment_date=request.enrollment_date,
            enrollment_status="ACTIVE",
        )
        db.add(new_enrollment)
        db.commit()
        db.refresh(new_enrollment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this class.",
        )
    except Exception:
        db.rollback()
        raise

    return get_enrollment_by_id(db, new_enrollment.enrollment_id)


def update_enrollment_status(
    db: Session, enrollment_id: int, request: EnrollmentStatusUpdateRequest
) -> EnrollmentDetailResponse:
    """Update enrollment status between ACTIVE and INACTIVE."""
    enrollment = db.scalar(
        select(Enrollment).where(Enrollment.enrollment_id == enrollment_id)
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment with ID {enrollment_id} not found.",
        )

    clean_status = request.enrollment_status.strip().upper()
    if clean_status not in ("ACTIVE", "INACTIVE"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enrollment status must be either 'ACTIVE' or 'INACTIVE'.",
        )

    try:
        enrollment.enrollment_status = clean_status
        db.commit()
        db.refresh(enrollment)
    except Exception:
        db.rollback()
        raise

    return get_enrollment_by_id(db, enrollment_id)

