"""Admin faculty management service layer handling faculty and linked user queries."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.departments import Department
from app.models.faculty import Faculty
from app.models.roles import Role
from app.models.users import User
from app.schemas.admin_faculty import (
    FacultyCreateRequest,
    FacultyDetailResponse,
    FacultyListResponse,
    FacultyStatusUpdateRequest,
    FacultyUpdateRequest,
)


def to_faculty_detail_response(faculty: Faculty) -> FacultyDetailResponse:
    """Helper to convert a Faculty ORM model into a FacultyDetailResponse."""
    return FacultyDetailResponse(
        faculty_id=faculty.faculty_id,
        user_id=faculty.user_id,
        faculty_name=faculty.faculty_name,
        username=faculty.user.username if faculty.user else "",
        email=faculty.user.email if faculty.user else "",
        department_id=faculty.department_id,
        department_name=faculty.department.department_name if faculty.department else "",
        account_status=faculty.user.account_status if faculty.user else "INACTIVE",
    )


def list_faculty(
    db: Session,
    search: Optional[str] = None,
    account_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> FacultyListResponse:
    """Retrieve paginated list of faculty members with optional search and status filtering."""
    query = (
        select(Faculty)
        .join(User, Faculty.user_id == User.user_id)
        .join(Department, Faculty.department_id == Department.department_id)
        .options(joinedload(Faculty.user), joinedload(Faculty.department))
    )
    count_query = (
        select(func.count(Faculty.faculty_id))
        .join(User, Faculty.user_id == User.user_id)
        .join(Department, Faculty.department_id == Department.department_id)
    )

    conditions = []

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Faculty.faculty_name.ilike(search_pattern),
                User.username.ilike(search_pattern),
                User.email.ilike(search_pattern),
                Department.department_name.ilike(search_pattern),
            )
        )

    if account_status and account_status.strip():
        conditions.append(User.account_status == account_status.strip().upper())

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    faculties = (
        db.scalars(
            query.order_by(Faculty.faculty_id.asc()).offset(skip).limit(limit)
        )
        .unique()
        .all()
    )

    items = [to_faculty_detail_response(f) for f in faculties]

    return FacultyListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )


def get_faculty_by_id(db: Session, faculty_id: int) -> FacultyDetailResponse:
    """Retrieve detailed faculty information by faculty_id."""
    stmt = (
        select(Faculty)
        .options(joinedload(Faculty.user), joinedload(Faculty.department))
        .where(Faculty.faculty_id == faculty_id)
    )
    faculty = db.scalars(stmt).first()

    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with ID {faculty_id} not found.",
        )

    return to_faculty_detail_response(faculty)


def create_faculty(
    db: Session, request: FacultyCreateRequest
) -> FacultyDetailResponse:
    """Create a new faculty profile and linked user account in a single transaction."""
    # 1. Fetch the FACULTY role dynamically
    faculty_role = db.scalars(
        select(Role).where(Role.role_name == "FACULTY")
    ).first()
    if not faculty_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FACULTY role is not configured in the database.",
        )

    # 2. Verify that the supplied department_id exists
    department = db.scalar(
        select(Department.department_id).where(
            Department.department_id == request.department_id
        )
    )
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {request.department_id} not found.",
        )

    # 3. Check for duplicate username
    clean_username = request.username.strip()
    existing_username = db.scalar(
        select(User.user_id).where(User.username == clean_username)
    )
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{clean_username}' is already in use.",
        )

    # 4. Check for duplicate email
    clean_email = request.email.strip()
    existing_email = db.scalar(
        select(User.user_id).where(User.email == clean_email)
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{clean_email}' is already registered.",
        )

    # 5. Create linked User and Faculty in one transaction
    try:
        new_user = User(
            role_id=faculty_role.role_id,
            username=clean_username,
            email=clean_email,
            password_hash=None,
            account_status="ACTIVE",
        )
        db.add(new_user)
        db.flush()

        new_faculty = Faculty(
            user_id=new_user.user_id,
            department_id=request.department_id,
            faculty_name=request.faculty_name.strip(),
        )
        db.add(new_faculty)
        db.commit()

        # Eager load relationships for the response
        stmt = (
            select(Faculty)
            .options(joinedload(Faculty.user), joinedload(Faculty.department))
            .where(Faculty.faculty_id == new_faculty.faculty_id)
        )
        created_faculty = db.scalars(stmt).first()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A unique constraint conflict occurred while creating the faculty member.",
        )
    except Exception:
        db.rollback()
        raise

    return to_faculty_detail_response(created_faculty)


def update_faculty(
    db: Session, faculty_id: int, request: FacultyUpdateRequest
) -> FacultyDetailResponse:
    """Update faculty profile and linked user credentials with conflict checks."""
    stmt = (
        select(Faculty)
        .options(joinedload(Faculty.user), joinedload(Faculty.department))
        .where(Faculty.faculty_id == faculty_id)
    )
    faculty = db.scalars(stmt).first()

    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with ID {faculty_id} not found.",
        )

    # Validate department if provided
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
        faculty.department_id = request.department_id

    # Validate duplicate username if changed
    if request.username is not None and request.username.strip():
        new_username = request.username.strip()
        if new_username != faculty.user.username:
            dup_user = db.scalar(
                select(User.user_id).where(
                    User.username == new_username, User.user_id != faculty.user_id
                )
            )
            if dup_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Username '{new_username}' is already in use.",
                )
            faculty.user.username = new_username

    # Validate duplicate email if changed
    if request.email is not None and request.email.strip():
        new_email = request.email.strip()
        if new_email != faculty.user.email:
            dup_email = db.scalar(
                select(User.user_id).where(
                    User.email == new_email, User.user_id != faculty.user_id
                )
            )
            if dup_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Email '{new_email}' is already registered.",
                )
            faculty.user.email = new_email

    # Update faculty_name if provided
    if request.faculty_name is not None and request.faculty_name.strip():
        faculty.faculty_name = request.faculty_name.strip()

    try:
        db.commit()
        # Refresh with relationships reloaded
        stmt = (
            select(Faculty)
            .options(joinedload(Faculty.user), joinedload(Faculty.department))
            .where(Faculty.faculty_id == faculty.faculty_id)
        )
        updated_faculty = db.scalars(stmt).first()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict updating faculty records.",
        )
    except Exception:
        db.rollback()
        raise

    return to_faculty_detail_response(updated_faculty)


def update_faculty_status(
    db: Session, faculty_id: int, request: FacultyStatusUpdateRequest
) -> FacultyDetailResponse:
    """Activate or deactivate a faculty member's linked user account."""
    stmt = (
        select(Faculty)
        .options(joinedload(Faculty.user), joinedload(Faculty.department))
        .where(Faculty.faculty_id == faculty_id)
    )
    faculty = db.scalars(stmt).first()

    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with ID {faculty_id} not found.",
        )

    faculty.user.account_status = request.account_status
    try:
        db.commit()
        db.refresh(faculty)
        db.refresh(faculty.user)
    except Exception:
        db.rollback()
        raise

    return to_faculty_detail_response(faculty)

