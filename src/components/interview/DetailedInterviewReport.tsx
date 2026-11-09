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
} from 'lucide-react';

interface RadarSkill {
  name: string;
  score: number;
  delta: number;
}

interface DetailedInterviewReportProps {
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
  skills?: {
    correctness: number;
    approach: number;
    explaining: number;
    thinkingAloud: number;
    readability: number;
    structure: number;
  };
  whatWentGreat?: Array<{ title: string; subtitle: string }>;
  needsImprovement?: Array<{ title: string; subtitle: string }>;
  interviewsRemaining?: number;
  onRetake?: () => void;
}

export function DetailedInterviewReport({
  score = 92,
  verdict = 'Strong Hire',
  language = 'C++',
  difficulty = 'Easy',
  durationMinutes = 4,
  summaryText,
  userCode,
  pointsEarned = 161,
  currentRank = 'Knight',
  nextRankTarget = 200,
  skills = {
    correctness: 100,
    approach: 88,
    explaining: 85,
    thinkingAloud: 50,
    readability: 50,
    structure: 50,
  },
  whatWentGreat = [
    {
      title: 'Every correctness test passed',
      subtitle: '9 of 9 tests passing on initial submission. Correctness',
    },
    {
      title: 'Optimal complexity stated',
      subtitle: 'Accurately derived O(N) time and O(1) space complexity. Approach',
    },
    {
      title: 'Structured verbal explanation',
      subtitle: 'Articulated step-by-step logic before coding. Explaining',
    },
  ],
  needsImprovement = [
    {
      title: 'Quiet while coding',
      subtitle: 'About 39 words while you wrote the code. Thinking aloud',
    },
    {
      title: 'Variable naming clarity',
      subtitle: 'Avoid single letters like a and b in production solutions. Readability',
    },
    {
      title: 'Explicit length pre-check',
      subtitle: 'State the guard clauses upfront before allocating containers. Structure',
    },
  ],
  interviewsRemaining = 2,
  onRetake,
}: DetailedInterviewReportProps) {
  const router = useRouter();
  const [showCodeModal, setShowCodeModal] = useState(false);

  const defaultSummary =
    summaryText ||
    `The student identified the optimal approach quickly, stated the asymptotic complexities correctly, and got all tests passing on the first run. The main growth areas were maintaining verbal narrative while typing the solution and ensuring self-descriptive identifier naming.`;

  // Radar chart calculations for 6 axes
  // Center is (120, 120), radius is 80
  const cx = 120;
  const cy = 120;
  const r = 75;

  const skillList: RadarSkill[] = [
    { name: 'Correctness', score: skills.correctness, delta: skills.correctness },
    { name: 'Approach', score: skills.approach, delta: skills.approach },
    { name: 'Explaining', score: skills.explaining, delta: skills.explaining },
    { name: 'Thinking aloud', score: skills.thinkingAloud, delta: skills.thinkingAloud },
    { name: 'Readability', score: skills.readability, delta: skills.readability },
    { name: 'Structure', score: skills.structure, delta: skills.structure },
  ];

  // Helper to compute (x, y) on 60-degree increments starting at top (-90 deg)
  const getCoordinates = (index: number, val: number, maxVal = 100) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const distance = (val / maxVal) * r;
    return {
      x: cx + distance * Math.cos(angle),
      y: cy + distance * Math.sin(angle),
    };
  };

  // Build grid rings (25%, 50%, 75%, 100%)
  const gridRings = [0.33, 0.66, 1.0].map((scale) => {
    return Array.from({ length: 6 })
      .map((_, i) => {
        const pt = getCoordinates(i, 100 * scale);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  });

  // Build data polygon
  const dataPoints = skillList.map((s, i) => getCoordinates(i, s.score));
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full max-w-6xl mx-auto py-8 sm:py-12 px-4 animate-in fade-in-50 duration-300">
      {/* 1. TOP MAIN CARD matching media_1794199496289_30454623.jpg */}
      <div className="rounded-3xl border border-white/10 bg-[#15101a]/95 p-6 sm:p-10 shadow-2xl relative backdrop-blur-2xl mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Score, Verdict & Narrative */}
          <div className="lg:col-span-7 space-y-5">
            {/* Metadata Tags */}
            <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
              <span>{language}</span>
              <span>·</span>
              <span>{difficulty}</span>
              <span>·</span>
              <span>{durationMinutes} minutes</span>
            </div>

            {/* Huge Score + Verdict Badge */}
            <div className="flex items-baseline gap-4">
              <h1 className="font-serif text-6xl sm:text-7xl font-normal text-white tracking-tight leading-none">
                {score}
                <span className="text-2xl sm:text-3xl font-sans text-zinc-400 font-light">
                  /100
                </span>
              </h1>

              <span
                className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
                  score >= 85
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : score >= 70
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}
              >
                {verdict}
              </span>
            </div>

            {/* Qualitative Narrative Summary */}
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal pt-1">
              {defaultSummary}
            </p>

            {/* Rank Advancement Bar */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#f59e0b] shadow-sm flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-xs text-zinc-300">
                <span className="text-[#f59e0b] font-bold text-sm">+{pointsEarned} points</span>
                <span className="text-zinc-400">
                  {' '}
                  · {currentRank}, {nextRankTarget} ·{' '}
                </span>
                <span className="text-emerald-400 font-semibold">Promoted to {currentRank}.</span>
              </div>
            </div>
          </div>

          {/* Right Column: 6-Axis Hexagonal Radar Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-zinc-300 mb-2 self-start sm:self-center">
              Your first scored interview
            </span>

            {/* SVG Radar */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible">
                {/* Background Grid Rings */}
                {gridRings.map((points, idx) => (
                  <polygon
                    key={idx}
                    points={points}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
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
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Filled Data Polygon */}
                <polygon
                  points={dataPolygon}
                  fill="rgba(245, 158, 11, 0.28)"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  className="filter drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                />

                {/* Vertex Dots */}
                {dataPoints.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#f472b6"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              {/* Labels placed around the hexagon */}
              {/* Top: Correctness */}
              <div className="absolute top-0 text-center text-[10px] text-zinc-300 font-medium">
                <div>Correctness</div>
                <div className="text-white font-bold">{skills.correctness} <span className="text-emerald-400">+{skills.correctness}</span></div>
              </div>

              {/* Top Right: Approach */}
              <div className="absolute top-8 -right-4 text-left text-[10px] text-zinc-300 font-medium">
                <div>Approach</div>
                <div className="text-white font-bold">{skills.approach} <span className="text-emerald-400">+{skills.approach}</span></div>
              </div>

              {/* Bottom Right: Explaining */}
              <div className="absolute bottom-8 -right-4 text-left text-[10px] text-zinc-300 font-medium">
                <div>Explaining</div>
                <div className="text-white font-bold">{skills.explaining} <span className="text-emerald-400">+{skills.explaining}</span></div>
              </div>

              {/* Bottom: Thinking aloud */}
              <div className="absolute -bottom-3 text-center text-[10px] text-zinc-300 font-medium">
                <div>Thinking aloud</div>
                <div className="text-white font-bold">{skills.thinkingAloud} <span className="text-emerald-400">+{skills.thinkingAloud}</span></div>
              </div>

              {/* Bottom Left: Readability */}
              <div className="absolute bottom-8 -left-4 text-right text-[10px] text-zinc-300 font-medium">
                <div>Readability</div>
                <div className="text-white font-bold">{skills.readability} <span className="text-emerald-400">+{skills.readability}</span></div>
              </div>

              {/* Top Left: Structure */}
              <div className="absolute top-8 -left-4 text-right text-[10px] text-zinc-300 font-medium">
                <div>Structure</div>
                <div className="text-white font-bold">{skills.structure} <span className="text-emerald-400">+{skills.structure}</span></div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 text-center mt-5">
              Every skill starts here. Your next interview shows what changed.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ACTION BUTTONS ROW matching media_1794199496289_30454623.jpg */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
        <button
          type="button"
          onClick={onRetake ? onRetake : () => router.push('/interview')}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-slate-950 text-sm bg-gradient-to-r from-[#d8973c] via-[#f7cf7c] to-[#d8973c] hover:brightness-105 shadow-[0_0_20px_rgba(247,214,136,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Take another interview</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-sm border border-white/10 transition-all text-center"
        >
          Back to home
        </Link>

        {userCode && (
          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-sm border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            <span>Show code</span>
          </button>
        )}
      </div>

      <p className="text-center text-xs text-zinc-400 mb-10">
        You have {interviewsRemaining} interviews left.
      </p>

      {/* 3. SIDE-BY-SIDE CARDS: What Went Great & Needs Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: What went great */}
        <div className="rounded-3xl border border-white/10 bg-[#161220]/95 p-6 sm:p-7 shadow-xl">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/10">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-semibold text-base text-white">What went great</h3>
          </div>

          <div className="space-y-4">
            {whatWentGreat.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-200">
                    {item.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Needs improvement */}
        <div className="rounded-3xl border border-white/10 bg-[#161220]/95 p-6 sm:p-7 shadow-xl">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/10">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <X className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-semibold text-base text-white">Needs improvement</h3>
          </div>

          <div className="space-y-4">
            {needsImprovement.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-200">
                    {item.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-[#161220] border border-white/10 rounded-3xl p-6 sm:p-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#f59e0b]" />
                <h3 className="font-semibold text-white text-base">Your Submitted Code ({language})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="flex-1 overflow-auto rounded-2xl bg-[#0d0914] border border-white/10 p-4 font-mono text-xs sm:text-sm text-zinc-200 leading-relaxed">
              <code>{userCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
