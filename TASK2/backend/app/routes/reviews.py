"""
Reviews API routes - User-facing endpoints for review submission.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import ReviewCreate, ReviewResponse
from app.services.llm_service import get_llm_service, LLMService
from app.services.review_service import get_review_service, ReviewService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reviews", tags=["reviews"])


def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("", response_model=ReviewResponse)
async def submit_review(
    review_data: ReviewCreate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    llm_service: Annotated[LLMService, Depends(get_llm_service)],
    review_service: Annotated[ReviewService, Depends(get_review_service)]
) -> ReviewResponse:
    """
    Submit a new review.
    
    - Validates the review data
    - Creates a database record
    - Processes with LLM for AI response
    - Updates record with results
    - Returns AI-generated response
    
    Handles failures gracefully - user submissions are always stored.
    """
    ip_address = get_client_ip(request)
    logger.info(f"New review submission: rating={review_data.rating}, ip={ip_address}")
    
    try:
        # Create the review record first (ensures we always store submissions)
        review = await review_service.create_review(
            db=db,
            review_data=review_data,
            ip_address=ip_address
        )
        
        # Process with LLM
        analysis, llm_success = await llm_service.analyze_review(
            rating=review_data.rating,
            review_text=review_data.review_text
        )
        
        # Update review with analysis
        await review_service.update_review_with_analysis(
            db=db,
            review=review,
            analysis=analysis,
            success=llm_success
        )
        
        await db.commit()
        
        return ReviewResponse(
            success=True,
            ai_response=analysis.user_response
        )
        
    except Exception as e:
        logger.error(f"Error processing review: {e}")
        
        # Try to save the failed submission
        try:
            await db.rollback()
            review = await review_service.create_review(
                db=db,
                review_data=review_data,
                ip_address=ip_address
            )
            await review_service.mark_review_failed(
                db=db,
                review=review,
                error_message=str(e)
            )
            await db.commit()
        except Exception as save_error:
            logger.error(f"Failed to save failed review: {save_error}")
        
        # Always return a friendly message to user
        return ReviewResponse(
            success=True,  # From user's perspective, submission was received
            ai_response="Thank you for your feedback! Your review has been recorded and will be processed shortly."
        )
