'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AIPanelsSection } from '@/components/shared/AIPanelsSection';
import { ReviewsSection } from '@/components/shared/ReviewsSection';
import { getRankDefinition } from '@/config/ranks';
import { captureEvent } from '@/lib/analytics/posthog';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (e) {
        console.warn('Failed to load profile for home:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const username =
    profileData?.user?.username ||
    user?.username ||
    user?.name ||
    'Candidate';

  const userRank = profileData?.user?.rank || user?.rank || 'Bronze';
  const rankDef = getRankDefinition(userRank);
  const totalInterviews = profileData?.stats?.totalInterviews ?? 0;

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1">
        {/* User Welcome & Rank Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="glass-card-luxury border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            {/* Background rank glow hint */}
            <div
              className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
              style={{ backgroundColor: rankDef.colorVar }}
            />

            <div className="max-w-3xl space-y-4">
              {/* Greeting above username */}
              <p className="text-sm sm:text-base font-semibold text-text-muted">Hello,</p>

              {/* Username in large display font + rank badge & name beside it */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-text-primary font-sans">
                  {username}
                </h1>

                {/* Rank Badge + Rank Name */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-border bg-bg-subtle shadow-sm">
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <Image
                      src={rankDef.badgeUrl}
                      alt={rankDef.displayName}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle block font-bold">
                      Current Rank
                    </span>
                    <span className="text-base sm:text-lg font-bold text-accent">
                      {rankDef.displayName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Under username: prompt line with CTA */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <p className="text-base sm:text-lg text-text-muted font-medium">
                  {totalInterviews === 0
                    ? 'Give your first interview now'
                    : 'Ready for your next round?'}
                </p>

                <Link
                  href="/interview"
                  onClick={() => captureEvent('home_start_interview_clicked')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-sm shadow-md transition-all sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AI agents/panels section */}
        <AIPanelsSection />

        {/* Reviews section */}
        <ReviewsSection />
      </main>

      <Footer />
    </div>
  );
}
