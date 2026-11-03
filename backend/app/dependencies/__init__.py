"""API dependencies package."""

from app.dependencies.auth import (
    RoleChecker,
    get_current_user,
    require_admin,
    require_faculty,
    require_student,
)

__all__ = [
    "get_current_user",
    "RoleChecker",
    "require_admin",
    "require_faculty",
    "require_student",
]
