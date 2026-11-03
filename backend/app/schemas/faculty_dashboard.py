"""Pydantic schemas for Faculty Dashboard and Performance Reports."""

from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class FacultyDashboardSummaryResponse(BaseModel):
    """Executive metrics summary for authenticated faculty member."""

    faculty_id: int = Field(..., description="Faculty ID")
    faculty_name: str = Field(..., description="Faculty name")
    department_name: str = Field(..., description="Department name")
    total_teaching_assignments: int = Field(..., description="Total assigned courses")
    total_lectures: int = Field(..., description="Total lectures created")
    submitted_lectures: int = Field(..., description="SUBMITTED lectures count")
    draft_lectures: int = Field(..., description="DRAFT lectures count")
    cancelled_lectures: int = Field(..., description="CANCELLED lectures count")
    total_students_across_active_classes: int = Field(
        ..., description="Total active students enrolled across assigned classes"
    )
    pending_correction_requests: int = Field(
        ..., description="Pending correction requests requiring review"
    )
    present_count: int = Field(..., description="Total PRESENT marks across faculty's submitted lectures")
    absent_count: int = Field(..., description="Total ABSENT marks across faculty's submitted lectures")
    overall_attendance_percentage: float = Field(
        ..., description="Overall attendance percentage for faculty's lectures"
    )

    model_config = ConfigDict(from_attributes=True)


class FacultyAttendanceTrendItem(BaseModel):
    """Attendance trend item for faculty courses."""

    period: str = Field(..., description="Time bucket identifier ('YYYY-MM-DD', 'YYYY-Www', 'YYYY-MM')")
    submitted_lectures: int = Field(..., description="Submitted lectures conducted in period")
    present_count: int = Field(..., description="Student PRESENT marks in period")
    absent_count: int = Field(..., description="Student ABSENT marks in period")
    attendance_percentage: float = Field(..., description="Attendance percentage for period")

    model_config = ConfigDict(from_attributes=True)


class FacultyAttendanceTrendsResponse(BaseModel):
    """Chronological attendance trends for faculty courses."""

    period_type: Literal["daily", "weekly", "monthly"] = Field(..., description="Period granularity")
    total_periods: int = Field(..., description="Total periods returned")
    items: List[FacultyAttendanceTrendItem] = Field(..., description="Trend items")

    model_config = ConfigDict(from_attributes=True)


class FacultyPerformanceReportItem(BaseModel):
    """Course-wise teaching and attendance performance item."""

    assignment_id: int = Field(..., description="Assignment ID")
    subject_name: str = Field(..., description="Subject name")
    subject_code: str = Field(..., description="Subject code")
    class_name: str = Field(..., description="Class name")
    division: str = Field(..., description="Division")
    total_submitted_lectures: int = Field(..., description="Total submitted lectures conducted")
    total_students: int = Field(..., description="Active students enrolled in class")
    present_count: int = Field(..., description="Total PRESENT marks")
    absent_count: int = Field(..., description="Total ABSENT marks")
    attendance_percentage: float = Field(..., description="Course attendance percentage")

    model_config = ConfigDict(from_attributes=True)


class FacultyPerformanceReportResponse(BaseModel):
    """Paginated report of faculty course performance."""

    total: int = Field(..., description="Total course sections")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[FacultyPerformanceReportItem] = Field(..., description="Performance items")


class FacultyStudentAttendanceItem(BaseModel):
    """Student attendance performance within faculty's classes."""

    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Roll number")
    class_name: str = Field(..., description="Class name")
    subject_name: str = Field(..., description="Subject name")
    total_submitted_lectures: int = Field(..., description="Conducted lectures for subject")
    present_count: int = Field(..., description="Student attended count")
    absent_count: int = Field(..., description="Student missed count")
    attendance_percentage: float = Field(..., description="Attendance percentage")

    model_config = ConfigDict(from_attributes=True)


class FacultyStudentAttendanceResponse(BaseModel):
    """Paginated student attendance report for faculty."""

    total: int = Field(..., description="Total matching student-course records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[FacultyStudentAttendanceItem] = Field(..., description="Student attendance items")

