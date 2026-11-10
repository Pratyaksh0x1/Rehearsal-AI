'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HomeHeroSection } from '@/components/home/HomeHeroSection';
import { HomePanelLeaderboardSection } from '@/components/home/HomePanelLeaderboardSection';
import { ReviewsSection } from '@/components/shared/ReviewsSection';
import { AuthGate } from '@/components/auth/AuthGate';

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
    'You';

  const userRank = profileData?.user?.rank || user?.rank || 'Bronze';
  const userPoints = profileData?.user?.points ?? user?.points ?? 100;

  return (
    <AuthGate>
      <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors selection:bg-accent-subtle selection:text-accent">
        <Navbar />

        <main className="flex-1 space-y-2">
          {/* Top Hero Section with Soundwave Visualizer & Rank Card */}
          <HomeHeroSection
            userRank={userRank}
            points={userPoints}
            username={username}
          />

          {/* Meet Your Panel & Leaderboard Section */}
          <HomePanelLeaderboardSection
            userPoints={userPoints}
            userName={username}
          />

          {/* Student Reviews & Testimonials */}
          <ReviewsSection />
        </main>

        <Footer />
      </div>
    </AuthGate>
  );
}
