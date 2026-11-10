'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User, FileText, CheckCircle2, AlertCircle, ArrowRight, Upload } from 'lucide-react';

interface IntroGuideSectionProps {
  initialName?: string;
  initialHasResume?: boolean;
  onBegin: (name: string, file: File | null) => void;
}

export function IntroGuideSection({
  initialName = '',
  initialHasResume = false,
  onBegin,
}: IntroGuideSectionProps) {
  const [name, setName] = useState(initialName || '');
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const displayName = name.trim() || 'there';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      setErrorMessage('Please upload a PDF file.');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5 MB limit.');
      return;
    }

    setFile(selected);
  };

  const handleStart = () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your name so the interviewer knows who they are talking to.');
      return;
    }
    setErrorMessage('');
    onBegin(name.trim(), file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full">
        {/* ================================================================= */}
        {/* LEFT COLUMN: Navya Portrait Card + Guide Pill */}
        <div className="md:col-span-5 flex flex-col items-center space-y-3">
          <div className="relative w-64 sm:w-72 aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-surface shadow-md group">
            {/* Ambient subtle glow behind Navya */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 pointer-events-none" />

            <Image
              src="/avatars/navya.jpg"
              alt="Navya your guide"
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>

          {/* Guide Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-text-primary font-mono text-xs shadow-sm">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-medium tracking-wide">Navya your guide</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Speech Bubble + Setup Card */}
        <div className="md:col-span-7 space-y-5">
          {/* Speech Bubble */}
          <div className="relative rounded-2xl bg-surface border border-border p-6 sm:p-7 shadow-sm">
            {/* Bubble pointer triangle */}
            <div className="hidden md:block absolute -left-2.5 top-9 w-4 h-4 bg-surface border-l border-b border-border rotate-45" />

            <p className="text-base sm:text-lg text-text-primary leading-relaxed">
              Hi {displayName}, I&apos;m <span className="font-bold text-accent">Navya</span>. Before your first mock interview, let&apos;s set up two quick things so your interviewer knows who they&apos;re talking to.
            </p>
          </div>

          {/* Setup Card with 2 Tiles */}
          <div className="rounded-2xl bg-surface border border-border p-6 sm:p-7 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TILE 1: Your name */}
              <div className="rounded-xl bg-bg-subtle border border-border p-4 transition-all hover:border-border-strong flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-accent-subtle border border-accent/20 text-accent flex items-center justify-center mb-3 shadow-sm">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="font-semibold text-sm text-text-primary mb-0.5">Your name</h4>
                  <p className="text-xs text-text-muted leading-tight mb-3">What the interviewer calls you</p>
                </div>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary placeholder:text-text-subtle focus-ring font-medium transition-colors"
                />
              </div>

              {/* TILE 2: Your resume */}
              <label
                htmlFor="resume-upload-input"
                className={`rounded-xl border p-4 transition-all flex flex-col justify-between cursor-pointer group ${
                  file
                    ? 'bg-accent-subtle border-accent/40 shadow-sm'
                    : 'bg-bg-subtle border-border hover:border-border-strong'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-accent-subtle border border-accent/20 text-accent flex items-center justify-center mb-3 shadow-sm">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="font-semibold text-sm text-text-primary mb-0.5">Your resume</h4>
                  <p className="text-xs text-text-muted leading-tight mb-3">So the questions are about you</p>
                </div>

                <input
                  id="resume-upload-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-text-primary truncate flex items-center justify-between">
                  {file ? (
                    <span className="truncate flex items-center gap-1.5 text-accent font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-success" />
                      <span className="truncate">{file.name}</span>
                    </span>
                  ) : initialHasResume ? (
                    <span className="flex items-center gap-1.5 text-success font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-success" />
                      <span>Resume on file (click to replace)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-text-subtle">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose PDF resume</span>
                    </span>
                  )}
                </div>
              </label>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-danger-subtle border border-danger/30 text-xs text-danger">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bottom Button Row */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleStart}
                className="px-7 py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-sm shadow-sm transition-all flex items-center gap-2 active:scale-95 focus-ring"
              >
                <span>Let&apos;s begin</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <span className="text-xs font-mono text-text-muted">
                About a minute.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

