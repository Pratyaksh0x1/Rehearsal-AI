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
    duration: '20 min',
    durationMinutes: 20,
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
    duration: '20 min',
    durationMinutes: 20,
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

      {/* Main Configuration Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-9 shadow-sm relative">
        <div className="space-y-8 relative z-10">
          {/* 1. Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-3.5">
              Format
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FORMAT_OPTIONS.map((format) => {
                const isSelected = selectedFormat === format.id;

                return (
                  <div
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`relative rounded-xl p-5 flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? 'border-2 border-accent bg-accent-subtle shadow-sm'
                        : 'border border-border bg-bg-subtle hover:border-border-strong hover:bg-surface-hover'
                    }`}
                  >
                    {/* Suggested Badge */}
                    {format.isSuggested && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                        <span className="bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                          Suggested
                        </span>
                      </div>
                    )}

                    {/* Overlapping Avatars */}
                    <div className="flex items-center justify-center pt-2 mb-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-border shadow-sm z-0">
                        <Image
                          src={format.avatars[0].src}
                          alt={format.avatars[0].name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-border shadow-sm -ml-3 z-10">
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
                            ? 'text-text-primary'
                            : 'text-text-primary'
                        }`}
                      >
                        {format.pairName}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {format.role}
                      </p>
                    </div>

                    {/* Difficulty and Duration */}
                    <div
                      className={`w-full pt-3 border-t text-xs font-medium flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-accent/30 text-accent font-semibold'
                          : 'border-border text-text-muted'
                      }`}
                    >
                      <span className={isSelected ? 'text-accent font-bold' : ''}>
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
            <div className="mt-3.5 flex items-center gap-2 text-xs sm:text-sm text-text-muted">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-accent" />
              <span>{activeFormat.suggestedHint}</span>
            </div>
          </div>

          {/* 2. Company Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Company
            </label>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                className="w-full rounded-xl bg-surface border border-border px-4 py-3.5 text-sm text-text-primary flex items-center justify-between cursor-pointer focus-ring hover:border-border-strong transition-all shadow-sm"
              >
                <span className="font-medium">{selectedCompany}</span>
                <ChevronDown
                  className={`w-4 h-4 text-text-subtle transition-transform duration-200 ${
                    isCompanyDropdownOpen ? 'rotate-180 text-accent' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isCompanyDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-dropdown rounded-xl bg-surface border border-border shadow-xl overflow-hidden py-1.5 max-h-64 overflow-y-auto backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
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
                            ? 'bg-accent-subtle text-accent font-semibold'
                            : 'text-text-primary hover:bg-surface-hover'
                        }`}
                      >
                        <span>{comp}</span>
                        {isCompSelected && <Check className="w-4 h-4 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
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
                    className={`rounded-xl py-3 px-4 text-sm font-medium transition-all duration-150 cursor-pointer text-center select-none focus-ring ${
                      isSelected
                        ? 'border-2 border-accent bg-accent-subtle text-accent font-semibold shadow-sm'
                        : 'border border-border bg-surface text-text-muted hover:border-border-strong hover:text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Bottom Note Banner */}
          <div className="rounded-xl bg-bg-subtle border border-border p-4 text-xs sm:text-sm text-text-muted font-normal leading-relaxed">
            Leave it on <span className="text-text-primary font-semibold">Any company</span>, or pick one to practise the topics reported in its interviews.
          </div>

          {/* 5. Start Interview Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-text-muted">
              Session length:{' '}
              <span className="font-semibold text-text-primary">
                {activeFormat.duration}
              </span>{' '}
              · Interviewer:{' '}
              <span className="font-semibold text-text-primary">
                {activeFormat.pairName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleStartInterview}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg font-semibold text-accent-foreground text-sm sm:text-base bg-accent hover:bg-accent-hover shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer group active:scale-95 focus-ring"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

