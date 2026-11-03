from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.attendance_records import AttendanceRecord
    from app.models.users import User


class AttendanceAuditLog(Base):
    """AttendanceAuditLog model recording changes to attendance records."""

    __tablename__ = "attendance_audit_logs"

    log_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    attendance_id: Mapped[int] = mapped_column(
        ForeignKey("attendance_records.attendance_id", name="fk_audit_attendance"), nullable=False
    )
    old_status: Mapped[str] = mapped_column(String(10), nullable=False)
    new_status: Mapped[str] = mapped_column(String(10), nullable=False)
    changed_by: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", name="fk_audit_user"), nullable=False
    )
    change_reason: Mapped[str] = mapped_column(Text, nullable=False)
    changed_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp(), nullable=True
    )

    __table_args__ = (
        CheckConstraint("old_status IN ('PRESENT', 'ABSENT')", name="chk_audit_old_status"),
        CheckConstraint("new_status IN ('PRESENT', 'ABSENT')", name="chk_audit_new_status"),
    )

    # Relationships
    attendance_record: Mapped["AttendanceRecord"] = relationship(
        "AttendanceRecord", back_populates="audit_logs"
    )
    changed_by_user: Mapped["User"] = relationship(
        "User", back_populates="audit_logs", foreign_keys=[changed_by]
    )

