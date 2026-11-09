'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Code2, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';

export default function InterviewHubPage() {
  const interviewTracks = [
    {
      id: 'technical',
      title: 'Technical',
      subtitle: 'Data Structures and Algorithms',
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
    <div className="min-h-screen bg-[#0a0818] text-text-primary flex flex-col transition-colors selection:bg-purple-500/30">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        {/* Step Indicator Header matching screenshot */}
        <div className="mb-8 flex items-baseline">
          <span className="font-serif italic text-purple-300 text-xl sm:text-2xl font-normal mr-3">
            1
          </span>
          <h1 className="text-sm sm:text-base font-medium text-white/90 tracking-wide">
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
                onClick={() => captureEvent('interview_track_selected', { track: track.id })}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 group cursor-pointer ${
                  track.isActive
                    ? 'bg-[#141226]/95 border border-purple-500/50 shadow-[0_0_35px_rgba(168,85,247,0.18)] hover:border-purple-400'
                    : 'bg-[#141226]/85 border border-white/10 hover:border-purple-500/40 hover:bg-[#18152e]'
                }`}
              >
                {/* Ambient purple glow for active card */}
                {track.isActive && (
                  <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-purple-600/15 blur-2xl pointer-events-none" />
                )}

                <div>
                  {/* Card Header Row: Icon + Title/Subtitle + Arrow */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3.5">
                      {/* Squircle Icon Container */}
                      <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-300 shadow-inner group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5 text-purple-300" />
                      </div>

                      <div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-purple-200 transition-colors">
                          {track.title}
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5 font-normal">
                          {track.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Circular Arrow Button */}
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-purple-500/25 group-hover:border-purple-500/40 group-hover:text-white transition-all shadow-sm flex-shrink-0">
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
                        <span key={i} className="font-bold text-white">
                          {c.label}
                        </span>
                      ) : (
                        <span key={i}>{c.text}</span>
                      )
                    )}
                  </p>
                </div>

                {/* Bottom Interviewer Avatars Section */}
                <div className="pt-4 border-t border-white/5">
                  {track.interviewerLabel && (
                    <span className="text-[11px] font-mono text-text-subtle font-medium block mb-3">
                      {track.interviewerLabel}
                    </span>
                  )}

                  <div className="flex items-center gap-4">
                    {track.interviewers.map((iv, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 group/iv">
                        <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-purple-500/30 group-hover/iv:ring-purple-400 transition-all shadow-md">
                          <Image
                            src={iv.avatarUrl}
                            alt={iv.name}
                            fill
                            className="object-cover group-hover/iv:scale-105 transition-transform"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-text-muted group-hover/iv:text-white transition-colors">
                          {iv.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
