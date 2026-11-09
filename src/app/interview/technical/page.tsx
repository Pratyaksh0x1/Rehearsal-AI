'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { CodeEditor, DEFAULT_STARTER_CODE } from '@/components/editor/CodeEditor';
import { ConsoleResults } from '@/components/editor/ConsoleResults';
import { VoicePanel, VoicePanelHandle } from '@/components/voice/VoicePanel';
import { EvaluationModal } from '@/components/interview/EvaluationModal';
import { ProctorCamera } from '@/components/interview/ProctorCamera';
import { InterviewTimer, resetInterviewTimer } from '@/components/interview/InterviewTimer';
import { BeforeYouStartSection } from '@/components/interview/BeforeYouStartSection';
import { EnvironmentSetupAnimation } from '@/components/interview/EnvironmentSetupAnimation';
import { ExecutionResult } from '@/lib/judge';
import { captureEvent } from '@/lib/analytics/posthog';
import {
  ExternalLink,
  Bot,
  Sparkles,
  Lock,
  Eye,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
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

  // Chat conversation state. messagesRef is the source of truth so async voice callbacks never see stale history.
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

  // Interview script state: lobby -> setting-environment -> intro (welcome + briefing) -> live (discussion) 
  const voiceRef = useRef<VoicePanelHandle>(null);
  const [phase, setPhase] = useState<'lobby' | 'setting-environment' | 'intro' | 'live'>(
    autoStartParam ? 'setting-environment' : 'lobby'
  );
  const phaseRef = useRef<'lobby' | 'setting-environment' | 'intro' | 'live'>(
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

  // Silence & pause detector state refs
  const lastActiveTimeRef = useRef(Date.now());
  const hasNudgedRef = useRef(false);

  // Evaluation modal
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

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

  // Update activity timestamp whenever candidate writes code
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    lastActiveTimeRef.current = Date.now();
    hasNudgedRef.current = false;
  };

  // Gentle spoken nudge only after a long idle stretch (45 s) and never while someone is talking
  useEffect(() => {
    const interval = setInterval(() => {
      if (phaseRef.current !== 'live' || hasNudgedRef.current) return;
      if (Date.now() - lastActiveTimeRef.current < 45000) return;
      if (voiceRef.current?.isBusy()) return;
      hasNudgedRef.current = true;
      const nudges = [
        'Take your time. Would you like to talk me through your first idea, or clarify any constraint?',
        'I am here whenever you want to bounce an approach off me, even a brute force one.',
        'Feel free to think out loud. It helps me follow your reasoning.',
      ];
      const nudge = nudges[Math.floor(Math.random() * nudges.length)];
      pushMessage('assistant', nudge);
      void voiceRef.current?.speak(nudge);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Spoken problem briefing
  const buildBriefing = (p: Problem): string => {
    let desc = (p.description || '').replace(/\s+/g, ' ').trim();
    if (desc.length > 520) {
      desc = desc.slice(0, 520);
      const cut = desc.lastIndexOf('. ');
      desc = cut > 200 ? desc.slice(0, cut + 1) : desc;
    }
    const ex = p.examples?.[0];
    const exText = ex ? ` For example, with input ${ex.input}, the expected output is ${ex.output}.` : '';
    const cons = p.constraints && p.constraints.length ? ` Keep in mind: ${p.constraints.slice(0, 2).join('; ')}.` : '';
    return `Your problem today is called ${p.title}, a ${String(p.difficulty || 'medium').toLowerCase()} level problem. ${desc}${exText}${cons}`;
  };

  // Called when the candidate starts the interview: welcome -> how it works -> the problem -> hand over
  const startInterview = async () => {
    if (phaseRef.current === 'live') return;
    phaseRef.current = 'intro';
    setPhase('intro');
    const iv = interviewerRef.current;

    for (let i = 0; i < 50 && !problemRef.current; i++) await new Promise((r) => setTimeout(r, 200));
    const p = problemRef.current;

    const say = async (text: string) => {
      pushMessage('assistant', text);
      await voiceRef.current?.speak(text);
    };

    await say(
      `Hello, and welcome to your technical interview at Rehearsal AI. I'm ${iv.name}, ${iv.role}. Here is how this will go. I will walk you through a coding problem. Then you tell me out loud how you plan to solve it, and we discuss your approach together, so ask me anything or compare options. After that you write the code, run it against the tests, and I will ask about time and space complexity. At the end I will evaluate your performance.`
    );
    if (p) await say(buildBriefing(p));
    else await say('I could not load a problem just now. Please refresh the page and start again.');
    await say('Take a moment to read it. When you are ready, tell me how you would approach it.');

    phaseRef.current = 'live';
    setPhase('live');
    lastActiveTimeRef.current = Date.now();
    hasNudgedRef.current = false;
  };

  // When environment setup completes and phase transitions to 'intro', trigger voice introduction
  useEffect(() => {
    if (phase === 'intro') {
      const timer = setTimeout(() => {
        void startInterview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phase]);

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
      const wantsStream = Boolean(options?.onChunk);

      const res = await fetch('/api/interviews/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(wantsStream ? { Accept: 'text/event-stream' } : {}),
        },
        signal: options?.signal,
        body: JSON.stringify({
          messages: updatedMessages.slice(-24),
          type: 'Technical',
          stream: wantsStream,
          phase: phaseRef.current === 'live' ? 'discussion' : phaseRef.current,
          complexityAsked: complexityAskedRef.current,
          problemTitle: p?.title,
          problem: p
            ? {
                title: p.title,
                difficulty: p.difficulty,
                description: p.description,
                examples: p.examples,
                constraints: p.constraints,
                optimal_complexity: p.optimal_complexity,
                solution_approach: p.solution_approach,
              }
            : undefined,
          currentCode: codeRef.current,
          interviewerName: iv.name,
          interviewerRole: iv.role,
          interviewerPersonality: iv.personality,
        }),
      });

      if (wantsStream && res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullReply = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                try {
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.token) {
                    fullReply += parsed.token;
                    options?.onChunk?.(parsed.token);
                  } else if (parsed.done && parsed.fullText) {
                    fullReply = parsed.fullText;
                  }
                } catch {
                  // ignore non-json SSE lines
                }
              }
            }
          }
        }

        if (/complexity/i.test(fullReply)) complexityAskedRef.current = true;
        pushMessage('assistant', fullReply);
        return fullReply;
      }

      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || 'Empty reply');
      setLlmMock(data.provider === 'mock');
      const reply: string = data.reply;
      if (/complexity/i.test(reply)) complexityAskedRef.current = true;
      pushMessage('assistant', reply);
      return reply;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.log('[Technical] Chat request aborted by candidate resumption');
        return '';
      }
      console.error('Chat error:', err);
      const fallbackReply = 'Sorry, I lost my train of thought for a moment. Could you say that again?';
      pushMessage('assistant', fallbackReply);
      return fallbackReply;
    } finally {
      setIsChatLoading(false);
    }
  };

  // Run code through sandboxed Piston judge against visible test cases
  const handleRunCode = async () => {
    setIsRunningCode(true);
    setExecutionResult(null);
    lastActiveTimeRef.current = Date.now();

    try {
      const res = await fetch('/api/judge/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problemId: problem?.id,
        }),
      });

      const data: ExecutionResult = await res.json();
      setExecutionResult(data);

      if (data.passedAllTests && !complexityAskedRef.current && phaseRef.current === 'live') {
        complexityAskedRef.current = true;
        const q = 'Nice, your solution passes the tests. Now tell me, what are the time and space complexity of your approach, and why?';
        pushMessage('assistant', q);
        void voiceRef.current?.speak(q);
      }

      captureEvent('code_executed_piston', {
        language,
        status: data.status,
        timeMs: data.timeMs,
        passed: data.passedAllTests,
      });
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

  // Submit interview for final evaluation (evaluates visible + hidden test cases)
  const handleSubmitInterview = async () => {
    // The interviewer always asks for complexity before the final evaluation.
    if (phaseRef.current === 'live' && !complexityAskedRef.current && !submitNudgedRef.current) {
      submitNudgedRef.current = true;
      complexityAskedRef.current = true;
      const q = "Before I evaluate you, let's cover complexity. What are the time and space complexity of your solution, and why?";
      pushMessage('assistant', q);
      void voiceRef.current?.speak(q);
      return;
    }
    voiceRef.current?.stopSpeaking();
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
        setShowModal(true);
        resetInterviewTimer('technical');
        resetInterviewTimer(`technical_${difficultyParam || 'standard'}`);
        const ev = data.evaluation;
        const firstSentences = String(ev.feedback || '').split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
        const verdict = `Thanks for the session. You scored ${Math.round(Number(ev.score) || 0)} out of 100. ${firstSentences} Your full breakdown is on the screen.`;
        pushMessage('assistant', verdict);
        void voiceRef.current?.speak(verdict);
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

  const visibleTestCases = problem?.test_cases?.filter((t) => !t.is_hidden) || [];
  const hiddenTestCases = problem?.test_cases?.filter((t) => t.is_hidden) || [];

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
              phaseRef.current = 'intro';
              setPhase('intro');
              setTimeout(() => {
                void startInterview();
              }, 200);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border rounded-xl p-4 shadow-sm">
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
            <span className="text-sm font-semibold text-text-muted">
              Tier: <strong className="text-text-primary">{userRank}</strong>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-text-subtle px-2 py-0.5 rounded bg-bg border border-border">
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
              onClick={handleSubmitInterview}
              disabled={isEvaluating}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isEvaluating ? 'Evaluating Performance...' : 'Submit Interview'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* LEFT COLUMN: Proctor Camera & AI Interviewer Chamber (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live Camera Proctor & Continuous Screen Monitoring */}
            <ProctorCamera isMonitoring={true} />

            {/* AI Interviewer Conversation & Voice Chamber */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-accent/40 bg-bg flex-shrink-0">
                    <Image
                      src={interviewer.avatarUrl}
                      alt={interviewer.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">
                      {interviewer.name}
                    </h3>
                    <p className="text-[11px] text-text-muted truncate max-w-[220px]">
                      {interviewer.role}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
                    Gnani {interviewer.model}
                  </span>
                </div>
              </div>

              {/* Chat Transcript */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {messages.length === 0 && (
                  <p className="text-xs text-text-subtle italic">
                    Press &ldquo;Start voice interview&rdquo; below. {interviewer.name} will welcome you, explain the
                    format and read out the problem.
                  </p>
                )}
                {llmMock && (
                  <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    The interviewer is running in offline demo mode (no working LLM key/model), so replies are canned.
                    Open /api/voice/health to see why.
                  </p>
                )}
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                  >
                    <span className="text-[10px] font-mono text-text-subtle mb-1">
                      {m.role === 'user' ? 'You (Candidate)' : interviewer.name}
                    </span>
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${m.role === 'user'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-bg text-text-primary border border-border'
                        }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-xs text-text-subtle italic">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent animate-ping" />
                    {interviewer.name} is evaluating your response...
                  </div>
                )}
              </div>

              {/* Live Voice & Audio Controls (Strict No-Barge-In with Automatic Voice Activity Detection) */}
              <VoicePanel
                ref={voiceRef}
                autoStart={phase === 'intro'}
                onStart={startInterview}
                onSendMessage={handleUserMessage}
                isProcessing={isChatLoading}
                panelistName={interviewer.name}
                voice={interviewer.voice}
                model={interviewer.model}
                voiceId={interviewer.voiceId}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Problem Specifications, Monaco Editor & Console (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Problem Details & 3 Visible + 2 Hidden Test Cases Card */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-subtle">
                    {problem?.source || 'Rehearsal AI'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-warning-subtle text-warning font-mono">
                    {problem?.difficulty || 'Medium'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullProblem(!showFullProblem)}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                >
                  <span>{showFullProblem ? 'Collapse Spec' : 'Expand Spec'}</span>
                  {showFullProblem ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-text-primary mb-1">
                  {problem?.title || 'Loading Problem Specification...'}
                </h1>

                {problem?.url && (
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline mb-2"
                  >
                    <span>View original link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(problem?.topics || ['Arrays', 'Algorithms']).map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg text-text-muted border border-border"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {showFullProblem && (
                <div className="space-y-4 pt-2 border-t border-border">
                  {problem?.description && (
                    <div className="text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-line bg-bg/50 p-3.5 rounded-lg border border-border">
                      {problem.description}
                    </div>
                  )}

                  {/* Examples */}
                  {problem?.examples && problem.examples.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        Examples
                      </h4>
                      <div className="space-y-2">
                        {problem.examples.map((ex, idx) => (
                          <div
                            key={idx}
                            className="bg-bg p-3 rounded-lg border border-border text-xs font-mono space-y-1"
                          >
                            <div>
                              <span className="text-text-subtle">Input: </span>
                              <span className="text-text-primary">{ex.input}</span>
                            </div>
                            <div>
                              <span className="text-text-subtle">Output: </span>
                              <span className="text-accent font-bold">{ex.output}</span>
                            </div>
                            {ex.explanation && (
                              <p className="text-[11px] text-text-muted font-sans pt-1">
                                {ex.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Cases (3 Visible + 2 Hidden) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        Test Suite (5 Test Cases)
                      </h4>
                      <span className="text-[11px] font-mono text-text-subtle">
                        3 Visible + 2 Hidden Edge Cases
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Visible Test Cases */}
                      {visibleTestCases.map((tc, idx) => (
                        <div
                          key={`vis-${idx}`}
                          className="bg-bg p-2.5 rounded-lg border border-border text-[11px] font-mono space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-success font-bold flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Case {idx + 1}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-subtle text-success">
                              Visible
                            </span>
                          </div>
                          <div className="truncate text-text-muted">
                            <span className="text-text-subtle">In:</span> {tc.input}
                          </div>
                          <div className="truncate text-text-primary font-bold">
                            <span className="text-text-subtle">Exp:</span> {tc.expected_output}
                          </div>
                        </div>
                      ))}

                      {/* Hidden Test Cases */}
                      {hiddenTestCases.map((tc, idx) => (
                        <div
                          key={`hid-${idx}`}
                          className="bg-bg-subtle/80 p-2.5 rounded-lg border border-border/80 text-[11px] font-mono space-y-1 border-dashed"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-text-muted font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-warning" /> Hidden Edge Case {idx + 1}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-subtle text-warning font-semibold">
                              Locked
                            </span>
                          </div>
                          <p className="text-[10px] text-text-subtle font-sans leading-tight">
                            Boundary & extreme constraint case. Evaluated upon interview submission.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Constraints */}
                  {problem?.constraints && problem.constraints.length > 0 && (
                    <div className="text-xs font-mono space-y-1 bg-bg-subtle/40 p-2.5 rounded-lg border border-border">
                      <span className="text-text-subtle uppercase tracking-wider text-[10px] font-bold block mb-1">
                        Constraints:
                      </span>
                      {problem.constraints.map((c, idx) => (
                        <div key={idx} className="text-text-muted">
                          • {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Monaco Code Editor */}
            <div className="h-[480px]">
              <CodeEditor
                code={code}
                onChange={handleCodeChange}
                language={language}
                onLanguageChange={handleLanguageChange}
                onRunCode={handleRunCode}
                isRunning={isRunningCode}
              />
            </div>

            {/* Console / Results Bottom */}
            <ConsoleResults result={executionResult} isRunning={isRunningCode} />
          </div>
        </div>
      </main>

      {/* Evaluation Modal */}
      <EvaluationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type="Technical"
        evaluation={evaluation}
      />
    </div>
  );
}
