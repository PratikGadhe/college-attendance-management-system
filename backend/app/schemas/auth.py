from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Request payload for demo prototype login."""

    username: str = Field(
        ...,
        description="Username of the demo account (e.g. admin, faculty1, student01)",
        min_length=1,
    )


class LoginResponse(BaseModel):
    """Response payload containing verified user profile and database role."""

    user_id: int = Field(..., description="Unique database ID of the user")
    username: str = Field(..., description="Username of the user")
    role: str = Field(..., description="Verified role name from database (ADMIN, FACULTY, STUDENT)")
    status: str = Field(..., description="Account status from database (ACTIVE, INACTIVE)")

