'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { RankLadder } from '@/components/ranks/RankLadder';
import { captureEvent, identifyUser } from '@/lib/analytics/posthog';
import { Upload, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export function OnboardingFlow() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Handle Step 1: Username
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    const trimmed = username.trim();

    if (trimmed.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 24) {
      setUsernameError('Username cannot exceed 24 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameError('Only letters, numbers, and underscores are allowed.');
      return;
    }

    captureEvent('onboarding_username_submitted', { username: trimmed });
    setStep(2);
  };

  // Handle Step 2: Resume upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported.');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 5 MB.');
      return;
    }

    setFile(selected);
  };

  const handleResumeSubmit = async () => {
    if (!file) {
      setUploadError('Please select a PDF resume file.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/user/resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse resume.');
      }

      captureEvent('onboarding_resume_uploaded', {
        wordCount: data.wordCount,
      });

      // Complete onboarding record
      const onboardRes = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          resumeUrl: data.resumeUrl,
          resumeText: data.resumeText,
        }),
      });

      const onboardData = await onboardRes.json();
      if (!onboardRes.ok) {
        throw new Error(onboardData.error || 'Failed to complete profile.');
      }

      updateUser({
        username: username.trim(),
        rank: 'Bronze',
        points: 0,
        isOnboarded: true,
        resumeText: data.resumeText,
        resumeUrl: data.resumeUrl,
      });

      identifyUser(user?.id || username.trim(), {
        username: username.trim(),
        rank: 'Bronze',
        email: user?.email,
      });

      captureEvent('onboarding_completed', {
        rank: 'Bronze',
        username: username.trim(),
      });

      setStep(3);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading resume.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-4 py-12 transition-colors">
      <div className="w-full max-w-xl mx-auto">
        {/* Mascot & Speech Bubble */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          {/* Mascot SVG Avatar */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 animate-bounce duration-1000">
            <Image
              src="/mascot.svg"
              alt="Rehearsal AI Mascot"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Speech Bubble */}
          <div className="relative flex-1 bg-surface border border-border rounded-2xl p-6 shadow-md">
            <div className="hidden sm:block absolute -left-2.5 top-8 w-4 h-4 bg-surface border-l border-b border-border rotate-45" />

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
                Rehearsal AI Guide
              </span>
              <h2 className="text-xl font-bold text-text-primary">
                {step === 1 && "Welcome! What's your name?"}
                {step === 2 && "Awesome! Now drop your resume."}
                {step === 3 && `Ready, ${username}! Here is your Rank Ladder.`}
              </h2>
              <p className="text-sm text-text-muted">
                {step === 1 && "This will be your unique handle on the leaderboards and interview reports."}
                {step === 2 && "We extract your skills and experience to tailor real-time technical and behavioral questions."}
                {step === 3 && "Every recruit starts at Bronze. Complete interviews and solve challenges to climb all the way to Conqueror."}
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: What's your name? */}
        {step === 1 && (
          <form
            onSubmit={handleUsernameSubmit}
            className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
          >
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-text-primary mb-2">
                Choose your username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dev_knight"
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent font-medium text-base transition-colors"
                autoFocus
              />
              {usernameError && (
                <p className="mt-2 text-xs text-danger flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {usernameError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-foreground font-bold text-base transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Drop your resume */}
        {step === 2 && (
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-accent bg-accent-subtle/20' : 'border-border hover:border-accent/60'
              }`}
            >
              <input
                type="file"
                id="resume-file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="resume-file" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-accent-subtle text-accent flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-semibold text-text-primary text-base">
                  {file ? file.name : 'Click to select or drag and drop your resume'}
                </span>
                <span className="text-xs text-text-subtle mt-1 font-mono">
                  PDF only &bull; Max 5 MB
                </span>
              </label>
            </div>

            {uploadError && (
              <p className="text-xs text-danger flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {uploadError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl border border-border bg-bg text-text-muted hover:text-text-primary text-sm font-semibold transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleResumeSubmit}
                disabled={!file || isUploading}
                className="flex-1 py-3.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-foreground font-bold text-base transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing PDF Resume...</span>
                  </>
                ) : (
                  <>
                    <span>Upload & View Rank</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Rank Ladder Screen */}
        {step === 3 && (
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-accent bg-accent-subtle px-3 py-1 rounded-full mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Onboarding Complete
              </div>
              <h3 className="text-xl font-bold text-text-primary">
                Your Starting Tier: <span className="text-rank-bronze">Bronze</span>
              </h3>
            </div>

            <RankLadder currentRank="Bronze" onContinue={() => router.push('/home')} />
          </div>
        )}
      </div>
    </div>
  );
}
