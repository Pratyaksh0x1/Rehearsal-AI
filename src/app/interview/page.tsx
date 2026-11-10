'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Code2, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';
import {
  TechnicalRoundSetup,
  TechnicalSetupConfig,
} from '@/components/interview/TechnicalRoundSetup';
import { BeforeYouStartSection } from '@/components/interview/BeforeYouStartSection';
import { AuthGate } from '@/components/auth/AuthGate';

export default function InterviewHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStep =
    searchParams.get('step') === 'setup'
      ? 'setup-technical'
      : searchParams.get('step') === 'before-start'
      ? 'before-start'
      : 'choose';

  const [currentStep, setCurrentStep] = useState<'choose' | 'setup-technical' | 'before-start'>(
    initialStep
  );
  const [technicalConfig, setTechnicalConfig] = useState<TechnicalSetupConfig | null>(null);

  useEffect(() => {
    const s = searchParams.get('step');
    if (s === 'setup') {
      setCurrentStep('setup-technical');
    } else if (s === 'before-start') {
      setCurrentStep('before-start');
    }
  }, [searchParams]);

  const handleSetupComplete = (config: TechnicalSetupConfig) => {
    setTechnicalConfig(config);
    setCurrentStep('before-start');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchInterview = () => {
    const langKeyMap: Record<string, string> = {
      'C++': 'cpp',
      'Java': 'java',
      'Python': 'python',
      'JavaScript': 'javascript',
    };

    const difficulty = technicalConfig?.difficulty || 'easy';
    const company = technicalConfig?.company || 'Any company';
    const lang = technicalConfig ? langKeyMap[technicalConfig.language] || 'cpp' : 'cpp';
    const pair = technicalConfig?.pair || 'arjun-tanya';
    const duration = technicalConfig?.durationMinutes || 20;

    const query = new URLSearchParams({
      difficulty,
      company,
      lang,
      pair,
      duration: String(duration),
      autoStart: 'true',
    });

    router.push(`/interview/technical?${query.toString()}`);
  };

  const interviewTracks = [
    {
      id: 'technical',
      title: 'Technical',
      subtitle: 'Data Structures and Algorithms',
      duration: '20 min',
      href: '/interview/technical',
      icon: Code2,
      isActive: true, // Glowing active card as shown in screenshot
      description: 'Solve a coding problem and explain your approach.',
      criteria: [
        { label: 'problem solving', bold: true },
        { text: ', ' },
        { label: 'clarity of thought', bold: true },
        { text: ' and ' },
        { label: 'code quality', bold: true },
        { text: '.' },
      ],
      interviewerLabel: 'Our top engineers',
      interviewers: [
        { name: 'Arjun', avatarUrl: '/avatars/arjun.jpg' },
        { name: 'Tanya', avatarUrl: '/avatars/tanya.jpg' },
        { name: 'Samarth', avatarUrl: '/avatars/samarth.jpg' },
      ],
    },
    {
      id: 'resume',
      title: 'Resume Roast',
      subtitle: 'Deep dive on your resume',
      duration: '20 min',
      href: '/interview/resume',
      icon: FileText,
      isActive: false,
      description:
        'Every project and internship on your resume, questioned in depth: how it works, why not the obvious alternative, the frameworks you used, and how you measured your numbers.',
      criteria: [
        { label: 'technical depth', bold: true },
        { text: ', ' },
        { label: 'ownership', bold: true },
        { text: ' and ' },
        { label: 'communication', bold: true },
        { text: '.' },
      ],
      interviewerLabel: 'Our top strategists',
      interviewers: [
        { name: 'Vivan', avatarUrl: '/avatars/vivan.jpg' },
        { name: 'Shreya', avatarUrl: '/avatars/shreya.jpg' },
      ],
    },
    {
      id: 'hr',
      title: 'Behavioral',
      subtitle: 'HR & Leadership principles',
      duration: '10 min',
      href: '/interview/hr',
      icon: MessageSquare,
      isActive: false,
      description:
        'A conversational round about you and your past experiences: how you handle conflict, ambiguity, deadlines, and ownership.',
      criteria: [
        { label: 'communication', bold: true },
        { text: ', ' },
        { label: 'self-awareness', bold: true },
        { text: ' and ' },
        { label: 'leadership', bold: true },
        { text: '.' },
      ],
      interviewerLabel: 'Our top partners',
      interviewers: [
        { name: 'Kavya', avatarUrl: '/avatars/kavya.jpg' },
        { name: 'Shubhra', avatarUrl: '/avatars/shubhra.jpg' },
      ],
    },
  ];

  return (
    <AuthGate>
      <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors selection:bg-accent-subtle selection:text-accent">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        {currentStep === 'before-start' ? (
          <BeforeYouStartSection
            onBack={() => setCurrentStep('setup-technical')}
            onStartInterview={handleLaunchInterview}
          />
        ) : currentStep === 'setup-technical' ? (
          <TechnicalRoundSetup
            onBack={() => setCurrentStep('choose')}
            onStart={handleSetupComplete}
          />
        ) : (
          <>
            {/* Step 1 Indicator Header */}
            <div className="mb-8 flex items-baseline">
              <span className="text-accent text-xl sm:text-2xl font-semibold mr-3">
                1
              </span>
              <h1 className="text-sm sm:text-base font-medium text-text-primary tracking-wide">
                Choose your round
              </h1>
            </div>

            {/* 3 Interactive Round Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {interviewTracks.map((track) => {
                const Icon = track.icon;

                return (
                  <Link
                    key={track.id}
                    href={track.href}
                    onClick={(e) => {
                      if (track.id === 'technical') {
                        e.preventDefault();
                        setCurrentStep('setup-technical');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        captureEvent('interview_track_selected', { track: track.id });
                      } else {
                        captureEvent('interview_track_selected', { track: track.id });
                      }
                    }}
                    className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 group cursor-pointer ${
                      track.isActive
                        ? 'bg-surface border-2 border-accent shadow-md ring-1 ring-accent/20'
                        : 'bg-surface border border-border hover:border-border-strong hover:bg-surface-hover'
                    }`}
                  >
                    {/* Ambient glow for active card */}
                    {track.isActive && (
                      <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-accent-subtle blur-2xl pointer-events-none" />
                    )}

                    <div>
                      {/* Card Header Row: Icon + Title/Subtitle + Arrow */}
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3.5">
                          {/* Squircle Icon Container */}
                          <div className="w-12 h-12 rounded-xl bg-accent-subtle border border-accent/20 flex items-center justify-center flex-shrink-0 text-accent shadow-sm group-hover:scale-105 transition-transform">
                            <Icon className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors">
                                {track.title}
                              </h2>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                                {track.duration}
                              </span>
                            </div>
                            <p className="text-xs text-text-muted mt-0.5 font-normal">
                              {track.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Circular Arrow Button */}
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-purple-600 group-hover:border-purple-600 group-hover:text-white dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:group-hover:bg-purple-500/25 dark:group-hover:border-purple-500/40 dark:group-hover:text-white transition-all shadow-sm flex-shrink-0">
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>

                      {/* Body Paragraph */}
                      <p className="text-sm text-text-muted leading-relaxed font-normal mb-4">
                        {track.description}
                      </p>

                      {/* Judged on Line */}
                      <p className="text-sm text-text-muted leading-relaxed font-normal mb-8">
                        Judged on{' '}
                        {track.criteria.map((c, i) =>
                          c.bold ? (
                            <span
                              key={i}
                              className="font-bold text-text-primary dark:text-white"
                            >
                              {c.label}
                            </span>
                          ) : (
                            <span key={i}>{c.text}</span>
                          )
                        )}
                      </p>
                    </div>

                    {/* Bottom Row: Interviewer Portraits */}
                    <div className="pt-4 border-t border-border dark:border-white/10 mt-auto">
                      <span className="text-xs font-medium text-text-muted mb-3 block">
                        {track.interviewerLabel}
                      </span>

                      <div className="flex items-center gap-3">
                        {track.interviewers.map((person, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center gap-1.5 group/person"
                          >
                            <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-purple-500/30 group-hover/person:ring-purple-500 transition-all shadow-sm">
                              <Image
                                src={person.avatarUrl}
                                alt={person.name}
                                fill
                                className="object-cover group-hover/person:scale-105 transition-transform"
                              />
                            </div>
                            <span className="text-[11px] font-mono font-medium text-text-primary dark:text-white/90">
                              {person.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
    </AuthGate>
  );
}
