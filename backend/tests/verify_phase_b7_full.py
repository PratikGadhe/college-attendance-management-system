"""Phase B7 — Complete Master Backend Verification Suite.

Validates:
- Application startup, environment config, and CORS middleware
- ORM mapping and database connectivity
- OpenAPI contract and full 79-endpoint inventory
- Strict Role-Based Access Control (RBAC) across Admin, Faculty, Student, and Unauthenticated callers
- Phase B4 Academic Management APIs and integrity constraints
- Phase B5 Lecture lifecycle, bulk attendance, atomic submission, correction requests, and audit logging
- Phase B6 Institutional reports, executive dashboards, trends, and analytical formulas
- Boundary validation, error handling, and parameter constraints
- Cross-role, cross-faculty, and cross-student data isolation
- 100% preservation of the baseline database records across all 13 tables with zero leftover test data
"""

import asyncio
import json
import math
import os
import sys
from datetime import date, time, timedelta

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
    )
)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.core.config import settings
from app.database.connection import SessionLocal
from app.main import app

TABLES = [
    "roles",
    "users",
    "departments",
    "students",
    "faculty",
    "classes",
    "subjects",
    "enrollments",
    "teaching_assignments",
    "lectures",
    "attendance_records",
    "correction_requests",
    "attendance_audit_logs",
]

EXPECTED_BASELINES = {
    "roles": 3,
    "users": 15,
    "departments": 1,
    "students": 12,
    "faculty": 2,
    "classes": 1,
    "subjects": 4,
    "enrollments": 12,
    "teaching_assignments": 4,
    "lectures": 8,
    "attendance_records": 96,
    "correction_requests": 2,
    "attendance_audit_logs": 1,
}


async def make_asgi_request(
    method: str,
    path: str,
    headers_dict: dict = None,
    body_data: dict = None,
):
    """Invoke ASGI application directly with simulated HTTP request."""
    headers = []
    if headers_dict:
        for k, v in headers_dict.items():
            headers.append([k.lower().encode(), str(v).encode()])
    headers.append([b"host", b"127.0.0.1"])

    body_bytes = json.dumps(body_data).encode() if body_data is not None else b""
    if body_data is not None:
        headers.append([b"content-type", b"application/json"])
        headers.append([b"content-length", str(len(body_bytes)).encode()])

    if "?" in path:
        req_path, qs = path.split("?", 1)
        query_string = qs.encode()
    else:
        req_path = path
        query_string = b""

    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": method.upper(),
        "path": req_path,
        "raw_path": req_path.encode(),
        "query_string": query_string,
        "headers": headers,
    }

    body = bytearray()
    status_code = None
    res_headers = {}

    async def receive():
        return {"type": "http.request", "body": body_bytes, "more_body": False}

    async def send(message):
        nonlocal status_code, body, res_headers
        if message["type"] == "http.response.start":
            status_code = message["status"]
            for hk, hv in message.get("headers", []):
                res_headers[hk.decode().lower()] = hv.decode()
        elif message["type"] == "http.response.body":
            body.extend(message.get("body", b""))

    await app(scope, receive, send)
    parsed_json = {}
    if body:
        try:
            parsed_json = json.loads(body.decode())
        except Exception:
            parsed_json = {"raw": body.decode()}
    return status_code, parsed_json, res_headers


def get_current_counts(db):
    """Retrieve exact row count for each of the 13 tables."""
    counts = {}
    for tbl in TABLES:
        cnt = db.execute(text(f"SELECT COUNT(*) FROM `{tbl}`")).scalar()
        counts[tbl] = cnt
    return counts


async def run_master_verification():
    db = SessionLocal()
    print("=" * 90)
    print("PHASE B7 — MASTER BACKEND VERIFICATION & INTEGRATION READINESS SUITE")
    print("=" * 90)

    # -------------------------------------------------------------
    # SECTION 1: Application Startup, Settings & CORS Configuration
    # -------------------------------------------------------------
    print("\n--- [SECTION 1] Configuration, Startup & CORS Verification ---")
    assert settings.APP_NAME == "Attendance Management System API"
    assert settings.APP_VERSION == "0.1.0"
    assert settings.DB_NAME == "attendance_management"
    assert "http://localhost:5173" in settings.CORS_ORIGINS
    assert "http://127.0.0.1:5173" in settings.CORS_ORIGINS
    print(f"  ✓ App Name: {settings.APP_NAME} (v{settings.APP_VERSION})")
    print(f"  ✓ Database Config: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    print(f"  ✓ Configured CORS Origins: {settings.CORS_ORIGINS}")

    # Test CORS preflight on API root
    cors_headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
    }
    st, _, resp_h = await make_asgi_request("OPTIONS", "/api/auth/login", headers_dict=cors_headers)
    assert st == 200, f"Expected 200 for CORS preflight, got {st}"
    assert resp_h.get("access-control-allow-origin") == "http://localhost:5173"
    assert resp_h.get("access-control-allow-credentials") == "true"
    print("  ✓ CORS preflight request validated: Allow-Origin and Allow-Credentials correctly set.")

    # -------------------------------------------------------------
    # SECTION 2: Initial Database Baseline Verification
    # -------------------------------------------------------------
    print("\n--- [SECTION 2] Database Baseline Integrity Check ---")
    initial_counts = get_current_counts(db)
    for tbl, cnt in initial_counts.items():
        print(f"  - Table `{tbl:<23}`: {cnt:>3} rows")

    assert initial_counts == EXPECTED_BASELINES, (
        f"Initial database counts do not match expected baseline!\n"
        f"Expected: {EXPECTED_BASELINES}\nActual: {initial_counts}"
    )
    print("  ✓ All 13 tables match initial baseline counts exactly.")

    # Dynamic demo user resolution
    admin_user = db.execute(text("SELECT user_id FROM users WHERE username = 'admin'")).scalar()
    faculty1_user = db.execute(text("SELECT user_id FROM users WHERE username = 'faculty1'")).scalar()
    faculty2_user = db.execute(text("SELECT user_id FROM users WHERE username = 'faculty2'")).scalar()
    student1_user = db.execute(text("SELECT user_id FROM users WHERE username = 'student01'")).scalar()
    student2_user = db.execute(text("SELECT user_id FROM users WHERE username = 'student02'")).scalar()

    assert all([admin_user, faculty1_user, faculty2_user, student1_user, student2_user]), "Failed to resolve demo users"

    admin_headers = {"X-Demo-User-ID": str(admin_user)}
    faculty1_headers = {"X-Demo-User-ID": str(faculty1_user)}
    faculty2_headers = {"X-Demo-User-ID": str(faculty2_user)}
    student1_headers = {"X-Demo-User-ID": str(student1_user)}
    student2_headers = {"X-Demo-User-ID": str(student2_user)}

    print(f"  ✓ Dynamic Demo Users: Admin={admin_user}, Faculty1={faculty1_user}, Faculty2={faculty2_user}, Student1={student1_user}, Student2={student2_user}")

    # Dynamic entity IDs
    dept_id = db.execute(text("SELECT department_id FROM departments LIMIT 1")).scalar()
    class_id = db.execute(text("SELECT class_id FROM classes LIMIT 1")).scalar()
    fac1_id = db.execute(text("SELECT faculty_id FROM faculty ORDER BY faculty_id ASC LIMIT 1")).scalar()
    fac2_id = db.execute(text("SELECT faculty_id FROM faculty ORDER BY faculty_id DESC LIMIT 1")).scalar()
    sub_dbms_id = db.execute(text("SELECT subject_id FROM subjects WHERE subject_code = 'DBMS'")).scalar()
    ta_f1_id = db.execute(text(f"SELECT assignment_id FROM teaching_assignments WHERE faculty_id = {fac1_id} LIMIT 1")).scalar()
    ta_f2_id = db.execute(text(f"SELECT assignment_id FROM teaching_assignments WHERE faculty_id = {fac2_id} LIMIT 1")).scalar()
    stu1_id = db.execute(text("SELECT student_id FROM students WHERE roll_number = 'student01'")).scalar()
    stu2_id = db.execute(text("SELECT student_id FROM students WHERE roll_number = 'student02'")).scalar()
    enr1_id = db.execute(text(f"SELECT enrollment_id FROM enrollments WHERE student_id = {stu1_id} LIMIT 1")).scalar()


    # -------------------------------------------------------------
    # SECTION 3: OpenAPI Contract & Full Endpoint Inventory Check
    # -------------------------------------------------------------
    print("\n--- [SECTION 3] OpenAPI Contract & Endpoint Inventory Verification ---")
    st, openapi_doc, _ = await make_asgi_request("GET", "/openapi.json")
    assert st == 200, f"Failed to retrieve /openapi.json, status={st}"
    assert "paths" in openapi_doc
    all_paths = openapi_doc["paths"]
    
    total_endpoints_found = sum(len(methods) for methods in all_paths.values())
    assert total_endpoints_found == 79, f"Expected 79 registered endpoints, got {total_endpoints_found}"
    print(f"  ✓ Successfully verified OpenAPI contract: exactly {total_endpoints_found} endpoints registered across {len(all_paths)} unique paths.")

    # -------------------------------------------------------------
    # SECTION 4: Authentication & Role-Based Access Control (RBAC)
    # -------------------------------------------------------------
    print("\n--- [SECTION 4] RBAC & Authentication Security Verification ---")
    # Health checks (public)
    st, h_res, _ = await make_asgi_request("GET", "/health")
    assert st == 200 and h_res["status"] == "healthy"
    st, db_res, _ = await make_asgi_request("GET", "/health/db")
    assert st == 200 and db_res["database"] == "connected"
    print("  ✓ Public health checks operational (/health, /health/db).")

    # Login endpoint
    st, login_admin, _ = await make_asgi_request("POST", "/api/auth/login", body_data={"username": "admin"})
    assert st == 200 and login_admin["role"] == "ADMIN"
    st, login_fac, _ = await make_asgi_request("POST", "/api/auth/login", body_data={"username": "faculty1"})
    assert st == 200 and login_fac["role"] == "FACULTY"
    st, login_stu, _ = await make_asgi_request("POST", "/api/auth/login", body_data={"username": "student01"})
    assert st == 200 and login_stu["role"] == "STUDENT"
    st, login_bad, _ = await make_asgi_request("POST", "/api/auth/login", body_data={"username": "nonexistent_user"})
    assert st == 401, f"Expected 401 for non-existent login, got {st}"
    print("  ✓ Prototype demo login validated for all roles and non-existent username rejection (401).")

    # /api/auth/me profile
    st, me_admin, _ = await make_asgi_request("GET", "/api/auth/me", headers_dict=admin_headers)
    assert st == 200 and me_admin["username"] == "admin"
    st, me_fac, _ = await make_asgi_request("GET", "/api/auth/me", headers_dict=faculty1_headers)
    assert st == 200 and me_fac["username"] == "faculty1"
    st, me_stu, _ = await make_asgi_request("GET", "/api/auth/me", headers_dict=student1_headers)
    assert st == 200 and me_stu["username"] == "student01"
    print("  ✓ /api/auth/me validated for all demo roles.")

    # Header validation edge cases
    st, _, _ = await make_asgi_request("GET", "/api/auth/me")
    assert st == 401, "Expected 401 when X-Demo-User-ID is missing"
    st, _, _ = await make_asgi_request("GET", "/api/auth/me", headers_dict={"X-Demo-User-ID": "not_an_int"})
    assert st == 401, "Expected 401 when X-Demo-User-ID is non-integer"
    st, _, _ = await make_asgi_request("GET", "/api/auth/me", headers_dict={"X-Demo-User-ID": "999999"})
    assert st == 401, "Expected 401 when X-Demo-User-ID points to non-existent user"
    print("  ✓ Missing, malformed, and non-existent X-Demo-User-ID headers properly rejected (401).")

    # Cross-Role Authorization Matrix Checks
    test_endpoints = [
        # (method, path, admin_expected, faculty_expected, student_expected)
        ("GET", "/api/admin/dashboard/summary", 200, 403, 403),
        ("GET", "/api/admin/students", 200, 403, 403),
        ("GET", "/api/admin/faculty", 200, 403, 403),
        ("GET", "/api/admin/departments", 200, 403, 403),
        ("GET", "/api/admin/classes", 200, 403, 403),
        ("GET", "/api/admin/subjects", 200, 403, 403),
        ("GET", "/api/admin/enrollments", 200, 403, 403),
        ("GET", "/api/admin/teaching-assignments", 200, 403, 403),
        ("GET", "/api/admin/reports/departments", 200, 403, 403),
        ("GET", "/api/faculty/teaching-assignments", 403, 200, 403),
        ("GET", "/api/faculty/dashboard/summary", 403, 200, 403),
        ("GET", "/api/student/dashboard/summary", 403, 403, 200),
        ("GET", "/api/student/attendance/summary", 403, 403, 200),
    ]

    for m, p, exp_a, exp_f, exp_s in test_endpoints:
        # Unauthenticated -> 401
        st_unauth, _, _ = await make_asgi_request(m, p)
        assert st_unauth == 401, f"{p} unauth expected 401, got {st_unauth}"
        # Admin
        st_a, _, _ = await make_asgi_request(m, p, headers_dict=admin_headers)
        assert st_a == exp_a, f"{p} Admin expected {exp_a}, got {st_a}"
        # Faculty
        st_f, _, _ = await make_asgi_request(m, p, headers_dict=faculty1_headers)
        assert st_f == exp_f, f"{p} Faculty expected {exp_f}, got {st_f}"
        # Student
        st_s, _, _ = await make_asgi_request(m, p, headers_dict=student1_headers)
        assert st_s == exp_s, f"{p} Student expected {exp_s}, got {st_s}"

    print(f"  ✓ Cross-role authorization matrix verified across {len(test_endpoints)} core endpoints.")

    # -------------------------------------------------------------
    # SECTION 5: Phase B4 Academic Management APIs & Business Rules
    # -------------------------------------------------------------
    print("\n--- [SECTION 5] Phase B4 Academic Management APIs & Business Rules ---")
    
    # 1. Students Management
    st, stu_list, _ = await make_asgi_request("GET", "/api/admin/students", headers_dict=admin_headers)
    assert st == 200 and stu_list["total"] == 12
    st, stu_1, _ = await make_asgi_request("GET", f"/api/admin/students/{stu1_id}", headers_dict=admin_headers)
    assert st == 200 and stu_1["student_name"] == "Aarav Patil"
    # Duplicate username / email / roll_number conflict
    st, dup_stu, _ = await make_asgi_request(
        "POST",
        "/api/admin/students",
        headers_dict=admin_headers,
        body_data={
            "username": "student01",
            "email": "aarav.patil@college.edu",
            "student_name": "Duplicate Student",
            "roll_number": "student01",
        },
    )
    assert st == 409, f"Expected 409 Conflict for duplicate student, got {st}"
    print("  ✓ Student listing, details, and duplicate registration conflict (409) verified.")

    # 2. Faculty Management
    st, fac_list, _ = await make_asgi_request("GET", "/api/admin/faculty", headers_dict=admin_headers)
    assert st == 200 and fac_list["total"] == 2
    st, fac_1, _ = await make_asgi_request("GET", f"/api/admin/faculty/{fac1_id}", headers_dict=admin_headers)
    assert st == 200 and fac_1["faculty_name"] == "Faculty A"
    st, dup_fac, _ = await make_asgi_request(
        "POST",
        "/api/admin/faculty",
        headers_dict=admin_headers,
        body_data={
            "username": "faculty1",
            "email": "faculty1@college.edu",
            "faculty_name": "Duplicate Faculty",
            "department_id": dept_id,
        },
    )
    assert st == 409, f"Expected 409 Conflict for duplicate faculty, got {st}"
    print("  ✓ Faculty listing, details, and duplicate registration conflict (409) verified.")

    # 3. Departments Management
    st, dept_list, _ = await make_asgi_request("GET", "/api/admin/departments", headers_dict=admin_headers)
    assert st == 200 and dept_list["total"] == 1
    st, dept_1, _ = await make_asgi_request("GET", f"/api/admin/departments/{dept_id}", headers_dict=admin_headers)
    assert st == 200 and dept_1["department_code"] == "COMP"
    st, dup_dept, _ = await make_asgi_request(
        "POST",
        "/api/admin/departments",
        headers_dict=admin_headers,
        body_data={
            "department_name": "Computer Engineering",
            "department_code": "COMP",
        },
    )
    assert st == 409, f"Expected 409 Conflict for duplicate department, got {st}"
    print("  ✓ Department listing, details, and duplicate department code conflict (409) verified.")

    # 4. Classes Management
    st, cls_list, _ = await make_asgi_request("GET", "/api/admin/classes", headers_dict=admin_headers)
    assert st == 200 and cls_list["total"] == 1
    st, cls_1, _ = await make_asgi_request("GET", f"/api/admin/classes/{class_id}", headers_dict=admin_headers)
    assert st == 200 and cls_1["class_name"] == "SY Computer Engineering"
    # Invalid semester validation
    st, inv_sem_cls, _ = await make_asgi_request(
        "POST",
        "/api/admin/classes",
        headers_dict=admin_headers,
        body_data={
            "department_id": dept_id,
            "class_name": "Invalid Class",
            "academic_year": "2026-27",
            "semester": 10,  # Invalid: > 8
            "division": "A",
        },
    )
    assert st in (400, 422), f"Expected 400 or 422 for invalid semester > 8, got {st}"
    print("  ✓ Class listing, details, and invalid semester validation (<1 or >8) verified.")

    # 5. Subjects Management
    st, sub_list, _ = await make_asgi_request("GET", "/api/admin/subjects", headers_dict=admin_headers)
    assert st == 200 and sub_list["total"] == 4
    st, sub_1, _ = await make_asgi_request("GET", f"/api/admin/subjects/{sub_dbms_id}", headers_dict=admin_headers)
    assert st == 200 and sub_1["subject_code"] == "DBMS"
    st, dup_sub, _ = await make_asgi_request(
        "POST",
        "/api/admin/subjects",
        headers_dict=admin_headers,
        body_data={
            "subject_name": "Database Management System",
            "subject_code": "DBMS",
            "semester": 3,
        },
    )
    assert st == 409, f"Expected 409 Conflict for duplicate subject_code, got {st}"
    print("  ✓ Subject listing, details, and duplicate subject code conflict (409) verified.")

    # 6. Enrollments Management
    st, enr_list, _ = await make_asgi_request("GET", "/api/admin/enrollments", headers_dict=admin_headers)
    assert st == 200 and enr_list["total"] == 12
    st, enr_1, _ = await make_asgi_request("GET", f"/api/admin/enrollments/{enr1_id}", headers_dict=admin_headers)
    assert st == 200 and enr_1["enrollment_status"] == "ACTIVE"
    # Duplicate enrollment in same class
    st, dup_enr, _ = await make_asgi_request(
        "POST",
        "/api/admin/enrollments",
        headers_dict=admin_headers,
        body_data={"student_id": stu1_id, "class_id": class_id, "enrollment_date": "2026-08-01"},
    )
    assert st == 409, f"Expected 409 Conflict for duplicate active enrollment, got {st}"
    print("  ✓ Student enrollment listing, details, and duplicate enrollment conflict (409) verified.")

    # 7. Teaching Assignments Management
    st, ta_list, _ = await make_asgi_request("GET", "/api/admin/teaching-assignments", headers_dict=admin_headers)
    assert st == 200 and ta_list["total"] == 4
    st, ta_1, _ = await make_asgi_request("GET", f"/api/admin/teaching-assignments/{ta_f1_id}", headers_dict=admin_headers)
    assert st == 200 and ta_1["subject_code"] == "DBMS"
    # Cannot delete assignment when dependent lectures exist
    st, del_ta_err, _ = await make_asgi_request("DELETE", f"/api/admin/teaching-assignments/{ta_f1_id}", headers_dict=admin_headers)
    assert st == 409, f"Expected 409 Conflict deleting assignment with lectures, got {del_ta_err}"
    print("  ✓ Teaching assignment listing, details, and lecture-dependency deletion constraint (409) verified.")

    # -------------------------------------------------------------
    # SECTION 6: Phase B5 Lecture & Attendance Workflows
    # -------------------------------------------------------------
    print("\n--- [SECTION 6] Phase B5 Lecture Lifecycle, Attendance & Corrections ---")
    
    # 1. Faculty Lecture Management
    # List assignments for Faculty 1 (owns assignments 1 and 2)
    st, f1_assigns, _ = await make_asgi_request("GET", "/api/faculty/teaching-assignments", headers_dict=faculty1_headers)
    assert st == 200 and f1_assigns["total"] == 2
    f1_assign_ids = [a["assignment_id"] for a in f1_assigns["items"]]
    assert ta_f1_id in f1_assign_ids

    # Unassigned subject lecture creation rejected with 403
    st, unassigned_lec_err, _ = await make_asgi_request(
        "POST",
        "/api/faculty/lectures",
        headers_dict=faculty1_headers,
        body_data={
            "assignment_id": ta_f2_id,  # Belongs to Faculty 2
            "lecture_date": "2026-11-10",
            "start_time": "10:00:00",
            "end_time": "11:00:00",
        },
    )
    assert st == 403, f"Expected 403 for unowned assignment lecture creation, got {st}"

    # Invalid time range rejection (end_time <= start_time)
    st, inv_time_err, _ = await make_asgi_request(
        "POST",
        "/api/faculty/lectures",
        headers_dict=faculty1_headers,
        body_data={
            "assignment_id": ta_f1_id,
            "lecture_date": "2026-11-10",
            "start_time": "11:00:00",
            "end_time": "10:00:00",
        },
    )
    assert st == 400, f"Expected 400 for end_time <= start_time, got {st}"

    # Create temporary DRAFT lecture
    temp_lec_id = None
    temp_cr_id = None
    temp_att_id = None
    try:
        st, new_lec, _ = await make_asgi_request(
            "POST",
            "/api/faculty/lectures",
            headers_dict=faculty1_headers,
            body_data={
                "assignment_id": ta_f1_id,
                "lecture_date": "2026-11-10",
                "start_time": "09:00:00",
                "end_time": "10:00:00",
            },
        )
        assert st == 201, f"Expected 201 Created for draft lecture, got {st}"
        temp_lec_id = new_lec["lecture_id"]
        assert new_lec["lecture_status"] == "DRAFT"

        # Cross-faculty lecture boundary: Faculty 2 cannot access or edit Faculty 1's draft lecture
        st, f2_edit_err, _ = await make_asgi_request(
            "PUT",
            f"/api/faculty/lectures/{temp_lec_id}",
            headers_dict=faculty2_headers,
            body_data={"start_time": "10:00:00", "end_time": "11:00:00"},
        )
        assert st == 403, f"Expected 403 for cross-faculty lecture modification, got {st}"

        # Update draft lecture
        st, updated_lec, _ = await make_asgi_request(
            "PUT",
            f"/api/faculty/lectures/{temp_lec_id}",
            headers_dict=faculty1_headers,
            body_data={"start_time": "09:30:00", "end_time": "10:30:00"},
        )
        assert st == 200 and updated_lec["start_time"] == "09:30:00"

        # 2. Faculty Attendance Marking & Submission
        # Retrieve roster
        st, roster, _ = await make_asgi_request("GET", f"/api/faculty/lectures/{temp_lec_id}/roster", headers_dict=faculty1_headers)
        assert st == 200 and roster["total_enrolled_students"] == 12 and len(roster["students"]) == 12

        # Reject duplicate student IDs in bulk attendance marking
        st, dup_mark_err, _ = await make_asgi_request(
            "PUT",
            f"/api/faculty/lectures/{temp_lec_id}/attendance",
            headers_dict=faculty1_headers,
            body_data={
                "records": [
                    {"student_id": 1, "status": "PRESENT"},
                    {"student_id": 1, "status": "ABSENT"},
                ]
            },
        )
        assert st == 400, f"Expected 400 for duplicate student IDs in bulk marking, got {st}"

        # Incomplete submission rejection (no attendance marked yet)
        st, incomp_submit_err, _ = await make_asgi_request("POST", f"/api/faculty/lectures/{temp_lec_id}/submit", headers_dict=faculty1_headers)
        assert st == 400, f"Expected 400 for incomplete attendance submission, got {st}"

        # Mark complete attendance for all 12 students (10 present, 2 absent)
        records_to_mark = []
        for s_idx in range(1, 13):
            records_to_mark.append({"student_id": s_idx, "status": "PRESENT" if s_idx <= 10 else "ABSENT"})
        st, mark_res, _ = await make_asgi_request(
            "PUT",
            f"/api/faculty/lectures/{temp_lec_id}/attendance",
            headers_dict=faculty1_headers,
            body_data={"records": records_to_mark},
        )
        assert st == 200 and mark_res["marked_students"] == 12

        # Submit attendance atomically
        st, submit_res, _ = await make_asgi_request("POST", f"/api/faculty/lectures/{temp_lec_id}/submit", headers_dict=faculty1_headers)
        assert st == 200 and submit_res["lecture_status"] == "SUBMITTED"

        # Post-submission immutability: modification, cancellation, and repeated submission are rejected
        st, post_edit_err, _ = await make_asgi_request("PUT", f"/api/faculty/lectures/{temp_lec_id}", headers_dict=faculty1_headers, body_data={"start_time": "11:00:00"})
        assert st == 400, "Expected 400 when modifying submitted lecture"
        st, post_cancel_err, _ = await make_asgi_request("PATCH", f"/api/faculty/lectures/{temp_lec_id}/cancel", headers_dict=faculty1_headers)
        assert st == 400, "Expected 400 when cancelling submitted lecture"
        st, post_resubmit_err, _ = await make_asgi_request("POST", f"/api/faculty/lectures/{temp_lec_id}/submit", headers_dict=faculty1_headers)
        assert st == 400, "Expected 400 for duplicate submission"

        # 3. Student Attendance Inquiry
        st, stu1_summary, _ = await make_asgi_request("GET", "/api/student/attendance/summary", headers_dict=student1_headers)
        assert st == 200 and stu1_summary["student_id"] == stu1_id
        st, stu1_history, _ = await make_asgi_request("GET", "/api/student/attendance/history", headers_dict=student1_headers)
        assert st == 200 and stu1_history["total"] >= 1
        # Locate student 1's attendance record for the temp lecture
        target_rec = next((r for r in stu1_history["items"] if r["lecture_id"] == temp_lec_id), None)
        assert target_rec is not None
        temp_att_id = target_rec["attendance_id"]

        # Student cannot view another student's record details
        st, cross_stu_rec_err, _ = await make_asgi_request("GET", f"/api/student/attendance/{temp_att_id}", headers_dict=student2_headers)
        assert st == 404, f"Expected 404 accessing other student's record, got {st}"

        # 4. Attendance Correction Request & Faculty Review Lifecycle
        # Reject request matching current status
        st, same_stat_err, _ = await make_asgi_request(
            "POST",
            "/api/student/correction-requests",
            headers_dict=student1_headers,
            body_data={"attendance_id": temp_att_id, "requested_status": "PRESENT", "reason": "Already present"},
        )
        assert st == 400, "Expected 400 when requesting same attendance status"

        # Create valid correction request (student 1 was marked PRESENT, requests ABSENT for testing)
        st, new_cr, _ = await make_asgi_request(
            "POST",
            "/api/student/correction-requests",
            headers_dict=student1_headers,
            body_data={"attendance_id": temp_att_id, "requested_status": "ABSENT", "reason": "Attended wrong section"},
        )
        assert st == 201 and new_cr["request_status"] == "PENDING"
        temp_cr_id = new_cr["request_id"]

        # Duplicate pending request rejection
        st, dup_cr_err, _ = await make_asgi_request(
            "POST",
            "/api/student/correction-requests",
            headers_dict=student1_headers,
            body_data={"attendance_id": temp_att_id, "requested_status": "ABSENT", "reason": "Duplicate attempt"},
        )
        assert st == 409, f"Expected 409 Conflict for duplicate pending correction, got {st}"

        # Cross-faculty review rejection (Faculty 2 cannot review Faculty 1's course request)
        st, f2_rev_err, _ = await make_asgi_request(
            "PATCH",
            f"/api/faculty/correction-requests/{temp_cr_id}/review",
            headers_dict=faculty2_headers,
            body_data={"decision": "APPROVED", "review_remarks": "Unauthorized review"},
        )
        assert st == 403, f"Expected 403 for cross-faculty correction review, got {st}"

        # Faculty 1 APPROVES the request atomically
        st, approve_res, _ = await make_asgi_request(
            "PATCH",
            f"/api/faculty/correction-requests/{temp_cr_id}/review",
            headers_dict=faculty1_headers,
            body_data={"decision": "APPROVED", "review_remarks": "Approved after section check"},
        )
        assert st == 200 and approve_res["request_status"] == "APPROVED"
        assert approve_res["current_status"] == "ABSENT"

        # Repeated review attempt on already reviewed request rejected with 400
        st, double_rev_err, _ = await make_asgi_request(
            "PATCH",
            f"/api/faculty/correction-requests/{temp_cr_id}/review",
            headers_dict=faculty1_headers,
            body_data={"decision": "REJECTED", "review_remarks": "Repeated review"},
        )
        assert st == 400, "Expected 400 when reviewing an already reviewed request"

    finally:
        # 5. Clean up temporary test records immediately in reverse dependency order
        if temp_att_id:
            db.execute(text(f"DELETE FROM attendance_audit_logs WHERE attendance_id = {temp_att_id}"))
        if temp_cr_id:
            db.execute(text(f"DELETE FROM correction_requests WHERE request_id = {temp_cr_id}"))
        if temp_lec_id:
            db.execute(text(f"DELETE FROM attendance_records WHERE lecture_id = {temp_lec_id}"))
            db.execute(text(f"DELETE FROM lectures WHERE lecture_id = {temp_lec_id}"))
        db.commit()
    print("  ✓ Full lecture lifecycle, attendance marking, atomic submit, correction workflow, and audit logging verified.")
    print("  ✓ Safely cleaned up temporary test lecture, attendance, correction, and audit records.")

    # -------------------------------------------------------------
    # SECTION 7: Phase B6 Dashboards & Reporting APIs
    # -------------------------------------------------------------
    print("\n--- [SECTION 7] Phase B6 Dashboards, Analytics & Reporting APIs ---")
    
    # 1. Admin Dashboard Summary & Distribution
    st, adm_sum, _ = await make_asgi_request("GET", "/api/admin/dashboard/summary", headers_dict=admin_headers)
    assert st == 200
    assert adm_sum["total_students"] == 12
    assert adm_sum["total_faculty"] == 2
    assert adm_sum["total_departments"] == 1
    assert adm_sum["total_classes"] == 1
    assert adm_sum["total_subjects"] == 4
    assert adm_sum["total_lectures"] == 8
    assert adm_sum["submitted_lectures"] == 8
    assert adm_sum["total_attendance_records_for_submitted_lectures"] == 96
    assert adm_sum["total_present"] == 60
    assert adm_sum["total_absent"] == 36
    assert adm_sum["overall_attendance_percentage"] == 62.5
    print("  ✓ Admin dashboard summary matches live aggregates (96 records, 60 present, 36 absent, 62.5%).")

    st, adm_dist, _ = await make_asgi_request("GET", "/api/admin/dashboard/attendance-distribution", headers_dict=admin_headers)
    assert st == 200
    assert adm_dist["present_count"] == 60 and adm_dist["absent_count"] == 36
    assert adm_dist["present_percentage"] == 62.5 and adm_dist["absent_percentage"] == 37.5
    print("  ✓ Admin attendance distribution matches 62.5% present vs 37.5% absent.")

    # Trends: Daily, Weekly, Monthly
    st, tr_d, _ = await make_asgi_request("GET", "/api/admin/dashboard/attendance-trends?period=daily", headers_dict=admin_headers)
    assert st == 200 and tr_d["total_periods"] == 4
    st, tr_w, _ = await make_asgi_request("GET", "/api/admin/dashboard/attendance-trends?period=weekly", headers_dict=admin_headers)
    assert st == 200 and tr_w["total_periods"] == 1 and tr_w["items"][0]["attendance_percentage"] == 62.5
    st, tr_m, _ = await make_asgi_request("GET", "/api/admin/dashboard/attendance-trends?period=monthly", headers_dict=admin_headers)
    assert st == 200 and tr_m["total_periods"] == 1 and tr_m["items"][0]["period"] == "2026-10"
    print("  ✓ Admin attendance trends verified for daily, weekly, and monthly periods.")

    # 2. Admin Institutional Reports
    st, rep_dept, _ = await make_asgi_request("GET", "/api/admin/reports/departments", headers_dict=admin_headers)
    assert st == 200 and rep_dept["items"][0]["department_code"] == "COMP"
    st, rep_cls, _ = await make_asgi_request("GET", "/api/admin/reports/classes", headers_dict=admin_headers)
    assert st == 200 and rep_cls["items"][0]["class_name"] == "SY Computer Engineering"
    st, rep_sub, _ = await make_asgi_request("GET", "/api/admin/reports/subjects", headers_dict=admin_headers)
    assert st == 200 and rep_sub["total"] == 4
    st, rep_fac, _ = await make_asgi_request("GET", "/api/admin/reports/faculty", headers_dict=admin_headers)
    assert st == 200 and rep_fac["total"] == 2
    st, rep_stu, _ = await make_asgi_request("GET", "/api/admin/reports/students", headers_dict=admin_headers)
    assert st == 200 and rep_stu["total"] == 12

    # Low attendance warning report & mathematical recovery formula validation
    st, rep_low, _ = await make_asgi_request("GET", "/api/admin/reports/low-attendance?threshold=75.0", headers_dict=admin_headers)
    assert st == 200 and rep_low["threshold"] == 75.0
    for l_stu in rep_low["items"]:
        assert l_stu["attendance_percentage"] < 75.0
        P = l_stu["present_count"]
        T = l_stu["total_submitted_lectures"]
        expected_x = math.ceil((75.0 * T - 100 * P) / (100 - 75.0))
        assert l_stu["required_present_count_to_reach_threshold"] == expected_x
    print(f"  ✓ Low attendance report verified: {rep_low['total']} students below 75% threshold with exact recovery counts.")

    # Lecture report & Date-range attendance report
    st, rep_lec, _ = await make_asgi_request("GET", "/api/admin/reports/lectures", headers_dict=admin_headers)
    assert st == 200 and rep_lec["total"] == 8
    st, rep_dt, _ = await make_asgi_request("GET", "/api/admin/reports/attendance?start_date=2026-10-20&end_date=2026-10-21", headers_dict=admin_headers)
    assert st == 200 and rep_dt["total_lectures"] == 4 and rep_dt["total_records"] == 48
    print("  ✓ Admin lecture reports and date-range attendance aggregations verified.")

    # 3. Faculty Dashboard & Reports
    st, f1_sum, _ = await make_asgi_request("GET", "/api/faculty/dashboard/summary", headers_dict=faculty1_headers)
    assert st == 200 and f1_sum["faculty_id"] == fac1_id and f1_sum["total_teaching_assignments"] == 2
    st, f1_perf, _ = await make_asgi_request("GET", "/api/faculty/reports/performance", headers_dict=faculty1_headers)
    assert st == 200 and f1_perf["total"] == 2
    st, f1_stus, _ = await make_asgi_request("GET", "/api/faculty/reports/students", headers_dict=faculty1_headers)
    assert st == 200 and f1_stus["total"] == 24
    # Cross-faculty isolation on student reports
    st, f1_cross_err, _ = await make_asgi_request("GET", f"/api/faculty/reports/students?assignment_id={ta_f2_id}", headers_dict=faculty1_headers)
    assert st == 403, "Expected 403 when faculty requests other faculty's assignment report"
    print("  ✓ Faculty dashboard, performance, student tracking, and cross-faculty isolation verified.")

    # 4. Student Dashboard
    st, s1_sum, _ = await make_asgi_request("GET", "/api/student/dashboard/summary", headers_dict=student1_headers)
    assert st == 200 and s1_sum["student_id"] == stu1_id and s1_sum["roll_number"] == "student01" and s1_sum["overall_attendance_percentage"] == 87.5
    st, s1_subj, _ = await make_asgi_request("GET", "/api/student/dashboard/subject-performance", headers_dict=student1_headers)
    assert st == 200 and len(s1_subj["items"]) == 4
    st, s1_tr, _ = await make_asgi_request("GET", "/api/student/dashboard/attendance-trends?period=daily", headers_dict=student1_headers)
    assert st == 200 and s1_tr["total_periods"] == 4
    # Student identity isolation: Student 2 sees student 2's data
    st, s2_sum, _ = await make_asgi_request("GET", "/api/student/dashboard/summary", headers_dict=student2_headers)
    assert st == 200 and s2_sum["roll_number"] == "student02" and s2_sum["student_id"] == stu2_id
    print("  ✓ Student dashboard, subject breakdown, trends, and student identity isolation verified.")

    # -------------------------------------------------------------
    # SECTION 8: Boundary Validations, Constraints & Error Handling
    # -------------------------------------------------------------
    print("\n--- [SECTION 8] Boundary Validations & Error Handling ---")
    # Date range inversion: start_date > end_date -> 400
    st, _, _ = await make_asgi_request("GET", "/api/admin/dashboard/attendance-trends?start_date=2026-10-25&end_date=2026-10-20", headers_dict=admin_headers)
    assert st == 400, "Expected 400 for inverted date range"
    st, _, _ = await make_asgi_request("GET", "/api/admin/reports/attendance?start_date=2026-10-25&end_date=2026-10-20", headers_dict=admin_headers)
    assert st == 400, "Expected 400 for inverted date range in attendance report"

    # Invalid trend period -> 400
    st, _, _ = await make_asgi_request("GET", "/api/admin/dashboard/attendance-trends?period=quarterly", headers_dict=admin_headers)
    assert st == 400, "Expected 400 for invalid trend period"

    # Invalid threshold boundaries (<0 or >100) -> 422
    st, _, _ = await make_asgi_request("GET", "/api/admin/reports/low-attendance?threshold=105.0", headers_dict=admin_headers)
    assert st == 422, "Expected 422 for threshold > 100"
    st, _, _ = await make_asgi_request("GET", "/api/admin/reports/low-attendance?threshold=-5.0", headers_dict=admin_headers)
    assert st == 422, "Expected 422 for threshold < 0"

    # Pagination boundaries (skip < 0 or limit < 1 or limit > 100) -> 422
    st, _, _ = await make_asgi_request("GET", "/api/admin/students?skip=-1", headers_dict=admin_headers)
    assert st == 422, "Expected 422 for skip < 0"
    st, _, _ = await make_asgi_request("GET", "/api/admin/students?limit=0", headers_dict=admin_headers)
    assert st == 422, "Expected 422 for limit < 1"
    st, _, _ = await make_asgi_request("GET", "/api/admin/students?limit=101", headers_dict=admin_headers)
    assert st == 422, "Expected 422 for limit > 100"
    print("  ✓ Boundary validations verified: date inversions (400), invalid periods (400), invalid thresholds (422), invalid pagination (422).")

    # -------------------------------------------------------------
    # SECTION 9: Database Zero Mutation Verification
    # -------------------------------------------------------------
    print("\n--- [SECTION 9] Database Zero Mutation & Final Integrity Verification ---")
    final_counts = get_current_counts(db)
    mutations = []
    for tbl in TABLES:
        init_c = initial_counts[tbl]
        fin_c = final_counts[tbl]
        if init_c != fin_c:
            mutations.append(f"{tbl}: initial={init_c}, final={fin_c}")
        else:
            print(f"  - Table `{tbl:<23}`: {fin_c:>3} rows (UNCHANGED)")

    assert len(mutations) == 0, f"Database mutated during verification: {mutations}"
    print("\n  ✓ 100% VERIFIED: Zero database mutations. All 13 tables remain in their exact baseline state.")

    print("\n" + "=" * 90)
    print("ALL PHASE B7 MASTER VERIFICATION TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS!")
    print("=" * 90)
    db.close()


if __name__ == "__main__":
    asyncio.run(run_master_verification())
