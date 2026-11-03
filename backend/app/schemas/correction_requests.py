"""Pydantic schemas for Attendance Correction Requests and Review operations."""

from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class CorrectionRequestCreateRequest(BaseModel):
    """Payload submitted by student to request attendance correction."""

    attendance_id: int = Field(..., description="ID of the attendance record to dispute")
    requested_status: Literal["PRESENT", "ABSENT"] = Field(
        ..., description="Desired corrected status ('PRESENT' or 'ABSENT')"
    )
    reason: str = Field(
        ..., min_length=5, max_length=500, description="Justification for attendance correction"
    )


class CorrectionRequestReviewRequest(BaseModel):
    """Payload submitted by faculty to approve or reject a correction request."""

    decision: Literal["APPROVED", "REJECTED"] = Field(
        ..., description="Review decision ('APPROVED' or 'REJECTED')"
    )
    review_remarks: Optional[str] = Field(
        None, max_length=500, description="Optional faculty review remarks"
    )


class CorrectionRequestDetailResponse(BaseModel):
    """Detailed view of an attendance correction request."""

    request_id: int = Field(..., description="Unique request ID")
    attendance_id: int = Field(..., description="Target attendance ID")
    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Student roll number")
    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    class_name: str = Field(..., description="Class name")
    division: str = Field(..., description="Class division")
    lecture_date: date = Field(..., description="Lecture date")
    current_status: str = Field(..., description="Current/original attendance status")
    requested_status: str = Field(..., description="Requested attendance status")
    reason: str = Field(..., description="Student justification")
    request_status: str = Field(..., description="Status ('PENDING', 'APPROVED', 'REJECTED')")
    reviewed_by: Optional[int] = Field(None, description="Reviewer user ID")
    reviewer_name: Optional[str] = Field(None, description="Reviewer faculty name")
    reviewed_at: Optional[datetime] = Field(None, description="Review timestamp")
    review_remarks: Optional[str] = Field(None, description="Review remarks")
    created_at: Optional[datetime] = Field(None, description="Submission timestamp")

    model_config = ConfigDict(from_attributes=True)


class CorrectionRequestListResponse(BaseModel):
    """Paginated list response of correction requests."""

    total: int = Field(..., description="Total matching correction requests")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[CorrectionRequestDetailResponse] = Field(
        ..., description="Page of correction request items"
    )

