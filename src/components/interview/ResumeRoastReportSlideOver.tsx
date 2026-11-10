'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  FileText,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

export interface ResumeEvaluationData {
  score: number;
  accuracyAssessment?: string;
  candidateStrengths?: string[];
  resumeImprovements?: string[];
  sectionWiseNotes?: {
    summary?: string;
    skills?: string;
    projects?: string;
    experience?: string;
    education?: string;
    formattingAts?: string;
  };
  topChanges?: string[];
  rewrittenBullets?: Array<{
    original: string;
    improved: string;
  }>;
}

export interface ResumeRoastReportSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: ResumeEvaluationData | null;
  strategistName: string;
  strategistRole: string;
  onContinue: () => void;
}

export function ResumeRoastReportSlideOver({
  isOpen,
  onClose,
  evaluation,
  strategistName,
  strategistRole,
  onContinue,
}: ResumeRoastReportSlideOverProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeSectionTab, setActiveSectionTab] = useState<string>('projects');

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !evaluation) return null;

  const score = evaluation.score || 0;
  const scoreTier =
    score >= 85
      ? { label: 'FAANG Caliber', color: 'text-success bg-success-subtle border-success/30' }
      : score >= 70
      ? { label: 'Strong Defense', color: 'text-accent bg-accent-subtle border-accent/30' }
      : score >= 50
      ? { label: 'Competitive', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' }
      : { label: 'Needs Polish', color: 'text-danger bg-danger-subtle border-danger/30' };

  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const sectionEntries = evaluation.sectionWiseNotes
    ? Object.entries(evaluation.sectionWiseNotes).filter(([, val]) => Boolean(val))
    : [];

  return (
    <div
      className="fixed inset-0 z-modal overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-report-title"
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-overlay backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Sheet / Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10 pointer-events-none">
        <div className="w-screen max-w-2xl sm:max-w-3xl bg-surface border-l border-border shadow-2xl flex flex-col h-full overflow-hidden pointer-events-auto transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-border bg-surface/95 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent flex-shrink-0 shadow-sm">
                <FileCheck2 className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2
                    id="resume-report-title"
                    className="text-base sm:text-lg font-bold text-text-primary truncate"
                  >
                    Resume Roast Audit & Evaluation
                  </h2>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${scoreTier.color} flex-shrink-0`}
                  >
                    {scoreTier.label}
                  </span>
                </div>
                <p className="text-xs text-text-muted truncate mt-0.5">
                  Interviewed with <strong className="text-text-primary font-medium">{strategistName}</strong> ({strategistRole})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors flex-shrink-0"
              aria-label="Close report drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Report Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* Top Hero Score Card */}
            <div className="bg-bg border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 text-center sm:text-left">
                {/* Visual Circular Gauge / Pill */}
                <div className="relative w-20 h-20 rounded-2xl bg-accent-subtle/50 border border-accent/30 flex flex-col items-center justify-center flex-shrink-0 shadow-inner">
                  <span className="text-3xl font-black text-accent tracking-tight">{score}</span>
                  <span className="text-[10px] font-mono text-text-subtle uppercase">out of 100</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold text-accent uppercase tracking-wider block">
                    ATS & Defense Score
                  </span>
                  <h3 className="text-lg font-black text-text-primary mt-0.5">
                    {score >= 80
                      ? 'Exceptional Resume & Technical Defense'
                      : score >= 65
                      ? 'Solid Profile with Actionable Revisions'
                      : 'Requires Strategic Optimization'}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-md">
                    Evaluated against tech recruiter parsing benchmarks, quantified business impact, and verbal truthfulness.
                  </p>
                </div>
              </div>

              {/* Quick Stat Badges */}
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto font-mono text-xs">
                <div className="bg-surface border border-border rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-text-subtle uppercase block">Priority Fixes</span>
                  <strong className="text-sm font-bold text-text-primary">
                    {evaluation.topChanges?.length || 0} Action Items
                  </strong>
                </div>
                <div className="bg-surface border border-border rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-text-subtle uppercase block">Bullet Rewrites</span>
                  <strong className="text-sm font-bold text-accent">
                    {evaluation.rewrittenBullets?.length || 0} Upgrades
                  </strong>
                </div>
              </div>
            </div>

            {/* Candidate Project Accuracy Assessment */}
            {evaluation.accuracyAssessment && (
              <div className="bg-surface border border-accent/25 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <h4 className="text-xs font-bold text-accent uppercase tracking-wider font-mono">
                    Candidate Project Accuracy & Technical Truthfulness
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-bg/60 p-3.5 rounded-xl border border-border/80">
                  {evaluation.accuracyAssessment}
                </p>
              </div>
            )}

            {/* 2-Column Strengths & Recommendations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Key Strengths */}
              {evaluation.candidateStrengths && evaluation.candidateStrengths.length > 0 && (
                <div className="bg-surface border border-success/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <h4 className="text-xs font-bold text-success uppercase tracking-wider font-mono">
                      Key Strengths Articulated
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.candidateStrengths.map((str, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-text-muted flex items-start gap-2 bg-success-subtle/30 p-2.5 rounded-xl border border-success/20 leading-relaxed"
                      >
                        <span className="text-success font-bold mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations to Improve */}
              {evaluation.resumeImprovements && evaluation.resumeImprovements.length > 0 && (
                <div className="bg-surface border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">
                      Recommendations to Improve
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.resumeImprovements.map((imp, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-text-muted flex items-start gap-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed"
                      >
                        <span className="text-amber-500 font-bold mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Top Priority Action Items */}
            {evaluation.topChanges && evaluation.topChanges.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-accent" />
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                    Top Priority Resume Changes
                  </h4>
                </div>
                <div className="space-y-2">
                  {evaluation.topChanges.map((change, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 text-xs text-text-muted bg-bg p-3 rounded-xl border border-border leading-relaxed"
                    >
                      <span className="font-mono text-accent font-bold px-2 py-0.5 rounded bg-accent-subtle/60 border border-accent/20 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{change}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High-Impact Bullet Rewrites */}
            {evaluation.rewrittenBullets && evaluation.rewrittenBullets.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                      High-Impact Bullet Rewrites
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-text-subtle">
                    XYZ Formula (Accomplished [X] measured by [Y] by doing [Z])
                  </span>
                </div>

                <div className="space-y-3">
                  {evaluation.rewrittenBullets.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="border border-border rounded-xl p-4 bg-bg text-xs space-y-3 shadow-sm hover:border-accent/40 transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-danger uppercase tracking-wider font-bold block mb-1">
                          Original Bullet:
                        </span>
                        <p className="text-danger/90 line-through bg-danger-subtle/30 p-2.5 rounded-lg border border-danger/20 leading-relaxed">
                          {bullet.original}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-success uppercase tracking-wider font-bold block mb-1">
                          FAANG-Caliber Suggested Rewrite:
                        </span>
                        <p className="text-text-primary font-medium bg-success-subtle/30 p-2.5 rounded-lg border border-success/30 leading-relaxed">
                          {bullet.improved}
                        </p>
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyBullet(bullet.improved, idx)}
                          className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover text-text-primary font-semibold text-[11px] border border-border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-success" />
                              <span className="text-success">Copied to Clipboard</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-text-muted" />
                              <span>Copy Improved Bullet</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section-Wise Notes Diagnostic */}
            {sectionEntries.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                    Section-by-Section Diagnostic
                  </h4>
                </div>

                {/* Section selection tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
                  {sectionEntries.map(([key]) => {
                    const isActive = activeSectionTab === key;
                    const label =
                      key === 'formattingAts'
                        ? 'ATS Formatting'
                        : key.charAt(0).toUpperCase() + key.slice(1);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveSectionTab(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                            : 'bg-bg text-text-muted hover:text-text-primary hover:bg-surface-hover border border-border'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Active Section Content */}
                {evaluation.sectionWiseNotes && (
                  <div className="p-4 rounded-xl bg-bg border border-border text-xs sm:text-sm text-text-muted leading-relaxed">
                    <p>
                      {String(
                        (evaluation.sectionWiseNotes as Record<string, string>)[activeSectionTab] ||
                          'No specific notes recorded for this section.'
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sticky Footer CTA with prominent Continue Button */}
          <div className="sticky bottom-0 bg-surface/95 backdrop-blur-md border-t border-border p-4 sm:p-5 flex items-center justify-between gap-4 shadow-lg z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-surface-hover text-text-muted hover:text-text-primary text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Back to Resume
            </button>

            <button
              type="button"
              onClick={onContinue}
              className="px-7 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-sm sm:text-base shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer focus-ring"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

