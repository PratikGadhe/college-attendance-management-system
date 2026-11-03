"""Pydantic schemas for Admin Faculty Management operations."""

from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class FacultyCreateRequest(BaseModel):
    """Payload to create a new faculty profile and linked user account."""

    faculty_name: str = Field(
        ..., min_length=1, max_length=100, description="Full name of the faculty member"
    )
    username: str = Field(
        ..., min_length=1, max_length=50, description="Unique login username"
    )
    email: str = Field(
        ..., min_length=1, max_length=100, description="Unique faculty email address"
    )
    department_id: int = Field(
        ..., description="ID of the department to assign the faculty member to"
    )


class FacultyUpdateRequest(BaseModel):
    """Payload to update an existing faculty profile and linked user credentials."""

    faculty_name: Optional[str] = Field(
        None, min_length=1, max_length=100, description="Updated faculty name"
    )
    username: Optional[str] = Field(
        None, min_length=1, max_length=50, description="Updated username"
    )
    email: Optional[str] = Field(
        None, min_length=1, max_length=100, description="Updated email address"
    )
    department_id: Optional[int] = Field(
        None, description="Updated department ID"
    )


class FacultyStatusUpdateRequest(BaseModel):
    """Payload to activate or deactivate a faculty member's user account."""

    account_status: Literal["ACTIVE", "INACTIVE"] = Field(
        ..., description="Desired account status: ACTIVE or INACTIVE"
    )


class FacultyDetailResponse(BaseModel):
    """Detailed faculty information including linked user credentials and department info."""

    faculty_id: int = Field(..., description="Unique ID of the faculty profile")
    user_id: int = Field(..., description="Linked user account ID")
    faculty_name: str = Field(..., description="Faculty member's full name")
    username: str = Field(..., description="Linked user account username")
    email: str = Field(..., description="Linked user account email")
    department_id: int = Field(..., description="Assigned department ID")
    department_name: str = Field(..., description="Assigned department name")
    account_status: str = Field(..., description="Account status (ACTIVE or INACTIVE)")

    model_config = ConfigDict(from_attributes=True)


class FacultyListResponse(BaseModel):
    """Paginated response containing list of faculty members and metadata."""

    total: int = Field(..., description="Total matching faculty records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[FacultyDetailResponse] = Field(..., description="Page of faculty details")

