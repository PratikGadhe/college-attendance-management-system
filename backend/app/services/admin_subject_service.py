"""Admin subject management service layer handling subject queries and mutations."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.subjects import Subject
from app.schemas.admin_subjects import (
    SubjectCreateRequest,
    SubjectDetailResponse,
    SubjectListResponse,
    SubjectUpdateRequest,
)


def list_subjects(
    db: Session,
    search: Optional[str] = None,
    semester: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
) -> SubjectListResponse:
    """Retrieve paginated list of subjects with optional search and semester filters."""
    query = select(Subject)
    count_query = select(func.count(Subject.subject_id))

    conditions = []

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Subject.subject_code.ilike(search_pattern),
                Subject.subject_name.ilike(search_pattern),
            )
        )

    if semester is not None:
        conditions.append(Subject.semester == semester)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    subjects = (
        db.scalars(
            query.order_by(Subject.subject_id.asc()).offset(skip).limit(limit)
        )
        .all()
    )

    items = [
        SubjectDetailResponse(
            subject_id=s.subject_id,
            subject_code=s.subject_code,
            subject_name=s.subject_name,
            semester=s.semester,
        )
        for s in subjects
    ]

    return SubjectListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )


def get_subject_by_id(db: Session, subject_id: int) -> SubjectDetailResponse:
    """Retrieve a single subject by subject_id."""
    subject = db.scalars(
        select(Subject).where(Subject.subject_id == subject_id)
    ).first()

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found.",
        )

    return SubjectDetailResponse(
        subject_id=subject.subject_id,
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        semester=subject.semester,
    )


def create_subject(
    db: Session, request: SubjectCreateRequest
) -> SubjectDetailResponse:
    """Create a new subject with unique code and semester range validation."""
    clean_code = request.subject_code.strip()
    clean_name = request.subject_name.strip()

    if not (1 <= request.semester <= 8):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Semester must be between 1 and 8.",
        )

    # Check for existing subject code (case-insensitive)
    existing_code = db.scalars(
        select(Subject.subject_id).where(
            func.lower(Subject.subject_code) == clean_code.lower()
        )
    ).first()
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subject with code '{clean_code}' already exists.",
        )

    try:
        new_subject = Subject(
            subject_code=clean_code,
            subject_name=clean_name,
            semester=request.semester,
        )
        db.add(new_subject)
        db.commit()
        db.refresh(new_subject)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subject with code '{clean_code}' already exists.",
        )
    except Exception:
        db.rollback()
        raise

    return SubjectDetailResponse(
        subject_id=new_subject.subject_id,
        subject_code=new_subject.subject_code,
        subject_name=new_subject.subject_name,
        semester=new_subject.semester,
    )


def update_subject(
    db: Session, subject_id: int, request: SubjectUpdateRequest
) -> SubjectDetailResponse:
    """Update subject details with unique code check."""
    subject = db.scalars(
        select(Subject).where(Subject.subject_id == subject_id)
    ).first()

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found.",
        )

    if request.subject_code is not None:
        clean_code = request.subject_code.strip()
        existing_code = db.scalars(
            select(Subject.subject_id).where(
                func.lower(Subject.subject_code) == clean_code.lower(),
                Subject.subject_id != subject_id,
            )
        ).first()
        if existing_code:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Subject with code '{clean_code}' already exists.",
            )
        subject.subject_code = clean_code

    if request.subject_name is not None:
        subject.subject_name = request.subject_name.strip()

    if request.semester is not None:
        if not (1 <= request.semester <= 8):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Semester must be between 1 and 8.",
            )
        subject.semester = request.semester

    try:
        db.commit()
        db.refresh(subject)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A unique constraint conflict occurred while updating the subject.",
        )
    except Exception:
        db.rollback()
        raise

    return SubjectDetailResponse(
        subject_id=subject.subject_id,
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        semester=subject.semester,
    )

