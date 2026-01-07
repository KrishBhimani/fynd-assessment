import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    return (
        <div
            className={cn(
                "animate-spin rounded-full border-2 border-current border-t-transparent text-primary",
                sizeClasses[size],
                className
            )}
        />
    );
}

export function LoadingSkeleton({ className }: { className?: string }) {
    return <div className={cn("skeleton rounded-md", className)} />;
}

export function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                    <LoadingSkeleton className="h-8 w-12" />
                    <LoadingSkeleton className="h-8 flex-1" />
                    <LoadingSkeleton className="h-8 w-24" />
                    <LoadingSkeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    );
}
