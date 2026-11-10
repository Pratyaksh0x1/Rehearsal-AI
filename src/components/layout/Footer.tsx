import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface py-8 text-center text-sm text-text-muted mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <p className="font-medium text-text-muted">
            Crafted for engineers by{' '}
            <span className="text-text-primary font-semibold">Pratyaksh Tomar</span> &amp;{' '}
            <span className="text-text-primary font-semibold">Preet Chaudhary</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-subtle">
          <Link href="/privacy" className="hover:text-text-primary transition-colors focus-ring rounded-sm">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-text-primary transition-colors focus-ring rounded-sm">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/profile" className="hover:text-text-primary transition-colors focus-ring rounded-sm">
            Feedback &amp; Support
          </Link>
          <span>•</span>
          <span className="font-mono">
            &copy; {new Date().getFullYear()} Rehearsal AI
          </span>
        </div>
      </div>
    </footer>
  );
}
