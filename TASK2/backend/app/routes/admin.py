"""
Admin API routes - Internal dashboard endpoints.
"""

import logging
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import AdminReviewsResponse, ReviewDetail, AdminStats
from app.services.review_service import get_review_service, ReviewService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/reviews", response_model=AdminReviewsResponse)
async def get_reviews(
    db: Annotated[AsyncSession, Depends(get_db)],
    review_service: Annotated[ReviewService, Depends(get_review_service)],
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    rating: Optional[int] = Query(default=None, ge=1, le=5)
) -> AdminReviewsResponse:
    """
    Get all reviews for admin dashboard.
    
    - Supports pagination via limit/offset
    - Optional rating filter
    - Returns all AI-generated fields
    - Ordered by most recent first
    """
    reviews, total = await review_service.get_reviews(
        db=db,
        limit=limit,
        offset=offset,
        rating_filter=rating
    )
    
    review_details = [
        ReviewDetail(
            id=r.id,
            rating=r.rating,
            review_text=r.review_text,
            ai_summary=r.ai_summary,
            ai_actions=r.ai_actions,
            status=r.status,
            created_at=r.created_at
        )
        for r in reviews
    ]
    
    return AdminReviewsResponse(
        reviews=review_details,
        total=total
    )


@router.get("/stats", response_model=AdminStats)
async def get_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    review_service: Annotated[ReviewService, Depends(get_review_service)]
) -> AdminStats:
    """
    Get dashboard statistics.
    
    Returns:
    - Total reviews count
    - Average rating
    - Success/failed counts
    - Recent 24h activity
    - Rating distribution
    """
    return await review_service.get_stats(db)
