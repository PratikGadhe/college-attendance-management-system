"""Pydantic schemas for Faculty Attendance marking, roster, and submission operations."""

from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class AttendanceMarkItem(BaseModel):
    """Single student attendance mark."""

    student_id: int = Field(..., description="Student ID")
    status: Literal["PRESENT", "ABSENT"] = Field(
        ..., description="Attendance status ('PRESENT' or 'ABSENT')"
    )


class AttendanceMarkRequest(BaseModel):
    """Bulk attendance marking payload."""

    records: List[AttendanceMarkItem] = Field(
        ..., min_length=1, description="List of student attendance status entries"
    )


class RosterStudentItem(BaseModel):
    """Enrolled student details with attendance record if marked."""

    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Student roll number")
    attendance_id: Optional[int] = Field(None, description="Attendance record ID if marked")
    attendance_status: Optional[str] = Field(None, description="Marked status ('PRESENT' or 'ABSENT')")
    marked_at: Optional[datetime] = Field(None, description="Timestamp when marked")

    model_config = ConfigDict(from_attributes=True)


class LectureAttendanceRosterResponse(BaseModel):
    """Attendance roster and summary counts for a specific lecture."""

    lecture_id: int = Field(..., description="Lecture ID")
    lecture_status: str = Field(..., description="Lecture status (DRAFT, SUBMITTED, CANCELLED)")
    class_id: int = Field(..., description="Class ID")
    class_name: str = Field(..., description="Class name")
    total_enrolled_students: int = Field(..., description="Total active enrolled students")
    marked_students: int = Field(..., description="Total marked students")
    unmarked_students: int = Field(..., description="Total unmarked students")
    present_count: int = Field(..., description="Total PRESENT count")
    absent_count: int = Field(..., description="Total ABSENT count")
    students: List[RosterStudentItem] = Field(..., description="Student attendance roster list")

    model_config = ConfigDict(from_attributes=True)


class LectureSubmissionResponse(BaseModel):
    """Response returned upon successful lecture attendance submission."""

    lecture_id: int = Field(..., description="Submitted lecture ID")
    lecture_status: str = Field(..., description="Updated lecture status ('SUBMITTED')")
    submitted_at: datetime = Field(..., description="Submission timestamp")
    total_students_marked: int = Field(..., description="Total active students marked")
    present_count: int = Field(..., description="Total PRESENT students count")
    absent_count: int = Field(..., description="Total ABSENT students count")
    message: str = Field(..., description="Success confirmation message")

    model_config = ConfigDict(from_attributes=True)

