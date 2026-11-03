"""Pydantic schemas for Admin Institutional Reports."""

from datetime import date, time
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# 1. Department-wise Attendance Report
class DepartmentAttendanceReportItem(BaseModel):
    """Department-level attendance aggregate."""

    department_id: int = Field(..., description="Department ID")
    department_name: str = Field(..., description="Department name")
    department_code: str = Field(..., description="Department code")
    total_classes: int = Field(..., description="Total classes in department")
    total_active_students: int = Field(..., description="Active students enrolled in department classes")
    total_submitted_lectures: int = Field(..., description="Total SUBMITTED lectures in department")
    present_count: int = Field(..., description="Total PRESENT marks")
    absent_count: int = Field(..., description="Total ABSENT marks")
    attendance_percentage: float = Field(..., description="Overall attendance percentage")

    model_config = ConfigDict(from_attributes=True)


class DepartmentAttendanceReportResponse(BaseModel):
    """List response for department-wise attendance report."""

    total: int = Field(..., description="Total departments returned")
    items: List[DepartmentAttendanceReportItem] = Field(..., description="Department report items")


# 2. Class-wise Attendance Report
class ClassAttendanceReportItem(BaseModel):
    """Class-level attendance aggregate."""

    class_id: int = Field(..., description="Class ID")
    class_name: str = Field(..., description="Class name")
    department_name: str = Field(..., description="Department name")
    academic_year: str = Field(..., description="Academic year")
    division: str = Field(..., description="Division")
    semester: int = Field(..., description="Semester")
    total_active_students: int = Field(..., description="Total active students enrolled")
    total_submitted_lectures: int = Field(..., description="Total SUBMITTED lectures conducted for class")
    present_count: int = Field(..., description="Total PRESENT marks")
    absent_count: int = Field(..., description="Total ABSENT marks")
    attendance_percentage: float = Field(..., description="Attendance percentage")

    model_config = ConfigDict(from_attributes=True)


class ClassAttendanceReportResponse(BaseModel):
    """Paginated response for class-wise attendance report."""

    total: int = Field(..., description="Total matching class records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[ClassAttendanceReportItem] = Field(..., description="Class report items")


# 3. Subject-wise Attendance Report
class SubjectAttendanceReportItem(BaseModel):
    """Subject-level attendance aggregate."""

    subject_id: int = Field(..., description="Subject ID")
    subject_code: str = Field(..., description="Subject code")
    subject_name: str = Field(..., description="Subject name")
    semester: int = Field(..., description="Semester")
    class_id: Optional[int] = Field(None, description="Class ID if filtered/contextualized")
    class_name: Optional[str] = Field(None, description="Class name if filtered/contextualized")
    total_submitted_lectures: int = Field(..., description="Total SUBMITTED lectures for subject")
    present_count: int = Field(..., description="Total PRESENT marks")
    absent_count: int = Field(..., description="Total ABSENT marks")
    attendance_percentage: float = Field(..., description="Attendance percentage")

    model_config = ConfigDict(from_attributes=True)


class SubjectAttendanceReportResponse(BaseModel):
    """Paginated response for subject-wise attendance report."""

    total: int = Field(..., description="Total matching subject records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[SubjectAttendanceReportItem] = Field(..., description="Subject report items")


# 4. Faculty-wise Teaching and Attendance Report
class FacultyAttendanceReportItem(BaseModel):
    """Faculty teaching workload and attendance performance."""

    faculty_id: int = Field(..., description="Faculty ID")
    faculty_name: str = Field(..., description="Faculty name")
    department_name: str = Field(..., description="Department name")
    total_teaching_assignments: int = Field(..., description="Assigned teaching course sections")
    total_lectures: int = Field(..., description="Total recorded lectures")
    submitted_lectures: int = Field(..., description="SUBMITTED lectures count")
    draft_lectures: int = Field(..., description="DRAFT lectures count")
    cancelled_lectures: int = Field(..., description="CANCELLED lectures count")
    total_present: int = Field(..., description="Total PRESENT marks in faculty's submitted lectures")
    total_absent: int = Field(..., description="Total ABSENT marks in faculty's submitted lectures")
    attendance_percentage: float = Field(..., description="Attendance percentage for faculty's lectures")

    model_config = ConfigDict(from_attributes=True)


class FacultyAttendanceReportResponse(BaseModel):
    """Paginated response for faculty-wise attendance report."""

    total: int = Field(..., description="Total matching faculty records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[FacultyAttendanceReportItem] = Field(..., description="Faculty report items")


# 5. Student-wise Attendance Report
class StudentAttendanceReportItem(BaseModel):
    """Student attendance summary row."""

    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Roll number")
    class_name: str = Field(..., description="Enrolled class name")
    department_name: str = Field(..., description="Department name")
    total_submitted_lectures: int = Field(..., description="Total lectures conducted for student's class")
    present_count: int = Field(..., description="Lectures attended (PRESENT)")
    absent_count: int = Field(..., description="Lectures missed (ABSENT)")
    attendance_percentage: float = Field(..., description="Attendance percentage")

    model_config = ConfigDict(from_attributes=True)


class StudentAttendanceReportResponse(BaseModel):
    """Paginated response for student-wise attendance report."""

    total: int = Field(..., description="Total matching student records")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[StudentAttendanceReportItem] = Field(..., description="Student report items")


# 6. Low Attendance Report
class LowAttendanceReportItem(BaseModel):
    """Student below minimum attendance threshold."""

    student_id: int = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student name")
    roll_number: str = Field(..., description="Roll number")
    class_name: str = Field(..., description="Class name")
    department_name: str = Field(..., description="Department name")
    total_submitted_lectures: int = Field(..., description="Total submitted lectures")
    present_count: int = Field(..., description="Present count")
    absent_count: int = Field(..., description="Absent count")
    attendance_percentage: float = Field(..., description="Current attendance percentage")
    threshold: float = Field(..., description="Target threshold percentage")
    required_present_count_to_reach_threshold: int = Field(
        ..., description="Consecutive future lectures required to reach threshold"
    )

    model_config = ConfigDict(from_attributes=True)


class LowAttendanceReportResponse(BaseModel):
    """Response for low attendance warning report."""

    threshold: float = Field(..., description="Applied attendance threshold percentage")
    total: int = Field(..., description="Total students below threshold")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[LowAttendanceReportItem] = Field(..., description="Students below threshold")


# 7. Lecture Report
class LectureReportItem(BaseModel):
    """Individual lecture entry with attendance headcounts."""

    lecture_id: int = Field(..., description="Lecture ID")
    lecture_date: date = Field(..., description="Lecture date")
    start_time: time = Field(..., description="Start time")
    end_time: time = Field(..., description="End time")
    lecture_status: str = Field(..., description="Lecture status")
    subject_name: str = Field(..., description="Subject name")
    subject_code: str = Field(..., description="Subject code")
    faculty_name: str = Field(..., description="Assigned faculty name")
    class_name: str = Field(..., description="Class name")
    division: str = Field(..., description="Division")
    total_students: int = Field(..., description="Total students with marked attendance")
    present_count: int = Field(..., description="Count of PRESENT students")
    absent_count: int = Field(..., description="Count of ABSENT students")

    model_config = ConfigDict(from_attributes=True)


class LectureReportResponse(BaseModel):
    """Paginated list response for lecture reporting."""

    total: int = Field(..., description="Total matching lectures")
    skip: int = Field(..., description="Pagination offset applied")
    limit: int = Field(..., description="Maximum items requested")
    items: List[LectureReportItem] = Field(..., description="Lecture report items")


# 8. Date Range Attendance Performance Report
class DateRangeAttendanceReportResponse(BaseModel):
    """Aggregate attendance performance across date range."""

    start_date: Optional[date] = Field(None, description="Start date filter applied")
    end_date: Optional[date] = Field(None, description="End date filter applied")
    total_lectures: int = Field(..., description="Total submitted lectures in range")
    total_records: int = Field(..., description="Total attendance marks in range")
    present_count: int = Field(..., description="Total PRESENT marks in range")
    absent_count: int = Field(..., description="Total ABSENT marks in range")
    attendance_percentage: float = Field(..., description="Overall attendance percentage in range")
    items: List[LectureReportItem] = Field(..., description="Lectures included in this range")

    model_config = ConfigDict(from_attributes=True)

