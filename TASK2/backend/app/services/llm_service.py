"""
LLM Service for server-side AI orchestration.
Handles OpenAI API calls with structured JSON output.
"""

import json
import asyncio
import logging
from typing import Optional

from openai import AsyncOpenAI, APITimeoutError, APIError

from app.config import get_settings
from app.schemas import LLMAnalysis

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMService:
    """
    Service for LLM-based review analysis.
    All LLM calls are server-side only.
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.llm_model
        self.timeout = settings.llm_timeout_seconds
        
        # Check if API key is present
        if settings.openai_api_key:
            print(f"✅ OpenAI API key is present (starts with: {settings.openai_api_key[:10]}...)")
        else:
            print("❌ OpenAI API key is NOT present!")
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt for review analysis."""
        return """You are an AI assistant that analyzes customer feedback and generates appropriate responses.

Your task is to analyze a customer review and provide:
1. A user-facing response that acknowledges their feedback appropriately
2. An internal summary for the admin team
3. Recommended actions for the business

Guidelines:
- For positive reviews (4-5 stars): Express gratitude and reinforce positive aspects
- For neutral reviews (3 stars): Acknowledge the mixed experience, thank them, and express commitment to improvement
- For negative reviews (1-2 stars): Show empathy, apologize for shortcomings, and express desire to improve
- Be professional, warm, and concise
- Never make promises you can't keep
- For vague or empty reviews, provide a generic but warm response

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
    "user_response": "Your response to show the customer",
    "internal_summary": "Brief summary for admin team",
    "recommended_actions": "Suggested follow-up actions"
}"""
    
    def _build_user_prompt(self, rating: int, review_text: str) -> str:
        """Build the user prompt with review details."""
        text = review_text if review_text.strip() else "[No text provided - rating only]"
        
        # Truncate very long reviews for LLM
        max_chars = 4000
        if len(text) > max_chars:
            text = text[:max_chars] + "... [truncated]"
        
        return f"""Analyze this customer review:

Rating: {rating} out of 5 stars
Review: {text}

Provide your analysis as JSON."""
    
    def _get_fallback_response(self, rating: int, review_text: str) -> LLMAnalysis:
        """Generate fallback response when LLM fails."""
        
        # Determine sentiment based on rating
        if rating >= 4:
            user_response = "Thank you so much for your wonderful feedback! We're delighted to hear you had a great experience with us."
            internal_summary = f"Positive review ({rating} stars). Customer appears satisfied."
            actions = "Consider featuring in testimonials if detailed."
        elif rating == 3:
            user_response = "Thank you for your feedback! We appreciate you taking the time to share your experience and are always working to improve."
            internal_summary = f"Neutral review ({rating} stars). Mixed experience indicated."
            actions = "Review for specific improvement areas."
        else:
            user_response = "Thank you for sharing your feedback. We're sorry your experience didn't meet expectations, and we'll use this to improve."
            internal_summary = f"Negative review ({rating} stars). Customer dissatisfied."
            actions = "Prioritize follow-up. Investigate issues mentioned."
        
        return LLMAnalysis(
            user_response=user_response,
            internal_summary=internal_summary,
            recommended_actions=actions
        )
    
    def _get_empty_review_response(self, rating: int) -> LLMAnalysis:
        """Generate response for empty/minimal reviews."""
        
        if rating >= 4:
            user_response = "Thank you for your rating! We're glad you had a positive experience."
        elif rating == 3:
            user_response = "Thank you for your rating! We appreciate your feedback."
        else:
            user_response = "Thank you for your rating. We're sorry your experience wasn't better."
        
        return LLMAnalysis(
            user_response=user_response,
            internal_summary=f"Rating-only submission ({rating} stars). No text provided.",
            recommended_actions="No specific actions - consider follow-up survey."
        )
    
    async def analyze_review(
        self,
        rating: int,
        review_text: str
    ) -> tuple[LLMAnalysis, bool]:
        """
        Analyze a review using the LLM.
        
        Args:
            rating: Star rating 1-5
            review_text: Review text content
            
        Returns:
            Tuple of (LLMAnalysis, success_flag)
        """
        
        # Handle empty reviews without LLM call
        if not review_text or len(review_text.strip()) < 3:
            return self._get_empty_review_response(rating), True
        
        try:
            response = await asyncio.wait_for(
                self._call_llm(rating, review_text),
                timeout=self.timeout
            )
            return response, True
            
        except asyncio.TimeoutError:
            logger.warning(f"LLM timeout for review (rating={rating})")
            return self._get_fallback_response(rating, review_text), False
            
        except APITimeoutError:
            logger.warning(f"OpenAI API timeout for review (rating={rating})")
            return self._get_fallback_response(rating, review_text), False
            
        except APIError as e:
            logger.error(f"OpenAI API error: {e}")
            return self._get_fallback_response(rating, review_text), False
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            return self._get_fallback_response(rating, review_text), False
            
        except Exception as e:
            logger.error(f"Unexpected error in LLM analysis: {e}")
            return self._get_fallback_response(rating, review_text), False
    
    async def _call_llm(self, rating: int, review_text: str) -> LLMAnalysis:
        """Make the actual LLM API call."""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self._build_system_prompt()},
                {"role": "user", "content": self._build_user_prompt(rating, review_text)}
            ],
            temperature=0.7,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        return LLMAnalysis(
            user_response=data.get("user_response", "Thank you for your feedback!"),
            internal_summary=data.get("internal_summary", "Review processed"),
            recommended_actions=data.get("recommended_actions", "Review for follow-up")
        )


# Global instance
llm_service = LLMService()


def get_llm_service() -> LLMService:
    """Get LLM service instance."""
    return llm_service
