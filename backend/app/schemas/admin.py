from datetime import date, datetime, time
from typing import Optional
from pydantic import BaseModel, Field


class DashboardSummaryResponse(BaseModel):
    """Admin dashboard high-level metric summary."""

    # Academic structure
    total_students: int = Field(..., description="Total student profiles")
    active_students: int = Field(..., description="Students with ACTIVE user accounts")
    inactive_students: int = Field(..., description="Students with INACTIVE user accounts")
    total_faculty: int = Field(..., description="Total faculty profiles")
    active_faculty: int = Field(..., description="Faculty with ACTIVE user accounts")
    inactive_faculty: int = Field(..., description="Faculty with INACTIVE user accounts")
    total_departments: int = Field(..., description="Total academic departments")
    total_classes: int = Field(..., description="Total academic classes")
    total_subjects: int = Field(..., description="Total course subjects")
    total_enrollments: int = Field(..., description="Total student class enrollments")
    active_enrollments: int = Field(..., description="Active student enrollments")
    total_teaching_assignments: int = Field(..., description="Total teaching assignments")

    # Lecture statistics
    total_lectures: int = Field(..., description="Total recorded lectures")
    submitted_lectures: int = Field(..., description="Lectures in SUBMITTED state")
    draft_lectures: int = Field(..., description="Lectures in DRAFT state")
    cancelled_lectures: int = Field(..., description="Lectures in CANCELLED state")

    # Attendance statistics (SUBMITTED lectures only)
    total_attendance_records_for_submitted_lectures: int = Field(
        0, description="Total attendance records for SUBMITTED lectures"
    )
    total_present: int = Field(0, description="Total PRESENT attendance records")
    total_absent: int = Field(0, description="Total ABSENT attendance records")
    overall_attendance_percentage: float = Field(
        0.0, description="Overall institutional attendance percentage"
    )

    # Correction statistics
    total_correction_requests: int = Field(0, description="Total attendance correction requests")
    pending_correction_requests: int = Field(
        0, description="Attendance correction requests pending review"
    )
    approved_correction_requests: int = Field(
        0, description="Approved attendance correction requests"
    )
    rejected_correction_requests: int = Field(
        0, description="Rejected attendance correction requests"
    )


class RecentLectureResponse(BaseModel):
    """Overview item for recent lecture activity."""

    lecture_id: int = Field(..., description="Unique ID of the lecture")
    subject_name: str = Field(..., description="Name of the course subject")
    faculty_name: str = Field(..., description="Name of the assigned faculty member")
    class_name: str = Field(..., description="Class name")
    division: str = Field(..., description="Division / section")
    lecture_date: date = Field(..., description="Date on which the lecture was conducted")
    start_time: time = Field(..., description="Lecture start time")
    end_time: time = Field(..., description="Lecture end time")
    lecture_status: str = Field(..., description="Current status of lecture (DRAFT, SUBMITTED, CANCELLED)")
    present_count: int = Field(0, description="Count of PRESENT students")
    absent_count: int = Field(0, description="Count of ABSENT students")


class PendingCorrectionResponse(BaseModel):
    """Overview item for pending attendance correction request."""

    request_id: int = Field(..., description="Unique ID of the correction request")
    student_name: str = Field(..., description="Name of the requesting student")
    roll_number: str = Field(..., description="Roll number of the student")
    subject_name: str = Field(..., description="Subject for the lecture")
    lecture_date: date = Field(..., description="Date of the lecture")
    current_status: str = Field(..., description="Recorded attendance status (PRESENT / ABSENT)")
    requested_status: str = Field(..., description="Requested attendance status (PRESENT / ABSENT)")
    reason: str = Field(..., description="Student justification for correction")
    created_at: Optional[datetime] = Field(None, description="Timestamp when request was filed")
