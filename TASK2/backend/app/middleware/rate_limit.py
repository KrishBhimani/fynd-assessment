"""
Rate limiting middleware using SlowAPI.
Implements IP-based rate limiting for review submissions.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from fastapi import Request
from fastapi.responses import JSONResponse

from app.config import get_settings

settings = get_settings()

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_requests}/{settings.rate_limit_window}seconds"]
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Custom handler for rate limit exceeded errors."""
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "ai_response": "Please wait a moment before submitting another review. We want to ensure everyone gets a chance to share their feedback."
        }
    )


def get_limiter() -> Limiter:
    """Get the rate limiter instance."""
    return limiter
