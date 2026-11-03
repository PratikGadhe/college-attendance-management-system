"""Pydantic schemas for Admin Dashboard distribution and trends."""

from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field


class AttendanceDistributionResponse(BaseModel):
    """Overall institutional attendance distribution (SUBMITTED lectures only)."""

    present_count: int = Field(..., description="Total count of PRESENT records")
    absent_count: int = Field(..., description="Total count of ABSENT records")
    total_marked: int = Field(..., description="Total attendance records marked")
    present_percentage: float = Field(..., description="Percentage of PRESENT marks")
    absent_percentage: float = Field(..., description="Percentage of ABSENT marks")

    model_config = ConfigDict(from_attributes=True)


class AttendanceTrendItem(BaseModel):
    """Single time-bucket attendance trend aggregate."""

    period: str = Field(..., description="Time bucket identifier (e.g. '2026-10-20', '2026-W43', '2026-10')")
    total_lectures: int = Field(..., description="Total submitted lectures conducted in period")
    present_count: int = Field(..., description="Total student PRESENT records in period")
    absent_count: int = Field(..., description="Total student ABSENT records in period")
    attendance_percentage: float = Field(..., description="Attendance percentage for this period")

    model_config = ConfigDict(from_attributes=True)


class AttendanceTrendsResponse(BaseModel):
    """Institutional attendance trends over requested period."""

    period_type: Literal["daily", "weekly", "monthly"] = Field(
        ..., description="Granularity period ('daily', 'weekly', 'monthly')"
    )
    total_periods: int = Field(..., description="Count of periods returned")
    items: List[AttendanceTrendItem] = Field(..., description="Chronological trend items")

    model_config = ConfigDict(from_attributes=True)

