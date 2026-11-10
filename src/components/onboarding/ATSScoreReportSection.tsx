'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { ResumeProfile } from '@/lib/llm/schemas';

interface ATSScoreReportSectionProps {
  score: number | null;
  topChanges?: string[];
  sectionWiseNotes?: Record<string, string>;
  parsedResume: ResumeProfile | null;
  onContinue: () => void;
}

export function ATSScoreReportSection({
  score,
  topChanges = [],
  sectionWiseNotes = {},
  parsedResume,
  onContinue,
}: ATSScoreReportSectionProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (score === null) return;
    // Count up from 0 to score
    const target = score;
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  if (score === null) return null;

  const sections = [
    ['summary', 'Summary'],
    ['skills', 'Skills'],
    ['projects', 'Projects'],
    ['experience', 'Experience'],
    ['education', 'Education'],
    ['formattingAts', 'Formatting'],
  ] as const;

  const scoreLabel = score >= 90 ? 'Strong' : score >= 75 ? 'Good' : 'Needs Polish';
  const scoreColor = score >= 90 ? 'text-emerald-400' : score >= 75 ? 'text-amber-400' : 'text-orange-400';
  const ringColor = score >= 90 ? '#34d399' : score >= 75 ? '#fbbf24' : '#fb923c';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      {/* Top Header */}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-center text-text-primary mb-10 tracking-tight">
        Your resume review
      </h2>

      {parsedResume && (
        <div className="w-full rounded-2xl bg-surface border border-border p-6 mb-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-text-primary">
              {parsedResume.fullName || 'Resume details'}
            </h3>
            {parsedResume.headline && (
              <p className="text-sm text-text-muted mt-1">{parsedResume.headline}</p>
            )}
          </div>
          {parsedResume.summary && (
            <p className="text-sm text-text-muted leading-relaxed mb-4">{parsedResume.summary}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="font-semibold text-text-primary mb-1">Skills</p>
              <p className="text-text-muted leading-relaxed">
                {parsedResume.skills.length ? parsedResume.skills.join(', ') : 'None identified'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary mb-1">Experience</p>
              <p className="text-text-muted leading-relaxed">
                {parsedResume.experience.length
                  ? parsedResume.experience.map((item) => [item.title, item.company].filter(Boolean).join(' at ')).join(' · ')
                  : 'None identified'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary mb-1">Projects</p>
              <p className="text-text-muted leading-relaxed">
                {parsedResume.projects.length
                  ? parsedResume.projects.map((project) => project.name).filter(Boolean).join(' · ') || 'None identified'
                  : 'None identified'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3-Column Grid matching Screenshot 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mb-10 items-stretch">
        {/* ================================================================= */}
        {/* COLUMN 1: Circular Gauge Score (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-surface border border-border p-6 sm:p-7 flex flex-col justify-between shadow-sm">
          <div className="flex flex-col items-center text-center">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center my-3">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  stroke="var(--color-surface-hover)"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Foreground Animated Ring */}
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeDasharray={452}
                  strokeDashoffset={452 - (452 * animatedScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Inside Gauge Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-text-primary leading-none">
                  {animatedScore}
                </span>
                <span className={`text-base font-bold mt-1 tracking-wide ${scoreColor}`}>
                  {scoreLabel}
                </span>
              </div>
            </div>

            <span className="text-xs font-mono font-medium text-text-muted mt-1 block">
              out of 100
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed font-normal text-center mt-6 pt-4 border-t border-border">
            AI-generated assessment based on the text extracted from your uploaded resume. Use it as feedback, not as a guarantee of how every employer&apos;s ATS will score it.
          </p>
        </div>

        {/* COLUMN 2: What to fix (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-surface border border-border p-6 sm:p-7 flex flex-col shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-6">
            What to fix
          </h3>

          <div className="space-y-4 flex-1">
            {topChanges && topChanges.length > 0 ? (
              topChanges.map((change, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent-subtle text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">{idx + 1}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed font-normal">
                    {change}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-success-subtle border border-success/30">
                <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-xs text-success leading-relaxed font-medium">
                  No specific changes were returned. Review the section notes alongside your resume.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: Actual section notes (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-surface border border-border p-6 sm:p-7 flex flex-col justify-between shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-4">Section notes</h3>

          <div className="space-y-3">
            {sections.map(([key, label]) => (
              <div key={key} className="text-xs">
                <p className="font-semibold text-text-primary">{label}</p>
                <p className="mt-0.5 text-text-muted leading-relaxed">
                  {sectionWiseNotes[key] || 'No specific feedback for this section.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Subtext & Continue Button */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs text-text-muted font-medium text-center">
          This score was generated from the resume text provided and may vary between reviews.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="px-9 py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-sm shadow-sm transition-all flex items-center gap-2 active:scale-95 group cursor-pointer focus-ring"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
