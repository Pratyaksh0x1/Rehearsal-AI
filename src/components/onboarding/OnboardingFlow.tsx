'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { captureEvent, identifyUser } from '@/lib/analytics/posthog';
import { IntroGuideSection } from './IntroGuideSection';
import { ResumeRadarScanAnimation } from './ResumeRadarScanAnimation';
import { ATSScoreReportSection } from './ATSScoreReportSection';
import { FlashyRankRevealAnimation } from './FlashyRankRevealAnimation';
import type { ResumeProfile } from '@/lib/llm/schemas';

type OnboardingStep = 'intro' | 'parsing' | 'ats_score' | 'rank_reveal';

export function OnboardingFlow() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState<OnboardingStep>('intro');
  const [username, setUsername] = useState(user?.username || user?.name || '');
  const [file, setFile] = useState<File | null>(null);

  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [topChanges, setTopChanges] = useState<string[]>([]);
  const [sectionWiseNotes, setSectionWiseNotes] = useState<Record<string, string>>({});
  const [parsedResume, setParsedResume] = useState<ResumeProfile | null>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [resumeProcessed, setResumeProcessed] = useState(false);
  const [scanAnimationComplete, setScanAnimationComplete] = useState(false);
  const handleScanComplete = useCallback(() => setScanAnimationComplete(true), []);

  // Pre-fill username from authenticated Google account if available
  useEffect(() => {
    if (user && !username) {
      setUsername(user.username || user.name || '');
    }
  }, [user, username]);

  useEffect(() => {
    if (step === 'parsing' && resumeProcessed && scanAnimationComplete && atsScore !== null) {
      setStep('ats_score');
      captureEvent('onboarding_ats_score_viewed', { score: atsScore });
    }
  }, [step, resumeProcessed, scanAnimationComplete, atsScore]);

  // Handle Step 1 -> Step 2
  const handleBegin = async (candidateName: string, candidateFile: File | null) => {
    setUsername(candidateName);
    setFile(candidateFile);
    setOnboardingError(null);
    setResumeProcessed(false);
    setScanAnimationComplete(false);
    setStep('parsing');

    captureEvent('onboarding_intro_completed', {
      name: candidateName,
      hasResume: Boolean(candidateFile),
    });

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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Unable to process your resume. Please try again.');
      }
      if (
        typeof data.atsScore !== 'number' ||
        !Number.isFinite(data.atsScore) ||
        data.atsScore < 0 ||
        data.atsScore > 100 ||
        typeof data.resumeText !== 'string' ||
        !data.resumeText.trim() ||
        !data.parsedResume ||
        typeof data.parsedResume !== 'object'
      ) {
        throw new Error('Resume evaluation returned incomplete results. Please try again.');
      }

      setAtsScore(data.atsScore);
      setTopChanges(Array.isArray(data.topChanges) ? data.topChanges : []);
      setSectionWiseNotes(
        data.sectionWiseNotes && typeof data.sectionWiseNotes === 'object'
          ? data.sectionWiseNotes
          : {}
      );
      setParsedResume(data.parsedResume);
      updateUser({
        username: candidateName.trim(),
        rank: 'Bronze',
        points: 100,
        isOnboarded: true,
        onboardedAt: data.onboardedAt || new Date().toISOString(),
        resumeText: data.resumeText,
        resumeUrl: data.resumeUrl || user?.resumeUrl,
      });

      identifyUser(user?.id || candidateName.trim(), {
        username: candidateName.trim(),
        rank: 'Bronze',
        email: user?.email,
      });
      setResumeProcessed(true);
    } catch (error) {
      console.error('Onboarding resume processing failed:', error);
      setOnboardingError(
        error instanceof Error ? error.message : 'Unable to process your resume. Please try again.'
      );
      setStep('intro');
    }
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
          initialHasResume={Boolean(user?.resumeText)}
          initialFile={file}
          error={onboardingError}
          onBegin={handleBegin}
        />
      )}

      {step === 'parsing' && (
        <ResumeRadarScanAnimation
          onComplete={handleScanComplete}
          fileName={file?.name}
        />
      )}

      {step === 'ats_score' && (
        <ATSScoreReportSection
          score={atsScore}
          topChanges={topChanges}
          sectionWiseNotes={sectionWiseNotes}
          parsedResume={parsedResume}
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
