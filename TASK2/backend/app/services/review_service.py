"""
Review Service - Business logic for review operations.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Review, ReviewStatus
from app.schemas import ReviewCreate, LLMAnalysis, AdminStats

logger = logging.getLogger(__name__)


class ReviewService:
    """Business logic for review operations."""
    
    async def create_review(
        self,
        db: AsyncSession,
        review_data: ReviewCreate,
        ip_address: Optional[str] = None
    ) -> Review:
        """
        Create a new review record.
        
        Args:
            db: Database session
            review_data: Validated review data
            ip_address: Client IP for tracking
            
        Returns:
            Created Review instance
        """
        review = Review(
            rating=review_data.rating,
            review_text=review_data.review_text,
            ip_address=ip_address,
            status=ReviewStatus.PENDING
        )
        
        db.add(review)
        await db.flush()
        await db.refresh(review)
        
        return review
    
    async def update_review_with_analysis(
        self,
        db: AsyncSession,
        review: Review,
        analysis: LLMAnalysis,
        success: bool
    ) -> Review:
        """
        Update review with LLM analysis results.
        
        Args:
            db: Database session
            review: Review to update
            analysis: LLM analysis results
            success: Whether LLM processing succeeded
        """
        review.ai_response = analysis.user_response
        review.ai_summary = analysis.internal_summary
        review.ai_actions = analysis.recommended_actions
        review.status = ReviewStatus.SUCCESS if success else ReviewStatus.FAILED
        
        if not success:
            review.error_message = "LLM processing failed - fallback response used"
        
        await db.flush()
        await db.refresh(review)
        
        return review
    
    async def mark_review_failed(
        self,
        db: AsyncSession,
        review: Review,
        error_message: str
    ) -> Review:
        """Mark a review as failed with error message."""
        review.status = ReviewStatus.FAILED
        review.error_message = error_message
        
        await db.flush()
        await db.refresh(review)
        
        return review
    
    async def get_reviews(
        self,
        db: AsyncSession,
        limit: int = 100,
        offset: int = 0,
        rating_filter: Optional[int] = None
    ) -> tuple[list[Review], int]:
        """
        Get reviews with optional filtering.
        
        Args:
            db: Database session
            limit: Max number of results
            offset: Pagination offset
            rating_filter: Filter by specific rating
            
        Returns:
            Tuple of (reviews list, total count)
        """
        # Build base query
        query = select(Review).order_by(desc(Review.created_at))
        count_query = select(func.count(Review.id))
        
        # Apply rating filter
        if rating_filter is not None:
            query = query.where(Review.rating == rating_filter)
            count_query = count_query.where(Review.rating == rating_filter)
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute queries
        result = await db.execute(query)
        reviews = list(result.scalars().all())
        
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0
        
        return reviews, total
    
    async def get_stats(self, db: AsyncSession) -> AdminStats:
        """Get statistics for admin dashboard."""
        
        # Total reviews
        total_result = await db.execute(select(func.count(Review.id)))
        total_reviews = total_result.scalar() or 0
        
        # Average rating
        avg_result = await db.execute(select(func.avg(Review.rating)))
        average_rating = round(avg_result.scalar() or 0, 2)
        
        # Status counts
        success_result = await db.execute(
            select(func.count(Review.id)).where(Review.status == ReviewStatus.SUCCESS)
        )
        success_count = success_result.scalar() or 0
        
        failed_result = await db.execute(
            select(func.count(Review.id)).where(Review.status == ReviewStatus.FAILED)
        )
        failed_count = failed_result.scalar() or 0
        
        # Recent 24h count
        yesterday = datetime.utcnow() - timedelta(hours=24)
        recent_result = await db.execute(
            select(func.count(Review.id)).where(Review.created_at >= yesterday)
        )
        recent_24h_count = recent_result.scalar() or 0
        
        # Rating distribution
        rating_dist = {}
        for rating in range(1, 6):
            dist_result = await db.execute(
                select(func.count(Review.id)).where(Review.rating == rating)
            )
            rating_dist[rating] = dist_result.scalar() or 0
        
        return AdminStats(
            total_reviews=total_reviews,
            average_rating=average_rating,
            success_count=success_count,
            failed_count=failed_count,
            recent_24h_count=recent_24h_count,
            rating_distribution=rating_dist
        )


# Global instance
review_service = ReviewService()


def get_review_service() -> ReviewService:
    """Get review service instance."""
    return review_service
