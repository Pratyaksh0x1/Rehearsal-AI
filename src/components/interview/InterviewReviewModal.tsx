'use client';

import React, { useState } from 'react';
import { Star, MessageSquareHeart } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';

interface InterviewReviewModalProps {
  isOpen: boolean;
  interviewerName: string;
  onSubmitReview: (review: { rating: number; feedback: string }) => void;
  onSkip: () => void;
}

export function InterviewReviewModal({
  isOpen,
  interviewerName,
  onSubmitReview,
  onSkip,
}: InterviewReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    captureEvent('interview_user_reviewed', {
      rating,
      feedbackLength: feedback.length,
      interviewer: interviewerName,
    });
    onSubmitReview({ rating, feedback });
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl p-6 sm:p-8 text-center">
        {/* Top Icon */}
        <div className="w-12 h-12 rounded-xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent mx-auto mb-4 shadow-sm">
          <MessageSquareHeart className="w-6 h-6 text-accent" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-1.5">
          Rate your interview
        </h2>
        <p className="text-xs sm:text-sm text-text-muted mb-6">
          How was your session with <strong className="text-text-primary">{interviewerName}</strong>?
        </p>

        {/* 5 Interactive Stars */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating || rating) >= star;

            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 rounded-md hover:scale-110 transition-transform cursor-pointer focus-ring"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                    isFilled
                      ? 'fill-warning text-warning drop-shadow-sm'
                      : 'text-border-strong'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Text Feedback */}
        <div className="mb-6 text-left">
          <label className="block text-xs font-medium text-text-muted mb-2">
            Tell us something about it (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="How did the problem feel? Did the interviewer give helpful hints?"
            className="w-full rounded-xl bg-bg border border-border px-4 py-3 text-xs sm:text-sm text-text-primary placeholder:text-text-subtle focus-ring resize-none"
          />
        </div>

        {/* Buttons: Skip vs Submit */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer focus-ring"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-lg font-semibold text-accent-foreground text-xs sm:text-sm bg-accent hover:bg-accent-hover shadow-sm transition-all cursor-pointer focus-ring"
          >
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
}

