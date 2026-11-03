"""API routers package."""

from app.routers.admin import router as admin_router
from app.routers.admin_classes import router as admin_classes_router
from app.routers.admin_departments import router as admin_departments_router
from app.routers.admin_enrollments import router as admin_enrollments_router
from app.routers.admin_faculty import router as admin_faculty_router
from app.routers.admin_lectures import router as admin_lectures_router
from app.routers.admin_reports import router as admin_reports_router
from app.routers.admin_students import router as admin_students_router
from app.routers.admin_subjects import router as admin_subjects_router
from app.routers.admin_teaching_assignments import (
    router as admin_teaching_assignments_router,
)
from app.routers.auth import router as auth_router
from app.routers.faculty_attendance import router as faculty_attendance_router
from app.routers.faculty_corrections import router as faculty_corrections_router
from app.routers.faculty_dashboard import router as faculty_dashboard_router
from app.routers.faculty_lectures import router as faculty_lectures_router
from app.routers.student_attendance import router as student_attendance_router
from app.routers.student_corrections import router as student_corrections_router
from app.routers.student_dashboard import router as student_dashboard_router

__all__ = [
    "auth_router",
    "admin_router",
    "admin_students_router",
    "admin_faculty_router",
    "admin_departments_router",
    "admin_classes_router",
    "admin_subjects_router",
    "admin_enrollments_router",
    "admin_teaching_assignments_router",
    "faculty_lectures_router",
    "faculty_attendance_router",
    "student_attendance_router",
    "student_corrections_router",
    "faculty_corrections_router",
    "admin_lectures_router",
    "admin_reports_router",
    "faculty_dashboard_router",
    "student_dashboard_router",
]
