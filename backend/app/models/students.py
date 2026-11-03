from typing import TYPE_CHECKING, List
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.attendance_records import AttendanceRecord
    from app.models.correction_requests import CorrectionRequest
    from app.models.enrollments import Enrollment
    from app.models.users import User


class Student(Base):
    """Student model representing student profile information."""

    __tablename__ = "students"

    student_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", name="fk_students_users"), nullable=False, unique=True
    )
    roll_number: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    student_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="student")
    enrollments: Mapped[List["Enrollment"]] = relationship(
        "Enrollment", back_populates="student"
    )
    attendance_records: Mapped[List["AttendanceRecord"]] = relationship(
        "AttendanceRecord", back_populates="student"
    )
    correction_requests: Mapped[List["CorrectionRequest"]] = relationship(
        "CorrectionRequest", back_populates="student"
    )

