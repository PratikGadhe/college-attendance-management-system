from typing import TYPE_CHECKING, List
from sqlalchemy import CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.teaching_assignments import TeachingAssignment


class Subject(Base):
    """Subject model representing academic course subjects."""

    __tablename__ = "subjects"

    subject_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    subject_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    subject_name: Mapped[str] = mapped_column(String(100), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("semester BETWEEN 1 AND 8", name="chk_subject_semester"),
    )

    # Relationships
    teaching_assignments: Mapped[List["TeachingAssignment"]] = relationship(
        "TeachingAssignment", back_populates="subject"
    )

