"""Faculty lecture management service layer handling lecture lifecycle and query operations."""

from datetime import date, time
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.classes import Class
from app.models.departments import Department
from app.models.enrollments import Enrollment
from app.models.faculty import Faculty
from app.models.lectures import Lecture
from app.models.subjects import Subject
from app.models.teaching_assignments import TeachingAssignment
from app.models.attendance_records import AttendanceRecord
from app.schemas.faculty_lectures import (
    FacultyLectureListItem,
    FacultyLectureListResponse,
    FacultyTeachingAssignmentListResponse,
    FacultyTeachingAssignmentResponse,
    LectureCreateRequest,
    LectureDetailResponse,
    LectureUpdateRequest,
)


def get_faculty_profile(db: Session, user_id: int) -> Faculty:
    """Retrieve faculty profile for the authenticated user, or raise 403."""
    faculty = db.scalar(select(Faculty).where(Faculty.user_id == user_id))
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty profile not found for the authenticated user.",
        )
    return faculty


def list_my_teaching_assignments(
    db: Session, faculty_user_id: int
) -> FacultyTeachingAssignmentListResponse:
    """Retrieve teaching assignments belonging to the authenticated faculty member."""
    faculty = get_faculty_profile(db, faculty_user_id)

    query = (
        select(
            TeachingAssignment,
            Subject.subject_code,
            Subject.subject_name,
            Class.class_name,
            Class.academic_year,
            Class.division,
            Class.semester,
            Department.department_name,
        )
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .join(Department, Class.department_id == Department.department_id)
        .where(TeachingAssignment.faculty_id == faculty.faculty_id)
        .order_by(TeachingAssignment.assignment_id.asc())
    )

    results = db.execute(query).all()
    items = [
        FacultyTeachingAssignmentResponse(
            assignment_id=row[0].assignment_id,
            subject_id=row[0].subject_id,
            subject_code=row[1],
            subject_name=row[2],
            class_id=row[0].class_id,
            class_name=row[3],
            academic_year=row[4],
            division=row[5],
            semester=row[6],
            department_name=row[7],
        )
        for row in results
    ]

    return FacultyTeachingAssignmentListResponse(total=len(items), items=items)


def create_lecture(
    db: Session, faculty_user_id: int, request: LectureCreateRequest
) -> LectureDetailResponse:
    """Create a new lecture in DRAFT status for an owned teaching assignment."""
    faculty = get_faculty_profile(db, faculty_user_id)

    assignment = db.scalar(
        select(TeachingAssignment).where(
            TeachingAssignment.assignment_id == request.assignment_id
        )
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teaching assignment with ID {request.assignment_id} not found.",
        )

    if assignment.faculty_id != faculty.faculty_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: This teaching assignment does not belong to you.",
        )

    if not (request.end_time > request.start_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be later than start time.",
        )

    try:
        new_lecture = Lecture(
            assignment_id=request.assignment_id,
            lecture_date=request.lecture_date,
            start_time=request.start_time,
            end_time=request.end_time,
            lecture_status="DRAFT",
        )
        db.add(new_lecture)
        db.commit()
        db.refresh(new_lecture)
    except Exception:
        db.rollback()
        raise

    return get_lecture_details(db, faculty_user_id, new_lecture.lecture_id)


def list_my_lectures(
    db: Session,
    faculty_user_id: int,
    assignment_id: Optional[int] = None,
    lecture_date: Optional[date] = None,
    status_filter: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 20,
) -> FacultyLectureListResponse:
    """Retrieve paginated lectures belonging exclusively to the authenticated faculty member."""
    faculty = get_faculty_profile(db, faculty_user_id)

    query = (
        select(
            Lecture,
            Subject.subject_name,
            Subject.subject_code,
            Class.class_name,
            Class.division,
        )
        .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .where(TeachingAssignment.faculty_id == faculty.faculty_id)
    )

    count_query = (
        select(func.count(Lecture.lecture_id))
        .join(TeachingAssignment, Lecture.assignment_id == TeachingAssignment.assignment_id)
        .where(TeachingAssignment.faculty_id == faculty.faculty_id)
    )

    conditions = []
    if assignment_id is not None:
        conditions.append(Lecture.assignment_id == assignment_id)
    if lecture_date is not None:
        conditions.append(Lecture.lecture_date == lecture_date)
    if status_filter and status_filter.strip():
        conditions.append(Lecture.lecture_status == status_filter.strip().upper())
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
        FacultyLectureListItem(
            lecture_id=row[0].lecture_id,
            assignment_id=row[0].assignment_id,
            subject_name=row[1],
            subject_code=row[2],
            class_name=row[3],
            division=row[4],
            lecture_date=row[0].lecture_date,
            start_time=row[0].start_time,
            end_time=row[0].end_time,
            lecture_status=row[0].lecture_status,
            created_at=row[0].created_at,
            submitted_at=row[0].submitted_at,
        )
        for row in results
    ]

    return FacultyLectureListResponse(
        total=total, skip=skip, limit=limit, items=items
    )


def get_lecture_details(
    db: Session, faculty_user_id: int, lecture_id: int
) -> LectureDetailResponse:
    """Retrieve detailed lecture information with subject, class, and attendance counts."""
    faculty = get_faculty_profile(db, faculty_user_id)

    query = (
        select(Lecture)
        .options(
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

    if lecture.assignment.faculty_id != faculty.faculty_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this lecture.",
        )

    assignment = lecture.assignment
    subject = assignment.subject
    cls = assignment.class_
    dept = cls.department

    # Attendance metrics
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

    return LectureDetailResponse(
        lecture_id=lecture.lecture_id,
        assignment_id=lecture.assignment_id,
        lecture_date=lecture.lecture_date,
        start_time=lecture.start_time,
        end_time=lecture.end_time,
        lecture_status=lecture.lecture_status,
        created_at=lecture.created_at,
        submitted_at=lecture.submitted_at,
        subject_id=subject.subject_id,
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        class_id=cls.class_id,
        class_name=cls.class_name,
        academic_year=cls.academic_year,
        division=cls.division,
        semester=cls.semester,
        department_name=dept.department_name,
        total_enrolled_students=total_enrolled,
        marked_students=marked_students,
        unmarked_students=unmarked_students,
        present_count=present_count,
        absent_count=absent_count,
    )


def update_lecture(
    db: Session, faculty_user_id: int, lecture_id: int, request: LectureUpdateRequest
) -> LectureDetailResponse:
    """Update date or times of a DRAFT lecture."""
    faculty = get_faculty_profile(db, faculty_user_id)

    lecture = db.scalars(
        select(Lecture)
        .options(joinedload(Lecture.assignment))
        .where(Lecture.lecture_id == lecture_id)
    ).first()

    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lecture with ID {lecture_id} not found.",
        )

    if lecture.assignment.faculty_id != faculty.faculty_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this lecture.",
        )

    if lecture.lecture_status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update lecture: current status is {lecture.lecture_status}. Only DRAFT lectures can be modified.",
        )

    target_start = request.start_time if request.start_time is not None else lecture.start_time
    target_end = request.end_time if request.end_time is not None else lecture.end_time

    if not (target_end > target_start):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be later than start time.",
        )

    try:
        if request.lecture_date is not None:
            lecture.lecture_date = request.lecture_date
        lecture.start_time = target_start
        lecture.end_time = target_end
        db.commit()
        db.refresh(lecture)
    except Exception:
        db.rollback()
        raise

    return get_lecture_details(db, faculty_user_id, lecture_id)


def cancel_lecture(
    db: Session, faculty_user_id: int, lecture_id: int
) -> LectureDetailResponse:
    """Cancel a DRAFT lecture."""
    faculty = get_faculty_profile(db, faculty_user_id)

    lecture = db.scalars(
        select(Lecture)
        .options(joinedload(Lecture.assignment))
        .where(Lecture.lecture_id == lecture_id)
    ).first()

    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lecture with ID {lecture_id} not found.",
        )

    if lecture.assignment.faculty_id != faculty.faculty_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this lecture.",
        )

    if lecture.lecture_status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel lecture: current status is {lecture.lecture_status}. Only DRAFT lectures can be cancelled.",
        )

    try:
        lecture.lecture_status = "CANCELLED"
        db.commit()
        db.refresh(lecture)
    except Exception:
        db.rollback()
        raise

    return get_lecture_details(db, faculty_user_id, lecture_id)

