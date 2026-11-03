"""Development-only prototype authentication and authorization dependencies.

WARNING - SECURITY NOTICE:
--------------------------
This module implements development-only prototype authentication.
It relies on an unverified `X-Demo-User-ID` HTTP header for identifying users.
It DOES NOT use cryptographically signed tokens (JWT), password verification,
secure sessions, or cookies. Any client capable of altering HTTP headers can
impersonate any user.

DO NOT DEPLOY THIS TO PRODUCTION.
This is strictly for rapid local development and testing of college attendance workflows.
"""

from typing import Annotated, List, Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.users import User


def get_current_user(
    x_demo_user_id: Annotated[Optional[str], Header(alias="X-Demo-User-ID")] = None,
    db: Session = Depends(get_db),
) -> User:
    """Validate and retrieve the current demo user using the X-Demo-User-ID header.

    Workflow:
    1. Read user ID from `X-Demo-User-ID` header.
    2. Retrieve user record from database, eagerly loading the role.
    3. Verify user existence.
    4. Verify that account_status is 'ACTIVE'.
    5. Return verified User ORM instance.

    Raises:
        HTTPException 401: If header is missing, non-integer, user not found, or inactive.
    """
    if not x_demo_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Demo-User-ID header. Demo authentication required.",
        )

    try:
        user_id = int(x_demo_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid X-Demo-User-ID header. Must be an integer user ID.",
        )

    stmt = select(User).options(joinedload(User.role)).where(User.user_id == user_id)
    user = db.scalars(stmt).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Demo user not found.",
        )

    if user.account_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
        )

    return user


class RoleChecker:
    """Reusable role authorization dependency callable."""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = [r.upper() for r in allowed_roles]

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        """Verify that current_user has one of the required roles.

        Raises:
            HTTPException 403: If user role is not in allowed roles.
        """
        user_role = current_user.role.role_name.upper() if current_user.role else ""
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User role '{user_role}' lacks required permissions ({', '.join(self.allowed_roles)}).",
            )
        return current_user


# Reusable role-specific dependencies
require_admin = RoleChecker(["ADMIN"])
require_faculty = RoleChecker(["FACULTY"])
require_student = RoleChecker(["STUDENT"])

