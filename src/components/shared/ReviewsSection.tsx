import React from 'react';
import { MessageSquare, Star } from 'lucide-react';

interface ReviewItem {
  id: string;
  name: string;
  text: string;
  rating?: number;
}

interface ReviewsSectionProps {
  // Built so reviews can be added directly from JSON or DB
  initialReviews?: ReviewItem[];
}

export function ReviewsSection({ initialReviews = [] }: ReviewsSectionProps) {
  const hasReviews = initialReviews.length > 0;

  return (
    <section className="w-full py-16 sm:py-20 border-t border-border bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
            <Star className="w-3.5 h-3.5 text-warning" />
            Candidate Feedback
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            What users say
          </h2>
          <p className="mt-3 text-text-muted text-sm sm:text-base">
            Honest reflections from engineers practicing technical and behavioral interviews.
          </p>
        </div>

        {hasReviews ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {initialReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between"
              >
                <p className="text-sm text-text-primary italic mb-4">&ldquo;{rev.text}&rdquo;</p>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold text-sm text-text-primary">{rev.name}</span>
                  <div className="flex text-warning">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty-state container styled per specification */
          <div className="rounded-2xl border-2 border-dashed border-border bg-surface/50 p-12 text-center max-w-xl mx-auto">
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
      </div>
    </section>
  );
}

