"""Pydantic schemas for Admin Student Management operations."""

from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class StudentCreateRequest(BaseModel):
    """Payload to create a new student and linked user account."""

    student_name: str = Field(
        ..., min_length=1, max_length=100, description="Full name of the student"
    )
    roll_number: str = Field(
        ..., min_length=1, max_length=20, description="Unique college roll number"
    )
    username: str = Field(
        ..., min_length=1, max_length=50, description="Unique login username"
    )
    email: str = Field(
        ..., min_length=1, max_length=100, description="Unique student email address"
    )


class StudentUpdateRequest(BaseModel):
    """Payload to update an existing student profile and linked user credentials."""

    student_name: Optional[str] = Field(
        None, min_length=1, max_length=100, description="Updated full name"
    )
    roll_number: Optional[str] = Field(
        None, min_length=1, max_length=20, description="Updated roll number"
    )
    username: Optional[str] = Field(
        None, min_length=1, max_length=50, description="Updated username"
    )
    email: Optional[str] = Field(
        None, min_length=1, max_length=100, description="Updated email address"
    )


class StudentStatusUpdateRequest(BaseModel):
    """Payload to activate or deactivate a student's user account."""

    account_status: Literal["ACTIVE", "INACTIVE"] = Field(
        ..., description="Desired account status: ACTIVE or INACTIVE"
    )


class StudentDetailResponse(BaseModel):
    """Detailed student information including linked user credentials status."""

    student_id: int = Field(..., description="Unique ID of the student profile")
    user_id: int = Field(..., description="Linked user account ID")
    student_name: str = Field(..., description="Student's full name")
    roll_number: str = Field(..., description="Student's roll number")
    username: str = Field(..., description="Linked user account username")
    email: str = Field(..., description="Linked user account email")
    account_status: str = Field(..., description="Account status (ACTIVE or INACTIVE)")

    model_config = ConfigDict(from_attributes=True)


class StudentListResponse(BaseModel):
    """Paginated response containing list of students and metadata."""

    total: int = Field(..., description="Total matching student records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[StudentDetailResponse] = Field(..., description="Page of student details")

