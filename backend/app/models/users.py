from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.attendance_audit_logs import AttendanceAuditLog
    from app.models.attendance_records import AttendanceRecord
    from app.models.correction_requests import CorrectionRequest
    from app.models.faculty import Faculty
    from app.models.roles import Role
    from app.models.students import Student


class User(Base):
    """User model representing authentication and profile accounts."""

    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.role_id", name="fk_users_roles"), nullable=False
    )
    username: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    account_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ACTIVE", server_default="ACTIVE"
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp(), nullable=True
    )

    __table_args__ = (
        CheckConstraint("account_status IN ('ACTIVE', 'INACTIVE')", name="chk_user_status"),
    )

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="users")
    student: Mapped[Optional["Student"]] = relationship(
        "Student", back_populates="user", uselist=False
    )
    faculty: Mapped[Optional["Faculty"]] = relationship(
        "Faculty", back_populates="user", uselist=False
    )
    marked_attendance_records: Mapped[List["AttendanceRecord"]] = relationship(
        "AttendanceRecord", back_populates="marked_by_user", foreign_keys="[AttendanceRecord.marked_by]"
    )
    reviewed_correction_requests: Mapped[List["CorrectionRequest"]] = relationship(
        "CorrectionRequest", back_populates="reviewer", foreign_keys="[CorrectionRequest.reviewed_by]"
    )
    audit_logs: Mapped[List["AttendanceAuditLog"]] = relationship(
        "AttendanceAuditLog", back_populates="changed_by_user", foreign_keys="[AttendanceAuditLog.changed_by]"
    )

