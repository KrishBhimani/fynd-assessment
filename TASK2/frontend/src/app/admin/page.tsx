"use client";

import { useEffect, useState, useCallback } from "react";
import {
    RefreshCw,
    Star,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/loading";
import { getAdminReviews, getAdminStats, ReviewDetail, AdminStats } from "@/lib/api";
import { formatDate, truncate } from "@/lib/utils";

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function AdminPage() {
    const [reviews, setReviews] = useState<ReviewDetail[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [reviewsData, statsData] = await Promise.all([
                getAdminReviews(100, 0, ratingFilter ?? undefined),
                getAdminStats(),
            ]);
            setReviews(reviewsData.reviews);
            setStats(statsData);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
            setIsLoading(false);
        }
    }, [ratingFilter]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleRefresh = () => {
        setIsLoading(true);
        fetchData();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "success":
                return <Badge variant="success">Success</Badge>;
            case "failed":
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="warning">Pending</Badge>;
        }
    };

    const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
        const sizeClass = size === "lg" ? "w-6 h-6" : "w-4 h-4";
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${sizeClass} ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <main className="min-h-screen">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            Admin Dashboard
                        </h1>
                        {lastUpdated && (
                            <p className="text-xs text-muted-foreground">
                                Last updated: {formatDate(lastUpdated)}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                                        <p className="text-2xl font-bold">{stats.total_reviews}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                                        <p className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</p>
                                    </div>
                                    <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Successful</p>
                                        <p className="text-2xl font-bold text-emerald-600">{stats.success_count}</p>
                                    </div>
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Failed</p>
                                        <p className="text-2xl font-bold text-red-600">{stats.failed_count}</p>
                                    </div>
                                    <XCircle className="h-8 w-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Last 24h</p>
                                        <p className="text-2xl font-bold">{stats.recent_24h_count}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Rating Distribution & Filters */}
                {stats && (
                    <Card className="mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Rating Distribution</CardTitle>
                            <CardDescription>Click to filter by rating</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={ratingFilter === null ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setRatingFilter(null)}
                                >
                                    All ({stats.total_reviews})
                                </Button>
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <Button
                                        key={rating}
                                        variant={ratingFilter === rating ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setRatingFilter(rating)}
                                        className="gap-1"
                                    >
                                        {rating} <Star className="w-3 h-3 fill-current" /> ({stats.rating_distribution[rating] || 0})
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Reviews Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Submissions</CardTitle>
                        <CardDescription>
                            {reviews.length} review{reviews.length !== 1 ? "s" : ""} {ratingFilter ? `with ${ratingFilter}★ rating` : ""} — Click a row to view details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && reviews.length === 0 ? (
                            <TableSkeleton />
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="text-lg">No reviews yet</p>
                                <p className="text-sm">Reviews will appear here once submitted</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2 font-semibold text-sm">Rating</th>
                                            <th className="text-left py-3 px-2 font-semibold text-sm">Review</th>
                                            <th className="text-left py-3 px-2 font-semibold text-sm">AI Summary</th>
                                            <th className="text-left py-3 px-2 font-semibold text-sm">Status</th>
                                            <th className="text-left py-3 px-2 font-semibold text-sm">Date</th>
                                            <th className="text-left py-3 px-2 font-semibold text-sm w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews.map((review) => (
                                            <tr
                                                key={review.id}
                                                className="border-b hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                                                onClick={() => setSelectedReview(review)}
                                            >
                                                <td className="py-3 px-2">
                                                    {renderStars(review.rating)}
                                                </td>
                                                <td className="py-3 px-2 max-w-[200px]">
                                                    <p className="text-sm truncate">
                                                        {review.review_text ? truncate(review.review_text, 50) : <span className="text-muted-foreground italic">No text</span>}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-2 max-w-[200px]">
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {review.ai_summary ? truncate(review.ai_summary, 50) : "-"}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-2">
                                                    {getStatusBadge(review.status)}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                                                        {formatDate(review.created_at)}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Review Detail Modal */}
            <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                    {selectedReview && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    {renderStars(selectedReview.rating, "lg")}
                                    {getStatusBadge(selectedReview.status)}
                                </div>
                                <DialogTitle className="text-xl">Review Details</DialogTitle>
                                <DialogDescription>
                                    Submitted on {formatDate(selectedReview.created_at)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* Customer Review */}
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Customer Review</h4>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg max-h-[300px] overflow-y-auto">
                                        <p className="text-sm whitespace-pre-wrap break-all">
                                            {selectedReview.review_text || <span className="italic text-muted-foreground">No text provided</span>}
                                        </p>
                                        {selectedReview.review_text && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {selectedReview.review_text.length} characters
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* AI Summary */}
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">AI Summary</h4>
                                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm break-words">
                                            {selectedReview.ai_summary || <span className="italic text-muted-foreground">No summary available</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Recommended Actions */}
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Recommended Actions</h4>
                                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <p className="text-sm break-words">
                                            {selectedReview.ai_actions || <span className="italic text-muted-foreground">No actions recommended</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </main>
    );
}
