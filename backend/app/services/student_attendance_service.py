"""Student attendance service layer handling subject-wise summary, attendance history, and record details."""

from datetime import date
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.attendance_records import AttendanceRecord
from app.models.classes import Class
from app.models.enrollments import Enrollment
from app.models.lectures import Lecture
from app.models.students import Student
from app.models.subjects import Subject
from app.models.teaching_assignments import TeachingAssignment
from app.schemas.student_attendance import (
    StudentAttendanceHistoryItem,
    StudentAttendanceHistoryResponse,
    StudentAttendanceRecordDetailResponse,
    StudentAttendanceSummaryResponse,
    StudentSubjectAttendanceSummary,
)


def get_student_profile(db: Session, user_id: int) -> Student:
    """Retrieve student profile for the authenticated user, or raise 403."""
    student = db.scalar(select(Student).where(Student.user_id == user_id))
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile not found for the authenticated user.",
        )
    return student


def get_my_attendance_summary(
    db: Session, student_user_id: int
) -> StudentAttendanceSummaryResponse:
    """Calculate subject-wise and overall attendance percentage using only SUBMITTED lectures."""
    student = get_student_profile(db, student_user_id)

    # Find active class IDs for this student
    active_class_ids = db.scalars(
        select(Enrollment.class_id).where(
            Enrollment.student_id == student.student_id,
            Enrollment.enrollment_status == "ACTIVE",
        )
    ).all()

    if not active_class_ids:
        return StudentAttendanceSummaryResponse(
            student_id=student.student_id,
            student_name=student.student_name,
            roll_number=student.roll_number,
            overall_percentage=0.0,
            subjects=[],
        )

    # Find distinct subjects associated with the student's active classes
    subjects = (
        db.scalars(
            select(Subject)
            .join(TeachingAssignment, Subject.subject_id == TeachingAssignment.subject_id)
            .where(TeachingAssignment.class_id.in_(active_class_ids))
            .distinct()
            .order_by(Subject.subject_code.asc())
        )
        .all()
    )

    subject_summaries = []
    total_conducted_all = 0
    total_present_all = 0

    for sub in subjects:
        # Total SUBMITTED lectures for this subject in the student's class
        total_submitted_lectures = (
            db.scalar(
                select(func.count(Lecture.lecture_id))
                .join(
                    TeachingAssignment,
                    Lecture.assignment_id == TeachingAssignment.assignment_id,
                )
                .where(
                    TeachingAssignment.subject_id == sub.subject_id,
                    TeachingAssignment.class_id.in_(active_class_ids),
                    Lecture.lecture_status == "SUBMITTED",
                )
            )
            or 0
        )

        # Present count for this student
        present_count = (
            db.scalar(
                select(func.count(AttendanceRecord.attendance_id))
                .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
                .join(
                    TeachingAssignment,
                    Lecture.assignment_id == TeachingAssignment.assignment_id,
                )
                .where(
                    AttendanceRecord.student_id == student.student_id,
                    AttendanceRecord.status == "PRESENT",
                    TeachingAssignment.subject_id == sub.subject_id,
                    TeachingAssignment.class_id.in_(active_class_ids),
                    Lecture.lecture_status == "SUBMITTED",
                )
            )
            or 0
        )

        # Absent count for this student
        absent_count = (
            db.scalar(
                select(func.count(AttendanceRecord.attendance_id))
                .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
                .join(
                    TeachingAssignment,
                    Lecture.assignment_id == TeachingAssignment.assignment_id,
                )
                .where(
                    AttendanceRecord.student_id == student.student_id,
                    AttendanceRecord.status == "ABSENT",
                    TeachingAssignment.subject_id == sub.subject_id,
                    TeachingAssignment.class_id.in_(active_class_ids),
                    Lecture.lecture_status == "SUBMITTED",
                )
            )
            or 0
        )

        attendance_pct = (
            round((present_count / total_submitted_lectures) * 100.0, 2)
            if total_submitted_lectures > 0
            else 0.0
        )

        total_conducted_all += total_submitted_lectures
        total_present_all += present_count

        subject_summaries.append(
            StudentSubjectAttendanceSummary(
                subject_id=sub.subject_id,
                subject_code=sub.subject_code,
                subject_name=sub.subject_name,
                total_submitted_lectures=total_submitted_lectures,
                present_count=present_count,
                absent_count=absent_count,
                attendance_percentage=attendance_pct,
            )
        )

    overall_percentage = (
        round((total_present_all / total_conducted_all) * 100.0, 2)
        if total_conducted_all > 0
        else 0.0
    )

    return StudentAttendanceSummaryResponse(
        student_id=student.student_id,
        student_name=student.student_name,
        roll_number=student.roll_number,
        overall_percentage=overall_percentage,
        subjects=subject_summaries,
    )


def get_my_attendance_history(
    db: Session,
    student_user_id: int,
    subject_id: Optional[int] = None,
    attendance_status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 20,
) -> StudentAttendanceHistoryResponse:
    """Retrieve paginated attendance history for the authenticated student (SUBMITTED lectures only)."""
    student = get_student_profile(db, student_user_id)

    query = (
        select(
            AttendanceRecord,
            Lecture,
            Subject.subject_id,
            Subject.subject_code,
            Subject.subject_name,
            Class.class_name,
            Class.division,
        )
        .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
        .join(
            TeachingAssignment,
            Lecture.assignment_id == TeachingAssignment.assignment_id,
        )
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .where(
            AttendanceRecord.student_id == student.student_id,
            Lecture.lecture_status == "SUBMITTED",
        )
    )

    count_query = (
        select(func.count(AttendanceRecord.attendance_id))
        .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
        .join(
            TeachingAssignment,
            Lecture.assignment_id == TeachingAssignment.assignment_id,
        )
        .where(
            AttendanceRecord.student_id == student.student_id,
            Lecture.lecture_status == "SUBMITTED",
        )
    )

    conditions = []
    if subject_id is not None:
        conditions.append(TeachingAssignment.subject_id == subject_id)
    if attendance_status and attendance_status.strip():
        conditions.append(
            AttendanceRecord.status == attendance_status.strip().upper()
        )
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
                AttendanceRecord.attendance_id.desc(),
            )
            .offset(skip)
            .limit(limit)
        )
        .all()
    )

    items = [
        StudentAttendanceHistoryItem(
            attendance_id=row[0].attendance_id,
            lecture_id=row[1].lecture_id,
            subject_id=row[2],
            subject_code=row[3],
            subject_name=row[4],
            class_name=row[5],
            division=row[6],
            lecture_date=row[1].lecture_date,
            start_time=row[1].start_time,
            end_time=row[1].end_time,
            attendance_status=row[0].status,
            marked_at=row[0].marked_at,
        )
        for row in results
    ]

    return StudentAttendanceHistoryResponse(
        total=total, skip=skip, limit=limit, items=items
    )


def get_my_attendance_record_detail(
    db: Session, student_user_id: int, attendance_id: int
) -> StudentAttendanceRecordDetailResponse:
    """Retrieve detailed single attendance record for authenticated student."""
    student = get_student_profile(db, student_user_id)

    query = (
        select(
            AttendanceRecord,
            Lecture,
            Subject.subject_id,
            Subject.subject_code,
            Subject.subject_name,
            Class.class_name,
            Class.division,
        )
        .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
        .join(
            TeachingAssignment,
            Lecture.assignment_id == TeachingAssignment.assignment_id,
        )
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .where(
            AttendanceRecord.attendance_id == attendance_id,
            AttendanceRecord.student_id == student.student_id,
            Lecture.lecture_status == "SUBMITTED",
        )
    )

    row = db.execute(query).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record with ID {attendance_id} not found.",
        )

    rec = row[0]
    lec = row[1]
    return StudentAttendanceRecordDetailResponse(
        attendance_id=rec.attendance_id,
        lecture_id=lec.lecture_id,
        student_id=student.student_id,
        student_name=student.student_name,
        roll_number=student.roll_number,
        subject_id=row[2],
        subject_code=row[3],
        subject_name=row[4],
        class_name=row[5],
        division=row[6],
        lecture_date=lec.lecture_date,
        start_time=lec.start_time,
        end_time=lec.end_time,
        lecture_status=lec.lecture_status,
        attendance_status=rec.status,
        marked_at=rec.marked_at,
        submitted_at=lec.submitted_at,
    )

