'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Code2, Users, FileCheck2, ArrowRight, Shield, Mic, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getRankDefinition } from '@/config/ranks';
import { captureEvent } from '@/lib/analytics/posthog';

export default function InterviewHubPage() {
  const { user } = useAuth();
  const userRank = user?.rank || 'Bronze';
  const rankDef = getRankDefinition(userRank);

  const interviewTracks = [
    {
      title: 'Technical Round',
      href: '/interview/technical',
      trackKey: 'technical',
      icon: Code2,
      badge: 'Live Code Execution + Voice',
      badgeColor: 'bg-accent-subtle text-accent',
      description:
        'Solve coding problems chosen for your rank, with an AI interviewer.',
      highlights: [
        `Problems tailored for ${rankDef.displayName} tier`,
        'Monaco editor + sandboxed execution judge (Piston)',
        'Time & space complexity interrogation',
      ],
      buttonText: 'Start Technical Round',
      accentBorder: 'hover:border-accent',
    },
    {
      title: 'HR Round',
      href: '/interview/hr',
      trackKey: 'hr',
      icon: Users,
      badge: 'Behavioral STAR Protocol',
      badgeColor: 'bg-success-subtle text-success',
      description:
        'A behavioral interview; the AI assesses communication, ownership, teamwork, and clarity.',
      highlights: [
        '5 structured STAR questions',
        'Probes leadership & conflict resolution',
        'Scored communication clarity & relevance',
      ],
      buttonText: 'Start HR Round',
      accentBorder: 'hover:border-success',
    },
    {
      title: 'Resume Review',
      href: '/interview/resume',
      trackKey: 'resume_review',
      icon: FileCheck2,
      badge: 'Deep ATS & Impact Audit',
      badgeColor: 'bg-warning-subtle text-warning',
      description:
        'The AI reviews your resume and gives a score and the changes needed.',
      highlights: [
        'Score out of 100 with section breakdowns',
        'Actionable bullet rewrites with impact verbs',
        'ATS formatting check & missing keyword analysis',
      ],
      buttonText: 'Start Resume Review',
      accentBorder: 'hover:border-warning',
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Mic className="w-3.5 h-3.5" /> Interactive AI Interview Chambers
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary">
            Choose Your Interview Track
          </h1>
          <p className="mt-3 text-text-muted text-base">
            Select a session to rehearse with voice, receive immediate feedback, and earn promotion points.
          </p>
        </div>

        {/* The 3 Core Interview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {interviewTracks.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.title}
                className={`rounded-3xl border border-white/10 bg-surface/70 backdrop-blur-xl p-7 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 group hover:-translate-y-1.5 ${track.accentBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent group-hover:scale-105 transition-transform shadow-inner">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold px-3 py-1 rounded-full border border-white/10 ${track.badgeColor}`}
                    >
                      {track.badge}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-text-primary mb-3">
                    {track.title}
                  </h2>

                  <p className="text-sm text-text-muted leading-relaxed mb-6">
                    {track.description}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-white/10 mb-8">
                    {track.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-text-subtle font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={track.href}
                  onClick={() => captureEvent('interview_track_selected', { track: track.trackKey })}
                  className="w-full py-3.5 rounded-full bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-sm shadow-lg hover:shadow-accent/25 transition-all flex items-center justify-center gap-2 group-hover:shadow-accent/30"
                >
                  <span>{track.buttonText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
