"""Pydantic schemas for Admin Student Enrollment operations."""

from datetime import date
from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field


class EnrollmentCreateRequest(BaseModel):
    """Payload to enroll a student in a class."""

    student_id: int = Field(..., description="ID of the student to enroll")
    class_id: int = Field(..., description="ID of the class")
    enrollment_date: date = Field(..., description="Date of enrollment (YYYY-MM-DD)")


class EnrollmentStatusUpdateRequest(BaseModel):
    """Payload to update an enrollment's status."""

    enrollment_status: Literal["ACTIVE", "INACTIVE"] = Field(
        ..., description="New enrollment status ('ACTIVE' or 'INACTIVE')"
    )


class EnrollmentDetailResponse(BaseModel):
    """Detailed response schema for a student enrollment."""

    enrollment_id: int = Field(..., description="Unique enrollment ID")
    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student full name")
    roll_number: str = Field(..., description="Student roll number")
    class_id: int = Field(..., description="Class ID")
    class_name: str = Field(..., description="Class name")
    academic_year: str = Field(..., description="Class academic year")
    division: str = Field(..., description="Class division / section")
    department_name: str = Field(..., description="Department name")
    enrollment_date: date = Field(..., description="Date of enrollment")
    enrollment_status: str = Field(..., description="Status ('ACTIVE' or 'INACTIVE')")

    model_config = ConfigDict(from_attributes=True)


class EnrollmentListResponse(BaseModel):
    """Paginated response containing list of student enrollments and metadata."""

    total: int = Field(..., description="Total matching enrollment records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[EnrollmentDetailResponse] = Field(..., description="Page of enrollment details")

