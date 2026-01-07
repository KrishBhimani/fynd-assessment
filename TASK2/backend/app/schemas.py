"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ReviewStatus(str, Enum):
    """Status of review processing."""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


# ============== Request Schemas ==============

class ReviewCreate(BaseModel):
    """Schema for creating a new review."""
    
    rating: int = Field(
        ...,
        ge=1,
        le=5,
        description="Star rating from 1 to 5"
    )
    review_text: str = Field(
        default="",
        max_length=10000,
        description="Review text content"
    )
    
    @field_validator("review_text")
    @classmethod
    def clean_review_text(cls, v: str) -> str:
        """Strip whitespace from review text."""
        return v.strip() if v else ""


# ============== Response Schemas ==============

class ReviewResponse(BaseModel):
    """Response schema for review submission."""
    
    success: bool = Field(..., description="Whether the submission was successful")
    ai_response: str = Field(..., description="AI-generated response message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "ai_response": "Thank you for your feedback! We're glad you enjoyed your experience."
            }
        }


class ReviewDetail(BaseModel):
    """Detailed review schema for admin dashboard."""
    
    id: int
    rating: int
    review_text: str
    ai_summary: Optional[str] = None
    ai_actions: Optional[str] = None
    status: ReviewStatus
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "rating": 4,
                "review_text": "Great service, but food was a bit cold.",
                "ai_summary": "Positive overall with minor food temperature issue",
                "ai_actions": "Follow up on kitchen timing procedures",
                "status": "success",
                "created_at": "2024-01-15T10:30:00Z"
            }
        }


class AdminReviewsResponse(BaseModel):
    """Response schema for admin reviews list."""
    
    reviews: List[ReviewDetail]
    total: int = Field(..., description="Total number of reviews")
    
    class Config:
        json_schema_extra = {
            "example": {
                "reviews": [],
                "total": 0
            }
        }


class AdminStats(BaseModel):
    """Statistics for admin dashboard."""
    
    total_reviews: int
    average_rating: float
    success_count: int
    failed_count: int
    recent_24h_count: int
    rating_distribution: dict[int, int]


# ============== LLM Schemas ==============

class LLMAnalysis(BaseModel):
    """Schema for LLM analysis output."""
    
    user_response: str = Field(
        ...,
        description="User-facing response message"
    )
    internal_summary: str = Field(
        ...,
        description="Internal summary for admin"
    )
    recommended_actions: str = Field(
        ...,
        description="Recommended next actions"
    )


# ============== Error Schemas ==============

class ErrorResponse(BaseModel):
    """Standard error response."""
    
    detail: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "An error occurred while processing your request."
            }
        }


class HealthResponse(BaseModel):
    """Health check response."""
    
    status: str = "healthy"
    database: str = "connected"
