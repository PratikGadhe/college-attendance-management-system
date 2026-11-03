"""Pydantic schemas for Admin Subject Management operations."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SubjectCreateRequest(BaseModel):
    """Payload to create a new subject."""

    subject_code: str = Field(
        ..., min_length=1, max_length=20, description="Unique subject code (e.g. DBMS, OS)"
    )
    subject_name: str = Field(
        ..., min_length=1, max_length=100, description="Full subject name (e.g. Database Management Systems)"
    )
    semester: int = Field(
        ..., ge=1, le=8, description="Academic semester number (must be between 1 and 8)"
    )


class SubjectUpdateRequest(BaseModel):
    """Payload to update an existing subject."""

    subject_code: Optional[str] = Field(
        None, min_length=1, max_length=20, description="Updated subject code"
    )
    subject_name: Optional[str] = Field(
        None, min_length=1, max_length=100, description="Updated subject name"
    )
    semester: Optional[int] = Field(
        None, ge=1, le=8, description="Updated academic semester number (1 to 8)"
    )


class SubjectDetailResponse(BaseModel):
    """Detailed response schema for a subject."""

    subject_id: int = Field(..., description="Unique subject ID")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    semester: int = Field(..., description="Semester number")

    model_config = ConfigDict(from_attributes=True)


class SubjectListResponse(BaseModel):
    """Paginated response containing list of subjects and metadata."""

    total: int = Field(..., description="Total matching subject records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[SubjectDetailResponse] = Field(..., description="Page of subject details")

