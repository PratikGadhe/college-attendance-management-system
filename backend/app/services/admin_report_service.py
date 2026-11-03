"""Admin reports service layer handling institutional, departmental, class, subject, faculty, and student analytics."""

import math
from datetime import date
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, case, distinct, func, or_, select
from sqlalchemy.orm import Session

from app.models.attendance_records import AttendanceRecord
from app.models.classes import Class
from app.models.departments import Department
from app.models.enrollments import Enrollment
from app.models.faculty import Faculty
from app.models.lectures import Lecture
from app.models.students import Student
from app.models.subjects import Subject
from app.models.teaching_assignments import TeachingAssignment
from app.models.users import User
from app.schemas.admin_reports import (
    ClassAttendanceReportItem,
    ClassAttendanceReportResponse,
    DateRangeAttendanceReportResponse,
    DepartmentAttendanceReportItem,
    DepartmentAttendanceReportResponse,
    FacultyAttendanceReportItem,
    FacultyAttendanceReportResponse,
    LectureReportItem,
    LectureReportResponse,
    LowAttendanceReportItem,
    LowAttendanceReportResponse,
    StudentAttendanceReportItem,
    StudentAttendanceReportResponse,
    SubjectAttendanceReportItem,
    SubjectAttendanceReportResponse,
)


def get_department_attendance_report(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> DepartmentAttendanceReportResponse:
    """Calculate institutional attendance aggregated by academic department."""
    query = select(Department)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Department.department_name.ilike(term),
                Department.department_code.ilike(term),
            )
        )
    departments = db.scalars(
        query.order_by(Department.department_name.asc())
    ).all()

    items = []
    for dept in departments:
        # Total classes in department
        total_classes = (
            db.scalar(
                select(func.count(Class.class_id)).where(
                    Class.department_id == dept.department_id
                )
            )
            or 0
        )

        # Active students enrolled in classes of this department
        total_active_students = (
            db.scalar(
                select(func.count(distinct(Enrollment.student_id)))
                .join(Class, Enrollment.class_id == Class.class_id)
                .where(
                    Class.department_id == dept.department_id,
                    Enrollment.enrollment_status == "ACTIVE",
                )
            )
            or 0
        )

        # Submitted lectures in department classes
        dept_submitted_lectures = (
            select(Lecture.lecture_id)
            .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
            .join(Class, TeachingAssignment.class_id == Class.class_id)
            .where(
                Class.department_id == dept.department_id,
                Lecture.lecture_status == "SUBMITTED",
            )
        )

        total_submitted_lectures = (
            db.scalar(
                select(func.count(func.distinct(Lecture.lecture_id)))
                .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
                .join(Class, TeachingAssignment.class_id == Class.class_id)
                .where(
                    Class.department_id == dept.department_id,
                    Lecture.lecture_status == "SUBMITTED",
                )
            )
            or 0
        )

        present_count = (
            db.scalar(
                select(func.count(AttendanceRecord.attendance_id)).where(
                    AttendanceRecord.lecture_id.in_(dept_submitted_lectures),
                    AttendanceRecord.status == "PRESENT",
                )
            )
            or 0
        )

        absent_count = (
            db.scalar(
                select(func.count(AttendanceRecord.attendance_id)).where(
                    AttendanceRecord.lecture_id.in_(dept_submitted_lectures),
                    AttendanceRecord.status == "ABSENT",
                )
            )
            or 0
        )

        total_marks = present_count + absent_count
        attendance_pct = (
            round((present_count / total_marks) * 100.0, 2)
            if total_marks > 0
            else 0.0
        )

        items.append(
            DepartmentAttendanceReportItem(
                department_id=dept.department_id,
                department_name=dept.department_name,
                department_code=dept.department_code,
                total_classes=total_classes,
                total_active_students=total_active_students,
                total_submitted_lectures=total_submitted_lectures,
                present_count=present_count,
                absent_count=absent_count,
                attendance_percentage=attendance_pct,
            )
        )

    paginated_items = items[skip : skip + limit]
    return DepartmentAttendanceReportResponse(total=len(items), items=paginated_items)


def get_class_attendance_report(
    db: Session,
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    academic_year: Optional[str] = None,
    division: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> ClassAttendanceReportResponse:
    """Calculate class-wise attendance aggregates with optional relational filters."""
    query = (
        select(Class, Department.department_name)
        .join(Department, Class.department_id == Department.department_id)
    )
    count_query = select(func.count(Class.class_id)).join(
        Department, Class.department_id == Department.department_id
    )

    conditions = []
    if department_id is not None:
        conditions.append(Class.department_id == department_id)
    if semester is not None:
        conditions.append(Class.semester == semester)
    if academic_year and academic_year.strip():
        conditions.append(Class.academic_year == academic_year.strip())
    if division and division.strip():
        conditions.append(Class.division == division.strip().upper())
    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append(
            or_(
                Class.class_name.ilike(term),
                Class.division.ilike(term),
                Department.department_name.ilike(term),
            )
        )

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    classes = (
        db.execute(
            query.order_by(Class.class_id.asc()).offset(skip).limit(limit)
        )
        .all()
    )

    items = []
    for row in classes:
        cls: Class = row[0]
        dept_name: str = row[1]

        # Active enrolled students
        total_active_students = (
            db.scalar(
                select(func.count(Enrollment.enrollment_id)).where(
                    Enrollment.class_id == cls.class_id,
                    Enrollment.enrollment_status == "ACTIVE",
                )
            )
            or 0
        )

        # Submitted lectures for this class
        class_submitted_lectures = (
            select(Lecture.lecture_id)
            .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
            .where(
                TeachingAssignment.class_id == cls.class_id,
                Lecture.lecture_status == "SUBMITTED",
            )
        )

        total_submitted_lectures = (
            db.scalar(
                select(func.count(func.distinct(Lecture.lecture_id)))
                .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
                .where(
                    TeachingAssignment.class_id == cls.class_id,
                    Lecture.lecture_status == "SUBMITTED",
                )
            )
            or 0
        )

        present_count = (
            db.scalar(
                select(func.count(AttendanceRecord.attendance_id)).where(
                    AttendanceRecord.lecture_id.in_(class_submitted_lectures),
                    AttendanceRecord.status == "PRESENT",
                )
            )
            or 0
        )

        absent_count = (
            db.scalar(
                select(func.count(AttendanceRecord.attendance_id)).where(
                    AttendanceRecord.lecture_id.in_(class_submitted_lectures),
                    AttendanceRecord.status == "ABSENT",
                )
            )
            or 0
        )

        total_marks = present_count + absent_count
        attendance_pct = (
            round((present_count / total_marks) * 100.0, 2)
            if total_marks > 0
            else 0.0
        )

        items.append(
            ClassAttendanceReportItem(
                class_id=cls.class_id,
                class_name=cls.class_name,
                department_name=dept_name,
                academic_year=cls.academic_year,
                division=cls.division,
                semester=cls.semester,
                total_active_students=total_active_students,
                total_submitted_lectures=total_submitted_lectures,
                present_count=present_count,
                absent_count=absent_count,
                attendance_percentage=attendance_pct,
            )
        )

    return ClassAttendanceReportResponse(
        total=total, skip=skip, limit=limit, items=items
    )


def get_subject_attendance_report(
    db: Session,
    department_id: Optional[int] = None,
    class_id: Optional[int] = None,
    semester: Optional[int] = None,
    academic_year: Optional[str] = None,
    subject_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> SubjectAttendanceReportResponse:
    """Calculate subject-wise attendance performance with course and academic filters."""
    query = select(Subject)
    count_query = select(func.count(Subject.subject_id))

    conditions = []
    if subject_id is not None:
        conditions.append(Subject.subject_id == subject_id)
    if semester is not None:
        conditions.append(Subject.semester == semester)
    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append(
            or_(
                Subject.subject_name.ilike(term),
                Subject.subject_code.ilike(term),
            )
        )

    # If class/department/academic_year filter applied, join through TeachingAssignment
    if class_id is not None or department_id is not None or academic_year:
        assign_filter = select(distinct(TeachingAssignment.subject_id)).join(
            Class, TeachingAssignment.class_id == Class.class_id
        )
        if class_id is not None:
            assign_filter = assign_filter.where(TeachingAssignment.class_id == class_id)
        if department_id is not None:
            assign_filter = assign_filter.where(Class.department_id == department_id)
        if academic_year and academic_year.strip():
            assign_filter = assign_filter.where(Class.academic_year == academic_year.strip())
        conditions.append(Subject.subject_id.in_(assign_filter))

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    subjects = (
        db.scalars(
            query.order_by(Subject.subject_id.asc()).offset(skip).limit(limit)
        )
        .all()
    )

    items = []
    for sub in subjects:
        # Base lecture query for this subject
        lec_query = (
            select(Lecture.lecture_id)
            .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
            .join(Class, TeachingAssignment.class_id == Class.class_id)
            .where(
                TeachingAssignment.subject_id == sub.subject_id,
                Lecture.lecture_status == "SUBMITTED",
            )
        )
        if class_id is not None:
            lec_query = lec_query.where(TeachingAssignment.class_id == class_id)
        if department_id is not None:
            lec_query = lec_query.where(Class.department_id == department_id)

        total_submitted_lectures = (
            db.scalar(
                select(func.count(func.distinct(Lecture.lecture_id)))
                .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
                .join(Class, TeachingAssignment.class_id == Class.class_id)
                .where(
                    TeachingAssignment.subject_id == sub.subject_id,
                    Lecture.lecture_status == "SUBMITTED",
                )
            )
            or 0
        )

        present_count = (
            db.scalar(
                select(func.count(AttendanceRecord.attendance_id)).where(
                    AttendanceRecord.lecture_id.in_(lec_query),
                    AttendanceRecord.status == "PRESENT",
                )
            )
            or 0
        )

        absent_count = (
            db.scalar(
                select(func.count(AttendanceRecord.attendance_id)).where(
                    AttendanceRecord.lecture_id.in_(lec_query),
                    AttendanceRecord.status == "ABSENT",
                )
            )
            or 0
        )

        total_marks = present_count + absent_count
        attendance_pct = (
            round((present_count / total_marks) * 100.0, 2)
            if total_marks > 0
            else 0.0
        )

        # Context class name if filtered
        ctx_class_name = None
        if class_id:
            c = db.scalar(select(Class.class_name).where(Class.class_id == class_id))
            ctx_class_name = c

        items.append(
            SubjectAttendanceReportItem(
                subject_id=sub.subject_id,
                subject_code=sub.subject_code,
                subject_name=sub.subject_name,
                semester=sub.semester,
                class_id=class_id,
                class_name=ctx_class_name,
                total_submitted_lectures=total_submitted_lectures,
                present_count=present_count,
                absent_count=absent_count,
                attendance_percentage=attendance_pct,
            )
        )

    return SubjectAttendanceReportResponse(
        total=total, skip=skip, limit=limit, items=items
    )


def get_faculty_attendance_report(
    db: Session,
    department_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
    search: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 20,
) -> FacultyAttendanceReportResponse:
    """Calculate faculty workload, lectures breakdown, and lecture attendance performance."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be later than end_date.",
        )

    query = (
        select(Faculty, Department.department_name)
        .join(Department, Faculty.department_id == Department.department_id)
    )
    count_query = select(func.count(Faculty.faculty_id)).join(
        Department, Faculty.department_id == Department.department_id
    )

    conditions = []
    if department_id is not None:
        conditions.append(Faculty.department_id == department_id)
    if faculty_id is not None:
        conditions.append(Faculty.faculty_id == faculty_id)
    if search and search.strip():
        conditions.append(Faculty.faculty_name.ilike(f"%{search.strip()}%"))

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    faculty_rows = (
        db.execute(
            query.order_by(Faculty.faculty_id.asc()).offset(skip).limit(limit)
        )
        .all()
    )

    items = []
    for row in faculty_rows:
        fac: Faculty = row[0]
        dept_name: str = row[1]

        # Total teaching assignments
        total_assignments = (
            db.scalar(
                select(func.count(TeachingAssignment.assignment_id)).where(
                    TeachingAssignment.faculty_id == fac.faculty_id
                )
            )
            or 0
        )

        # Faculty lecture queries with optional date filters
        lec_query = (
            select(Lecture)
            .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
            .where(TeachingAssignment.faculty_id == fac.faculty_id)
        )
        if start_date:
            lec_query = lec_query.where(Lecture.lecture_date >= start_date)
        if end_date:
            lec_query = lec_query.where(Lecture.lecture_date <= end_date)

        lectures_list = db.scalars(lec_query).all()
        total_lectures = len(lectures_list)
        submitted_lectures = sum(1 for l in lectures_list if l.lecture_status == "SUBMITTED")
        draft_lectures = sum(1 for l in lectures_list if l.lecture_status == "DRAFT")
        cancelled_lectures = sum(1 for l in lectures_list if l.lecture_status == "CANCELLED")

        submitted_ids = [l.lecture_id for l in lectures_list if l.lecture_status == "SUBMITTED"]
        total_present = 0
        total_absent = 0
        if submitted_ids:
            counts = db.execute(
                select(
                    func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)),
                    func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)),
                ).where(AttendanceRecord.lecture_id.in_(submitted_ids))
            ).first()
            if counts:
                total_present = int(counts[0] or 0)
                total_absent = int(counts[1] or 0)

        total_marks = total_present + total_absent
        attendance_pct = (
            round((total_present / total_marks) * 100.0, 2)
            if total_marks > 0
            else 0.0
        )

        items.append(
            FacultyAttendanceReportItem(
                faculty_id=fac.faculty_id,
                faculty_name=fac.faculty_name,
                department_name=dept_name,
                total_teaching_assignments=total_assignments,
                total_lectures=total_lectures,
                submitted_lectures=submitted_lectures,
                draft_lectures=draft_lectures,
                cancelled_lectures=cancelled_lectures,
                total_present=total_present,
                total_absent=total_absent,
                attendance_percentage=attendance_pct,
            )
        )

    return FacultyAttendanceReportResponse(
        total=total, skip=skip, limit=limit, items=items
    )


def get_student_attendance_report(
    db: Session,
    department_id: Optional[int] = None,
    class_id: Optional[int] = None,
    semester: Optional[int] = None,
    academic_year: Optional[str] = None,
    attendance_threshold: Optional[float] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> StudentAttendanceReportResponse:
    """Calculate overall attendance percentage for actively enrolled students."""
    if attendance_threshold is not None and not (0.0 <= attendance_threshold <= 100.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="attendance_threshold must be between 0.0 and 100.0.",
        )

    # Base query for active student enrollments
    query = (
        select(Student, Class, Department.department_name)
        .join(Enrollment, Student.student_id == Enrollment.student_id)
        .join(Class, Enrollment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
        .where(Enrollment.enrollment_status == "ACTIVE")
    )

    conditions = []
    if department_id is not None:
        conditions.append(Class.department_id == department_id)
    if class_id is not None:
        conditions.append(Class.class_id == class_id)
    if semester is not None:
        conditions.append(Class.semester == semester)
    if academic_year and academic_year.strip():
        conditions.append(Class.academic_year == academic_year.strip())
    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Student.student_name.ilike(search_pattern),
                Student.roll_number.ilike(search_pattern),
            )
        )

    if conditions:
        query = query.where(and_(*conditions))

    rows = db.execute(query.order_by(Student.roll_number.asc())).all()

    items = []
    for row in rows:
        st: Student = row[0]
        cls: Class = row[1]
        dept_name: str = row[2]

        # Total SUBMITTED lectures for student's class
        total_sub_lectures = (
            db.scalar(
                select(func.count(Lecture.lecture_id))
                .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
                .where(
                    TeachingAssignment.class_id == cls.class_id,
                    Lecture.lecture_status == "SUBMITTED",
                )
            )
            or 0
        )

        # Present & Absent counts for this student in SUBMITTED lectures
        counts = db.execute(
            select(
                func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)),
                func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)),
            )
            .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
            .where(
                AttendanceRecord.student_id == st.student_id,
                Lecture.lecture_status == "SUBMITTED",
            )
        ).first()

        present_cnt = int(counts[0] or 0) if counts else 0
        absent_cnt = int(counts[1] or 0) if counts else 0

        pct = (
            round((present_cnt / total_sub_lectures) * 100.0, 2)
            if total_sub_lectures > 0
            else 0.0
        )

        # Optional threshold filter
        if attendance_threshold is not None and pct > attendance_threshold:
            continue

        items.append(
            StudentAttendanceReportItem(
                student_id=st.student_id,
                student_name=st.student_name,
                roll_number=st.roll_number,
                class_name=cls.class_name,
                department_name=dept_name,
                total_submitted_lectures=total_sub_lectures,
                present_count=present_cnt,
                absent_count=absent_cnt,
                attendance_percentage=pct,
            )
        )

    # Manual slice for pagination after in-memory threshold filtering
    paginated_items = items[skip : skip + limit]
    return StudentAttendanceReportResponse(
        total=len(items), skip=skip, limit=limit, items=paginated_items
    )


def get_low_attendance_report(
    db: Session,
    threshold: float = 75.0,
    department_id: Optional[int] = None,
    class_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    semester: Optional[int] = None,
    academic_year: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> LowAttendanceReportResponse:
    """Identify students with attendance strictly below the defined threshold and calculate recovery required."""
    if not (0.0 <= threshold <= 100.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Threshold must be between 0.0 and 100.0.",
        )

    query = (
        select(Student, Class, Department.department_name)
        .join(Enrollment, Student.student_id == Enrollment.student_id)
        .join(Class, Enrollment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
        .where(Enrollment.enrollment_status == "ACTIVE")
    )

    conditions = []
    if department_id is not None:
        conditions.append(Class.department_id == department_id)
    if class_id is not None:
        conditions.append(Class.class_id == class_id)
    if semester is not None:
        conditions.append(Class.semester == semester)
    if academic_year and academic_year.strip():
        conditions.append(Class.academic_year == academic_year.strip())

    if conditions:
        query = query.where(and_(*conditions))

    rows = db.execute(query.order_by(Student.roll_number.asc())).all()

    items = []
    for row in rows:
        st: Student = row[0]
        cls: Class = row[1]
        dept_name: str = row[2]

        lec_stmt = (
            select(func.count(Lecture.lecture_id))
            .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
            .where(
                TeachingAssignment.class_id == cls.class_id,
                Lecture.lecture_status == "SUBMITTED",
            )
        )
        if subject_id is not None:
            lec_stmt = lec_stmt.where(TeachingAssignment.subject_id == subject_id)

        total_sub_lectures = db.scalar(lec_stmt) or 0

        counts_stmt = (
            select(
                func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)),
                func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)),
            )
            .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
            .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
            .where(
                AttendanceRecord.student_id == st.student_id,
                Lecture.lecture_status == "SUBMITTED",
            )
        )
        if subject_id is not None:
            counts_stmt = counts_stmt.where(TeachingAssignment.subject_id == subject_id)

        counts = db.execute(counts_stmt).first()

        present_cnt = int(counts[0] or 0) if counts else 0
        absent_cnt = int(counts[1] or 0) if counts else 0

        pct = (
            round((present_cnt / total_sub_lectures) * 100.0, 2)
            if total_sub_lectures > 0
            else 0.0
        )

        if pct < threshold:
            # Calculate required consecutive lectures to reach threshold:
            # (P + x) / (T + x) >= threshold / 100
            # x >= (threshold * T - 100 * P) / (100 - threshold)
            req_count = 0
            if total_sub_lectures > 0:
                if threshold < 100.0:
                    numerator = (threshold * total_sub_lectures) - (100.0 * present_cnt)
                    denominator = 100.0 - threshold
                    if numerator > 0:
                        req_count = math.ceil(numerator / denominator)
                else:
                    # If threshold is 100% and student missed any lecture, mathematically impossible
                    req_count = 0 if present_cnt == total_sub_lectures else -1

            items.append(
                LowAttendanceReportItem(
                    student_id=st.student_id,
                    student_name=st.student_name,
                    roll_number=st.roll_number,
                    class_name=cls.class_name,
                    department_name=dept_name,
                    total_submitted_lectures=total_sub_lectures,
                    present_count=present_cnt,
                    absent_count=absent_cnt,
                    attendance_percentage=pct,
                    threshold=threshold,
                    required_present_count_to_reach_threshold=req_count,
                )
            )

    paginated_items = items[skip : skip + limit]
    return LowAttendanceReportResponse(
        threshold=threshold,
        total=len(items),
        skip=skip,
        limit=limit,
        items=paginated_items,
    )


def get_lecture_report(
    db: Session,
    faculty_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    class_id: Optional[int] = None,
    department_id: Optional[int] = None,
    lecture_status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 20,
) -> LectureReportResponse:
    """Retrieve detailed list of lectures with attendance headcounts."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be later than end_date.",
        )

    query = (
        select(
            Lecture,
            Subject.subject_name,
            Subject.subject_code,
            Faculty.faculty_name,
            Class.class_name,
            Class.division,
        )
        .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Faculty, TeachingAssignment.faculty_id == Faculty.faculty_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
    )

    count_query = (
        select(func.count(Lecture.lecture_id))
        .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
    )

    conditions = []
    if faculty_id is not None:
        conditions.append(TeachingAssignment.faculty_id == faculty_id)
    if subject_id is not None:
        conditions.append(TeachingAssignment.subject_id == subject_id)
    if class_id is not None:
        conditions.append(TeachingAssignment.class_id == class_id)
    if department_id is not None:
        conditions.append(Class.department_id == department_id)
    if lecture_status and lecture_status.strip():
        conditions.append(Lecture.lecture_status == lecture_status.strip().upper())
    if start_date:
        conditions.append(Lecture.lecture_date >= start_date)
    if end_date:
        conditions.append(Lecture.lecture_date <= end_date)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.scalar(count_query) or 0
    results = (
        db.execute(
            query.order_by(
                Lecture.lecture_date.desc(),
                Lecture.start_time.desc(),
                Lecture.lecture_id.desc(),
            )
            .offset(skip)
            .limit(limit)
        )
        .all()
    )

    # Compute present/absent per lecture
    lecture_ids = [r[0].lecture_id for r in results]
    counts_map = {}
    if lecture_ids:
        c_stmt = (
            select(
                AttendanceRecord.lecture_id,
                func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)),
                func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)),
            )
            .where(AttendanceRecord.lecture_id.in_(lecture_ids))
            .group_by(AttendanceRecord.lecture_id)
        )
        for r in db.execute(c_stmt).all():
            counts_map[r[0]] = (int(r[1] or 0), int(r[2] or 0))

    items = [
        LectureReportItem(
            lecture_id=r[0].lecture_id,
            lecture_date=r[0].lecture_date,
            start_time=r[0].start_time,
            end_time=r[0].end_time,
            lecture_status=r[0].lecture_status,
            subject_name=r[1],
            subject_code=r[2],
            faculty_name=r[3],
            class_name=r[4],
            division=r[5],
            total_students=counts_map.get(r[0].lecture_id, (0, 0))[0] + counts_map.get(r[0].lecture_id, (0, 0))[1],
            present_count=counts_map.get(r[0].lecture_id, (0, 0))[0],
            absent_count=counts_map.get(r[0].lecture_id, (0, 0))[1],
        )
        for r in results
    ]

    return LectureReportResponse(total=total, skip=skip, limit=limit, items=items)


def get_attendance_performance_by_date_range(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department_id: Optional[int] = None,
    class_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
) -> DateRangeAttendanceReportResponse:
    """Calculate institutional attendance metrics and lecture listings across a specified date range."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be later than end_date.",
        )

    # Fetch all submitted lectures matching range and filters
    lec_report = get_lecture_report(
        db=db,
        faculty_id=faculty_id,
        subject_id=subject_id,
        class_id=class_id,
        department_id=department_id,
        lecture_status="SUBMITTED",
        start_date=start_date,
        end_date=end_date,
        skip=0,
        limit=500,
    )

    total_lectures = lec_report.total
    present_count = sum(item.present_count for item in lec_report.items)
    absent_count = sum(item.absent_count for item in lec_report.items)
    total_records = present_count + absent_count

    pct = (
        round((present_count / total_records) * 100.0, 2)
        if total_records > 0
        else 0.0
    )

    return DateRangeAttendanceReportResponse(
        start_date=start_date,
        end_date=end_date,
        total_lectures=total_lectures,
        total_records=total_records,
        present_count=present_count,
        absent_count=absent_count,
        attendance_percentage=pct,
        items=lec_report.items,
    )
