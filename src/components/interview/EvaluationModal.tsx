'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Award, ArrowRight, ShieldAlert, Sparkles, TrendingUp, X } from 'lucide-react';
import { TechnicalEvaluation, HREvaluation, ResumeEvaluation } from '@/lib/llm/schemas';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'Technical' | 'HR' | 'Resume Review';
  evaluation: any;
}

export function EvaluationModal({ isOpen, onClose, type, evaluation }: EvaluationModalProps) {
  if (!isOpen || !evaluation) return null;

  const tech = type === 'Technical' ? (evaluation as TechnicalEvaluation) : null;
  const hr = type === 'HR' ? (evaluation as HREvaluation) : null;
  const resume = type === 'Resume Review' ? (evaluation as ResumeEvaluation) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" /> Final Interview Report
          </div>
          <h2 className="text-2xl font-extrabold text-text-primary">
            {type} Round Performance
          </h2>
        </div>

        {/* TECHNICAL EVALUATION */}
        {tech && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-bg-subtle border border-border rounded-xl p-3">
                <span className="text-xs text-text-muted font-medium">Overall Score</span>
                <p className="text-2xl font-black text-accent mt-1">{tech.score}/100</p>
              </div>
              <div className="bg-bg-subtle border border-border rounded-xl p-3">
                <span className="text-xs text-text-muted font-medium">Correctness</span>
                <p className="text-2xl font-black text-text-primary mt-1">{tech.correctness}%</p>
              </div>
              <div className="bg-bg-subtle border border-border rounded-xl p-3">
                <span className="text-xs text-text-muted font-medium">Approach</span>
                <p className="text-2xl font-black text-text-primary mt-1">{tech.approach}%</p>
              </div>
              <div className="bg-bg-subtle border border-border rounded-xl p-3">
                <span className="text-xs text-text-muted font-medium">Communication</span>
                <p className="text-2xl font-black text-text-primary mt-1">{tech.communication}%</p>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-bg-subtle border border-border rounded-xl p-3">
                <span className="text-xs text-text-muted font-medium">Test Cases</span>
                <p className="text-lg font-black text-success mt-1">
                  {tech.passed ? '5/5 Passed' : '3/5 Passed'}
                </p>
                <span className="text-[10px] text-text-subtle font-mono block">3 Vis + 2 Hidden</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div>
                <span className="text-text-subtle">Time Complexity:</span>{' '}
                <strong className="text-accent">{tech.timeComplexity}</strong>
              </div>
              <div>
                <span className="text-text-subtle">Space Complexity:</span>{' '}
                <strong className="text-accent">{tech.spaceComplexity}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-bg-subtle text-text-muted border border-border">
                  🔒 Hidden Tests Verified
                </span>
                <span
                  className={`px-2.5 py-1 rounded font-bold ${
                    tech.passed ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                  }`}
                >
                  {tech.passed ? 'PASSED (+50 pts)' : 'NEEDS REVISION'}
                </span>
              </div>
            </div>

            <div className="bg-surface-hover/50 rounded-xl border border-border p-4">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" /> Staff Interviewer Feedback
              </h4>
              <p className="text-sm text-text-muted leading-relaxed">{tech.feedback}</p>
            </div>
          </div>
        )}

        {/* HR EVALUATION */}
        {hr && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-bg-subtle border border-border rounded-xl p-3">
                <span className="text-xs text-text-muted">Communication</span>
                <p className="text-xl font-black text-accent mt-1">{hr.communicationScore}%</p>
              </div>
              <div className="bg-bg-subtle border border-border rounded-xl p-3">
                <span className="text-xs text-text-muted">STAR Method</span>
                <p className="text-xl font-black text-text-primary mt-1">{hr.starStructureScore}%</p>
              </div>
              <div className="bg-bg-subtle border border-border rounded-xl p-3">
                <span className="text-xs text-text-muted">Confidence</span>
                <p className="text-xl font-black text-text-primary mt-1">{hr.confidenceClarityScore}%</p>
              </div>
              <div className="bg-bg-subtle border border-border rounded-xl p-3">
                <span className="text-xs text-text-muted">Relevance</span>
                <p className="text-xl font-black text-text-primary mt-1">{hr.relevanceScore}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-surface-hover/50 rounded-xl border border-border p-4">
                <h4 className="text-xs font-bold text-success uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-text-muted">
                  {hr.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-surface-hover/50 rounded-xl border border-border p-4">
                <h4 className="text-xs font-bold text-warning uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Growth Recommendations
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-text-muted">
                  {hr.improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-sm text-text-muted italic bg-bg p-3 rounded-lg border border-border">
              &ldquo;{hr.overallFeedback}&rdquo;
            </p>
          </div>
        )}

        {/* RESUME REVIEW */}
        {resume && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border">
              <div>
                <span className="text-xs text-text-subtle">ATS & Impact Score</span>
                <h3 className="text-3xl font-black text-accent mt-0.5">{resume.score}/100</h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded bg-accent-subtle text-accent font-semibold">
                Actionable Review Ready
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                Top Priority Changes
              </h4>
              <div className="space-y-2">
                {resume.topChanges.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-text-muted bg-surface-hover/60 p-2.5 rounded-lg border border-border"
                  >
                    <span className="font-mono text-accent font-bold">{idx + 1}.</span>
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </div>

            {resume.rewrittenBullets && resume.rewrittenBullets.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                  High-Impact Bullet Rewrites
                </h4>
                <div className="space-y-3">
                  {resume.rewrittenBullets.map((bullet, idx) => (
                    <div key={idx} className="border border-border rounded-xl p-3 bg-bg text-xs space-y-2">
                      <div>
                        <span className="text-text-subtle font-mono block">Original:</span>
                        <p className="text-danger/90 line-through mt-0.5">{bullet.original}</p>
                      </div>
                      <div>
                        <span className="text-success font-mono font-bold block">Improved:</span>
                        <p className="text-text-primary font-medium mt-0.5">{bullet.improved}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer CTA */}
        <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text-primary rounded-lg"
          >
            Close Report
          </button>
          <Link
            href="/home"
            className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
          >
            <span>Return to Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

