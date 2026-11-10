'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EXPLAINER_LANGUAGES, ExplainerLanguage } from '@/config/languages';
import { Globe, ArrowRight, Check, Sparkles, X, BookOpen } from 'lucide-react';

interface LanguageSelectModalProps {
  isOpen: boolean;
  currentLanguageId?: string;
  onSelectLanguage?: (lang: ExplainerLanguage) => void;
  onClose: () => void;
}

export function LanguageSelectModal({
  isOpen,
  currentLanguageId = 'en',
  onSelectLanguage,
  onClose,
}: LanguageSelectModalProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(currentLanguageId);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const selected =
      EXPLAINER_LANGUAGES.find((l) => l.id === selectedId) || EXPLAINER_LANGUAGES[0];

    if (onSelectLanguage) {
      onSelectLanguage(selected);
      onClose();
    } else {
      router.push(`/explainer?lang=${selected.id}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-overlay backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl p-6 sm:p-8 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-accent-subtle blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-border">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Concept Explainer</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Choose your preferred language
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Select the language you want the voice agent to reply and explain on the blackboard. You can speak or ask questions in any language—speech-to-text will automatically detect it.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10 Languages Grid matching Gnani API catalog */}
        <div className="flex-1 overflow-y-auto py-5 pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXPLAINER_LANGUAGES.map((lang) => {
            const isSelected = selectedId === lang.id;

            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedId(lang.id)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
                  isSelected
                    ? 'bg-accent-subtle border-2 border-accent shadow-sm'
                    : 'bg-bg border-border hover:border-border-strong hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl flex-shrink-0">{lang.flag}</span>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-text-primary group-hover:text-accent transition-colors">
                        {lang.nativeName}
                      </h4>
                      <span className="text-xs text-text-muted font-normal">
                        ({lang.name})
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-text-subtle block mt-0.5">
                      Voice: {lang.voiceName} · Gnani {lang.gnaniCode}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'border border-border text-transparent group-hover:border-accent/40'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
          <p className="text-xs text-text-subtle font-mono hidden sm:block">
            You can change this anytime during your explanation session.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer focus-ring"
            >
              <span>Enter Blackboard Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

