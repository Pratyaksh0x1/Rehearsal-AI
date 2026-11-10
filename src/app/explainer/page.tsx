'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGate } from '@/components/auth/AuthGate';
import { BlackboardCanvas } from '@/components/explainer/BlackboardCanvas';
import { ExplainerVoicePanel } from '@/components/explainer/ExplainerVoicePanel';
import { LanguageSelectModal } from '@/components/explainer/LanguageSelectModal';
import { getExplainerLanguage, ExplainerLanguage } from '@/config/languages';
import { ExplainerResponse } from '@/lib/llm/schemas';
import { BookOpen, Globe } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';

export default function ConceptExplainerPage() {
  return (
    <AuthGate>
      <ConceptExplainerContent />
    </AuthGate>
  );
}

function ConceptExplainerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');

  const [language, setLanguage] = useState<ExplainerLanguage>(() =>
    getExplainerLanguage(langParam || 'en')
  );
  const [concept, setConcept] = useState<ExplainerResponse | null>(null);
  const [spokenReply, setSpokenReply] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  useEffect(() => {
    if (langParam) {
      setLanguage(getExplainerLanguage(langParam));
    }
  }, [langParam]);

  const handleAskQuestion = async (query: string) => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setSpokenReply(null);
    const updatedHistory = [...chatHistory, { role: 'user' as const, content: query }];
    setChatHistory(updatedHistory);
    captureEvent('explainer_question_asked', { query, language: language.id });

    try {
      const res = await fetch('/api/explainer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          languageId: language.id,
          history: chatHistory,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to explain concept');
      }

      const data = await res.json();
      if (data.result) {
        setConcept(data.result);
        setSpokenReply(data.result.spokenExplanation);
        setChatHistory([
          ...updatedHistory,
          { role: 'assistant', content: data.result.spokenExplanation },
        ]);
        captureEvent('explainer_concept_received', {
          isCsTopic: data.result.isCsTopic,
          title: data.result.blackboardTitle,
          language: language.id,
        });
      }
    } catch (err: any) {
      console.error('Explainer query error:', err);
      // Fallback
      setConcept({
        isCsTopic: true,
        blackboardTitle: 'Connection Notice',
        spokenExplanation: 'Could not fetch explanation. Please verify your connection or retry.',
        explanationText: 'There was a brief network notice while processing your request. Please ask your question again.',
        diagramType: 'none',
        diagram: null,
        codeSnippet: null,
        keyTakeaways: ['Please try asking your question again.'],
      });
      setSpokenReply('There was a brief issue processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (newLang: ExplainerLanguage) => {
    setLanguage(newLang);
    router.replace(`/explainer?lang=${newLang.id}`);
    setSpokenReply(newLang.greeting);
    captureEvent('explainer_language_changed', { newLang: newLang.id });
  };

  const handleClearBoard = () => {
    setConcept(null);
    setSpokenReply(null);
    setChatHistory([]);
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors selection:bg-emerald-500/30 selection:text-emerald-300">
      <Navbar />

      {/* Language Selection Modal */}
      <LanguageSelectModal
        isOpen={isLanguageModalOpen}
        currentLanguageId={language.id}
        onSelectLanguage={handleLanguageChange}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      <main className="flex-1 max-w-[1800px] w-full mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 h-[calc(100dvh-4.5rem)] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-xl px-4 py-2.5 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Concept Explainer</span>
            </span>
            <span className="text-xs sm:text-sm font-semibold text-text-primary hidden md:inline">
              CS Fundamentals & Architecture Blackboard
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Preferred Language Pill */}
            <button
              type="button"
              onClick={() => setIsLanguageModalOpen(true)}
              className="px-3 py-1 rounded-full bg-accent-subtle hover:bg-accent/20 border border-accent/30 text-accent transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm focus-ring"
            >
              <span className="text-sm">{language.flag}</span>
              <span>{language.nativeName} ({language.name})</span>
              <Globe className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Workspace: Blackboard Canvas (7 cols) + Voice Instructor (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden items-stretch">
          {/* LEFT: Chalk Blackboard Canvas */}
          <div className="lg:col-span-7 h-full min-h-0 min-w-0 overflow-hidden">
            <BlackboardCanvas
              concept={concept}
              language={language}
              isLoading={isLoading}
              onClearBoard={handleClearBoard}
              onSelectSampleTopic={(topic) => void handleAskQuestion(topic)}
            />
          </div>

          {/* RIGHT: Voice & Instructor Question Panel */}
          <div className="lg:col-span-5 h-full min-h-0 min-w-0 overflow-hidden">
            <ExplainerVoicePanel
              language={language}
              onAskQuestion={handleAskQuestion}
              isLoading={isLoading}
              spokenReply={spokenReply}
              onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
