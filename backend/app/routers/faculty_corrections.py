"""Faculty router for reviewing attendance correction requests."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_faculty
from app.models.users import User
from app.schemas.correction_requests import (
    CorrectionRequestDetailResponse,
    CorrectionRequestListResponse,
    CorrectionRequestReviewRequest,
)
from app.services.correction_request_service import (
    get_faculty_correction_request_by_id,
    list_faculty_correction_requests,
    review_correction_request,
)

router = APIRouter(dependencies=[Depends(require_faculty)])


@router.get(
    "",
    response_model=CorrectionRequestListResponse,
    summary="List correction requests for my lectures",
    description="Returns paginated list of correction requests submitted for lectures assigned to the authenticated faculty member.",
)
def get_faculty_requests(
    request_status: Optional[str] = Query(
        None, description="Filter requests by status ('PENDING', 'APPROVED', 'REJECTED')"
    ),
    subject_id: Optional[int] = Query(
        None, description="Filter requests by subject ID"
    ),
    start_date: Optional[date] = Query(
        None, description="Filter requests on or after this date"
    ),
    end_date: Optional[date] = Query(
        None, description="Filter requests on or before this date"
    ),
    skip: int = Query(0, ge=0, description="Records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """List correction requests for assigned lectures."""
    return list_faculty_correction_requests(
        db=db,
        faculty_user_id=current_user.user_id,
        request_status=request_status,
        subject_id=subject_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{request_id}",
    response_model=CorrectionRequestDetailResponse,
    summary="Get correction request details",
    description="Returns detailed info for a correction request on an assigned lecture.",
)
def get_faculty_request_detail(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Retrieve single correction request."""
    return get_faculty_correction_request_by_id(
        db=db, faculty_user_id=current_user.user_id, request_id=request_id
    )


@router.patch(
    "/{request_id}/review",
    response_model=CorrectionRequestDetailResponse,
    summary="Review correction request (Approve/Reject)",
    description="Approve or reject a pending correction request in a single atomic transaction. Approval updates attendance and logs an audit trail.",
)
def review_request(
    request_id: int,
    review_data: CorrectionRequestReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty),
):
    """Approve or reject a correction request."""
    return review_correction_request(
        db=db,
        faculty_user_id=current_user.user_id,
        request_id=request_id,
        review_data=review_data,
    )

