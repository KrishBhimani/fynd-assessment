"""
SQLAlchemy ORM models for the feedback system.
"""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, CheckConstraint
from sqlalchemy.sql import func

from app.database import Base


class ReviewStatus(str, PyEnum):
    """Status of review processing."""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class Review(Base):
    """
    Review model storing user feedback and AI-generated responses.
    
    Attributes:
        id: Primary key
        rating: Star rating 1-5
        review_text: User's review text
        ai_response: AI-generated response shown to user
        ai_summary: Internal summary for admin
        ai_actions: Recommended actions for admin
        status: Processing status (pending/success/failed)
        error_message: Error details if processing failed
        ip_address: Client IP for rate limiting tracking
        created_at: Timestamp of submission
        updated_at: Last update timestamp
    """
    
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)
    review_text = Column(Text, nullable=False, default="")
    
    # AI-generated fields
    ai_response = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_actions = Column(Text, nullable=True)
    
    # Processing metadata
    status = Column(
        Enum(ReviewStatus),
        default=ReviewStatus.PENDING,
        nullable=False
    )
    error_message = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        {'schema': 'fynd'}
    )
    
    def __repr__(self) -> str:
        return f"<Review(id={self.id}, rating={self.rating}, status={self.status})>"
