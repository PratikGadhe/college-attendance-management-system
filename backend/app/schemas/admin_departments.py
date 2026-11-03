"""Pydantic schemas for Admin Department Management operations."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DepartmentCreateRequest(BaseModel):
    """Payload to create a new academic department."""

    department_name: str = Field(
        ..., min_length=1, max_length=100, description="Full name of the department"
    )
    department_code: str = Field(
        ..., min_length=1, max_length=20, description="Unique department code"
    )


class DepartmentUpdateRequest(BaseModel):
    """Payload to update an existing department."""

    department_name: Optional[str] = Field(
        None, min_length=1, max_length=100, description="Updated department name"
    )
    department_code: Optional[str] = Field(
        None, min_length=1, max_length=20, description="Updated department code"
    )


class DepartmentDetailResponse(BaseModel):
    """Department information including class and faculty counts."""

    department_id: int = Field(..., description="Unique department ID")
    department_name: str = Field(..., description="Department name")
    department_code: str = Field(..., description="Unique department code")
    total_classes: int = Field(..., description="Total classes belonging to this department")
    total_faculty: int = Field(..., description="Total faculty assigned to this department")

    model_config = ConfigDict(from_attributes=True)


class DepartmentListResponse(BaseModel):
    """Paginated response containing list of departments and metadata."""

    total: int = Field(..., description="Total matching department records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[DepartmentDetailResponse] = Field(..., description="Page of department details")

