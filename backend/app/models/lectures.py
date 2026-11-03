from datetime import date, datetime, time
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import CheckConstraint, Date, ForeignKey, Integer, String, Time, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.attendance_records import AttendanceRecord
    from app.models.teaching_assignments import TeachingAssignment


class Lecture(Base):
    """Lecture model representing individual scheduled and conducted lectures."""

    __tablename__ = "lectures"

    lecture_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("teaching_assignments.assignment_id", name="fk_lectures_assignments"), nullable=False
    )
    lecture_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    lecture_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="DRAFT", server_default="DRAFT"
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp(), nullable=True
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "lecture_status IN ('DRAFT', 'SUBMITTED', 'CANCELLED')",
            name="chk_lecture_status",
        ),
        CheckConstraint("end_time > start_time", name="chk_lecture_time"),
    )

    # Relationships
    assignment: Mapped["TeachingAssignment"] = relationship(
        "TeachingAssignment", back_populates="lectures"
    )
    attendance_records: Mapped[List["AttendanceRecord"]] = relationship(
        "AttendanceRecord", back_populates="lecture"
    )

