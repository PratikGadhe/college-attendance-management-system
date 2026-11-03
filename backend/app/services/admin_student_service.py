"""Admin student management service layer handling student and linked user queries."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.roles import Role
from app.models.students import Student
from app.models.users import User
from app.schemas.admin_students import (
    StudentCreateRequest,
    StudentDetailResponse,
    StudentListResponse,
    StudentStatusUpdateRequest,
    StudentUpdateRequest,
)


def to_student_detail_response(student: Student) -> StudentDetailResponse:
    """Helper to convert a Student ORM model into a StudentDetailResponse."""
    return StudentDetailResponse(
        student_id=student.student_id,
        user_id=student.user_id,
        student_name=student.student_name,
        roll_number=student.roll_number,
        username=student.user.username if student.user else "",
        email=student.user.email if student.user else "",
        account_status=student.user.account_status if student.user else "INACTIVE",
    )


def list_students(
    db: Session,
    search: Optional[str] = None,
    account_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> StudentListResponse:
    """Retrieve paginated list of students with optional search and status filtering."""
    query = (
        select(Student)
        .join(User, Student.user_id == User.user_id)
        .options(joinedload(Student.user))
    )
    count_query = select(func.count(Student.student_id)).join(
        User, Student.user_id == User.user_id
    )

    conditions = []

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Student.student_name.ilike(search_pattern),
                Student.roll_number.ilike(search_pattern),
                User.username.ilike(search_pattern),
                User.email.ilike(search_pattern),
            )
        )

    if account_status and account_status.strip():
        conditions.append(User.account_status == account_status.strip().upper())

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    students = (
        db.scalars(
            query.order_by(Student.student_id.asc()).offset(skip).limit(limit)
        )
        .unique()
        .all()
    )

    items = [to_student_detail_response(s) for s in students]

    return StudentListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )


def get_student_by_id(db: Session, student_id: int) -> StudentDetailResponse:
    """Retrieve detailed student information by student_id."""
    stmt = (
        select(Student)
        .options(joinedload(Student.user))
        .where(Student.student_id == student_id)
    )
    student = db.scalars(stmt).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )

    return to_student_detail_response(student)


def create_student(
    db: Session, request: StudentCreateRequest
) -> StudentDetailResponse:
    """Create a new student profile and linked user account within a single transaction."""
    # 1. Fetch the STUDENT role dynamically
    student_role = db.scalars(
        select(Role).where(Role.role_name == "STUDENT")
    ).first()
    if not student_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="STUDENT role is not configured in the database.",
        )

    # 2. Check for duplicate username
    clean_username = request.username.strip()
    existing_username = db.scalar(
        select(User.user_id).where(User.username == clean_username)
    )
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{clean_username}' is already in use.",
        )

    # 3. Check for duplicate email
    clean_email = request.email.strip()
    existing_email = db.scalar(
        select(User.user_id).where(User.email == clean_email)
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{clean_email}' is already registered.",
        )

    # 4. Check for duplicate roll number
    clean_roll = request.roll_number.strip()
    existing_roll = db.scalar(
        select(Student.student_id).where(Student.roll_number == clean_roll)
    )
    if existing_roll:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Roll number '{clean_roll}' is already in use.",
        )

    # 5. Create linked user and student in one transaction
    try:
        new_user = User(
            role_id=student_role.role_id,
            username=clean_username,
            email=clean_email,
            password_hash=None,
            account_status="ACTIVE",
        )
        db.add(new_user)
        db.flush()

        new_student = Student(
            user_id=new_user.user_id,
            roll_number=clean_roll,
            student_name=request.student_name.strip(),
        )
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A unique constraint conflict occurred while creating the student.",
        )
    except Exception:
        db.rollback()
        raise

    return to_student_detail_response(new_student)


def update_student(
    db: Session, student_id: int, request: StudentUpdateRequest
) -> StudentDetailResponse:
    """Update student profile and linked user credentials with conflict checks."""
    stmt = (
        select(Student)
        .options(joinedload(Student.user))
        .where(Student.student_id == student_id)
    )
    student = db.scalars(stmt).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )

    # Validate duplicate username if changed
    if request.username is not None and request.username.strip():
        new_username = request.username.strip()
        if new_username != student.user.username:
            dup_user = db.scalar(
                select(User.user_id).where(
                    User.username == new_username, User.user_id != student.user_id
                )
            )
            if dup_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Username '{new_username}' is already in use.",
                )
            student.user.username = new_username

    # Validate duplicate email if changed
    if request.email is not None and request.email.strip():
        new_email = request.email.strip()
        if new_email != student.user.email:
            dup_email = db.scalar(
                select(User.user_id).where(
                    User.email == new_email, User.user_id != student.user_id
                )
            )
            if dup_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Email '{new_email}' is already registered.",
                )
            student.user.email = new_email

    # Validate duplicate roll_number if changed
    if request.roll_number is not None and request.roll_number.strip():
        new_roll = request.roll_number.strip()
        if new_roll != student.roll_number:
            dup_roll = db.scalar(
                select(Student.student_id).where(
                    Student.roll_number == new_roll,
                    Student.student_id != student.student_id,
                )
            )
            if dup_roll:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Roll number '{new_roll}' is already in use.",
                )
            student.roll_number = new_roll

    # Update student_name if provided
    if request.student_name is not None and request.student_name.strip():
        student.student_name = request.student_name.strip()

    try:
        db.commit()
        db.refresh(student)
        db.refresh(student.user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict updating student records.",
        )
    except Exception:
        db.rollback()
        raise

    return to_student_detail_response(student)


def update_student_status(
    db: Session, student_id: int, request: StudentStatusUpdateRequest
) -> StudentDetailResponse:
    """Activate or deactivate a student's linked user account."""
    stmt = (
        select(Student)
        .options(joinedload(Student.user))
        .where(Student.student_id == student_id)
    )
    student = db.scalars(stmt).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )

    student.user.account_status = request.account_status
    try:
        db.commit()
        db.refresh(student)
        db.refresh(student.user)
    except Exception:
        db.rollback()
        raise

    return to_student_detail_response(student)

