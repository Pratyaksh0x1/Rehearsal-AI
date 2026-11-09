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

    let parsedResumeText = user?.resumeText || '';
    let parsedResumeUrl = user?.resumeUrl || '';

    // Start background resume parsing & evaluation
    if (candidateFile) {
      try {
        const formData = new FormData();
        formData.append('resume', candidateFile);

        const res = await fetch('/api/user/resume', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.resumeText) parsedResumeText = data.resumeText;
          if (data.resumeUrl) parsedResumeUrl = data.resumeUrl;
          setResumeText(parsedResumeText);
          setResumeUrl(parsedResumeUrl);

          // Run ATS evaluation
          if (parsedResumeText) {
            try {
              const evalRes = await fetch('/api/interviews/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'Resume Review',
                  resumeText: parsedResumeText,
                }),
              });

              if (evalRes.ok) {
                const evalData = await evalRes.json();
                if (evalData.evaluation) {
                  setAtsScore(evalData.evaluation.score || 97);
                  setTopChanges(evalData.evaluation.topChanges || []);
                }
              }
            } catch (evalErr) {
              console.warn('ATS evaluation fallback:', evalErr);
            }
          }
        }
      } catch (err) {
        console.error('Resume processing error in background:', err);
      }
    }

    // Save profile to database - only pass non-empty resume data, never overwrite with empty strings
    try {
      const onboardPayload: Record<string, any> = {
        username: candidateName.trim(),
      };
      if (parsedResumeUrl) onboardPayload.resumeUrl = parsedResumeUrl;
      if (parsedResumeText) onboardPayload.resumeText = parsedResumeText;

      await fetch('/api/user/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardPayload),
      });

      updateUser({
        username: candidateName.trim(),
        rank: 'Bronze',
        points: 100,
        isOnboarded: true,
        resumeText: parsedResumeText || user?.resumeText,
        resumeUrl: parsedResumeUrl || user?.resumeUrl,
      });

      identifyUser(user?.id || candidateName.trim(), {
        username: candidateName.trim(),
        rank: 'Bronze',
        email: user?.email,
      });
    } catch (saveErr) {
      console.warn('Profile save note:', saveErr);
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
    <div className="min-h-screen bg-[#0e0a0a] text-amber-50 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden transition-colors selection:bg-amber-500/30">
      {/* Background Ambient Warm Sepia Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-amber-600/10 via-amber-900/5 to-transparent blur-3xl pointer-events-none" />

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
