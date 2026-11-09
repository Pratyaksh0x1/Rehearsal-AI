'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Check, Sparkles, ArrowRight } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';

export type TechnicalDifficulty = 'easy' | 'medium' | 'hard';
export type TechnicalLanguage = 'C++' | 'Java' | 'Python' | 'JavaScript';

export interface TechnicalSetupConfig {
  difficulty: TechnicalDifficulty;
  company: string;
  language: TechnicalLanguage;
  pair: 'arjun-tanya' | 'samarth-riddhi' | 'vivan-shreya';
  durationMinutes: number;
}

interface TechnicalRoundSetupProps {
  onBack?: () => void;
  onStart?: (config: TechnicalSetupConfig) => void;
}

export const COMPANIES_LIST = [
  'Any company',
  'Google',
  'Meta',
  'Amazon',
  'Microsoft',
  'Apple',
  'Uber',
  'Netflix',
  'Stripe',
  'Goldman Sachs',
];

export const FORMAT_OPTIONS = [
  {
    id: 'easy' as TechnicalDifficulty,
    pairId: 'arjun-tanya' as const,
    pairName: 'Arjun or Tanya',
    role: 'Software developers',
    difficulty: 'Easy',
    duration: '20 min',
    durationMinutes: 20,
    isSuggested: true,
    suggestedHint: 'Suggested: Easy. A friendly warm-up to start with.',
    avatars: [
      { name: 'Arjun', src: '/avatars/arjun.jpg' },
      { name: 'Tanya', src: '/avatars/tanya.jpg' },
    ],
  },
  {
    id: 'medium' as TechnicalDifficulty,
    pairId: 'samarth-riddhi' as const,
    pairName: 'Samarth or Riddhi',
    role: 'Senior engineers',
    difficulty: 'Medium',
    duration: '25 min',
    durationMinutes: 25,
    isSuggested: false,
    suggestedHint: 'Medium: A real company round. Wants specifics, not claims.',
    avatars: [
      { name: 'Samarth', src: '/avatars/samarth.jpg' },
      { name: 'Riddhi', src: '/avatars/riddhi.jpg' },
    ],
  },
  {
    id: 'hard' as TechnicalDifficulty,
    pairId: 'vivan-shreya' as const,
    pairName: 'Vivan or Shreya',
    role: 'Principal engineers',
    difficulty: 'Hard',
    duration: '30 min',
    durationMinutes: 30,
    isSuggested: false,
    suggestedHint: 'Hard: Principal-level problem solving, edge cases, and deep complexity.',
    avatars: [
      { name: 'Vivan', src: '/avatars/vivan.jpg' },
      { name: 'Shreya', src: '/avatars/shreya.jpg' },
    ],
  },
];

export const LANGUAGES: TechnicalLanguage[] = ['C++', 'Java', 'Python', 'JavaScript'];

export function TechnicalRoundSetup({ onBack, onStart }: TechnicalRoundSetupProps) {
  const router = useRouter();

  const [selectedFormat, setSelectedFormat] = useState<TechnicalDifficulty>('easy');
  const [selectedCompany, setSelectedCompany] = useState<string>('Any company');
  const [selectedLanguage, setSelectedLanguage] = useState<TechnicalLanguage>('C++');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFormat =
    FORMAT_OPTIONS.find((f) => f.id === selectedFormat) || FORMAT_OPTIONS[0];

  const handleStartInterview = () => {
    const langKeyMap: Record<TechnicalLanguage, string> = {
      'C++': 'cpp',
      'Java': 'java',
      'Python': 'python',
      'JavaScript': 'javascript',
    };

    const config: TechnicalSetupConfig = {
      difficulty: selectedFormat,
      company: selectedCompany,
      language: selectedLanguage,
      pair: activeFormat.pairId,
      durationMinutes: activeFormat.durationMinutes,
    };

    captureEvent('technical_round_customized', {
      difficulty: selectedFormat,
      company: selectedCompany,
      language: selectedLanguage,
      pair: activeFormat.pairId,
      durationMinutes: activeFormat.durationMinutes,
    });

    if (onStart) {
      onStart(config);
    } else {
      const query = new URLSearchParams({
        difficulty: selectedFormat,
        company: selectedCompany,
        lang: langKeyMap[selectedLanguage],
        pair: activeFormat.pairId,
        duration: String(activeFormat.durationMinutes),
      });
      router.push(`/interview/technical?${query.toString()}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 animate-in fade-in-50 duration-300">
      {/* Top Navigation: Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack ? onBack : () => router.back()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>
      </div>

      {/* Section Title matching screenshot */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text-primary dark:text-white tracking-tight">
          Set up your interview
        </h1>
        <div className="mt-2.5 flex items-baseline">
          <span className="font-serif italic text-purple-600 dark:text-amber-500/90 text-lg sm:text-xl font-normal mr-2.5">
            2
          </span>
          <p className="text-xs sm:text-sm text-text-muted dark:text-zinc-400">
            Set up the technical round
          </p>
        </div>
      </div>

      {/* Main Configuration Card matching screenshot */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-9 shadow-2xl relative backdrop-blur-2xl dark:bg-[#14101e]/90 dark:border-white/10 dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {/* Subtle ambient warm glow in background */}
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="space-y-8 relative z-10">
          {/* 1. Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-muted dark:text-zinc-400 uppercase tracking-wider mb-3.5">
              Format
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FORMAT_OPTIONS.map((format) => {
                const isSelected = selectedFormat === format.id;

                return (
                  <div
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`relative rounded-2xl p-5 flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-2 border-[#e0a055] bg-amber-50/40 dark:bg-[#201518]/90 shadow-[0_0_25px_rgba(224,160,85,0.18)] scale-[1.01]'
                        : 'border border-border bg-card/60 dark:border-white/10 dark:bg-white/[0.02] hover:border-border-hover dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Suggested Badge */}
                    {format.isSuggested && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                        <span className="bg-[#3d2c18] text-[#f59e0b] border border-[#f59e0b]/50 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          Suggested
                        </span>
                      </div>
                    )}

                    {/* Overlapping Avatars */}
                    <div className="flex items-center justify-center pt-2 mb-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-900/60 dark:ring-[#2d1b24] shadow-md z-0">
                        <Image
                          src={format.avatars[0].src}
                          alt={format.avatars[0].name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-900/60 dark:ring-[#2d1b24] shadow-md -ml-3 z-10">
                        <Image
                          src={format.avatars[1].src}
                          alt={format.avatars[1].name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Interviewer Names */}
                    <div className="mb-4">
                      <h3
                        className={`text-sm sm:text-base font-semibold ${
                          isSelected
                            ? 'text-text-primary dark:text-white'
                            : 'text-text-primary dark:text-zinc-200'
                        }`}
                      >
                        {format.pairName}
                      </h3>
                      <p className="text-xs text-text-muted dark:text-zinc-400 mt-0.5">
                        {format.role}
                      </p>
                    </div>

                    {/* Difficulty and Duration */}
                    <div
                      className={`w-full pt-3 border-t text-xs font-medium flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-amber-500/20 text-[#e0a055] font-semibold'
                          : 'border-border dark:border-white/10 text-text-muted dark:text-zinc-400'
                      }`}
                    >
                      <span className={isSelected ? 'text-[#f59e0b] font-bold' : ''}>
                        {format.difficulty}
                      </span>
                      <span>·</span>
                      <span>{format.duration}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Suggestion/Hint Subtext */}
            <div className="mt-3.5 flex items-center gap-2 text-xs sm:text-sm text-[#e0a055] dark:text-[#f6ad55]">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
              <span>{activeFormat.suggestedHint}</span>
            </div>
          </div>

          {/* 2. Company Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-muted dark:text-zinc-400 uppercase tracking-wider mb-2">
              Company
            </label>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                className="w-full rounded-2xl bg-slate-50 dark:bg-[#0f0c1e] border border-border dark:border-white/10 px-4 py-3.5 text-sm text-text-primary dark:text-white flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 hover:border-border-hover dark:hover:border-white/20 transition-all shadow-sm"
              >
                <span className="font-medium">{selectedCompany}</span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted dark:text-zinc-400 transition-transform duration-200 ${
                    isCompanyDropdownOpen ? 'rotate-180 text-amber-500' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isCompanyDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-surface dark:bg-[#161226] border border-border dark:border-white/15 shadow-2xl overflow-hidden py-1.5 max-h-64 overflow-y-auto backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150">
                  {COMPANIES_LIST.map((comp) => {
                    const isCompSelected = selectedCompany === comp;
                    return (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => {
                          setSelectedCompany(comp);
                          setIsCompanyDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                          isCompSelected
                            ? 'bg-amber-500/10 text-amber-600 dark:text-[#f6ad55] font-semibold'
                            : 'text-text-primary dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>{comp}</span>
                        {isCompSelected && <Check className="w-4 h-4 text-amber-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-muted dark:text-zinc-400 uppercase tracking-wider mb-2.5">
              Language
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang;

                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    className={`rounded-2xl py-3 px-4 text-sm font-medium transition-all duration-150 cursor-pointer text-center select-none ${
                      isSelected
                        ? 'border-2 border-[#e0a055] bg-[#221815] text-[#f6ad55] font-semibold shadow-[0_0_18px_rgba(224,160,85,0.22)]'
                        : 'border border-border dark:border-white/10 bg-slate-50 dark:bg-[#0f0c1e] text-text-muted dark:text-zinc-300 hover:border-border-hover dark:hover:border-white/25 hover:text-text-primary dark:hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Bottom Note Banner */}
          <div className="rounded-2xl bg-[#1b151a] border border-[#3b2a26] p-4 text-xs sm:text-sm text-[#c8a98b] font-normal leading-relaxed shadow-inner">
            Leave it on <span className="text-[#f59e0b] font-medium">Any company</span>, or pick one to practise the topics reported in its interviews.
          </div>

          {/* 5. Start Interview Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-text-muted dark:text-zinc-400">
              Session length:{' '}
              <span className="font-semibold text-text-primary dark:text-zinc-200">
                {activeFormat.duration}
              </span>{' '}
              · Interviewer:{' '}
              <span className="font-semibold text-text-primary dark:text-zinc-200">
                {activeFormat.pairName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleStartInterview}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-slate-950 text-sm sm:text-base bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-xl hover:shadow-amber-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group active:scale-95"
            >
              <span>Start interview</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
