from typing import TYPE_CHECKING, List
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.classes import Class
    from app.models.faculty import Faculty


class Department(Base):
    """Department model representing academic departments."""

    __tablename__ = "departments"

    department_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    department_name: Mapped[str] = mapped_column(String(100), nullable=False)
    department_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)

    # Relationships
    faculty: Mapped[List["Faculty"]] = relationship("Faculty", back_populates="department")
    classes: Mapped[List["Class"]] = relationship("Class", back_populates="department")

