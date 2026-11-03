"""Faculty attendance service layer handling roster retrieval, bulk marking, and atomic submission."""

from typing import Set
from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.attendance_records import AttendanceRecord
from app.models.classes import Class
from app.models.enrollments import Enrollment
from app.models.faculty import Faculty
from app.models.lectures import Lecture
from app.models.students import Student
from app.models.teaching_assignments import TeachingAssignment
from app.schemas.faculty_attendance import (
    AttendanceMarkRequest,
    LectureAttendanceRosterResponse,
    LectureSubmissionResponse,
    RosterStudentItem,
)
from app.services.faculty_lecture_service import get_faculty_profile


def get_lecture_roster(
    db: Session, faculty_user_id: int, lecture_id: int
) -> LectureAttendanceRosterResponse:
    """Retrieve enrolled student roster with attendance status for an assigned lecture."""
    faculty = get_faculty_profile(db, faculty_user_id)

    lecture = db.scalars(
        select(Lecture)
        .options(
            joinedload(Lecture.assignment).joinedload(TeachingAssignment.class_)
        )
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

    class_id = lecture.assignment.class_id
    class_name = lecture.assignment.class_.class_name

    # Retrieve all active enrolled students and outer join their attendance record for this lecture
    query = (
        select(
            Student.student_id,
            Student.student_name,
            Student.roll_number,
            AttendanceRecord.attendance_id,
            AttendanceRecord.status,
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
        .where(
            Enrollment.class_id == class_id,
            Enrollment.enrollment_status == "ACTIVE",
        )
        .order_by(Student.roll_number.asc(), Student.student_id.asc())
    )

    rows = db.execute(query).all()

    students = []
    marked_count = 0
    present_count = 0
    absent_count = 0

    for row in rows:
        att_id = row[3]
        att_status = row[4]
        marked_at = row[5]

        if att_id is not None:
            marked_count += 1
            if att_status == "PRESENT":
                present_count += 1
            elif att_status == "ABSENT":
                absent_count += 1

        students.append(
            RosterStudentItem(
                student_id=row[0],
                student_name=row[1],
                roll_number=row[2],
                attendance_id=att_id,
                attendance_status=att_status,
                marked_at=marked_at,
            )
        )

    total_enrolled = len(students)
    unmarked_count = max(0, total_enrolled - marked_count)

    return LectureAttendanceRosterResponse(
        lecture_id=lecture.lecture_id,
        lecture_status=lecture.lecture_status,
        class_id=class_id,
        class_name=class_name,
        total_enrolled_students=total_enrolled,
        marked_students=marked_count,
        unmarked_students=unmarked_count,
        present_count=present_count,
        absent_count=absent_count,
        students=students,
    )


def mark_attendance(
    db: Session,
    faculty_user_id: int,
    lecture_id: int,
    request: AttendanceMarkRequest,
) -> LectureAttendanceRosterResponse:
    """Bulk mark or update attendance records for active students in a DRAFT lecture."""
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
            detail=f"Cannot mark attendance: lecture status is {lecture.lecture_status}. Attendance can only be marked for DRAFT lectures.",
        )

    # 1. Reject duplicate student IDs in request
    seen_student_ids: Set[int] = set()
    for item in request.records:
        if item.student_id in seen_student_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate student ID {item.student_id} in attendance request.",
            )
        seen_student_ids.add(item.student_id)

    # 2. Verify all students belong to the class via ACTIVE enrollment
    active_enrolled_ids = set(
        db.scalars(
            select(Enrollment.student_id).where(
                Enrollment.class_id == lecture.assignment.class_id,
                Enrollment.enrollment_status == "ACTIVE",
            )
        ).all()
    )

    for item in request.records:
        if item.student_id not in active_enrolled_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student with ID {item.student_id} is not actively enrolled in this class.",
            )
        if item.status not in ("PRESENT", "ABSENT"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid attendance status '{item.status}'. Must be 'PRESENT' or 'ABSENT'.",
            )

    # 3. Perform bulk upsert in a single transaction
    try:
        for item in request.records:
            existing_record = db.scalar(
                select(AttendanceRecord).where(
                    AttendanceRecord.lecture_id == lecture_id,
                    AttendanceRecord.student_id == item.student_id,
                )
            )
            if existing_record:
                existing_record.status = item.status
                existing_record.marked_by = faculty_user_id
                existing_record.marked_at = func.now()
            else:
                new_record = AttendanceRecord(
                    lecture_id=lecture_id,
                    student_id=item.student_id,
                    status=item.status,
                    marked_by=faculty_user_id,
                )
                db.add(new_record)

        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_lecture_roster(db, faculty_user_id, lecture_id)


def submit_attendance(
    db: Session, faculty_user_id: int, lecture_id: int
) -> LectureSubmissionResponse:
    """Submit final attendance for a lecture, transitioning status from DRAFT to SUBMITTED."""
    faculty = get_faculty_profile(db, faculty_user_id)

    # Fetch and lock lecture
    lecture = db.scalars(
        select(Lecture)
        .options(joinedload(Lecture.assignment))
        .where(Lecture.lecture_id == lecture_id)
        .with_for_update()
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
            detail=f"Cannot submit attendance: lecture status is {lecture.lecture_status}. Only DRAFT lectures can be submitted.",
        )

    # Retrieve all actively enrolled students
    active_enrolled_ids = set(
        db.scalars(
            select(Enrollment.student_id).where(
                Enrollment.class_id == lecture.assignment.class_id,
                Enrollment.enrollment_status == "ACTIVE",
            )
        ).all()
    )

    # Retrieve all attendance records for this lecture
    records = db.scalars(
        select(AttendanceRecord).where(AttendanceRecord.lecture_id == lecture_id)
    ).all()
    recorded_student_ids = {r.student_id for r in records}

    # Verify complete roster marking
    unmarked_ids = active_enrolled_ids - recorded_student_ids
    if unmarked_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit attendance: {len(unmarked_ids)} active students remain unmarked.",
        )

    unexpected_ids = recorded_student_ids - active_enrolled_ids
    if unexpected_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit attendance: attendance records exist for {len(unexpected_ids)} students not actively enrolled in this class.",
        )

    try:
        now = func.now()
        lecture.lecture_status = "SUBMITTED"
        lecture.submitted_at = now
        db.commit()
        db.refresh(lecture)
    except Exception:
        db.rollback()
        raise

    present_count = sum(1 for r in records if r.status == "PRESENT")
    absent_count = sum(1 for r in records if r.status == "ABSENT")

    return LectureSubmissionResponse(
        lecture_id=lecture.lecture_id,
        lecture_status=lecture.lecture_status,
        submitted_at=lecture.submitted_at,
        total_students_marked=len(records),
        present_count=present_count,
        absent_count=absent_count,
        message="Attendance submitted successfully.",
    )

