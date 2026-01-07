/**
 * API client for backend communication.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ReviewSubmission {
    rating: number;
    review_text: string;
}

export interface ReviewResponse {
    success: boolean;
    ai_response: string;
}

export interface ReviewDetail {
    id: number;
    rating: number;
    review_text: string;
    ai_summary: string | null;
    ai_actions: string | null;
    status: "pending" | "success" | "failed";
    created_at: string;
}

export interface AdminReviewsResponse {
    reviews: ReviewDetail[];
    total: number;
}

export interface AdminStats {
    total_reviews: number;
    average_rating: number;
    success_count: number;
    failed_count: number;
    recent_24h_count: number;
    rating_distribution: Record<number, number>;
}

class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: unknown
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { detail: "An error occurred" };
        }
        throw new ApiError(
            errorData.detail || "Request failed",
            response.status,
            errorData
        );
    }
    return response.json();
}

export async function submitReview(data: ReviewSubmission): Promise<ReviewResponse> {
    try {
        const response = await fetch(`${API_URL}/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return handleResponse<ReviewResponse>(response);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        // Network error or other issues
        console.error("Submit review error:", error);
        throw new ApiError("Failed to connect to server. Please try again.", 0);
    }
}

export async function getAdminReviews(
    limit = 100,
    offset = 0,
    rating?: number
): Promise<AdminReviewsResponse> {
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
        });
        if (rating) {
            params.set("rating", rating.toString());
        }

        const response = await fetch(`${API_URL}/admin/reviews?${params}`);
        return handleResponse<AdminReviewsResponse>(response);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.error("Get reviews error:", error);
        throw new ApiError("Failed to fetch reviews. Please try again.", 0);
    }
}

export async function getAdminStats(): Promise<AdminStats> {
    try {
        const response = await fetch(`${API_URL}/admin/stats`);
        return handleResponse<AdminStats>(response);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.error("Get stats error:", error);
        throw new ApiError("Failed to fetch statistics. Please try again.", 0);
    }
}

export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/health`);
        return response.ok;
    } catch {
        return false;
    }
}
