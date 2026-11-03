"""Services package containing business and query logic."""

from app.services.admin_class_service import (
    create_class,
    get_class_by_id,
    list_classes,
    update_class,
)
from app.services.admin_department_service import (
    create_department,
    get_department_by_id,
    list_departments,
    update_department,
)
from app.services.admin_enrollment_service import (
    create_enrollment,
    get_enrollment_by_id,
    list_enrollments,
    update_enrollment_status,
)
from app.services.admin_faculty_service import (
    create_faculty,
    get_faculty_by_id,
    list_faculty,
    update_faculty,
    update_faculty_status,
)
from app.services.admin_lecture_service import (
    get_admin_lecture_attendance,
    get_admin_lecture_details,
    list_admin_lectures,
)
from app.services.admin_report_service import (
    get_attendance_performance_by_date_range,
    get_class_attendance_report,
    get_department_attendance_report,
    get_faculty_attendance_report,
    get_lecture_report,
    get_low_attendance_report,
    get_student_attendance_report,
    get_subject_attendance_report,
)
from app.services.admin_service import (
    get_attendance_distribution,
    get_attendance_trends,
    get_dashboard_summary,
    get_pending_corrections,
    get_recent_lectures,
)
from app.services.admin_student_service import (
    create_student,
    get_student_by_id,
    list_students,
    update_student,
    update_student_status,
)
from app.services.admin_subject_service import (
    create_subject,
    get_subject_by_id,
    list_subjects,
    update_subject,
)
from app.services.admin_teaching_assignment_service import (
    create_teaching_assignment,
    delete_teaching_assignment,
    get_teaching_assignment_by_id,
    list_teaching_assignments,
    update_teaching_assignment,
)
from app.services.correction_request_service import (
    create_student_correction_request,
    get_faculty_correction_request_by_id,
    get_student_correction_request_by_id,
    list_faculty_correction_requests,
    list_student_correction_requests,
    review_correction_request,
)
from app.services.faculty_attendance_service import (
    get_lecture_roster,
    mark_attendance,
    submit_attendance,
)
from app.services.faculty_lecture_service import (
    cancel_lecture,
    create_lecture,
    get_faculty_profile,
    get_lecture_details,
    list_my_lectures,
    list_my_teaching_assignments,
    update_lecture,
)
from app.services.faculty_report_service import (
    get_faculty_attendance_trends,
    get_faculty_dashboard_summary,
    get_faculty_performance_report,
    get_faculty_student_attendance_report,
)
from app.services.student_attendance_service import (
    get_my_attendance_history,
    get_my_attendance_record_detail,
    get_my_attendance_summary,
    get_student_profile,
)
from app.services.student_dashboard_service import (
    get_student_attendance_trends,
    get_student_dashboard_summary,
    get_student_subject_performance,
)

__all__ = [
    "get_dashboard_summary",
    "get_recent_lectures",
    "get_pending_corrections",
    "list_students",
    "get_student_by_id",
    "create_student",
    "update_student",
    "update_student_status",
    "list_faculty",
    "get_faculty_by_id",
    "create_faculty",
    "update_faculty",
    "update_faculty_status",
    "list_departments",
    "get_department_by_id",
    "create_department",
    "update_department",
    "list_classes",
    "get_class_by_id",
    "create_class",
    "update_class",
    "list_subjects",
    "get_subject_by_id",
    "create_subject",
    "update_subject",
    "list_enrollments",
    "get_enrollment_by_id",
    "create_enrollment",
    "update_enrollment_status",
    "list_teaching_assignments",
    "get_teaching_assignment_by_id",
    "create_teaching_assignment",
    "update_teaching_assignment",
    "delete_teaching_assignment",
    "get_faculty_profile",
    "list_my_teaching_assignments",
    "create_lecture",
    "list_my_lectures",
    "get_lecture_details",
    "update_lecture",
    "cancel_lecture",
    "get_lecture_roster",
    "mark_attendance",
    "submit_attendance",
    "get_student_profile",
    "get_my_attendance_summary",
    "get_my_attendance_history",
    "get_my_attendance_record_detail",
    "create_student_correction_request",
    "list_student_correction_requests",
    "get_student_correction_request_by_id",
    "list_faculty_correction_requests",
    "get_faculty_correction_request_by_id",
    "review_correction_request",
    "list_admin_lectures",
    "get_admin_lecture_details",
    "get_admin_lecture_attendance",
    "get_attendance_distribution",
    "get_attendance_trends",
    "get_department_attendance_report",
    "get_class_attendance_report",
    "get_subject_attendance_report",
    "get_faculty_attendance_report",
    "get_student_attendance_report",
    "get_low_attendance_report",
    "get_lecture_report",
    "get_attendance_performance_by_date_range",
    "get_faculty_dashboard_summary",
    "get_faculty_attendance_trends",
    "get_faculty_performance_report",
    "get_faculty_student_attendance_report",
    "get_student_dashboard_summary",
    "get_student_subject_performance",
    "get_student_attendance_trends",
]
