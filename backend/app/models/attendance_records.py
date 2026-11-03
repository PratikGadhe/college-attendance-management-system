from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, TIMESTAMP, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.attendance_audit_logs import AttendanceAuditLog
    from app.models.correction_requests import CorrectionRequest
    from app.models.lectures import Lecture
    from app.models.students import Student
    from app.models.users import User


class AttendanceRecord(Base):
    """AttendanceRecord model storing student attendance status for each lecture."""

    __tablename__ = "attendance_records"

    attendance_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lecture_id: Mapped[int] = mapped_column(
        ForeignKey("lectures.lecture_id", name="fk_attendance_lectures"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.student_id", name="fk_attendance_students"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(10), nullable=False)
    marked_by: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", name="fk_attendance_marked_by"), nullable=False
    )
    marked_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp(), nullable=True
    )

    __table_args__ = (
        UniqueConstraint("lecture_id", "student_id", name="uq_lecture_student"),
        CheckConstraint("status IN ('PRESENT', 'ABSENT')", name="chk_attendance_status"),
    )

    # Relationships
    lecture: Mapped["Lecture"] = relationship("Lecture", back_populates="attendance_records")
    student: Mapped["Student"] = relationship("Student", back_populates="attendance_records")
    marked_by_user: Mapped["User"] = relationship(
        "User", back_populates="marked_attendance_records", foreign_keys=[marked_by]
    )
    correction_requests: Mapped[List["CorrectionRequest"]] = relationship(
        "CorrectionRequest", back_populates="attendance_record"
    )
    audit_logs: Mapped[List["AttendanceAuditLog"]] = relationship(
        "AttendanceAuditLog", back_populates="attendance_record"
    )

