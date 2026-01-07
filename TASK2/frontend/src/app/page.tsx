import { ReviewForm } from "@/components/review-form";

export default function HomePage() {
    return (
        <main className="min-h-screen">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        AI Feedback System
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                            Your Voice Matters
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            Share your experience with us. Our AI-powered system will acknowledge your feedback
                            and help us continuously improve our services.
                        </p>
                    </div>

                    {/* Review Form */}
                    <ReviewForm />

                    {/* Features */}
                    <div className="mt-16 grid md:grid-cols-3 gap-6">
                        <div className="text-center p-6 rounded-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span className="text-2xl">🤖</span>
                            </div>
                            <h3 className="font-semibold mb-2">AI-Powered</h3>
                            <p className="text-sm text-muted-foreground">
                                Get instant, personalized responses to your feedback
                            </p>
                        </div>
                        <div className="text-center p-6 rounded-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <h3 className="font-semibold mb-2">Secure</h3>
                            <p className="text-sm text-muted-foreground">
                                Your feedback is securely stored and processed
                            </p>
                        </div>
                        <div className="text-center p-6 rounded-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h3 className="font-semibold mb-2">Instant</h3>
                            <p className="text-sm text-muted-foreground">
                                Receive acknowledgment within seconds
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
