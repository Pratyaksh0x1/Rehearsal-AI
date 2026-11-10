'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { captureEvent, identifyUser } from '@/lib/analytics/posthog';
import { IntroGuideSection } from './IntroGuideSection';
import { ResumeRadarScanAnimation } from './ResumeRadarScanAnimation';
import { ATSScoreReportSection } from './ATSScoreReportSection';
import { FlashyRankRevealAnimation } from './FlashyRankRevealAnimation';

type OnboardingStep = 'intro' | 'parsing' | 'ats_score' | 'rank_reveal';

export function OnboardingFlow() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState<OnboardingStep>('intro');
  const [username, setUsername] = useState(user?.username || user?.name || '');
  const [file, setFile] = useState<File | null>(null);

  // Resume evaluation result state
  const [atsScore, setAtsScore] = useState<number>(97);
  const [topChanges, setTopChanges] = useState<string[]>([]);
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeUrl, setResumeUrl] = useState<string>('');

  // Pre-fill username from authenticated Google account if available
  useEffect(() => {
    if (user && !username) {
      setUsername(user.username || user.name || '');
    }
  }, [user, username]);

  // Handle Step 1 -> Step 2
  const handleBegin = async (candidateName: string, candidateFile: File | null) => {
    setUsername(candidateName);
    setFile(candidateFile);
    setStep('parsing');

    captureEvent('onboarding_intro_completed', {
      name: candidateName,
      hasResume: Boolean(candidateFile),
    });

    // Single atomic request: name + optional resume
    try {
      const formData = new FormData();
      formData.append('username', candidateName.trim());
      if (candidateFile) {
        formData.append('resume', candidateFile);
      }

      const res = await fetch('/api/user/onboard', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.atsScore) setAtsScore(data.atsScore);
        if (data.topChanges?.length) setTopChanges(data.topChanges);
        if (data.resumeText) setResumeText(data.resumeText);
        if (data.resumeUrl) setResumeUrl(data.resumeUrl);

        updateUser({
          username: candidateName.trim(),
          rank: 'Bronze',
          points: 100,
          isOnboarded: true,
          onboardedAt: data.onboardedAt || new Date().toISOString(),
          resumeText: data.resumeText || user?.resumeText,
          resumeUrl: data.resumeUrl || user?.resumeUrl,
        });

        identifyUser(user?.id || candidateName.trim(), {
          username: candidateName.trim(),
          rank: 'Bronze',
          email: user?.email,
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('Onboarding error:', errData.error);
      }
    } catch (saveErr) {
      console.warn('Profile onboard error:', saveErr);
    }
  };

  // Handle Step 2 -> Step 3
  const handleParsingComplete = () => {
    setStep('ats_score');
    captureEvent('onboarding_ats_score_viewed', { score: atsScore });
  };

  // Handle Step 3 -> Step 4
  const handleContinueToRank = () => {
    setStep('rank_reveal');
    captureEvent('onboarding_rank_reveal_triggered', { rank: 'Bronze' });
  };

  // Handle Step 4 -> Enter Arena (/home)
  const handleEnterArena = () => {
    captureEvent('onboarding_arena_entered', { username });
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden transition-colors selection:bg-accent-subtle selection:text-accent">
      {/* Background Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent-subtle blur-3xl pointer-events-none" />

      {/* Dynamic 4-Stage Flow */}
      {step === 'intro' && (
        <IntroGuideSection
          initialName={username}
          initialHasResume={Boolean(user?.resumeUrl || user?.resumeText)}
          onBegin={handleBegin}
        />
      )}

      {step === 'parsing' && (
        <ResumeRadarScanAnimation
          onComplete={handleParsingComplete}
          fileName={file?.name}
        />
      )}

      {step === 'ats_score' && (
        <ATSScoreReportSection
          score={atsScore}
          topChanges={topChanges}
          onContinue={handleContinueToRank}
        />
      )}

      {step === 'rank_reveal' && (
        <FlashyRankRevealAnimation
          username={username}
          onEnterArena={handleEnterArena}
        />
      )}
    </div>
  );
}
