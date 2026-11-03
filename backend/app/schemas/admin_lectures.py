"""Pydantic schemas for Admin Lecture Oversight and Attendance inspection."""

from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AdminLectureListItem(BaseModel):
    """Lecture overview item for admin listing."""

    lecture_id: int = Field(..., description="Lecture ID")
    assignment_id: int = Field(..., description="Assignment ID")
    faculty_id: int = Field(..., description="Faculty ID")
    faculty_name: str = Field(..., description="Faculty name")
    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    class_id: int = Field(..., description="Class ID")
    class_name: str = Field(..., description="Class name")
    division: str = Field(..., description="Division")
    department_id: int = Field(..., description="Department ID")
    department_name: str = Field(..., description="Department name")
    lecture_date: date = Field(..., description="Lecture date")
    start_time: time = Field(..., description="Start time")
    end_time: time = Field(..., description="End time")
    lecture_status: str = Field(..., description="Status (DRAFT, SUBMITTED, CANCELLED)")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    submitted_at: Optional[datetime] = Field(None, description="Submission timestamp")

    model_config = ConfigDict(from_attributes=True)


class AdminLectureListResponse(BaseModel):
    """Paginated list response of lectures for admin oversight."""

    total: int = Field(..., description="Total matching lectures")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[AdminLectureListItem] = Field(..., description="Page of lecture items")


class AdminLectureDetailResponse(BaseModel):
    """Comprehensive lecture details and attendance summary for admin."""

    lecture_id: int = Field(..., description="Lecture ID")
    assignment_id: int = Field(..., description="Assignment ID")
    faculty_id: int = Field(..., description="Faculty ID")
    faculty_name: str = Field(..., description="Faculty name")
    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    class_id: int = Field(..., description="Class ID")
    class_name: str = Field(..., description="Class name")
    academic_year: str = Field(..., description="Academic year")
    division: str = Field(..., description="Division")
    semester: int = Field(..., description="Semester")
    department_name: str = Field(..., description="Department name")
    lecture_date: date = Field(..., description="Lecture date")
    start_time: time = Field(..., description="Start time")
    end_time: time = Field(..., description="End time")
    lecture_status: str = Field(..., description="Lecture status")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    submitted_at: Optional[datetime] = Field(None, description="Submission timestamp")

    # Attendance metrics
    total_enrolled_students: int = Field(0, description="Total active enrolled students")
    marked_students: int = Field(0, description="Marked count")
    unmarked_students: int = Field(0, description="Unmarked count")
    present_count: int = Field(0, description="Present count")
    absent_count: int = Field(0, description="Absent count")

    model_config = ConfigDict(from_attributes=True)


class AdminLectureAttendanceItem(BaseModel):
    """Individual student attendance entry for admin inspection."""

    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Roll number")
    attendance_id: Optional[int] = Field(None, description="Attendance ID")
    attendance_status: Optional[str] = Field(None, description="Attendance status ('PRESENT' or 'ABSENT')")
    marked_by: Optional[int] = Field(None, description="User ID who marked attendance")
    marked_by_name: Optional[str] = Field(None, description="Name of user who marked attendance")
    marked_at: Optional[datetime] = Field(None, description="Timestamp marked")

    model_config = ConfigDict(from_attributes=True)


class AdminLectureAttendanceRosterResponse(BaseModel):
    """Admin lecture attendance roster and summary."""

    lecture_id: int = Field(..., description="Lecture ID")
    lecture_status: str = Field(..., description="Lecture status")
    lecture_date: date = Field(..., description="Lecture date")
    start_time: time = Field(..., description="Start time")
    end_time: time = Field(..., description="End time")
    faculty_id: int = Field(..., description="Faculty ID")
    faculty_name: str = Field(..., description="Faculty name")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    class_name: str = Field(..., description="Class name")
    division: str = Field(..., description="Division")
    total_enrolled_students: int = Field(..., description="Total active enrolled students")
    present_count: int = Field(..., description="Present count")
    absent_count: int = Field(..., description="Absent count")
    unmarked_count: int = Field(..., description="Unmarked count")
    students: List[AdminLectureAttendanceItem] = Field(..., description="Student roster entries")

    model_config = ConfigDict(from_attributes=True)

