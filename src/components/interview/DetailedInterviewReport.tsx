'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  ArrowRight,
  Home,
  Code2,
  Check,
  X,
  Sparkles,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Layers,
  BookOpen,
  AlertTriangle,
  Terminal,
  Activity,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface RadarSkill {
  name: string;
  score: number;
  delta: number;
}

export interface DetailedInterviewReportProps {
  score?: number;
  verdict?: string; // e.g. 'Strong Hire' | 'Hire' | 'Needs Practice'
  language?: string;
  difficulty?: string;
  durationMinutes?: number;
  summaryText?: string;
  userCode?: string;
  pointsEarned?: number;
  currentRank?: string;
  nextRankTarget?: number;
  onContinue?: () => void;
  skills?: {
    correctness: number;
    approach: number;
    explaining: number;
    thinkingAloud: number;
    readability: number;
    structure: number;
  };
  categoryBreakdown?: {
    correctness?: { score: number; justification: string };
    codeQuality?: { score: number; justification: string };
    complexity?: { score: number; justification: string };
    approach?: { score: number; justification: string };
    communication?: { score: number; justification: string };
    edgeCases?: { score: number; justification: string };
  };
  testCasesTable?: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    runtimeMs?: number;
  }>;
  complexityComparison?: {
    userTime?: string;
    optimalTime?: string;
    userSpace?: string;
    optimalSpace?: string;
    verdict?: string;
  };
  optimalApproach?: {
    overview?: string;
    codeSnippet?: string;
    practiceTopics?: string[];
  };
  pacingMetrics?: {
    durationMinutes?: number;
    expectedMinutes?: number;
    timeToFirstCodeMinutes?: number;
    debuggingMinutes?: number;
    pauseCount?: number;
  };
  integritySummary?: {
    cameraStatus?: string;
    pasteViolations?: number;
    screenSwitchCount?: number;
    audioWarnings?: number;
    integrityVerdict?: 'Clean' | 'Minor Warnings' | 'Compromised';
  };
  whatWentGreat?: Array<{ title: string; subtitle: string }>;
  needsImprovement?: Array<{ title: string; subtitle: string }>;
  pauseAnalysis?: string;
  selfCorrectionAnalysis?: string;
  codeStyleFeedback?: string;
  englishGrammarFeedback?: string;
  grammarMistakes?: string[];
  screenSwitchingInfractions?: number;
  conductNotes?: string;
  interviewsRemaining?: number;
  onRetake?: () => void;
}

export function DetailedInterviewReport({
  score = 0,
  verdict = 'Awaiting result',
  language = 'Python',
  difficulty = 'Medium',
  durationMinutes = 4,
  summaryText,
  userCode,
  pointsEarned = 161,
  currentRank = 'Knight',
  nextRankTarget = 200,
  onContinue,
  skills = {
    correctness: 100,
    approach: 88,
    explaining: 85,
    thinkingAloud: 65,
    readability: 70,
    structure: 75,
  },
  categoryBreakdown,
  testCasesTable,
  complexityComparison,
  optimalApproach,
  pacingMetrics,
  integritySummary,
  whatWentGreat = [],
  needsImprovement = [],
  pauseAnalysis,
  selfCorrectionAnalysis,
  codeStyleFeedback,
  englishGrammarFeedback,
  grammarMistakes,
  screenSwitchingInfractions,
  conductNotes,
  interviewsRemaining,
  onRetake,
}: DetailedInterviewReportProps) {
  const router = useRouter();
  const [showCodeModal, setShowCodeModal] = useState(false);

  const defaultSummary =
    summaryText ||
    'Interview summary will appear here once the evaluation is generated from the actual code, judge results, and transcript.';

  // Radar geometry calculations
  const radarAxes = [
    { name: 'Correctness', value: skills.correctness },
    { name: 'Approach', value: skills.approach },
    { name: 'Explaining', value: skills.explaining },
    { name: 'Thinking aloud', value: skills.thinkingAloud },
    { name: 'Readability', value: skills.readability },
    { name: 'Structure', value: skills.structure },
  ];

  const cx = 120;
  const cy = 120;
  const radius = 80;

  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI * 2 / 6) * index - Math.PI / 2;
    const r = (val / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const gridRings = [25, 50, 75, 100].map((ringLevel) => {
    return Array.from({ length: 6 })
      .map((_, i) => {
        const pt = getCoordinates(i, ringLevel);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  });

  const dataPoints = radarAxes.map((axis, i) => getCoordinates(i, axis.value));
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Verdict style mapping
  const verdictBadgeStyle =
    score >= 85
      ? 'bg-success-subtle text-success border-success/30'
      : score >= 70
      ? 'bg-accent-subtle text-accent border-accent/30'
      : 'bg-warning-subtle text-warning border-warning/30';

  // Default category breakdown if none passed
  const categories = [
    {
      name: 'Correctness',
      score: categoryBreakdown?.correctness?.score ?? skills.correctness,
      justification:
        categoryBreakdown?.correctness?.justification ??
        'No detailed AI assessment was returned for this category.',
    },
    {
      name: 'Code Quality',
      score: categoryBreakdown?.codeQuality?.score ?? skills.readability,
      justification:
        categoryBreakdown?.codeQuality?.justification ??
        'No detailed AI assessment was returned for this category.',
    },
    {
      name: 'Time & Space Complexity',
      score: categoryBreakdown?.complexity?.score ?? skills.thinkingAloud,
      justification:
        categoryBreakdown?.complexity?.justification ??
        'No detailed AI assessment was returned for this category.',
    },
    {
      name: 'Problem-Solving Approach',
      score: categoryBreakdown?.approach?.score ?? skills.approach,
      justification:
        categoryBreakdown?.approach?.justification ??
        'No detailed AI assessment was returned for this category.',
    },
    {
      name: 'Communication',
      score: categoryBreakdown?.communication?.score ?? skills.explaining,
      justification:
        categoryBreakdown?.communication?.justification ??
        'No detailed AI assessment was returned for this category.',
    },
    {
      name: 'Edge-Case Handling',
      score: categoryBreakdown?.edgeCases?.score ?? skills.structure,
      justification:
        categoryBreakdown?.edgeCases?.justification ??
        'No detailed AI assessment was returned for this category.',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. HERO REPORT CARD */}
      <div className="w-full rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent-subtle blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Score, Verdict & 3-5 Sentence Summary */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${verdictBadgeStyle}`}>
                {verdict}
              </span>
              <span className="text-xs font-mono text-text-subtle">
                {language} &bull; {difficulty}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-serif font-black tracking-tight text-text-primary">
                {score}
              </span>
              <span className="text-sm font-mono text-text-muted">
                out of 100
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-normal">
              {defaultSummary}
            </p>

            {/* Rank Advancement Bar */}
            <div className="pt-4 border-t border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-xs text-text-muted">
                <span className="text-amber-500 font-bold text-sm">+{pointsEarned} points</span>
                <span className="text-text-subtle"> · Current Rank: </span>
                <strong className="text-text-primary uppercase">{currentRank}</strong>
                <span className="text-text-subtle"> · Next Target: </span>
                <span className="font-mono text-accent">{nextRankTarget} pts</span>
              </div>
            </div>
          </div>

          {/* Right Column: 6-Axis Hexagonal Radar Chart (Full Light & Dark Theme Support) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-text-muted mb-2">
              6-Axis Skill Evaluation
            </span>

            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible">
                {/* Background Grid Rings */}
                {gridRings.map((pts, idx) => (
                  <polygon
                    key={idx}
                    points={pts}
                    fill="none"
                    stroke="var(--color-border)"
                    strokeOpacity={0.4}
                    strokeWidth="1"
                  />
                ))}

                {/* Spokes from center to outer points */}
                {Array.from({ length: 6 }).map((_, i) => {
                  const pt = getCoordinates(i, 100);
                  return (
                    <line
                      key={i}
                      x1={cx}
                      y1={cy}
                      x2={pt.x}
                      y2={pt.y}
                      stroke="var(--color-border)"
                      strokeOpacity={0.4}
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Filled Data Polygon */}
                <polygon
                  points={dataPolygon}
                  fill="var(--color-accent-subtle)"
                  stroke="var(--color-accent)"
                  strokeWidth="2"
                  className="filter drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                />

                {/* Vertex Dots */}
                {dataPoints.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="var(--color-accent)"
                    stroke="var(--color-surface)"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              {/* Theme-aware Radar Labels */}
              <div className="absolute top-0 text-center text-[10px] text-text-muted font-medium">
                <div>Correctness</div>
                <div className="text-text-primary font-bold">{skills.correctness}</div>
              </div>

              <div className="absolute top-8 -right-4 text-left text-[10px] text-text-muted font-medium">
                <div>Approach</div>
                <div className="text-text-primary font-bold">{skills.approach}</div>
              </div>

              <div className="absolute bottom-8 -right-4 text-left text-[10px] text-text-muted font-medium">
                <div>Explaining</div>
                <div className="text-text-primary font-bold">{skills.explaining}</div>
              </div>

              <div className="absolute -bottom-3 text-center text-[10px] text-text-muted font-medium">
                <div>Thinking aloud</div>
                <div className="text-text-primary font-bold">{skills.thinkingAloud}</div>
              </div>

              <div className="absolute bottom-8 -left-4 text-right text-[10px] text-text-muted font-medium">
                <div>Readability</div>
                <div className="text-text-primary font-bold">{skills.readability}</div>
              </div>

              <div className="absolute top-8 -left-4 text-right text-[10px] text-text-muted font-medium">
                <div>Structure</div>
                <div className="text-text-primary font-bold">{skills.structure}</div>
              </div>
            </div>

            <p className="text-[11px] text-text-subtle text-center mt-5">
              Continuous evaluation calibrated to technical interview standards.
            </p>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY ACTION BUTTONS: PROMINENT CONTINUE BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto px-10 py-3.5 rounded-xl font-bold text-accent-foreground text-sm bg-accent hover:bg-accent-hover shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 focus-ring hover:scale-[1.02] active:scale-98"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onRetake ? onRetake : () => router.push('/interview')}
          className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-text-primary text-sm bg-surface hover:bg-surface-hover border border-border transition-all cursor-pointer flex items-center justify-center gap-2 focus-ring"
        >
          <span>Take another interview</span>
        </button>

        <Link
          href="/home"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface hover:bg-surface-hover text-text-primary font-medium text-sm border border-border transition-all text-center focus-ring"
        >
          Back to home
        </Link>

        {userCode && (
          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface hover:bg-surface-hover text-text-primary font-medium text-sm border border-border transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-ring"
          >
            <Code2 className="w-4 h-4" />
            <span>Show code</span>
          </button>
        )}
      </div>

      {/* 3. CATEGORY SCORE BREAKDOWN WITH JUSTIFICATIONS */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-base sm:text-lg text-text-primary">
              Category Breakdown & Scorecard
            </h3>
          </div>
          <span className="text-xs font-mono text-text-subtle">
            6 Dimensions Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-bg border border-border flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs sm:text-sm text-text-primary">
                  {cat.name}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    cat.score >= 85
                      ? 'bg-success-subtle text-success'
                      : cat.score >= 70
                      ? 'bg-accent-subtle text-accent'
                      : 'bg-warning-subtle text-warning'
                  }`}
                >
                  {cat.score}/100
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {cat.justification}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TEST CASE RESULTS TABLE */}
      {testCasesTable && testCasesTable.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-base sm:text-lg text-text-primary">
                Test Case Suite Results
              </h3>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {testCasesTable.filter((t) => t.passed).length} of {testCasesTable.length} Passing
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-text-subtle uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Input</th>
                  <th className="py-2.5 px-3">Expected</th>
                  <th className="py-2.5 px-3">Actual Output</th>
                  <th className="py-2.5 px-3 text-right">Runtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {testCasesTable.map((tc, idx) => (
                  <tr key={idx} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-2.5 px-3">
                      {tc.passed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger">
                          <XCircle className="w-3.5 h-3.5" /> Fail
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-text-primary max-w-xs truncate" title={tc.input}>
                      {tc.input}
                    </td>
                    <td className="py-2.5 px-3 text-text-muted max-w-xs truncate" title={tc.expected}>
                      {tc.expected}
                    </td>
                    <td className="py-2.5 px-3 text-text-muted max-w-xs truncate" title={tc.actual}>
                      {tc.actual || 'None'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-subtle">
                      {tc.runtimeMs !== undefined ? `${tc.runtimeMs}ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. COMPLEXITY COMPARISON (Candidate vs Optimal) */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Cpu className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-base sm:text-lg text-text-primary">
            Complexity Comparison
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-bg border border-border space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-text-subtle font-bold block">
              Time Complexity (Big-O)
            </span>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted">Your Stated Time:</span>
              <strong className="text-text-primary">{complexityComparison?.userTime || 'Not recorded'}</strong>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted">Optimal Target Time:</span>
              <strong className="text-accent">{complexityComparison?.optimalTime || 'Not provided'}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg border border-border space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-text-subtle font-bold block">
              Space Complexity (Auxiliary)
            </span>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted">Your Stated Space:</span>
              <strong className="text-text-primary">{complexityComparison?.userSpace || 'Not recorded'}</strong>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted">Optimal Target Space:</span>
              <strong className="text-accent">{complexityComparison?.optimalSpace || 'Not provided'}</strong>
            </div>
          </div>
        </div>

        {complexityComparison?.verdict && (
          <p className="text-xs text-text-muted pt-1">
            <strong className="text-text-primary font-semibold">Complexity Review:</strong>{' '}
            {complexityComparison.verdict}
          </p>
        )}
      </div>

      {/* 6. OPTIMAL APPROACH & PRACTICE RECOMMENDATIONS */}
      {optimalApproach && (
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <BookOpen className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-base sm:text-lg text-text-primary">
              Optimal Approach & Recommended Practice
            </h3>
          </div>

          {optimalApproach.overview && (
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              {optimalApproach.overview}
            </p>
          )}

          {optimalApproach.codeSnippet && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-text-subtle uppercase">
                Optimal Reference Implementation ({language})
              </span>
              <pre className="p-4 rounded-xl bg-bg border border-border font-mono text-xs overflow-x-auto text-text-primary leading-relaxed">
                <code>{optimalApproach.codeSnippet}</code>
              </pre>
            </div>
          )}

          {optimalApproach.practiceTopics && optimalApproach.practiceTopics.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-text-primary block mb-2">
                Recommended Practice Topics to Master Next:
              </span>
              <div className="flex flex-wrap gap-2">
                {optimalApproach.practiceTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-accent-subtle text-accent border border-accent/20 text-xs font-mono font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. TIMELINE, PACING & INTEGRITY SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Pacing Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Clock className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-base text-text-primary">Pacing & Duration</h3>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Round Duration:</span>
              <strong className="text-text-primary">{durationMinutes} minutes</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Time-to-First-Code:</span>
              <strong className="text-text-primary">
                {pacingMetrics?.timeToFirstCodeMinutes !== undefined ? `${pacingMetrics.timeToFirstCodeMinutes}m` : 'Not recorded'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Debugging & Iteration:</span>
              <strong className="text-text-primary">
                {pacingMetrics?.debuggingMinutes !== undefined ? `${pacingMetrics.debuggingMinutes}m` : 'Not recorded'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Thoughtful Pauses:</span>
              <strong className="text-text-primary">
                {pacingMetrics?.pauseCount !== undefined ? `${pacingMetrics.pauseCount} recorded` : 'Not recorded'}
              </strong>
            </div>
          </div>
        </div>

        {/* Proctoring & Integrity Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <ShieldCheck className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-base text-text-primary">Proctoring & Integrity</h3>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Camera & Face Tracking:</span>
              <span className="text-success font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {integritySummary?.cameraStatus || 'Camera status unavailable'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">External Paste Violations:</span>
              <strong className={integritySummary?.pasteViolations ? 'text-danger' : 'text-text-primary'}>
                {integritySummary?.pasteViolations ?? 'Not recorded'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Screen Switch Events:</span>
              <strong className={(screenSwitchingInfractions || integritySummary?.screenSwitchCount) ? 'text-warning' : 'text-text-primary'}>
                {screenSwitchingInfractions ?? integritySummary?.screenSwitchCount ?? 0}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Integrity Verdict:</span>
              <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-success-subtle text-success border border-success/30">
                {integritySummary?.integrityVerdict || 'Clean Integrity'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. WHAT WENT GREAT & NEEDS IMPROVEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
            <div className="w-7 h-7 rounded-full bg-success-subtle text-success flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-semibold text-base text-text-primary">What went great</h3>
          </div>

          <div className="space-y-4">
            {whatWentGreat.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-text-primary">
                    {item.title}
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
            <div className="w-7 h-7 rounded-full bg-danger-subtle text-danger flex items-center justify-center">
              <X className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-semibold text-base text-text-primary">Needs improvement</h3>
          </div>

          <div className="space-y-4">
            {needsImprovement.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-text-primary">
                    {item.title}
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {showCodeModal && userCode && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-overlay backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-surface border border-border rounded-2xl p-6 sm:p-8 max-h-[85vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-text-primary text-base">Your Submitted Code ({language})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer focus-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="flex-1 overflow-auto rounded-xl bg-bg border border-border p-4 font-mono text-xs sm:text-sm text-text-primary leading-relaxed">
              <code>{userCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
