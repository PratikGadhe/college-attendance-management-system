"""Pydantic schemas for Faculty Lecture Management operations."""

from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FacultyTeachingAssignmentResponse(BaseModel):
    """Teaching assignment representation for the authenticated faculty member."""

    assignment_id: int = Field(..., description="Unique assignment ID")
    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code (e.g. DBMS)")
    subject_name: str = Field(..., description="Subject name")
    class_id: int = Field(..., description="Class ID")
    class_name: str = Field(..., description="Class name")
    academic_year: str = Field(..., description="Academic year")
    division: str = Field(..., description="Division / section")
    semester: int = Field(..., description="Semester number")
    department_name: str = Field(..., description="Department name")

    model_config = ConfigDict(from_attributes=True)


class FacultyTeachingAssignmentListResponse(BaseModel):
    """List response of teaching assignments for the authenticated faculty member."""

    total: int = Field(..., description="Total assignments count")
    items: List[FacultyTeachingAssignmentResponse] = Field(
        ..., description="List of teaching assignments"
    )


class LectureCreateRequest(BaseModel):
    """Payload to schedule/create a new lecture in DRAFT status."""

    assignment_id: int = Field(..., description="Teaching assignment ID")
    lecture_date: date = Field(..., description="Date of lecture (YYYY-MM-DD)")
    start_time: time = Field(..., description="Lecture start time (HH:MM:SS)")
    end_time: time = Field(..., description="Lecture end time (HH:MM:SS)")


class LectureUpdateRequest(BaseModel):
    """Payload to update an existing DRAFT lecture."""

    lecture_date: Optional[date] = Field(None, description="Updated lecture date")
    start_time: Optional[time] = Field(None, description="Updated start time")
    end_time: Optional[time] = Field(None, description="Updated end time")


class LectureDetailResponse(BaseModel):
    """Detailed lecture information with subject, class, and attendance counts."""

    lecture_id: int = Field(..., description="Unique lecture ID")
    assignment_id: int = Field(..., description="Teaching assignment ID")
    lecture_date: date = Field(..., description="Date of lecture")
    start_time: time = Field(..., description="Lecture start time")
    end_time: time = Field(..., description="Lecture end time")
    lecture_status: str = Field(..., description="Lecture status (DRAFT, SUBMITTED, CANCELLED)")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    submitted_at: Optional[datetime] = Field(None, description="Submission timestamp")

    # Linked academic details
    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    class_id: int = Field(..., description="Class ID")
    class_name: str = Field(..., description="Class name")
    academic_year: str = Field(..., description="Academic year")
    division: str = Field(..., description="Division")
    semester: int = Field(..., description="Semester")
    department_name: str = Field(..., description="Department name")

    # Attendance metrics
    total_enrolled_students: int = Field(0, description="Total active enrolled students in class")
    marked_students: int = Field(0, description="Count of students with attendance marked")
    unmarked_students: int = Field(0, description="Count of students not yet marked")
    present_count: int = Field(0, description="Count of PRESENT students")
    absent_count: int = Field(0, description="Count of ABSENT students")

    model_config = ConfigDict(from_attributes=True)


class FacultyLectureListItem(BaseModel):
    """Summary item for faculty lecture listing."""

    lecture_id: int = Field(..., description="Unique lecture ID")
    assignment_id: int = Field(..., description="Teaching assignment ID")
    subject_name: str = Field(..., description="Subject name")
    subject_code: str = Field(..., description="Subject code")
    class_name: str = Field(..., description="Class name")
    division: str = Field(..., description="Division")
    lecture_date: date = Field(..., description="Date of lecture")
    start_time: time = Field(..., description="Start time")
    end_time: time = Field(..., description="End time")
    lecture_status: str = Field(..., description="Status (DRAFT, SUBMITTED, CANCELLED)")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    submitted_at: Optional[datetime] = Field(None, description="Submission timestamp")

    model_config = ConfigDict(from_attributes=True)


class FacultyLectureListResponse(BaseModel):
    """Paginated list response of faculty lectures."""

    total: int = Field(..., description="Total matching lectures")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[FacultyLectureListItem] = Field(..., description="Page of lectures")

