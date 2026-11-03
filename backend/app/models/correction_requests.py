from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.attendance_records import AttendanceRecord
    from app.models.students import Student
    from app.models.users import User


class CorrectionRequest(Base):
    """CorrectionRequest model representing attendance change requests submitted by students."""

    __tablename__ = "correction_requests"

    request_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    attendance_id: Mapped[int] = mapped_column(
        ForeignKey("attendance_records.attendance_id", name="fk_correction_attendance"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.student_id", name="fk_correction_students"), nullable=False
    )
    requested_status: Mapped[str] = mapped_column(String(10), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    request_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING", server_default="PENDING"
    )
    reviewed_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.user_id", name="fk_correction_reviewer"), nullable=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=True)
    review_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp(), nullable=True
    )

    __table_args__ = (
        CheckConstraint("requested_status IN ('PRESENT', 'ABSENT')", name="chk_requested_status"),
        CheckConstraint(
            "request_status IN ('PENDING', 'APPROVED', 'REJECTED')",
            name="chk_request_status",
        ),
    )

    # Relationships
    attendance_record: Mapped["AttendanceRecord"] = relationship(
        "AttendanceRecord", back_populates="correction_requests"
    )
    student: Mapped["Student"] = relationship(
        "Student", back_populates="correction_requests"
    )
    reviewer: Mapped[Optional["User"]] = relationship(
        "User", back_populates="reviewed_correction_requests", foreign_keys=[reviewed_by]
    )

