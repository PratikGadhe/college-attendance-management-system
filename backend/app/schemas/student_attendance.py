"""Pydantic schemas for Student Attendance inquiry operations."""

from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class StudentSubjectAttendanceSummary(BaseModel):
    """Subject-wise attendance metrics for an individual student."""

    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code (e.g. DBMS)")
    subject_name: str = Field(..., description="Subject name")
    total_submitted_lectures: int = Field(..., description="Total conducted/submitted lectures")
    present_count: int = Field(..., description="Lectures attended (PRESENT)")
    absent_count: int = Field(..., description="Lectures missed (ABSENT)")
    attendance_percentage: float = Field(..., description="Attendance percentage (0.0 to 100.0)")

    model_config = ConfigDict(from_attributes=True)


class StudentAttendanceSummaryResponse(BaseModel):
    """Overall student profile and subject-wise attendance summary."""

    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Roll number")
    overall_percentage: float = Field(..., description="Overall attendance percentage across all subjects")
    subjects: List[StudentSubjectAttendanceSummary] = Field(
        ..., description="Subject-wise attendance breakdown"
    )

    model_config = ConfigDict(from_attributes=True)


class StudentAttendanceHistoryItem(BaseModel):
    """Single attendance history log entry for student."""

    attendance_id: int = Field(..., description="Attendance record ID")
    lecture_id: int = Field(..., description="Lecture ID")
    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    class_name: str = Field(..., description="Class name")
    division: str = Field(..., description="Division")
    lecture_date: date = Field(..., description="Lecture date")
    start_time: time = Field(..., description="Lecture start time")
    end_time: time = Field(..., description="Lecture end time")
    attendance_status: str = Field(..., description="Attendance status ('PRESENT' or 'ABSENT')")
    marked_at: Optional[datetime] = Field(None, description="Marking timestamp")

    model_config = ConfigDict(from_attributes=True)


class StudentAttendanceHistoryResponse(BaseModel):
    """Paginated attendance history response for student."""

    total: int = Field(..., description="Total matching attendance records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[StudentAttendanceHistoryItem] = Field(
        ..., description="Page of attendance history items"
    )


class StudentAttendanceRecordDetailResponse(BaseModel):
    """Detailed attendance record view for student."""

    attendance_id: int = Field(..., description="Attendance record ID")
    lecture_id: int = Field(..., description="Lecture ID")
    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Roll number")
    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    class_name: str = Field(..., description="Class name")
    division: str = Field(..., description="Division")
    lecture_date: date = Field(..., description="Lecture date")
    start_time: time = Field(..., description="Lecture start time")
    end_time: time = Field(..., description="Lecture end time")
    lecture_status: str = Field(..., description="Lecture status")
    attendance_status: str = Field(..., description="Attendance status ('PRESENT' or 'ABSENT')")
    marked_at: Optional[datetime] = Field(None, description="Marking timestamp")
    submitted_at: Optional[datetime] = Field(None, description="Lecture submission timestamp")

    model_config = ConfigDict(from_attributes=True)

