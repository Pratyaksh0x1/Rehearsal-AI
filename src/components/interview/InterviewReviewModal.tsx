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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-md bg-[#161220] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 text-center">
        {/* Top Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#2b1f1a] border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] mx-auto mb-4 shadow-sm">
          <MessageSquareHeart className="w-6 h-6 text-[#f59e0b]" />
        </div>

        {/* Title */}
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white tracking-tight mb-1.5">
          Rate your interview
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mb-6">
          How was your session with <strong className="text-zinc-200">{interviewerName}</strong>?
        </p>

        {/* 5 Interactive Golden Stars */}
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
                className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                    isFilled
                      ? 'fill-[#f59e0b] text-[#f59e0b] filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'text-zinc-600'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Text Feedback */}
        <div className="mb-6 text-left">
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Tell us something about it (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="How did the problem feel? Did the interviewer give helpful hints?"
            className="w-full rounded-2xl bg-[#0f0c18] border border-white/10 px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
          />
        </div>

        {/* Buttons: Skip vs Submit */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-full font-bold text-slate-950 text-xs sm:text-sm bg-gradient-to-r from-[#d8973c] via-[#f7cf7c] to-[#d8973c] hover:brightness-105 shadow-[0_0_15px_rgba(247,214,136,0.3)] transition-all cursor-pointer"
          >
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
}

