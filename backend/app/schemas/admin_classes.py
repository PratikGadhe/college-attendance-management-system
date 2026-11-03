"""Pydantic schemas for Admin Class Management operations."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ClassCreateRequest(BaseModel):
    """Payload to create a new academic class."""

    department_id: int = Field(
        ..., description="ID of the department this class belongs to"
    )
    class_name: str = Field(
        ..., min_length=1, max_length=100, description="Class name (e.g. SY Computer Engineering)"
    )
    academic_year: str = Field(
        ..., min_length=1, max_length=20, description="Academic year (e.g. 2026-27)"
    )
    division: str = Field(
        ..., min_length=1, max_length=10, description="Class division / section (e.g. A)"
    )
    semester: int = Field(
        ..., ge=1, le=8, description="Semester number (must be between 1 and 8)"
    )


class ClassUpdateRequest(BaseModel):
    """Payload to update an existing academic class."""

    department_id: Optional[int] = Field(
        None, description="Updated department ID"
    )
    class_name: Optional[str] = Field(
        None, min_length=1, max_length=100, description="Updated class name"
    )
    academic_year: Optional[str] = Field(
        None, min_length=1, max_length=20, description="Updated academic year"
    )
    division: Optional[str] = Field(
        None, min_length=1, max_length=10, description="Updated division"
    )
    semester: Optional[int] = Field(
        None, ge=1, le=8, description="Updated semester (1 to 8)"
    )


class ClassDetailResponse(BaseModel):
    """Detailed class information including department info and enrollment count."""

    class_id: int = Field(..., description="Unique class ID")
    department_id: int = Field(..., description="Assigned department ID")
    department_name: str = Field(..., description="Assigned department name")
    class_name: str = Field(..., description="Class name")
    academic_year: str = Field(..., description="Academic year")
    division: str = Field(..., description="Division / section")
    semester: int = Field(..., description="Semester number")
    total_enrolled_students: int = Field(
        ..., description="Total count of enrolled students in this class"
    )

    model_config = ConfigDict(from_attributes=True)


class ClassListResponse(BaseModel):
    """Paginated response containing list of classes and metadata."""

    total: int = Field(..., description="Total matching class records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[ClassDetailResponse] = Field(..., description="Page of class details")

