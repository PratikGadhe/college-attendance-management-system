from typing import TYPE_CHECKING, List
from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.departments import Department
    from app.models.enrollments import Enrollment
    from app.models.teaching_assignments import TeachingAssignment


class Class(Base):
    """Class model representing academic classes."""

    __tablename__ = "classes"

    class_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.department_id", name="fk_classes_departments"), nullable=False
    )
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    division: Mapped[str] = mapped_column(String(10), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("semester BETWEEN 1 AND 8", name="chk_class_semester"),
        UniqueConstraint(
            "department_id",
            "academic_year",
            "class_name",
            "division",
            "semester",
            name="uq_class_details",
        ),
    )

    # Relationships
    department: Mapped["Department"] = relationship("Department", back_populates="classes")
    enrollments: Mapped[List["Enrollment"]] = relationship(
        "Enrollment", back_populates="class_"
    )
    teaching_assignments: Mapped[List["TeachingAssignment"]] = relationship(
        "TeachingAssignment", back_populates="class_"
    )

