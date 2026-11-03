"""Admin lecture service layer handling oversight, lecture details, and attendance roster inspection."""

from datetime import date
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

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
from app.schemas.admin_lectures import (
    AdminLectureAttendanceItem,
    AdminLectureAttendanceRosterResponse,
    AdminLectureDetailResponse,
    AdminLectureListItem,
    AdminLectureListResponse,
)


def list_admin_lectures(
    db: Session,
    faculty_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    class_id: Optional[int] = None,
    lecture_status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 20,
) -> AdminLectureListResponse:
    """Retrieve paginated lectures with full administrative filters."""
    query = (
        select(
            Lecture,
            TeachingAssignment.faculty_id,
            Faculty.faculty_name,
            Subject.subject_id,
            Subject.subject_code,
            Subject.subject_name,
            Class.class_id,
            Class.class_name,
            Class.division,
            Department.department_id,
            Department.department_name,
        )
        .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
        .join(Faculty, TeachingAssignment.faculty_id == Faculty.faculty_id)
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
    )

    count_query = (
        select(func.count(Lecture.lecture_id))
        .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
        .join(Faculty, TeachingAssignment.faculty_id == Faculty.faculty_id)
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
    )

    conditions = []
    if faculty_id is not None:
        conditions.append(TeachingAssignment.faculty_id == faculty_id)
    if subject_id is not None:
        conditions.append(TeachingAssignment.subject_id == subject_id)
    if class_id is not None:
        conditions.append(TeachingAssignment.class_id == class_id)
    if lecture_status and lecture_status.strip():
        conditions.append(Lecture.lecture_status == lecture_status.strip().upper())
    if start_date is not None:
        conditions.append(Lecture.lecture_date >= start_date)
    if end_date is not None:
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

    items = [
        AdminLectureListItem(
            lecture_id=row[0].lecture_id,
            assignment_id=row[0].assignment_id,
            faculty_id=row[1],
            faculty_name=row[2],
            subject_id=row[3],
            subject_code=row[4],
            subject_name=row[5],
            class_id=row[6],
            class_name=row[7],
            division=row[8],
            department_id=row[9],
            department_name=row[10],
            lecture_date=row[0].lecture_date,
            start_time=row[0].start_time,
            end_time=row[0].end_time,
            lecture_status=row[0].lecture_status,
            created_at=row[0].created_at,
            submitted_at=row[0].submitted_at,
        )
        for row in results
    ]

    return AdminLectureListResponse(
        total=total, skip=skip, limit=limit, items=items
    )


def get_admin_lecture_details(
    db: Session, lecture_id: int
) -> AdminLectureDetailResponse:
    """Retrieve comprehensive lecture information and attendance counts for admin."""
    query = (
        select(Lecture)
        .options(
            joinedload(Lecture.assignment).joinedload(TeachingAssignment.faculty),
            joinedload(Lecture.assignment).joinedload(TeachingAssignment.subject),
            joinedload(Lecture.assignment)
            .joinedload(TeachingAssignment.class_)
            .joinedload(Class.department),
        )
        .where(Lecture.lecture_id == lecture_id)
    )
    lecture = db.scalars(query).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lecture with ID {lecture_id} not found.",
        )

    assignment = lecture.assignment
    faculty = assignment.faculty
    subject = assignment.subject
    cls = assignment.class_
    dept = cls.department

    total_enrolled = (
        db.scalar(
            select(func.count(Enrollment.enrollment_id)).where(
                Enrollment.class_id == cls.class_id,
                Enrollment.enrollment_status == "ACTIVE",
            )
        )
        or 0
    )

    marked_students = (
        db.scalar(
            select(func.count(AttendanceRecord.attendance_id)).where(
                AttendanceRecord.lecture_id == lecture_id
            )
        )
        or 0
    )

    present_count = (
        db.scalar(
            select(func.count(AttendanceRecord.attendance_id)).where(
                AttendanceRecord.lecture_id == lecture_id,
                AttendanceRecord.status == "PRESENT",
            )
        )
        or 0
    )

    absent_count = (
        db.scalar(
            select(func.count(AttendanceRecord.attendance_id)).where(
                AttendanceRecord.lecture_id == lecture_id,
                AttendanceRecord.status == "ABSENT",
            )
        )
        or 0
    )

    unmarked_students = max(0, total_enrolled - marked_students)

    return AdminLectureDetailResponse(
        lecture_id=lecture.lecture_id,
        assignment_id=lecture.assignment_id,
        faculty_id=faculty.faculty_id,
        faculty_name=faculty.faculty_name,
        subject_id=subject.subject_id,
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        class_id=cls.class_id,
        class_name=cls.class_name,
        academic_year=cls.academic_year,
        division=cls.division,
        semester=cls.semester,
        department_name=dept.department_name,
        lecture_date=lecture.lecture_date,
        start_time=lecture.start_time,
        end_time=lecture.end_time,
        lecture_status=lecture.lecture_status,
        created_at=lecture.created_at,
        submitted_at=lecture.submitted_at,
        total_enrolled_students=total_enrolled,
        marked_students=marked_students,
        unmarked_students=unmarked_students,
        present_count=present_count,
        absent_count=absent_count,
    )


def get_admin_lecture_attendance(
    db: Session, lecture_id: int
) -> AdminLectureAttendanceRosterResponse:
    """Retrieve full student attendance roster for any lecture."""
    query = (
        select(Lecture)
        .options(
            joinedload(Lecture.assignment).joinedload(TeachingAssignment.faculty),
            joinedload(Lecture.assignment).joinedload(TeachingAssignment.subject),
            joinedload(Lecture.assignment).joinedload(TeachingAssignment.class_),
        )
        .where(Lecture.lecture_id == lecture_id)
    )
    lecture = db.scalars(query).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lecture with ID {lecture_id} not found.",
        )

    assignment = lecture.assignment
    faculty = assignment.faculty
    subject = assignment.subject
    cls = assignment.class_

    roster_query = (
        select(
            Student.student_id,
            Student.student_name,
            Student.roll_number,
            AttendanceRecord.attendance_id,
            AttendanceRecord.status,
            AttendanceRecord.marked_by,
            User.username.label("marked_by_name"),
            AttendanceRecord.marked_at,
        )
        .join(Enrollment, Student.student_id == Enrollment.student_id)
        .outerjoin(
            AttendanceRecord,
            and_(
                AttendanceRecord.student_id == Student.student_id,
                AttendanceRecord.lecture_id == lecture_id,
            ),
        )
        .outerjoin(User, AttendanceRecord.marked_by == User.user_id)
        .where(
            Enrollment.class_id == cls.class_id,
            Enrollment.enrollment_status == "ACTIVE",
        )
        .order_by(Student.roll_number.asc(), Student.student_id.asc())
    )

    rows = db.execute(roster_query).all()

    students = []
    present_count = 0
    absent_count = 0
    unmarked_count = 0

    for row in rows:
        att_id = row[3]
        att_status = row[4]

        if att_id is not None:
            if att_status == "PRESENT":
                present_count += 1
            elif att_status == "ABSENT":
                absent_count += 1
        else:
            unmarked_count += 1

        students.append(
            AdminLectureAttendanceItem(
                student_id=row[0],
                student_name=row[1],
                roll_number=row[2],
                attendance_id=att_id,
                attendance_status=att_status,
                marked_by=row[5],
                marked_by_name=row[6],
                marked_at=row[7],
            )
        )

    return AdminLectureAttendanceRosterResponse(
        lecture_id=lecture.lecture_id,
        lecture_status=lecture.lecture_status,
        lecture_date=lecture.lecture_date,
        start_time=lecture.start_time,
        end_time=lecture.end_time,
        faculty_id=faculty.faculty_id,
        faculty_name=faculty.faculty_name,
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        class_name=cls.class_name,
        division=cls.division,
        total_enrolled_students=len(students),
        present_count=present_count,
        absent_count=absent_count,
        unmarked_count=unmarked_count,
        students=students,
    )

