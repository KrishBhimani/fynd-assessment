"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StarRating } from "@/components/star-rating";
import { submitReview, ReviewResponse } from "@/lib/api";

const MAX_CHARS = 5000;

export function ReviewForm() {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [response, setResponse] = useState<ReviewResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            setError("Please select a rating before submitting.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setResponse(null);

        try {
            const result = await submitReview({
                rating,
                review_text: reviewText,
            });
            setResponse(result);
            // Reset form on success
            setRating(0);
            setReviewText("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setRating(0);
        setReviewText("");
        setResponse(null);
        setError(null);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg hover-card">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Share Your Feedback
                </CardTitle>
                <CardDescription className="text-lg">
                    We value your opinion! Rate your experience and let us know how we can improve.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">How would you rate your experience?</Label>
                        <div className="flex justify-center py-2">
                            <StarRating
                                rating={rating}
                                onRatingChange={setRating}
                                disabled={isSubmitting}
                            />
                        </div>
                        {rating > 0 && (
                            <p className="text-center text-sm text-muted-foreground animate-fade-in">
                                {rating === 5 && "Excellent! We're thrilled! 🎉"}
                                {rating === 4 && "Great! Thank you! 😊"}
                                {rating === 3 && "Thanks for your honest feedback 👍"}
                                {rating === 2 && "We'll work to do better 💪"}
                                {rating === 1 && "We're sorry to hear that 😔"}
                            </p>
                        )}
                    </div>

                    {/* Review Text */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="review" className="text-base font-semibold">
                                Tell us more (optional)
                            </Label>
                            <span className={`text-xs ${reviewText.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground"}`}>
                                {reviewText.length}/{MAX_CHARS}
                            </span>
                        </div>
                        <Textarea
                            id="review"
                            placeholder="What did you like? What could be better? Your detailed feedback helps us improve..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            disabled={isSubmitting}
                            className="min-h-[140px] resize-none"
                            maxLength={MAX_CHARS + 100}
                        />
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="animate-fade-in">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Success Response */}
                    {response && (
                        <Alert variant="success" className="animate-fade-in">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Thank You!</AlertTitle>
                            <AlertDescription className="mt-2">
                                {response.ai_response}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="flex-1 h-12 text-base font-semibold"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Submit Feedback
                                </>
                            )}
                        </Button>
                        {(response || error) && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                                className="h-12"
                            >
                                New Review
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
