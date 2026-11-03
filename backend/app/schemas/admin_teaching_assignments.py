"""Pydantic schemas for Admin Faculty Teaching Assignment operations."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TeachingAssignmentCreateRequest(BaseModel):
    """Payload to assign a faculty member to teach a subject for a class."""

    faculty_id: int = Field(..., description="ID of the faculty member")
    subject_id: int = Field(..., description="ID of the subject to teach")
    class_id: int = Field(..., description="ID of the class")


class TeachingAssignmentUpdateRequest(BaseModel):
    """Payload to update an existing teaching assignment."""

    faculty_id: Optional[int] = Field(None, description="Updated faculty member ID")
    subject_id: Optional[int] = Field(None, description="Updated subject ID")
    class_id: Optional[int] = Field(None, description="Updated class ID")


class TeachingAssignmentDetailResponse(BaseModel):
    """Detailed response schema for a faculty teaching assignment."""

    assignment_id: int = Field(..., description="Unique assignment ID")
    faculty_id: int = Field(..., description="Faculty ID")
    faculty_name: str = Field(..., description="Faculty full name")
    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    class_id: int = Field(..., description="Class ID")
    class_name: str = Field(..., description="Class name")
    academic_year: str = Field(..., description="Class academic year")
    division: str = Field(..., description="Class division / section")
    department_id: int = Field(..., description="Department ID")
    department_name: str = Field(..., description="Department name")

    model_config = ConfigDict(from_attributes=True)


class TeachingAssignmentListResponse(BaseModel):
    """Paginated response containing list of teaching assignments and metadata."""

    total: int = Field(..., description="Total matching teaching assignment records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[TeachingAssignmentDetailResponse] = Field(
        ..., description="Page of teaching assignment details"
    )

