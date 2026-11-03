"""SQLAlchemy ORM models package for Attendance Management System.

Exports all 13 models so they are registered with the declarative Base metadata.
"""

from app.models.attendance_audit_logs import AttendanceAuditLog
from app.models.attendance_records import AttendanceRecord
from app.models.classes import Class
from app.models.correction_requests import CorrectionRequest
from app.models.departments import Department
from app.models.enrollments import Enrollment
from app.models.faculty import Faculty
from app.models.lectures import Lecture
from app.models.roles import Role
from app.models.students import Student
from app.models.subjects import Subject
from app.models.teaching_assignments import TeachingAssignment
from app.models.users import User

__all__ = [
    "Role",
    "Department",
    "User",
    "Student",
    "Faculty",
    "Class",
    "Subject",
    "Enrollment",
    "TeachingAssignment",
    "Lecture",
    "AttendanceRecord",
    "CorrectionRequest",
    "AttendanceAuditLog",
]
