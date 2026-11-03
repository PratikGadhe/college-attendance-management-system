"""Attendance correction request service layer handling student disputes, faculty reviews, and audit logs."""

from datetime import date
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.attendance_audit_logs import AttendanceAuditLog
from app.models.attendance_records import AttendanceRecord
from app.models.classes import Class
from app.models.correction_requests import CorrectionRequest
from app.models.faculty import Faculty
from app.models.lectures import Lecture
from app.models.students import Student
from app.models.subjects import Subject
from app.models.teaching_assignments import TeachingAssignment
from app.models.users import User
from app.schemas.correction_requests import (
    CorrectionRequestCreateRequest,
    CorrectionRequestDetailResponse,
    CorrectionRequestListResponse,
    CorrectionRequestReviewRequest,
)
from app.services.faculty_lecture_service import get_faculty_profile
from app.services.student_attendance_service import get_student_profile


def _build_correction_request_query():
    """Construct base select query for correction requests with full relational context."""
    return (
        select(
            CorrectionRequest,
            Student.student_name,
            Student.roll_number,
            Subject.subject_id,
            Subject.subject_code,
            Subject.subject_name,
            Class.class_name,
            Class.division,
            Lecture.lecture_date,
            AttendanceRecord.status.label("current_status"),
            Faculty.faculty_name.label("reviewer_name"),
        )
        .join(Student, CorrectionRequest.student_id == Student.student_id)
        .join(
            AttendanceRecord,
            CorrectionRequest.attendance_id == AttendanceRecord.attendance_id,
        )
        .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
        .join(
            TeachingAssignment,
            Lecture.assignment_id == TeachingAssignment.assignment_id,
        )
        .join(Subject, TeachingAssignment.subject_id == Subject.subject_id)
        .join(Class, TeachingAssignment.class_id == Class.class_id)
        .outerjoin(User, CorrectionRequest.reviewed_by == User.user_id)
        .outerjoin(Faculty, User.user_id == Faculty.user_id)
    )


def _row_to_detail_response(row) -> CorrectionRequestDetailResponse:
    """Map database query tuple to CorrectionRequestDetailResponse."""
    cr: CorrectionRequest = row[0]
    return CorrectionRequestDetailResponse(
        request_id=cr.request_id,
        attendance_id=cr.attendance_id,
        student_id=cr.student_id,
        student_name=row[1],
        roll_number=row[2],
        subject_id=row[3],
        subject_code=row[4],
        subject_name=row[5],
        class_name=row[6],
        division=row[7],
        lecture_date=row[8],
        current_status=row[9],
        requested_status=cr.requested_status,
        reason=cr.reason,
        request_status=cr.request_status,
        reviewed_by=cr.reviewed_by,
        reviewer_name=row[10],
        reviewed_at=cr.reviewed_at,
        review_remarks=cr.review_remarks,
        created_at=cr.created_at,
    )


def create_student_correction_request(
    db: Session, student_user_id: int, request: CorrectionRequestCreateRequest
) -> CorrectionRequestDetailResponse:
    """Submit a correction request for student's own attendance record on a SUBMITTED lecture."""
    student = get_student_profile(db, student_user_id)

    att = db.scalars(
        select(AttendanceRecord)
        .options(joinedload(AttendanceRecord.lecture))
        .where(AttendanceRecord.attendance_id == request.attendance_id)
    ).first()

    if not att or att.student_id != student.student_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record with ID {request.attendance_id} not found.",
        )

    if att.lecture.lecture_status != "SUBMITTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correction requests can only be submitted for SUBMITTED lectures.",
        )

    clean_reason = request.reason.strip()
    if len(clean_reason) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reason must be at least 5 characters long.",
        )

    if att.status == request.requested_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested status is already the current attendance status ({att.status}).",
        )

    # Check for existing PENDING request on this attendance record
    existing_pending = db.scalar(
        select(CorrectionRequest.request_id).where(
            CorrectionRequest.attendance_id == request.attendance_id,
            CorrectionRequest.request_status == "PENDING",
        )
    )
    if existing_pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending correction request already exists for this attendance record.",
        )

    try:
        new_cr = CorrectionRequest(
            attendance_id=request.attendance_id,
            student_id=student.student_id,
            requested_status=request.requested_status,
            reason=clean_reason,
            request_status="PENDING",
        )
        db.add(new_cr)
        db.commit()
        db.refresh(new_cr)
    except Exception:
        db.rollback()
        raise

    return get_student_correction_request_by_id(db, student_user_id, new_cr.request_id)


def list_student_correction_requests(
    db: Session,
    student_user_id: int,
    request_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> CorrectionRequestListResponse:
    """Retrieve paginated list of correction requests submitted by the authenticated student."""
    student = get_student_profile(db, student_user_id)

    query = _build_correction_request_query().where(
        CorrectionRequest.student_id == student.student_id
    )
    count_query = select(func.count(CorrectionRequest.request_id)).where(
        CorrectionRequest.student_id == student.student_id
    )

    if request_status and request_status.strip():
        clean_status = request_status.strip().upper()
        query = query.where(CorrectionRequest.request_status == clean_status)
        count_query = count_query.where(CorrectionRequest.request_status == clean_status)

    total = db.scalar(count_query) or 0
    results = (
        db.execute(
            query.order_by(
                CorrectionRequest.created_at.desc(),
                CorrectionRequest.request_id.desc(),
            )
            .offset(skip)
            .limit(limit)
        )
        .all()
    )

    items = [_row_to_detail_response(r) for r in results]
    return CorrectionRequestListResponse(total=total, skip=skip, limit=limit, items=items)


def get_student_correction_request_by_id(
    db: Session, student_user_id: int, request_id: int
) -> CorrectionRequestDetailResponse:
    """Retrieve detailed single correction request for authenticated student."""
    student = get_student_profile(db, student_user_id)

    query = _build_correction_request_query().where(
        CorrectionRequest.request_id == request_id,
        CorrectionRequest.student_id == student.student_id,
    )
    row = db.execute(query).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Correction request with ID {request_id} not found.",
        )

    return _row_to_detail_response(row)


def list_faculty_correction_requests(
    db: Session,
    faculty_user_id: int,
    request_status: Optional[str] = None,
    subject_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 20,
) -> CorrectionRequestListResponse:
    """Retrieve paginated correction requests for lectures assigned to the authenticated faculty member."""
    faculty = get_faculty_profile(db, faculty_user_id)

    query = _build_correction_request_query().where(
        TeachingAssignment.faculty_id == faculty.faculty_id
    )
    count_query = (
        select(func.count(CorrectionRequest.request_id))
        .join(
            AttendanceRecord,
            CorrectionRequest.attendance_id == AttendanceRecord.attendance_id,
        )
        .join(Lecture, AttendanceRecord.lecture_id == Lecture.lecture_id)
        .join(
            TeachingAssignment,
            Lecture.assignment_id == TeachingAssignment.assignment_id,
        )
        .where(TeachingAssignment.faculty_id == faculty.faculty_id)
    )

    conditions = []
    if request_status and request_status.strip():
        conditions.append(
            CorrectionRequest.request_status == request_status.strip().upper()
        )
    if subject_id is not None:
        conditions.append(TeachingAssignment.subject_id == subject_id)
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
                CorrectionRequest.created_at.desc(),
                CorrectionRequest.request_id.desc(),
            )
            .offset(skip)
            .limit(limit)
        )
        .all()
    )

    items = [_row_to_detail_response(r) for r in results]
    return CorrectionRequestListResponse(total=total, skip=skip, limit=limit, items=items)


def get_faculty_correction_request_by_id(
    db: Session, faculty_user_id: int, request_id: int
) -> CorrectionRequestDetailResponse:
    """Retrieve detailed single correction request verifying faculty assignment ownership."""
    faculty = get_faculty_profile(db, faculty_user_id)

    query = _build_correction_request_query().where(
        CorrectionRequest.request_id == request_id
    )
    row = db.execute(query).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Correction request with ID {request_id} not found.",
        )

    # Check assignment faculty ownership
    cr: CorrectionRequest = row[0]
    assignment = cr.attendance_record.lecture.assignment
    if assignment.faculty_id != faculty.faculty_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to the lecture for this correction request.",
        )

    return _row_to_detail_response(row)


def review_correction_request(
    db: Session,
    faculty_user_id: int,
    request_id: int,
    review_data: CorrectionRequestReviewRequest,
) -> CorrectionRequestDetailResponse:
    """Review (Approve or Reject) an attendance correction request in a single atomic database transaction."""
    faculty = get_faculty_profile(db, faculty_user_id)

    # Fetch correction request with row lock
    cr = db.scalars(
        select(CorrectionRequest)
        .options(
            joinedload(CorrectionRequest.attendance_record)
            .joinedload(AttendanceRecord.lecture)
            .joinedload(Lecture.assignment)
        )
        .where(CorrectionRequest.request_id == request_id)
        .with_for_update()
    ).first()

    if not cr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Correction request with ID {request_id} not found.",
        )

    assignment = cr.attendance_record.lecture.assignment
    if assignment.faculty_id != faculty.faculty_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to the lecture for this correction request.",
        )

    if cr.request_status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review request: request has already been reviewed (current status: '{cr.request_status}'). Only PENDING requests can be reviewed.",
        )

    if cr.student_id != cr.attendance_record.student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID in correction request does not match attendance record student ID.",
        )

    if cr.attendance_record.lecture.lecture_status != "SUBMITTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Related lecture must be SUBMITTED to process correction.",
        )

    clean_remarks = review_data.review_remarks.strip() if review_data.review_remarks else None

    # ATOMIC TRANSACTION
    try:
        now = func.now()
        if review_data.decision == "APPROVED":
            old_status = cr.attendance_record.status
            new_status = cr.requested_status

            # 1. Update attendance record
            cr.attendance_record.status = new_status
            cr.attendance_record.marked_by = faculty_user_id
            cr.attendance_record.marked_at = now

            # 2. Update correction request
            cr.request_status = "APPROVED"
            cr.reviewed_by = faculty_user_id
            cr.reviewed_at = now
            cr.review_remarks = clean_remarks

            # 3. Insert audit log
            audit_log = AttendanceAuditLog(
                attendance_id=cr.attendance_id,
                old_status=old_status,
                new_status=new_status,
                changed_by=faculty_user_id,
                change_reason=cr.reason,
            )
            db.add(audit_log)

        elif review_data.decision == "REJECTED":
            # Update only request status, remarks, and reviewer metadata
            cr.request_status = "REJECTED"
            cr.reviewed_by = faculty_user_id
            cr.reviewed_at = now
            cr.review_remarks = clean_remarks
            # Attendance record is untouched; no audit log created

        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_faculty_correction_request_by_id(db, faculty_user_id, request_id)
