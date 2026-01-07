"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    disabled?: boolean;
}

export function StarRating({ rating, onRatingChange, disabled = false }: StarRatingProps) {
    return (
        <div className="star-rating flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange(star)}
                    disabled={disabled}
                    className={cn(
                        "p-1 rounded-full transition-all duration-150",
                        "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        disabled && "cursor-not-allowed opacity-50"
                    )}
                    aria-label={`Rate ${star} stars`}
                >
                    <Star
                        className={cn(
                            "w-8 h-8 transition-colors",
                            star <= rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-transparent text-slate-300 hover:text-amber-300"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
