from datetime import date
from typing import TYPE_CHECKING
from sqlalchemy import CheckConstraint, Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.classes import Class
    from app.models.students import Student


class Enrollment(Base):
    """Enrollment model representing student enrollment in classes."""

    __tablename__ = "enrollments"

    enrollment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.student_id", name="fk_enrollments_students"), nullable=False
    )
    class_id: Mapped[int] = mapped_column(
        ForeignKey("classes.class_id", name="fk_enrollments_classes"), nullable=False
    )
    enrollment_date: Mapped[date] = mapped_column(Date, nullable=False)
    enrollment_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ACTIVE", server_default="ACTIVE"
    )

    __table_args__ = (
        UniqueConstraint("student_id", "class_id", name="uq_student_class"),
        CheckConstraint("enrollment_status IN ('ACTIVE', 'INACTIVE')", name="chk_enrollment_status"),
    )

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="enrollments")
    class_: Mapped["Class"] = relationship("Class", back_populates="enrollments")

