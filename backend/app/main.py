from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
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

app = FastAPI(
    title="Attendance Management System API",
    description="Backend API for the College Attendance Management System",
    version="0.1.0",
)

# CORS middleware for local React / Vite frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication & Admin Dashboard Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin Dashboard"])

# Academic Structure & Entity Management (Phase B4)
app.include_router(
    admin_students_router,
    prefix="/api/admin/students",
    tags=["Admin Student Management"],
)
app.include_router(
    admin_faculty_router,
    prefix="/api/admin/faculty",
    tags=["Admin Faculty Management"],
)
app.include_router(
    admin_departments_router,
    prefix="/api/admin/departments",
    tags=["Admin Department Management"],
)
app.include_router(
    admin_classes_router,
    prefix="/api/admin/classes",
    tags=["Admin Class Management"],
)
app.include_router(
    admin_subjects_router,
    prefix="/api/admin/subjects",
    tags=["Admin Subject Management"],
)
app.include_router(
    admin_enrollments_router,
    prefix="/api/admin/enrollments",
    tags=["Admin Student Enrollment Management"],
)
app.include_router(
    admin_teaching_assignments_router,
    prefix="/api/admin/teaching-assignments",
    tags=["Admin Faculty Teaching Assignment Management"],
)

# Faculty Lecture & Attendance Operations (Phase B5)
app.include_router(
    faculty_lectures_router,
    prefix="/api/faculty",
    tags=["Faculty Lectures"],
)
app.include_router(
    faculty_attendance_router,
    prefix="/api/faculty",
    tags=["Faculty Attendance"],
)
app.include_router(
    faculty_corrections_router,
    prefix="/api/faculty/correction-requests",
    tags=["Faculty Correction Reviews"],
)

# Student Attendance Operations (Phase B5)
app.include_router(
    student_attendance_router,
    prefix="/api/student/attendance",
    tags=["Student Attendance"],
)
app.include_router(
    student_corrections_router,
    prefix="/api/student/correction-requests",
    tags=["Student Correction Requests"],
)

# Admin Lecture Oversight (Phase B5)
app.include_router(
    admin_lectures_router,
    prefix="/api/admin",
    tags=["Admin Lecture Oversight"],
)

# Reports and Dashboards (Phase B6)
app.include_router(
    admin_reports_router,
    prefix="/api/admin/reports",
    tags=["Admin Reports"],
)
app.include_router(
    faculty_dashboard_router,
    prefix="/api/faculty",
    tags=["Faculty Dashboard & Reports"],
)
app.include_router(
    student_dashboard_router,
    prefix="/api/student/dashboard",
    tags=["Student Dashboard"],
)



@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify that the API server is operational."""
    return {
        "status": "healthy",
        "message": "Attendance Management System API is running",
    }


@app.get("/health/db", tags=["Health"])
def health_db_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify database connectivity.

    Executes a simple SELECT 1 query and returns 200 on success or 503 on failure.
    Never exposes database credentials or connection details.
    """
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "message": "Database connection successful",
        }
    except (SQLAlchemyError, Exception):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable",
        )
