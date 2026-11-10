'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, Loader2, CheckCircle2, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePathname } from 'next/navigation';

export interface ReviewItem {
  id: string;
  name: string;
  text: string;
  rating?: number;
  createdAt?: string | Date;
}

interface ReviewsSectionProps {
  initialReviews?: ReviewItem[];
}

export function ReviewsSection({ initialReviews = [] }: ReviewsSectionProps) {
  const { user, isLoading: isAuthLoading, signInWithGoogle } = useAuth();
  const pathname = usePathname();

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Pre-fill candidate name when user is logged in
  useEffect(() => {
    if (user?.username && !name) {
      setName(user.username);
    }
  }, [user, name]);

  // Fetch persisted reviews on mount
  useEffect(() => {
    async function loadReviews() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.reviews) && data.reviews.length > 0) {
            setReviewsList(data.reviews);
          }
        }
      } catch (err) {
        console.warn('Failed to load reviews from API:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReviews();
  }, []);

  const handleRatingSelect = (selectedStar: number) => {
    setRating(selectedStar);
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage('');
    try {
      const returnPath = pathname === '/' ? '/#reviews' : `${pathname}#reviews`;
      await signInWithGoogle(returnPath);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to start sign-in. Please try again.');
      setIsSigningIn(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 5) {
      setErrorMessage('Please write a review description of at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const candidateName = name.trim() || user?.username || 'Candidate';
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidateName,
          rating,
          text: text.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      if (data.review) {
        // Immediately update this section with the new review
        setReviewsList((prev) => [data.review, ...prev]);
        setText('');
        setSuccessMessage('Thank you for your feedback! Your review has been added.');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return '5 out of 5 — Excellent session!';
      case 4:
        return '4 out of 5 — Very good experience';
      case 3:
        return '3 out of 5 — Good, with room to improve';
      case 2:
        return '2 out of 5 — Fair, needs polish';
      case 1:
        return '1 out of 5 — Disappointing';
      default:
        return `${val} out of 5 stars`;
    }
  };

  const hasReviews = reviewsList.length > 0;

  return (
    <section id="reviews" className="w-full py-16 sm:py-20 border-t border-border bg-bg text-text-primary transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
            Candidate Feedback
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            What users say
          </h2>
          <p className="mt-3 text-text-muted text-sm sm:text-base">
            Honest reflections from engineers practicing technical and behavioral interviews.
          </p>
        </div>

        {/* Reviews Grid or Empty State */}
        {hasReviews ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16">
            {reviewsList.map((rev) => {
              const starsCount = rev.rating ?? 5;
              return (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between hover:border-accent/40 transition-colors animate-in fade-in duration-300"
                >
                  <div>
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= starsCount
                              ? 'text-warning fill-warning'
                              : 'text-border-strong'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Review Description */}
                    <p className="text-sm text-text-primary leading-relaxed italic mb-4">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-subtle text-accent flex items-center justify-center font-bold text-xs">
                        {rev.name ? rev.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-text-primary">
                        {rev.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-text-subtle">
                      {rev.createdAt
                        ? new Date(rev.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Verified Candidate'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty-state container styled per specification */
          <div className="rounded-2xl border-2 border-dashed border-border bg-surface/50 p-12 text-center max-w-xl mx-auto mb-16">
            <div className="w-12 h-12 rounded-full bg-accent-subtle text-accent flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-1">
              Be the first to leave a review
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Reviews will be populated dynamically as candidates complete technical rounds, HR evaluations, and resume reviews.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* ADD A REVIEW / WRITE A REVIEW SECTION                    */}
        {/* ======================================================== */}
        <div className="max-w-2xl mx-auto bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent block">
                Add a Review
              </span>
              <h3 className="text-lg font-bold text-text-primary">
                Write a review section
              </h3>
            </div>
          </div>

          {isAuthLoading ? (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking your sign-in...</span>
            </div>
          ) : !user ? (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Please log in to share your interview rehearsal experience and submit a review.
              </p>
              <button
                type="button"
                onClick={() => void handleSignIn()}
                disabled={isSigningIn}
                className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <span>Log in to write a review</span>
                )}
              </button>
              {errorMessage && (
                <p className="text-xs text-danger font-medium">{errorMessage}</p>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-text-muted mb-6 leading-relaxed">
                Rate your interview rehearsal experience and describe how the AI interviewer, live voice, or evaluation report helped you prepare.
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-5">
            {/* 1. 5-Star Rating Selector */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2 font-mono uppercase tracking-wider">
                Rating (Give a star out of 5)
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-bg border border-border px-3 py-2 rounded-xl">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingSelect(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-md hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                        aria-label={`Rate ${star} star`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            isFilled
                              ? 'text-warning fill-warning drop-shadow-sm'
                              : 'text-border-strong hover:text-warning/50'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-mono font-medium text-text-primary">
                  {getRatingLabel(hoverRating || rating)}
                </span>
              </div>
            </div>

            {/* 2. Candidate Name */}
            <div>
              <label
                htmlFor="review-name"
                className="block text-xs font-semibold text-text-muted mb-1.5 font-mono uppercase tracking-wider"
              >
                Candidate Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="review-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name (e.g. Alex Chen)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            {/* 3. Description / Review Content */}
            <div>
              <label
                htmlFor="review-description"
                className="block text-xs font-semibold text-text-muted mb-1.5 font-mono uppercase tracking-wider"
              >
                Write a description about it
              </label>
              <textarea
                id="review-description"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your interview experience... How did the problem feel? Did the AI interviewer give helpful hints or realistic feedback?"
                rows={4}
                className="w-full p-3.5 rounded-xl border border-border bg-bg text-text-primary text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent transition-colors resize-y"
              />
            </div>

            {/* Feedback messages */}
            {errorMessage && (
              <p className="text-xs text-danger font-medium">{errorMessage}</p>
            )}

            {successMessage && (
              <p className="text-xs text-success font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>{successMessage}</span>
              </p>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !text.trim()}
                className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </div>
              </form>
            </>
          )}
        </div>

      </div>
    </section>
  );
}
