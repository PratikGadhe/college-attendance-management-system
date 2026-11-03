from typing import TYPE_CHECKING, List
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.users import User


class Role(Base):
    """Role model representing application roles."""

    __tablename__ = "roles"

    role_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_name: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="role")

