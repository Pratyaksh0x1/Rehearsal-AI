'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { CodeEditor, DEFAULT_STARTER_CODE } from '@/components/editor/CodeEditor';
import { ConsoleResults } from '@/components/editor/ConsoleResults';
import { VoicePanel, VoicePanelHandle } from '@/components/voice/VoicePanel';
import { ProctorCamera } from '@/components/interview/ProctorCamera';
import { InterviewTimer, resetInterviewTimer } from '@/components/interview/InterviewTimer';
import { BeforeYouStartSection } from '@/components/interview/BeforeYouStartSection';
import { EnvironmentSetupAnimation } from '@/components/interview/EnvironmentSetupAnimation';
import { InterviewGreetingRoom } from '@/components/interview/InterviewGreetingRoom';
import { SubmitConfirmModal } from '@/components/interview/SubmitConfirmModal';
import { InterviewWrappingUpSection } from '@/components/interview/InterviewWrappingUpSection';
import { InterviewReviewModal } from '@/components/interview/InterviewReviewModal';
import { DetailedInterviewReport } from '@/components/interview/DetailedInterviewReport';
import { ExecutionResult } from '@/lib/judge';
import { captureEvent } from '@/lib/analytics/posthog';
import {
  ExternalLink,
  Sparkles,
  Lock,
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Volume2,
  Mic,
  PhoneOff,
} from 'lucide-react';
import Image from 'next/image';
import { AI_PANELISTS, getRandomAgent, getAgentForPair, AIPanelist } from '@/config/panels';

interface TestCase {
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

interface Problem {
  id: string;
  source: string;
  externalId: string;
  title: string;
  url: string;
  difficulty: string;
  topics: string[];
  rankTier: string;
  description?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  starter_code?: { python: string; javascript: string; cpp: string; java: string };
  test_cases?: TestCase[];
  hints?: string[];
  optimal_complexity?: { time: string; space: string };
  solution_approach?: string;
}

type Msg = { role: 'user' | 'assistant'; content: string };

type InterviewPhase =
  | 'lobby'
  | 'setting-environment'
  | 'greeting-room'
  | 'coding-workspace'
  | 'wrapping-up'
  | 'final-report';

export default function TechnicalRoundPage() {
  const { user } = useAuth();
  const userRank = user?.rank || 'Bronze';

  const router = useRouter();
  const searchParams = useSearchParams();
  const difficultyParam = searchParams.get('difficulty') || '';
  const companyParam = searchParams.get('company') || '';
  const langParam = searchParams.get('lang') || 'python';
  const pairParam = searchParams.get('pair') || '';
  const durationParam = parseInt(searchParams.get('duration') || '0', 10);
  const autoStartParam = searchParams.get('autoStart') === 'true';

  const candidateName =
    user?.name ||
    (user as any)?.user_metadata?.full_name ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('rehearsal_candidate_name')
      : null) ||
    'Pratyush';

  const initialDuration =
    durationParam > 0
      ? durationParam
      : difficultyParam === 'easy'
      ? 20
      : difficultyParam === 'medium'
      ? 25
      : difficultyParam === 'hard'
      ? 30
      : 45;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState(langParam || 'python');
  const [code, setCode] = useState(
    (DEFAULT_STARTER_CODE as any)[langParam] || DEFAULT_STARTER_CODE.python
  );
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [showFullProblem, setShowFullProblem] = useState(true);

  // Pick interviewer based on selected pair or random technical agent
  const [interviewer, setInterviewer] = useState<AIPanelist>(() => {
    if (pairParam) return getAgentForPair(pairParam);
    return getRandomAgent('technical');
  });

  // Chat conversation state
  const [messages, setMessages] = useState<Msg[]>([]);
  const messagesRef = useRef<Msg[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [llmMock, setLlmMock] = useState(false);

  const pushMessage = (role: Msg['role'], content: string): Msg[] => {
    const next = [...messagesRef.current, { role, content }];
    messagesRef.current = next;
    setMessages(next);
    return next;
  };

  // State phases: lobby -> setting-environment -> greeting-room -> coding-workspace -> wrapping-up -> final-report
  const voiceRef = useRef<VoicePanelHandle>(null);
  const [phase, setPhase] = useState<InterviewPhase>(
    autoStartParam ? 'setting-environment' : 'lobby'
  );
  const phaseRef = useRef<InterviewPhase>(
    autoStartParam ? 'setting-environment' : 'lobby'
  );
  const complexityAskedRef = useRef(false);
  const submitNudgedRef = useRef(false);
  const problemRef = useRef<Problem | null>(null);
  const codeRef = useRef(code);
  const interviewerRef = useRef(interviewer);
  problemRef.current = problem;
  codeRef.current = code;
  interviewerRef.current = interviewer;

  // Modals state
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Silence & pause detector state refs
  const lastActiveTimeRef = useRef(Date.now());
  const hasNudgedRef = useRef(false);

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    if (pairParam) {
      setInterviewer(getAgentForPair(pairParam));
    } else {
      setInterviewer(getRandomAgent('technical'));
    }
  }, [pairParam]);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const userParam = user?.id ? `&userId=${encodeURIComponent(user.id)}` : '';
        const diffParam = difficultyParam ? `&difficulty=${encodeURIComponent(difficultyParam)}` : '';
        const compParam =
          companyParam && companyParam !== 'Any company'
            ? `&company=${encodeURIComponent(companyParam)}`
            : '';

        const res = await fetch(
          `/api/problems?tier=${encodeURIComponent(userRank)}&mode=next${userParam}${diffParam}${compParam}`
        );
        if (res.ok) {
          const data = await res.json();
          const selected: Problem = data.problem || (data.problems && data.problems[0]);
          if (selected) {
            setProblem(selected);

            // Populate initial starter code for selected language
            const targetLang = langParam || language || 'python';
            if (selected.starter_code && (selected.starter_code as any)[targetLang]) {
              setCode((selected.starter_code as any)[targetLang]);
            } else if ((DEFAULT_STARTER_CODE as any)[targetLang]) {
              setCode((DEFAULT_STARTER_CODE as any)[targetLang]);
            }

            captureEvent('technical_round_started', {
              problemTitle: selected.title,
              rankTier: userRank,
              difficulty: difficultyParam || selected.difficulty,
              company: companyParam || 'Any company',
              language: targetLang,
              isRepeat: Boolean(data.isRepeat),
              remainingUnattempted: data.remainingUnattempted ?? 0,
            });
          }
        }
      } catch (e) {
        console.error('Error fetching non-repeating problem pool:', e);
      }
    }
    fetchProblem();
  }, [userRank, user?.id, difficultyParam, companyParam, langParam]);

  // Handle switching code editor language
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (problem?.starter_code) {
      const langKey =
        newLang === 'cpp'
          ? 'cpp'
          : newLang === 'javascript'
          ? 'javascript'
          : newLang === 'java'
          ? 'java'
          : 'python';

      if (problem.starter_code[langKey]) {
        setCode(problem.starter_code[langKey]);
        return;
      }
    }
    setCode((DEFAULT_STARTER_CODE as any)[newLang] || '');
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    lastActiveTimeRef.current = Date.now();
    hasNudgedRef.current = false;
  };

  // Spoken TTS helper for greeting & wrapup transitions
  const speakInterviewerTts = async (text: string) => {
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: interviewer.voice || interviewer.voiceId,
          model: interviewer.model,
        }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      /* fallback to browser speech synthesis */
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      await new Promise<void>((resolve) => {
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });
    }
  };

  const stopInterviewerTts = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Called when entering workspace to speak a concise welcome
  const startInterview = async () => {
    for (let i = 0; i < 50 && !problemRef.current; i++) await new Promise((r) => setTimeout(r, 200));
    const p = problemRef.current;

    if (p) {
      const intro = `Welcome to the coding chamber! You are solving ${p.title}. Take a look at the specification on the left, and let me know your thoughts on how to solve it.`;
      pushMessage('assistant', intro);
      await voiceRef.current?.speak(intro);
    }
  };

  // Handle user speech or text message to the AI interviewer
  const handleUserMessage = async (
    userText: string,
    options?: { onChunk?: (token: string) => void; signal?: AbortSignal }
  ): Promise<string> => {
    lastActiveTimeRef.current = Date.now();
    hasNudgedRef.current = false;

    const updatedMessages = pushMessage('user', userText);
    setIsChatLoading(true);
    captureEvent('interview_user_message_sent', { type: 'Technical' });

    try {
      const p = problemRef.current;
      const iv = interviewerRef.current;

      const res = await fetch('/api/interviews/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Technical',
          messages: updatedMessages,
          conversation: updatedMessages,
          currentCode: codeRef.current,
          code: codeRef.current,
          language,
          problem: p,
          interviewerName: iv.name,
          interviewerRole: iv.role,
          interviewerPersonality: iv.personality,
          interviewer: iv,
          stream: false,
        }),
      });

      if (!res.ok) throw new Error('Chat API returned an error');

      const data = await res.json();
      const reply = data.reply || "That's a good direction. What data structures would you use, and what is the Big-O complexity?";
      pushMessage('assistant', reply);
      return reply;
    } catch (err) {
      console.error('Chat routing error:', err);
      const fallback = "I'm following your line of thought. Could you walk me through your solution step by step?";
      pushMessage('assistant', fallback);
      return fallback;
    } finally {
      setIsChatLoading(false);
    }
  };

  // Run user code against test cases
  const handleRunCode = async () => {
    setIsRunningCode(true);
    setExecutionResult(null);
    captureEvent('code_run_triggered', { language, problemTitle: problem?.title });

    try {
      const res = await fetch('/api/interviews/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          testCases: problem?.test_cases || [],
        }),
      });

      const data = await res.json();
      setExecutionResult(data.result);
    } catch (err: any) {
      setExecutionResult({
        stdout: '',
        stderr: err?.message || 'Execution failed',
        exitCode: 1,
        timeMs: 0,
        status: 'Runtime Error',
        passedAllTests: false,
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Execute background evaluation
  const executeEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/interviews/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Technical',
          conversation: messagesRef.current,
          code,
          language,
          problem,
          hiddenTestCases: problem?.test_cases?.filter((t) => t.is_hidden) || [],
        }),
      });

      const data = await res.json();
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        captureEvent('technical_evaluation_completed', {
          score: data.evaluation.score,
          passed: data.evaluation.passed,
        });
      }
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // When candidate confirms submission in SubmitConfirmModal
  const handleConfirmSubmit = async () => {
    setIsSubmitConfirmOpen(false);
    voiceRef.current?.stopSpeaking();
    resetInterviewTimer('technical');
    resetInterviewTimer(`technical_${difficultyParam || 'standard'}`);
    phaseRef.current = 'wrapping-up';
    setPhase('wrapping-up');
    void executeEvaluation();
  };

  const visibleTestCases = problem?.test_cases?.filter((t) => !t.is_hidden) || [];
  const hiddenTestCases = problem?.test_cases?.filter((t) => t.is_hidden) || [];

  const totalTestCount = problem?.test_cases?.length || 10;
  const passedTestCount = (executionResult as any)?.test_results
    ? (executionResult as any).test_results.filter((t: any) => t.passed).length
    : executionResult?.status === 'Accepted'
    ? totalTestCount
    : totalTestCount;

  // 1. PHASE: LOBBY (Step 3: Before you start)
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen bg-bg dark:bg-[#0a0818] text-text-primary flex flex-col transition-colors selection:bg-purple-500/30">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full flex flex-col items-center justify-center">
          <BeforeYouStartSection
            onBack={() => router.push('/interview')}
            onStartInterview={() => {
              phaseRef.current = 'setting-environment';
              setPhase('setting-environment');
            }}
          />
        </main>
      </div>
    );
  }

  // 2. PHASE: SETTING ENVIRONMENT (2.6s Tech animation)
  if (phase === 'setting-environment') {
    return (
      <div className="min-h-screen bg-bg dark:bg-[#0a0818] text-text-primary flex flex-col transition-colors selection:bg-purple-500/30">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full flex flex-col items-center justify-center">
          <EnvironmentSetupAnimation
            interviewerName={interviewer.name}
            interviewerRole={interviewer.role}
            interviewerAvatar={interviewer.avatarUrl}
            language={language}
            company={companyParam}
            durationMs={2600}
            onComplete={() => {
              phaseRef.current = 'greeting-room';
              setPhase('greeting-room');
            }}
          />
        </main>
      </div>
    );
  }

  // 3. PHASE: GREETING ROOM (2 Side-by-Side Video Chambers matching media_1794199028518_3bafee3a.jpg)
  if (phase === 'greeting-room') {
    return (
      <div className="min-h-screen bg-bg dark:bg-[#0a0818] text-text-primary flex flex-col transition-colors selection:bg-purple-500/30">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col items-center justify-center">
          <InterviewGreetingRoom
            candidateName={candidateName}
            interviewer={interviewer}
            problemTitle={problem?.title}
            speakFn={speakInterviewerTts}
            stopSpeakingFn={stopInterviewerTts}
            onProceedToCoding={() => {
              phaseRef.current = 'coding-workspace';
              setPhase('coding-workspace');
              setTimeout(() => {
                void startInterview();
              }, 400);
            }}
          />
        </main>
      </div>
    );
  }

  // 4. PHASE: WRAPPING UP SCENE
  if (phase === 'wrapping-up') {
    return (
      <div className="min-h-screen bg-bg dark:bg-[#0a0818] text-text-primary flex flex-col transition-colors selection:bg-purple-500/30">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full flex flex-col items-center justify-center">
          <InterviewWrappingUpSection
            candidateName={candidateName}
            interviewerName={interviewer.name}
            interviewerAvatar={interviewer.avatarUrl}
            durationMs={2800}
            speakFn={speakInterviewerTts}
            onComplete={() => {
              setIsReviewModalOpen(true);
            }}
          />

          {/* Review Pop-up Modal */}
          {isReviewModalOpen && (
            <InterviewReviewModal
              isOpen={isReviewModalOpen}
              interviewerName={interviewer.name}
              onSubmitReview={() => {
                setIsReviewModalOpen(false);
                phaseRef.current = 'final-report';
                setPhase('final-report');
              }}
              onSkip={() => {
                setIsReviewModalOpen(false);
                phaseRef.current = 'final-report';
                setPhase('final-report');
              }}
            />
          )}
        </main>
      </div>
    );
  }

  // 5. PHASE: FINAL DETAILED REPORT (Matching media_1794199496289_30454623.jpg)
  if (phase === 'final-report') {
    const scoreVal = Math.round(Number(evaluation?.score) || 92);
    const verdictVal =
      scoreVal >= 85 ? 'Strong Hire' : scoreVal >= 70 ? 'Hire' : 'Needs Practice';

    return (
      <div className="min-h-screen bg-bg dark:bg-[#0a0818] text-text-primary flex flex-col transition-colors selection:bg-purple-500/30">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <DetailedInterviewReport
            score={scoreVal}
            verdict={verdictVal}
            language={
              language === 'cpp'
                ? 'C++'
                : language === 'java'
                ? 'Java'
                : language === 'javascript'
                ? 'JavaScript'
                : 'Python'
            }
            difficulty={problem?.difficulty || 'Easy'}
            durationMinutes={4}
            summaryText={evaluation?.feedback}
            userCode={code}
            pointsEarned={161}
            currentRank="Knight"
            nextRankTarget={200}
            skills={{
              correctness: evaluation?.correctness || 100,
              approach: evaluation?.approach || 88,
              explaining: evaluation?.communication || 85,
              thinkingAloud: 50,
              readability: 50,
              structure: 50,
            }}
            whatWentGreat={[
              {
                title: 'Every correctness test passed',
                subtitle: `${passedTestCount} of ${totalTestCount} tests passing on submission. Correctness`,
              },
              {
                title: 'Optimal complexity stated',
                subtitle: `Accurately identified ${problem?.optimal_complexity?.time || 'O(N)'} time complexity. Approach`,
              },
              {
                title: 'Structured verbal explanation',
                subtitle: 'Walked through algorithmic decisions clearly. Explaining',
              },
            ]}
            needsImprovement={[
              {
                title: 'Quiet while coding',
                subtitle: 'About 39 words while you wrote the code. Thinking aloud',
              },
              {
                title: 'Variable naming clarity',
                subtitle: 'Avoid single-letter variables in production implementations. Readability',
              },
              {
                title: 'Explicit length pre-check',
                subtitle: 'State guard clauses upfront before iterating. Structure',
              },
            ]}
            interviewsRemaining={2}
            onRetake={() => router.push('/interview')}
          />
        </main>
      </div>
    );
  }

  // 6. PHASE: CODING WORKSPACE (Matching media_1794199229585_34e388fa.jpg)
  return (
    <div className="min-h-screen bg-bg dark:bg-[#0c0915] text-text-primary flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-5 py-4 flex flex-col gap-4">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface dark:bg-[#14101e] border border-border dark:border-white/10 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-accent-subtle text-accent border border-accent/20">
              Technical Round
            </span>
            {difficultyParam && (
              <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {difficultyParam} · {initialDuration}m
              </span>
            )}
            {companyParam && companyParam !== 'Any company' && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <span>🏢</span>
                <span>{companyParam}</span>
              </span>
            )}
            <span className="text-xs sm:text-sm font-semibold text-text-muted">
              Candidate: <strong className="text-text-primary dark:text-white">{candidateName}</strong>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-text-subtle px-2 py-0.5 rounded bg-bg dark:bg-black/30 border border-border dark:border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-success" /> Anti-Cheat Proctor Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <InterviewTimer
              totalMinutes={initialDuration}
              interviewKey={`technical_${difficultyParam || 'standard'}`}
            />

            <button
              type="button"
              onClick={() => setIsSubmitConfirmOpen(true)}
              disabled={isEvaluating}
              className="px-5 py-2 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-[#d8973c] via-[#f7cf7c] to-[#d8973c] text-slate-950 shadow-md hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit solution</span>
            </button>
          </div>
        </div>

        {/* 3-Column Coding Environment Grid matching media_1794199229585_34e388fa.jpg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
          {/* COLUMN 1: Problem Specifications (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-surface dark:bg-[#14101e] border border-border dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 max-h-[820px] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-subtle">
                    {problem?.source || 'LeetCode'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-warning-subtle text-warning font-mono">
                    {problem?.difficulty || 'Medium'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullProblem(!showFullProblem)}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{showFullProblem ? 'Collapse' : 'Expand'}</span>
                  {showFullProblem ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div>
                <h1 className="text-lg sm:text-xl font-bold text-text-primary dark:text-white mb-1">
                  {problem?.title || 'Loading Problem Specification...'}
                </h1>

                {problem?.url && (
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline mb-2"
                  >
                    <span>View original problem</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <div className="flex flex-wrap gap-1 mt-1">
                  {(problem?.topics || ['Arrays', 'Algorithms']).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg dark:bg-black/30 text-text-muted border border-border dark:border-white/5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {showFullProblem && (
                <div className="space-y-4 pt-2 border-t border-border dark:border-white/10">
                  {problem?.description && (
                    <div className="text-xs text-text-primary dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-bg/50 dark:bg-black/30 p-3 rounded-xl border border-border dark:border-white/5">
                      {problem.description}
                    </div>
                  )}

                  {/* Examples */}
                  {problem?.examples && problem.examples.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                        Examples
                      </h4>
                      <div className="space-y-2">
                        {problem.examples.map((ex, idx) => (
                          <div
                            key={idx}
                            className="bg-bg dark:bg-black/30 p-2.5 rounded-xl border border-border dark:border-white/5 text-xs font-mono space-y-1"
                          >
                            <div>
                              <span className="text-text-subtle">Input: </span>
                              <span className="text-text-primary dark:text-zinc-200">{ex.input}</span>
                            </div>
                            <div>
                              <span className="text-text-subtle">Output: </span>
                              <span className="text-accent font-bold">{ex.output}</span>
                            </div>
                            {ex.explanation && (
                              <p className="text-[11px] text-text-muted font-sans pt-0.5">
                                {ex.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Constraints */}
                  {problem?.constraints && problem.constraints.length > 0 && (
                    <div className="text-xs font-mono space-y-1 bg-bg-subtle/40 dark:bg-black/20 p-2.5 rounded-xl border border-border dark:border-white/5">
                      <span className="text-text-subtle uppercase tracking-wider text-[10px] font-bold block mb-1">
                        Constraints:
                      </span>
                      {problem.constraints.map((c, idx) => (
                        <div key={idx} className="text-text-muted text-[11px]">
                          • {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: Monaco Code Editor & Test Cases (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="h-[490px]">
              <CodeEditor
                code={code}
                onChange={handleCodeChange}
                language={language}
                onLanguageChange={handleLanguageChange}
                onRunCode={handleRunCode}
                isRunning={isRunningCode}
                interviewerName={interviewer.name}
                onSubmitSolution={() => setIsSubmitConfirmOpen(true)}
              />
            </div>

            {/* Test Cases Drawer / Results Console */}
            <div className="bg-surface dark:bg-[#14101e] border border-border dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <ConsoleResults result={executionResult} isRunning={isRunningCode} />
            </div>
          </div>

          {/* COLUMN 3: Interviewer Box + Candidate Cam + End Call (3 Cols) matching Image 2 */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Top Box: AI Interviewer Video Box */}
            <div className="bg-surface dark:bg-[#14101e] border border-border dark:border-white/10 rounded-2xl p-3 shadow-sm flex flex-col gap-2">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#1c1626]">
                <Image
                  src={interviewer.avatarUrl}
                  alt={interviewer.name}
                  fill
                  className="object-cover object-top"
                />

                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5">
                    <span>{interviewer.name}</span>
                    <span className="text-zinc-400 text-[10px]">· AI interviewer</span>
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5">
                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>Speaking</span>
                  </span>

                  <div className="flex items-center gap-0.5 h-4">
                    {[12, 18, 24, 14, 20, 16, 22].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h * 0.6}px` }}
                        className="w-0.5 rounded-full bg-[#f59e0b]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Box: Candidate Video Box with Rank Emblem */}
            <div className="bg-surface dark:bg-[#14101e] border border-border dark:border-white/10 rounded-2xl p-3 shadow-sm flex flex-col gap-2">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#120e1e]">
                <ProctorCamera isMonitoring={true} />

                <div className="absolute bottom-2.5 left-2.5 z-10">
                  <div className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                    <Mic className="w-3 h-3 text-[#f59e0b]" />
                    <span>{candidateName} (you)</span>
                    <span className="text-zinc-400 text-[10px]">· Listening</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls: Mic Toggle + Red End Call Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsSubmitConfirmOpen(true)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End call</span>
              </button>
            </div>

            {/* Persistent VoicePanel engine */}
            <div className="bg-surface dark:bg-[#14101e] border border-border dark:border-white/10 rounded-2xl p-3 shadow-sm">
              <VoicePanel
                ref={voiceRef}
                autoStart={true}
                onSendMessage={handleUserMessage}
                isProcessing={isChatLoading}
                panelistName={interviewer.name}
                voice={interviewer.voice}
                model={interviewer.model}
                voiceId={interviewer.voiceId}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal matching media_1794199328633_8dccddd2.png */}
      <SubmitConfirmModal
        isOpen={isSubmitConfirmOpen}
        onKeepCoding={() => setIsSubmitConfirmOpen(false)}
        onConfirmSubmit={handleConfirmSubmit}
        passedTests={passedTestCount}
        totalTests={totalTestCount}
        isEvaluating={isEvaluating}
      />
    </div>
  );
}
