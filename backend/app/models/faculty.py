from typing import TYPE_CHECKING, List
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.departments import Department
    from app.models.teaching_assignments import TeachingAssignment
    from app.models.users import User


class Faculty(Base):
    """Faculty model representing faculty profile information."""

    __tablename__ = "faculty"

    faculty_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", name="fk_faculty_users"), nullable=False, unique=True
    )
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.department_id", name="fk_faculty_departments"), nullable=False
    )
    faculty_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="faculty")
    department: Mapped["Department"] = relationship("Department", back_populates="faculty")
    teaching_assignments: Mapped[List["TeachingAssignment"]] = relationship(
        "TeachingAssignment", back_populates="faculty"
    )

