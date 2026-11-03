"""Authentication router implementing prototype demo login and role checks."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.dependencies.auth import (
    get_current_user,
    require_admin,
    require_faculty,
    require_student,
)
from app.models.users import User
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter()


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Prototype demo login",
    description="Development-only username-based login. Validates user existence and status from MySQL.",
)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a demo user by username.

    Steps:
    1. Look up user by username in MySQL.
    2. Check that user exists (HTTP 401 if missing).
    3. Check that account is ACTIVE (HTTP 401 if inactive).
    4. Retrieve validated role from the database.
    5. Return user identity and role.
    """
    stmt = (
        select(User)
        .options(joinedload(User.role))
        .where(User.username == request.username.strip())
    )
    user = db.scalars(stmt).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username.",
        )

    if user.account_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive.",
        )

    return LoginResponse(
        user_id=user.user_id,
        username=user.username,
        role=user.role.role_name if user.role else "UNKNOWN",
        status=user.account_status,
    )


@router.get(
    "/me",
    response_model=LoginResponse,
    summary="Get current user profile",
    description="Returns the profile and role of the user verified by the X-Demo-User-ID header.",
)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated demo user's profile."""
    return LoginResponse(
        user_id=current_user.user_id,
        username=current_user.username,
        role=current_user.role.role_name if current_user.role else "UNKNOWN",
        status=current_user.account_status,
    )


@router.get(
    "/test-admin",
    summary="Admin role test endpoint",
    description="Protected endpoint accessible only to users with the ADMIN role.",
)
def test_admin_role(current_user: User = Depends(require_admin)):
    """Verify ADMIN role access."""
    return {
        "status": "success",
        "message": f"Welcome Admin {current_user.username}",
        "user_id": current_user.user_id,
        "role": current_user.role.role_name,
    }


@router.get(
    "/test-faculty",
    summary="Faculty role test endpoint",
    description="Protected endpoint accessible only to users with the FACULTY role.",
)
def test_faculty_role(current_user: User = Depends(require_faculty)):
    """Verify FACULTY role access."""
    return {
        "status": "success",
        "message": f"Welcome Faculty {current_user.username}",
        "user_id": current_user.user_id,
        "role": current_user.role.role_name,
    }


@router.get(
    "/test-student",
    summary="Student role test endpoint",
    description="Protected endpoint accessible only to users with the STUDENT role.",
)
def test_student_role(current_user: User = Depends(require_student)):
    """Verify STUDENT role access."""
    return {
        "status": "success",
        "message": f"Welcome Student {current_user.username}",
        "user_id": current_user.user_id,
        "role": current_user.role.role_name,
    }

