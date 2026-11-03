"""Student router for creating and viewing attendance correction requests."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_student
from app.models.users import User
from app.schemas.correction_requests import (
    CorrectionRequestCreateRequest,
    CorrectionRequestDetailResponse,
    CorrectionRequestListResponse,
)
from app.services.correction_request_service import (
    create_student_correction_request,
    get_student_correction_request_by_id,
    list_student_correction_requests,
)

router = APIRouter(dependencies=[Depends(require_student)])


@router.post(
    "",
    response_model=CorrectionRequestDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit attendance correction request",
    description="Submits a correction request for an attendance record on a SUBMITTED lecture.",
)
def create_request(
    request: CorrectionRequestCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Create a new correction request."""
    return create_student_correction_request(
        db=db, student_user_id=current_user.user_id, request=request
    )


@router.get(
    "",
    response_model=CorrectionRequestListResponse,
    summary="List my correction requests",
    description="Returns paginated list of correction requests submitted by authenticated student.",
)
def get_requests(
    request_status: Optional[str] = Query(
        None, description="Filter requests by status ('PENDING', 'APPROVED', 'REJECTED')"
    ),
    skip: int = Query(0, ge=0, description="Records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """List my correction requests."""
    return list_student_correction_requests(
        db=db,
        student_user_id=current_user.user_id,
        request_status=request_status,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{request_id}",
    response_model=CorrectionRequestDetailResponse,
    summary="Get correction request details",
    description="Returns detailed info for student's own correction request.",
)
def get_request_detail(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Retrieve detailed single correction request."""
    return get_student_correction_request_by_id(
        db=db, student_user_id=current_user.user_id, request_id=request_id
    )

