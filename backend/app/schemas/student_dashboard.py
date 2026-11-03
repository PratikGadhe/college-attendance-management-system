"""Pydantic schemas for Student Dashboard and Personal Analytics."""

from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.student_attendance import StudentSubjectAttendanceSummary


class StudentDashboardSummaryResponse(BaseModel):
    """Executive metrics summary for authenticated student."""

    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Roll number")
    active_class_name: str = Field(..., description="Currently enrolled active class name")
    department_name: str = Field(..., description="Department name")
    total_subjects: int = Field(..., description="Total enrolled academic subjects")
    total_submitted_lectures: int = Field(..., description="Total submitted lectures conducted across all subjects")
    present_count: int = Field(..., description="Total lectures attended (PRESENT)")
    absent_count: int = Field(..., description="Total lectures missed (ABSENT)")
    overall_attendance_percentage: float = Field(..., description="Overall attendance percentage")
    pending_correction_requests: int = Field(..., description="Count of PENDING correction requests")
    approved_correction_requests: int = Field(..., description="Count of APPROVED correction requests")
    rejected_correction_requests: int = Field(..., description="Count of REJECTED correction requests")

    model_config = ConfigDict(from_attributes=True)


class StudentSubjectPerformanceResponse(BaseModel):
    """Subject performance breakdown for student dashboard."""

    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Roll number")
    items: List[StudentSubjectAttendanceSummary] = Field(
        ..., description="Subject-wise attendance breakdown items"
    )

    model_config = ConfigDict(from_attributes=True)


class StudentAttendanceTrendItem(BaseModel):
    """Student attendance trend bucket."""

    period: str = Field(..., description="Period identifier ('YYYY-MM-DD', 'YYYY-Www', 'YYYY-MM')")
    total_lectures: int = Field(..., description="Submitted lectures conducted in period")
    present_count: int = Field(..., description="Lectures attended in period")
    absent_count: int = Field(..., description="Lectures missed in period")
    attendance_percentage: float = Field(..., description="Attendance percentage in period")

    model_config = ConfigDict(from_attributes=True)


class StudentAttendanceTrendsResponse(BaseModel):
    """Chronological personal attendance trend response for student."""

    period_type: Literal["daily", "weekly", "monthly"] = Field(..., description="Period granularity")
    total_periods: int = Field(..., description="Total periods returned")
    items: List[StudentAttendanceTrendItem] = Field(..., description="Trend items")

    model_config = ConfigDict(from_attributes=True)

