from typing import TYPE_CHECKING, List
from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.classes import Class
    from app.models.faculty import Faculty
    from app.models.lectures import Lecture
    from app.models.subjects import Subject


class TeachingAssignment(Base):
    """TeachingAssignment model linking faculty, subjects, and classes."""

    __tablename__ = "teaching_assignments"

    assignment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    faculty_id: Mapped[int] = mapped_column(
        ForeignKey("faculty.faculty_id", name="fk_assignments_faculty"), nullable=False
    )
    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subjects.subject_id", name="fk_assignments_subjects"), nullable=False
    )
    class_id: Mapped[int] = mapped_column(
        ForeignKey("classes.class_id", name="fk_assignments_classes"), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("faculty_id", "subject_id", "class_id", name="uq_faculty_subject_class"),
    )

    # Relationships
    faculty: Mapped["Faculty"] = relationship("Faculty", back_populates="teaching_assignments")
    subject: Mapped["Subject"] = relationship("Subject", back_populates="teaching_assignments")
    class_: Mapped["Class"] = relationship("Class", back_populates="teaching_assignments")
    lectures: Mapped[List["Lecture"]] = relationship(
        "Lecture", back_populates="assignment"
    )

