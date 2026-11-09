'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User, FileText, CheckCircle2, AlertCircle, ArrowRight, Upload } from 'lucide-react';

interface IntroGuideSectionProps {
  initialName?: string;
  onBegin: (name: string, file: File | null) => void;
}

export function IntroGuideSection({
  initialName = '',
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
        {/* LEFT COLUMN: Navya Portrait Card + Guide Pill                      */}
        {/* ================================================================= */}
        <div className="md:col-span-5 flex flex-col items-center space-y-3">
          <div className="relative w-64 sm:w-72 aspect-[3/4] rounded-3xl overflow-hidden border border-amber-900/30 bg-[#161214] shadow-[0_20px_50px_rgba(0,0,0,0.6)] group">
            {/* Ambient Warm Golden Glow behind Navya */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-amber-500/10 z-10 pointer-events-none" />

            <Image
              src="/avatars/navya.jpg"
              alt="Navya your guide"
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>

          {/* Guide Pill Badge matching Screenshot 1 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1919]/90 border border-amber-800/40 text-amber-200/90 font-mono text-xs shadow-md backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />
            <span className="font-medium tracking-wide">Navya your guide</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Speech Bubble + Setup Card                          */}
        {/* ================================================================= */}
        <div className="md:col-span-7 space-y-5">
          {/* Warm Dark Speech Bubble matching Screenshot 1 */}
          <div className="relative rounded-3xl bg-[#1c1616]/95 border border-amber-900/40 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
            {/* Bubble pointer triangle pointing left toward Navya */}
            <div className="hidden md:block absolute -left-2.5 top-9 w-4 h-4 bg-[#1c1616] border-l border-b border-amber-900/40 rotate-45" />

            <p className="text-base sm:text-lg text-amber-50/95 font-serif leading-relaxed">
              Hi {displayName}, I&apos;m <span className="italic font-bold text-amber-300">Navya</span>. Before your first mock interview, let&apos;s set up two quick things so your interviewer knows who they&apos;re talking to.
            </p>
          </div>

          {/* Setup Card with 2 Tiles matching Screenshot 1 */}
          <div className="rounded-3xl bg-[#171212]/90 border border-amber-900/30 p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TILE 1: Your name */}
              <div className="rounded-2xl bg-[#241c1c]/90 border border-amber-900/30 p-4 transition-all hover:border-amber-700/50 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mb-3 shadow-inner">
                    <User className="w-5 h-5 text-amber-300" />
                  </div>
                  <h4 className="font-bold text-sm text-white mb-0.5">Your name</h4>
                  <p className="text-xs text-amber-200/60 leading-tight mb-3">What the interviewer calls you</p>
                </div>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-900/40 text-sm text-white placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 font-medium transition-colors"
                />
              </div>

              {/* TILE 2: Your resume */}
              <label
                htmlFor="resume-upload-input"
                className={`rounded-2xl border p-4 transition-all flex flex-col justify-between cursor-pointer group ${
                  file
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-[#241c1c]/90 border-amber-900/30 hover:border-amber-700/50'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mb-3 shadow-inner">
                    <FileText className="w-5 h-5 text-amber-300" />
                  </div>
                  <h4 className="font-bold text-sm text-white mb-0.5">Your resume</h4>
                  <p className="text-xs text-amber-200/60 leading-tight mb-3">So the questions are about you</p>
                </div>

                <input
                  id="resume-upload-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-900/40 text-xs font-mono text-amber-200/90 truncate flex items-center justify-between">
                  {file ? (
                    <span className="truncate flex items-center gap-1.5 text-amber-300 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                      <span className="truncate">{file.name}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-200/60">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose PDF resume</span>
                    </span>
                  )}
                </div>
              </label>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bottom Button Row matching Screenshot 1 */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleStart}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-[0_0_28px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.65)] transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Let&apos;s begin</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <span className="text-xs font-mono text-amber-200/60">
                About a minute.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
