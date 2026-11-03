"""Admin faculty teaching assignment service layer handling assignment queries, academic validation, and lifecycle."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.classes import Class
from app.models.departments import Department
from app.models.faculty import Faculty
from app.models.lectures import Lecture
from app.models.subjects import Subject
from app.models.teaching_assignments import TeachingAssignment
from app.schemas.admin_teaching_assignments import (
    TeachingAssignmentCreateRequest,
    TeachingAssignmentDetailResponse,
    TeachingAssignmentListResponse,
    TeachingAssignmentUpdateRequest,
)


def _get_teaching_assignment_query():
    """Construct select query for teaching assignments joined with faculty, subject, class, and department."""
    return (
        select(
            TeachingAssignment,
            Faculty.faculty_name,
            Subject.subject_code,
            Subject.subject_name,
            Class.class_name,
            Class.academic_year,
            Class.division,
            Class.department_id,
            Department.department_name,
        )
        .join(Faculty, TeachingAssignment.faculty_id == Faculty.faculty_id)
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
    )


def list_teaching_assignments(
    db: Session,
    faculty_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    class_id: Optional[int] = None,
    department_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
) -> TeachingAssignmentListResponse:
    """Retrieve paginated list of teaching assignments with optional filters."""
    query = _get_teaching_assignment_query()
    count_query = (
        select(func.count(TeachingAssignment.assignment_id))
        .join(Faculty, TeachingAssignment.faculty_id == Faculty.faculty_id)
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
    )

    conditions = []

    if faculty_id is not None:
        conditions.append(TeachingAssignment.faculty_id == faculty_id)

    if subject_id is not None:
        conditions.append(TeachingAssignment.subject_id == subject_id)

    if class_id is not None:
        conditions.append(TeachingAssignment.class_id == class_id)

    if department_id is not None:
        conditions.append(Class.department_id == department_id)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    results = (
        db.execute(
            query.order_by(TeachingAssignment.assignment_id.asc()).offset(skip).limit(limit)
        )
        .all()
    )

    items = [
        TeachingAssignmentDetailResponse(
            assignment_id=row[0].assignment_id,
            faculty_id=row[0].faculty_id,
            faculty_name=row[1],
            subject_id=row[0].subject_id,
            subject_code=row[2],
            subject_name=row[3],
            class_id=row[0].class_id,
            class_name=row[4],
            academic_year=row[5],
            division=row[6],
            department_id=row[7],
            department_name=row[8],
        )
        for row in results
    ]

    return TeachingAssignmentListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )


def get_teaching_assignment_by_id(
    db: Session, assignment_id: int
) -> TeachingAssignmentDetailResponse:
    """Retrieve detailed teaching assignment information by assignment_id."""
    query = _get_teaching_assignment_query().where(
        TeachingAssignment.assignment_id == assignment_id
    )
    row = db.execute(query).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teaching assignment with ID {assignment_id} not found.",
        )

    ta = row[0]
    return TeachingAssignmentDetailResponse(
        assignment_id=ta.assignment_id,
        faculty_id=ta.faculty_id,
        faculty_name=row[1],
        subject_id=ta.subject_id,
        subject_code=row[2],
        subject_name=row[3],
        class_id=ta.class_id,
        class_name=row[4],
        academic_year=row[5],
        division=row[6],
        department_id=row[7],
        department_name=row[8],
    )


def create_teaching_assignment(
    db: Session, request: TeachingAssignmentCreateRequest
) -> TeachingAssignmentDetailResponse:
    """Create a new teaching assignment with academic validations and composite uniqueness."""
    # 1. Verify faculty exists
    faculty = db.scalar(
        select(Faculty).where(Faculty.faculty_id == request.faculty_id)
    )
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with ID {request.faculty_id} not found.",
        )

    # 2. Verify subject exists
    subject = db.scalar(
        select(Subject).where(Subject.subject_id == request.subject_id)
    )
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {request.subject_id} not found.",
        )

    # 3. Verify class exists
    cls = db.scalar(
        select(Class).where(Class.class_id == request.class_id)
    )
    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {request.class_id} not found.",
        )

    # 4. Academic validation: faculty department must match class department
    if faculty.department_id != cls.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faculty department does not match class department.",
        )

    # 5. Academic validation: subject semester must match class semester
    if subject.semester != cls.semester:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject semester does not match class semester.",
        )

    # 6. Composite uniqueness check
    existing = db.scalar(
        select(TeachingAssignment.assignment_id).where(
            TeachingAssignment.faculty_id == request.faculty_id,
            TeachingAssignment.subject_id == request.subject_id,
            TeachingAssignment.class_id == request.class_id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teaching assignment already exists for this faculty, subject, and class.",
        )

    try:
        new_assignment = TeachingAssignment(
            faculty_id=request.faculty_id,
            subject_id=request.subject_id,
            class_id=request.class_id,
        )
        db.add(new_assignment)
        db.commit()
        db.refresh(new_assignment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teaching assignment already exists for this faculty, subject, and class.",
        )
    except Exception:
        db.rollback()
        raise

    return get_teaching_assignment_by_id(db, new_assignment.assignment_id)


def update_teaching_assignment(
    db: Session, assignment_id: int, request: TeachingAssignmentUpdateRequest
) -> TeachingAssignmentDetailResponse:
    """Update teaching assignment references with academic validations and uniqueness check."""
    assignment = db.scalar(
        select(TeachingAssignment).where(
            TeachingAssignment.assignment_id == assignment_id
        )
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teaching assignment with ID {assignment_id} not found.",
        )

    target_faculty_id = (
        request.faculty_id if request.faculty_id is not None else assignment.faculty_id
    )
    target_subject_id = (
        request.subject_id if request.subject_id is not None else assignment.subject_id
    )
    target_class_id = (
        request.class_id if request.class_id is not None else assignment.class_id
    )

    # Verify target faculty exists
    faculty = db.scalar(
        select(Faculty).where(Faculty.faculty_id == target_faculty_id)
    )
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with ID {target_faculty_id} not found.",
        )

    # Verify target subject exists
    subject = db.scalar(
        select(Subject).where(Subject.subject_id == target_subject_id)
    )
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {target_subject_id} not found.",
        )

    # Verify target class exists
    cls = db.scalar(
        select(Class).where(Class.class_id == target_class_id)
    )
    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {target_class_id} not found.",
        )

    # Academic validations
    if faculty.department_id != cls.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faculty department does not match class department.",
        )

    if subject.semester != cls.semester:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject semester does not match class semester.",
        )

    # Composite uniqueness against other assignments
    existing_duplicate = db.scalar(
        select(TeachingAssignment.assignment_id).where(
            TeachingAssignment.faculty_id == target_faculty_id,
            TeachingAssignment.subject_id == target_subject_id,
            TeachingAssignment.class_id == target_class_id,
            TeachingAssignment.assignment_id != assignment_id,
        )
    )
    if existing_duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teaching assignment already exists for this faculty, subject, and class.",
        )

    try:
        assignment.faculty_id = target_faculty_id
        assignment.subject_id = target_subject_id
        assignment.class_id = target_class_id
        db.commit()
        db.refresh(assignment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teaching assignment already exists for this faculty, subject, and class.",
        )
    except Exception:
        db.rollback()
        raise

    return get_teaching_assignment_by_id(db, assignment_id)


def delete_teaching_assignment(db: Session, assignment_id: int) -> None:
    """Delete a teaching assignment if no dependent lecture records exist."""
    assignment = db.scalar(
        select(TeachingAssignment).where(
            TeachingAssignment.assignment_id == assignment_id
        )
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teaching assignment with ID {assignment_id} not found.",
        )

    # Check dependent lectures
    lecture_count = db.scalar(
        select(func.count(Lecture.lecture_id)).where(
            Lecture.assignment_id == assignment_id
        )
    ) or 0

    if lecture_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete teaching assignment because dependent lecture records exist.",
        )

    try:
        db.delete(assignment)
        db.commit()
    except Exception:
        db.rollback()
        raise

