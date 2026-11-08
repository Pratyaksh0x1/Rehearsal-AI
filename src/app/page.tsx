'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AIPanelsSection } from '@/components/shared/AIPanelsSection';
import { ReviewsSection } from '@/components/shared/ReviewsSection';
import { Footer } from '@/components/layout/Footer';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { DeviceMockupAnimation } from '@/components/home/DeviceMockupAnimation';
import { captureEvent } from '@/lib/analytics/posthog';
import {
  Mic,
  Code,
  FileText,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
  Trophy,
} from 'lucide-react';

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams?.get('auth_error');
    if (err) {
      setAuthError(decodeURIComponent(err));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.isOnboarded) {
        router.push('/home');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, isLoading, router]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    captureEvent('cta_continue_with_google_clicked');

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to initialize Google Sign-in');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors selection:bg-accent/30">
      {/* 1. Cylindrical Glassmorphism Header */}
      <header className="sticky top-3.5 z-50 w-full px-4 sm:px-6 pointer-events-none">
        <div className="pointer-events-auto max-w-5xl mx-auto h-13 rounded-full backdrop-blur-2xl bg-surface/80 dark:bg-[#0b0f19]/80 border border-white/20 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.35)] px-4 sm:px-6 flex items-center justify-between transition-all">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative w-7 h-7 flex-shrink-0">
              <Image
                src="/logo.svg"
                alt="Rehearsal AI Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight text-text-primary group-hover:text-accent transition-colors flex items-center gap-1">
              Rehearsal{' '}
              <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.2 rounded-full font-mono font-bold tracking-wider">
                AI
              </span>
            </span>
          </Link>

          {/* Quick Features Pill */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono text-text-muted">
            <span className="flex items-center gap-1.5 hover:text-text-primary transition-colors">
              <Code className="w-3.5 h-3.5 text-accent" /> Technical
            </span>
            <span className="text-white/20">&bull;</span>
            <span className="flex items-center gap-1.5 hover:text-text-primary transition-colors">
              <Mic className="w-3.5 h-3.5 text-purple-400" /> Behavioral HR
            </span>
            <span className="text-white/20">&bull;</span>
            <span className="flex items-center gap-1.5 hover:text-text-primary transition-colors">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Resume Review
            </span>
            <span className="text-white/20">&bull;</span>
            <span className="flex items-center gap-1.5 hover:text-text-primary transition-colors">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Dual Leagues
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-accent hover:bg-accent-hover text-accent-foreground transition-all shadow-md hover:shadow-accent/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Auth Error Banner */}
      {authError && (
        <div className="w-full bg-danger/10 border-b border-danger/30 text-danger px-4 py-3 mt-2">
          <div className="max-w-5xl mx-auto flex items-start justify-between gap-3 text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Google Authentication Notice</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{authError}</p>
                <p className="text-[11px] text-text-subtle mt-1 font-mono">
                  Make sure your Google Client ID &amp; Client Secret in Supabase Dashboard (Auth &rarr; Providers &rarr; Google) match your Google Cloud Console.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="p-1 hover:bg-danger/20 rounded text-text-muted hover:text-danger"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-14 lg:pb-24">
          {/* Hero Headlines */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-pill text-accent text-xs font-mono font-semibold uppercase tracking-wider animate-float-slow">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Real-Time Voice Interview Simulator &bull; Powered by Gnani.ai</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-text-primary leading-[1.12]">
              Practice coding interviews with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-indigo-400 to-purple-400">
                AI voice agents
              </span>
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
              Rehearse live Technical coding rounds with proctoring &amp; 5 test cases, debate your resume bullet-by-bullet, and master behavioral HR rounds. Climb from Bronze to Conqueror.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-sm shadow-xl hover:shadow-accent/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <span>Start Practicing for Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-xs text-text-subtle font-mono px-3 py-2">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>No credit card required &bull; Free tier available</span>
              </div>
            </div>
          </div>

          {/* Interactive Apple iMac / iPhone Device Mockup Animation (Looping simulation) */}
          <DeviceMockupAnimation />
        </section>

        {/* 3. AI Panels Section */}
        <AIPanelsSection />

        {/* 4. Reviews Section */}
        <ReviewsSection />
      </main>

      {/* 5. Footer */}
      <Footer />
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <LandingPageContent />
    </Suspense>
  );
}
