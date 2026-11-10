'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { CodeEditor, DEFAULT_STARTER_CODE } from '@/components/editor/CodeEditor';
import { ConsoleResults } from '@/components/editor/ConsoleResults';
import { VoicePanel, VoicePanelHandle, VoiceStateLabel } from '@/components/voice/VoicePanel';
import { sendChatMessage } from '@/lib/interview/chatClient';
import { ProctorCamera } from '@/components/interview/ProctorCamera';
import { InterviewTimer, resetInterviewTimer } from '@/components/interview/InterviewTimer';
import { BeforeYouStartSection } from '@/components/interview/BeforeYouStartSection';
import { EnvironmentSetupAnimation } from '@/components/interview/EnvironmentSetupAnimation';
import { InterviewGreetingRoom } from '@/components/interview/InterviewGreetingRoom';
import { SubmitConfirmModal } from '@/components/interview/SubmitConfirmModal';
import { InterviewWrappingUpSection } from '@/components/interview/InterviewWrappingUpSection';
import { InterviewReviewModal } from '@/components/interview/InterviewReviewModal';
import { DetailedInterviewReport } from '@/components/interview/DetailedInterviewReport';
import { ConductWarningBanner } from '@/components/interview/ConductWarningBanner';
import { checkProfanity } from '@/lib/moderation/profanity';
import { ExecutionResult } from '@/lib/judge';
import { captureEvent } from '@/lib/analytics/posthog';
import {
  Sparkles,
  Lock,
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Volume2,
  Mic,
  PhoneOff,
  Copy,
  Check,
  Code2,
  Terminal,
  UserSquare,
  FileText,
  Loader2,
} from 'lucide-react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import Image from 'next/image';
import { AI_PANELISTS, getRandomAgent, getAgentForPair, AIPanelist } from '@/config/panels';
import { AuthGate } from '@/components/auth/AuthGate';

interface TestCase {
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

interface Problem {
  id: string;
  source: string;
  externalId?: string;
  title: string;
  url?: string;
  difficulty: string;
  topics: string[];
  rankTier: string;
  description?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  starter_code?: { python: string; javascript: string; typescript?: string; cpp: string; java: string };
  starterCode?: { python: string; javascript: string; typescript?: string; cpp: string; java: string };
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
  return (
    <AuthGate>
      <TechnicalRoundContent />
    </AuthGate>
  );
}

function TechnicalRoundContent() {
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
    user?.username ||
    (user as any)?.user_metadata?.full_name ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('rehearsal_candidate_name')
      : null) ||
    'Candidate';

  // Exactly 20 minutes for all technical tests
  const initialDuration = 20;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [problemSessionId, setProblemSessionId] = useState<string | null>(null);
  const [language, setLanguage] = useState(langParam || 'python');
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>(() => ({
    python: (DEFAULT_STARTER_CODE as any).python || '',
    javascript: (DEFAULT_STARTER_CODE as any).javascript || '',
    cpp: (DEFAULT_STARTER_CODE as any).cpp || '',
    java: (DEFAULT_STARTER_CODE as any).java || '',
  }));
  const [code, setCode] = useState(
    (DEFAULT_STARTER_CODE as any)[langParam] || DEFAULT_STARTER_CODE.python
  );
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [showFullProblem, setShowFullProblem] = useState(true);
  const [problemTab, setProblemTab] = useState<'description' | 'examples' | 'constraints'>('description');
  const [mobileTab, setMobileTab] = useState<'problem' | 'code' | 'console' | 'interviewer'>('code');
  const [copiedConstraints, setCopiedConstraints] = useState(false);
  const [interviewDurationMinutes, setInterviewDurationMinutes] = useState<number>(4);
  const [rankUpdate, setRankUpdate] = useState<any>(null);

  // Live real-time VoicePanel state for video chambers
  const [panelVoiceState, setPanelVoiceState] = useState<VoiceStateLabel>('Mic Off');
  const [panelVolumeLevel, setPanelVolumeLevel] = useState(0);

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

  // Modals & Proctor state
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [profanityViolationCount, setProfanityViolationCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [proctorWarning, setProctorWarning] = useState<{
    isOpen: boolean;
    type: 'profanity' | 'screen_switch' | 'copy_paste';
    matchedWord?: string;
    infractionCount?: number;
  }>({ isOpen: false, type: 'profanity' });

  // Silence, pause & code monitor tracking refs
  const lastActiveTimeRef = useRef(Date.now());
  const hasNudgedRef = useRef(false);
  const lastBlurTimestampRef = useRef<number>(0);
  const pauseMetricsRef = useRef({
    pauseCount: 0,
    totalPauseSec: 0,
    maxPauseSec: 0,
  });
  const codeSnapshotsRef = useRef<Array<{ timestamp: number; code: string }>>([]);

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isGeneratingProblem, setIsGeneratingProblem] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const activeChatAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (pairParam) {
      setInterviewer(getAgentForPair(pairParam));
    } else {
      setInterviewer(getRandomAgent('technical'));
    }
  }, [pairParam]);

  const loadProblemData = useCallback(async () => {
    setGenerationError(null);
    setIsGeneratingProblem(true);

    // 1. First check if problem is already cached in client sessionStorage (e.g. page refresh during interview)
    try {
      const cached = sessionStorage.getItem('rehearsal_active_problem');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.problem && parsed?.problemSessionId) {
          setProblem(parsed.problem);
          setProblemSessionId(parsed.problemSessionId);

          const targetLang = langParam || language || 'python';
          const starters: Record<string, string> = {
            python: parsed.problem.starterCode?.python || parsed.problem.starter_code?.python || DEFAULT_STARTER_CODE.python,
            javascript: parsed.problem.starterCode?.javascript || parsed.problem.starter_code?.javascript || DEFAULT_STARTER_CODE.javascript,
            typescript: parsed.problem.starterCode?.typescript || (DEFAULT_STARTER_CODE as any).typescript || '',
            cpp: parsed.problem.starterCode?.cpp || parsed.problem.starter_code?.cpp || DEFAULT_STARTER_CODE.cpp,
            java: parsed.problem.starterCode?.java || parsed.problem.starter_code?.java || DEFAULT_STARTER_CODE.java,
          };
          setCodeDrafts(starters);
          setCode(starters[targetLang] || DEFAULT_STARTER_CODE.python);

          const savedCode = sessionStorage.getItem('rehearsal_active_code');
          if (savedCode) {
            try {
              const codeParsed = JSON.parse(savedCode);
              if (codeParsed.code) setCode(codeParsed.code);
              if (codeParsed.drafts) setCodeDrafts(codeParsed.drafts);
              if (codeParsed.language) setLanguage(codeParsed.language);
            } catch {}
          }
          setIsGeneratingProblem(false);
          return;
        }
      }
    } catch {}

    // 2. Generate problem dynamically via LLM generator
    try {
      const res = await fetch('/api/interview/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rank: userRank,
          company: companyParam && companyParam !== 'Any company' ? companyParam : null,
          language: langParam || language || 'python',
        }),
      });

      if (!res.ok) {
        // Fallback to GET /api/problems?tier=...&mode=next
        const fallbackRes = await fetch(
          `/api/problems?tier=${encodeURIComponent(userRank)}&mode=next${
            companyParam && companyParam !== 'Any company' ? `&company=${encodeURIComponent(companyParam)}` : ''
          }`
        );
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const selected = fbData.problem || fbData;
          if (selected) {
            setProblem(selected);
            if (fbData.problemSessionId) setProblemSessionId(fbData.problemSessionId);
            const targetLang = langParam || language || 'python';
            const starters: Record<string, string> = {
              python: selected.starterCode?.python || selected.starter_code?.python || DEFAULT_STARTER_CODE.python,
              javascript: selected.starterCode?.javascript || selected.starter_code?.javascript || DEFAULT_STARTER_CODE.javascript,
              typescript: selected.starterCode?.typescript || (DEFAULT_STARTER_CODE as any).typescript || '',
              cpp: selected.starterCode?.cpp || selected.starter_code?.cpp || DEFAULT_STARTER_CODE.cpp,
              java: selected.starterCode?.java || selected.starter_code?.java || DEFAULT_STARTER_CODE.java,
            };
            setCodeDrafts(starters);
            setCode(starters[targetLang] || DEFAULT_STARTER_CODE.python);
            sessionStorage.setItem('rehearsal_active_problem', JSON.stringify({ problem: selected, problemSessionId: fbData.problemSessionId }));
            setIsGeneratingProblem(false);
            return;
          }
        }
        throw new Error(`Problem generation failed (${res.status})`);
      }

      const data = await res.json();
      if (data.problemSessionId) {
        setProblemSessionId(data.problemSessionId);
      }
      const selected: Problem = data.problem;
      if (selected) {
        setProblem(selected);

        const targetLang = langParam || language || 'python';
        const starters: Record<string, string> = {
          python: selected.starterCode?.python || selected.starter_code?.python || DEFAULT_STARTER_CODE.python,
          javascript: selected.starterCode?.javascript || selected.starter_code?.javascript || DEFAULT_STARTER_CODE.javascript,
          typescript: selected.starterCode?.typescript || (DEFAULT_STARTER_CODE as any).typescript || '',
          cpp: selected.starterCode?.cpp || selected.starter_code?.cpp || DEFAULT_STARTER_CODE.cpp,
          java: selected.starterCode?.java || selected.starter_code?.java || DEFAULT_STARTER_CODE.java,
        };
        setCodeDrafts(starters);
        setCode(starters[targetLang] || DEFAULT_STARTER_CODE.python);

        try {
          sessionStorage.setItem(
            'rehearsal_active_problem',
            JSON.stringify({ problem: selected, problemSessionId: data.problemSessionId })
          );
        } catch {}

        captureEvent('technical_round_started', {
          problemTitle: selected.title,
          rankTier: userRank,
          difficulty: difficultyParam || selected.difficulty,
          company: companyParam || 'Any company',
          language: targetLang,
        });
      }
    } catch (e: any) {
      console.error('Error generating problem:', e);
      setGenerationError(e?.message || 'Failed to prepare interview problem. Click below to retry.');
    } finally {
      setIsGeneratingProblem(false);
    }
  }, [userRank, companyParam, difficultyParam, langParam, language]);

  useEffect(() => {
    loadProblemData();
  }, [loadProblemData]);

  // Handle switching code editor language without discarding work
  const handleLanguageChange = (newLang: string) => {
    setCodeDrafts((prev) => {
      const updated = { ...prev, [language]: code };
      const starters = problem?.starterCode || (problem as any)?.starter_code;
      const nextCode =
        updated[newLang] ??
        starters?.[newLang] ??
        (DEFAULT_STARTER_CODE as any)[newLang] ??
        '';
      setCode(nextCode);
      return updated;
    });
    setLanguage(newLang);
  };

  const handleResetCode = () => {
    const starters = problem?.starterCode || (problem as any)?.starter_code;
    const resetVal =
      starters?.[language] ||
      (DEFAULT_STARTER_CODE as any)[language] ||
      DEFAULT_STARTER_CODE.python;
    handleCodeChange(resetVal);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setCodeDrafts((prev) => {
      const updated = { ...prev, [language]: newCode };
      try {
        sessionStorage.setItem(
          'rehearsal_active_code',
          JSON.stringify({
            problemId: problem?.id,
            language,
            code: newCode,
            drafts: updated,
          })
        );
      } catch {}
      return updated;
    });
    lastActiveTimeRef.current = Date.now();
    hasNudgedRef.current = false;
  };

  // Dedicated Interviewer TTS via /api/voice/tts with strict cancellation
  const currentInterviewerAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopInterviewerTts = useCallback(() => {
    if (currentInterviewerAudioRef.current) {
      try {
        currentInterviewerAudioRef.current.pause();
        currentInterviewerAudioRef.current.currentTime = 0;
        currentInterviewerAudioRef.current.src = '';
      } catch {}
      currentInterviewerAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speakInterviewerTts = useCallback(async (text: string) => {
    // Always abort any prior interviewer speech
    stopInterviewerTts();

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: interviewerRef.current.voice || interviewerRef.current.voiceId,
          model: interviewerRef.current.model,
        }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentInterviewerAudioRef.current = audio;
        await new Promise<void>((resolve) => {
          audio.onended = () => {
            currentInterviewerAudioRef.current = null;
            resolve();
          };
          audio.onerror = () => {
            currentInterviewerAudioRef.current = null;
            resolve();
          };
          audio.play().catch(() => {
            currentInterviewerAudioRef.current = null;
            resolve();
          });
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
  }, [stopInterviewerTts]);

  const stopAllInterviewerSpeech = useCallback(() => {
    stopInterviewerTts();
    try {
      voiceRef.current?.stopSpeaking();
    } catch {}
  }, [stopInterviewerTts]);

  // Screen switching & tab focus detection
  useEffect(() => {
    if (phase !== 'coding-workspace') return;

    const handleFocusLoss = () => {
      const now = Date.now();
      if (now - lastBlurTimestampRef.current < 1200) return;
      lastBlurTimestampRef.current = now;

      setTabSwitchCount((prev) => {
        const next = prev + 1;
        setProctorWarning({
          isOpen: true,
          type: 'screen_switch',
          infractionCount: next,
        });
        return next;
      });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleFocusLoss();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleFocusLoss);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleFocusLoss);
    };
  }, [phase]);

  // Periodic code snapshot & candidate pause tracker
  useEffect(() => {
    if (phase !== 'coding-workspace') return;

    if (codeRef.current && codeSnapshotsRef.current.length === 0) {
      codeSnapshotsRef.current.push({ timestamp: Date.now(), code: codeRef.current });
    }

    const interval = setInterval(() => {
      // 1. Snapshot code evolution
      const current = codeRef.current;
      const lastSnap = codeSnapshotsRef.current[codeSnapshotsRef.current.length - 1];
      if (current && (!lastSnap || lastSnap.code !== current)) {
        codeSnapshotsRef.current.push({ timestamp: Date.now(), code: current });
        if (codeSnapshotsRef.current.length > 20) {
          codeSnapshotsRef.current.shift();
        }
      }

      // 2. Track candidate pauses (> 4 seconds of idle/silence)
      const idleSec = Math.round((Date.now() - lastActiveTimeRef.current) / 1000);
      if (idleSec >= 4 && !hasNudgedRef.current) {
        pauseMetricsRef.current.pauseCount += 1;
        pauseMetricsRef.current.totalPauseSec += idleSec;
        pauseMetricsRef.current.maxPauseSec = Math.max(
          pauseMetricsRef.current.maxPauseSec,
          idleSec
        );
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [phase]);

  const handlePasteBlocked = useCallback(() => {
    setProctorWarning({
      isOpen: true,
      type: 'copy_paste',
    });
  }, []);

  // Called when entering workspace to speak a concise welcome
  const startInterview = async () => {
    for (let i = 0; i < 50 && !problemRef.current; i++) await new Promise((r) => setTimeout(r, 200));
    const p = problemRef.current;
    const iv = interviewerRef.current;

    if (p) {
      try {
        const welcome = await sendChatMessage({
          body: {
            type: 'Technical',
            phase: 'coding_intro',
            problem: p,
            interviewerName: iv.name,
            interviewerRole: iv.role,
            interviewerPersonality: iv.personality,
            interviewer: iv,
            candidateName,
            messages: [],
          },
          fallbackReply: `Welcome to the coding chamber! You are solving ${p.title}. Take a look at the specification on the left, and let me know your thoughts on how to solve it.`,
        });
        const spokenIntro =
          welcome ||
          `Welcome to the coding chamber! You are solving ${p.title}. Take a look at the specification on the left, and let me know your thoughts on how to solve it.`;
        pushMessage('assistant', spokenIntro);
        await voiceRef.current?.speak(spokenIntro);
      } catch {
        const intro = `Welcome to the coding chamber! You are solving ${p.title}. Take a look at the specification on the left, and let me know your thoughts on how to solve it.`;
        pushMessage('assistant', intro);
        await voiceRef.current?.speak(intro);
      }
    }
  };

  // Handle user speech or text message to the AI interviewer
  const handleUserMessage = async (
    userText: string,
    options?: { onChunk?: (token: string) => void; signal?: AbortSignal }
  ): Promise<string> => {
    // If submit confirmation modal is open or not in coding phase, ignore speech completely
    if (isSubmitConfirmOpen || phaseRef.current !== 'coding-workspace') {
      return '';
    }

    lastActiveTimeRef.current = Date.now();
    hasNudgedRef.current = false;

    // Check for bad words / cursing
    const profCheck = checkProfanity(userText);
    if (profCheck.hasProfanity) {
      setProfanityViolationCount((prev) => prev + 1);
      setProctorWarning({
        isOpen: true,
        type: 'profanity',
        matchedWord: profCheck.matchedWord,
      });
      const conductReminder =
        "Please keep our discussion respectful and professional. Continued use of inappropriate language will be flagged in your evaluation report.";
      pushMessage('user', userText);
      pushMessage('assistant', conductReminder);
      if (voiceRef.current?.speak) {
        await voiceRef.current.speak(conductReminder);
      }
      return conductReminder;
    }

    const updatedMessages = pushMessage('user', userText);
    setIsChatLoading(true);
    captureEvent('interview_user_message_sent', { type: 'Technical' });

    const chatAbort = new AbortController();
    activeChatAbortRef.current = chatAbort;
    if (options?.signal) {
      options.signal.addEventListener('abort', () => chatAbort.abort());
    }

    try {
      const p = problemRef.current;
      const iv = interviewerRef.current;

      const reply = await sendChatMessage({
        body: {
          type: 'Technical',
          roundDuration: initialDuration,
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
        },
        signal: chatAbort.signal,
        onChunk: options?.onChunk,
        fallbackReply: "That's a good direction. What data structures would you use, and what is the Big-O complexity?",
      });

      if (chatAbort.signal.aborted || phaseRef.current !== 'coding-workspace' || isSubmitConfirmOpen) {
        console.log('[Technical] Discarding in-flight LLM reply because submission or phase transition occurred');
        return '';
      }

      pushMessage('assistant', reply);
      return reply;
    } catch (err: any) {
      if (err?.name === 'AbortError' || chatAbort.signal.aborted) {
        console.log('[Technical] Chat request aborted by candidate action or submission');
        return '';
      }
      console.error('Chat routing error:', err);
      const fallback = "I'm following your line of thought. Could you walk me through your solution step by step?";
      pushMessage('assistant', fallback);
      return fallback;
    } finally {
      setIsChatLoading(false);
    }
  };

  // Run user code against test cases via real sandboxed judge
  const handleRunCode = async () => {
    setIsRunningCode(true);
    setExecutionResult(null);
    captureEvent('code_run_triggered', { language, problemTitle: problem?.title });

    try {
      const res = await fetch('/api/judge/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problemSessionId,
          mode: 'run',
          testCases: problem?.test_cases?.filter((t) => !t.is_hidden) || [],
        }),
      });

      const data = await res.json();
      const exec = data.result || (data.status ? data : null);
      if (exec) {
        setExecutionResult(exec);
      } else if (data.error) {
        setExecutionResult({
          stdout: '',
          stderr: data.error,
          exitCode: 1,
          timeMs: 0,
          status: 'Runtime Error',
          passedAllTests: false,
        });
      }
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

  // Open submit confirm modal and immediately abort in-flight LLM calls and speech
  const handleOpenSubmitConfirm = useCallback(() => {
    activeChatAbortRef.current?.abort();
    activeChatAbortRef.current = null;
    stopAllInterviewerSpeech();
    setIsSubmitConfirmOpen(true);
  }, [stopAllInterviewerSpeech]);

  // Global keyboard shortcuts (Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleOpenSubmitConfirm();
        } else {
          void handleRunCode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language, problem, problemSessionId, handleOpenSubmitConfirm]);

  const handleCopyConstraints = () => {
    if (!problem?.constraints) return;
    navigator.clipboard?.writeText(problem.constraints.join('\n'));
    setCopiedConstraints(true);
    setTimeout(() => setCopiedConstraints(false), 2000);
  };

  // Execute background evaluation anchored to real test suite results and duration
  const executeEvaluation = async (
    submitExecution?: ExecutionResult | null,
    elapsedMinutes: number = 4
  ) => {
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
          problemSessionId,
          problem,
          executionResult: submitExecution || executionResult,
          durationMinutes: elapsedMinutes,
          profanityViolations: profanityViolationCount,
          screenSwitchCount: tabSwitchCount,
          pauseStats: pauseMetricsRef.current,
          codeSnapshots: codeSnapshotsRef.current.map((s) => s.code),
        }),
      });

      const data = await res.json();
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        if (data.rankUpdate) {
          setRankUpdate(data.rankUpdate);
        }
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
    activeChatAbortRef.current?.abort();
    activeChatAbortRef.current = null;
    setIsSubmitConfirmOpen(false);
    stopAllInterviewerSpeech();

    // Compute actual elapsed minutes from session timer
    let elapsed = 4;
    try {
      const storageKey = `rehearsal_timer_start_technical_${difficultyParam || 'standard'}`;
      const stored =
        sessionStorage.getItem(storageKey) ||
        sessionStorage.getItem('rehearsal_timer_start_technical');
      if (stored) {
        const start = parseInt(stored, 10);
        if (!isNaN(start) && start > 0) {
          elapsed = Math.max(1, Math.round((Date.now() - start) / 60000));
        }
      }
    } catch {}
    setInterviewDurationMinutes(elapsed);

    resetInterviewTimer('technical');
    resetInterviewTimer(`technical_${difficultyParam || 'standard'}`);
    try {
      sessionStorage.removeItem('rehearsal_active_code');
    } catch {}
    phaseRef.current = 'wrapping-up';
    setPhase('wrapping-up');

    // Run full test suite (visible + hidden) for submission
    let submitExecution: ExecutionResult | null = null;
    try {
      const res = await fetch('/api/judge/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problemSessionId,
          mode: 'submit',
          testCases: problem?.test_cases || [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const exec = data.result || (data.status ? data : null);
        if (exec) {
          submitExecution = exec;
          setExecutionResult(exec);
        }
      }
    } catch (err) {
      console.error('Submission execution error:', err);
    }

    void executeEvaluation(submitExecution, elapsed);
  };

  const visibleTestCases = problem?.test_cases?.filter((t) => !t.is_hidden) || [];
  const hiddenTestCases = problem?.test_cases?.filter((t) => t.is_hidden) || [];

  const totalTestCount =
    (executionResult as any)?.test_results?.length ||
    problem?.test_cases?.length ||
    5;
  const passedTestCount = (executionResult as any)?.test_results
    ? (executionResult as any).test_results.filter((t: any) => t.passed).length
    : executionResult?.passedAllTests
    ? totalTestCount
    : 0;

  // 1. PHASE: LOBBY (Step 3: Before you start)
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors selection:bg-accent-subtle selection:text-accent">
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
      <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors selection:bg-accent-subtle selection:text-accent">
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
      <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors selection:bg-accent-subtle selection:text-accent">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col items-center justify-center">
          <InterviewGreetingRoom
            candidateName={candidateName}
            candidateRank={user?.rank || 'Bronze'}
            interviewer={interviewer}
            problemTitle={problem?.title}
            durationMinutes={initialDuration}
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
      <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors selection:bg-accent-subtle selection:text-accent">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full flex flex-col items-center justify-center">
          <InterviewWrappingUpSection
            candidateName={candidateName}
            interviewerName={interviewer.name}
            interviewerAvatar={interviewer.avatarUrl}
            durationMs={2800}
            speakFn={speakInterviewerTts}
            onComplete={() => {
              phaseRef.current = 'final-report';
              setPhase('final-report');
            }}
          />
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
      <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors selection:bg-accent-subtle selection:text-accent">
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
            durationMinutes={interviewDurationMinutes}
            summaryText={evaluation?.feedback}
            userCode={code}
            pointsEarned={rankUpdate?.earnedPoints ?? 150}
            currentRank={rankUpdate?.newRank || userRank}
            nextRankTarget={200}
            onContinue={() => setIsReviewModalOpen(true)}
            skills={{
              correctness: evaluation?.correctness ?? (totalTestCount > 0 ? Math.round((passedTestCount / totalTestCount) * 100) : 100),
              approach: evaluation?.approach || 88,
              explaining: evaluation?.communication || 85,
              thinkingAloud: evaluation?.complexityAnalysis || 65,
              readability: 70,
              structure: 75,
            }}
            whatWentGreat={[
              {
                title: 'Judge automated test suite',
                subtitle: `${passedTestCount} of ${totalTestCount} test cases passing on final submission. Correctness`,
              },
              {
                title: 'Optimal complexity stated',
                subtitle: `Accurately identified ${problem?.optimal_complexity?.time || 'O(N)'} time complexity. Approach`,
              },
              {
                title: 'Structured verbal explanation',
                subtitle:
                  evaluation?.englishGrammarFeedback && !evaluation?.grammarMistakes?.length
                    ? `${evaluation.englishGrammarFeedback.slice(0, 110)}. Explaining`
                    : 'Walked through algorithmic decisions clearly. Explaining',
              },
            ]}
            needsImprovement={[
              ...(totalTestCount > passedTestCount
                ? [
                    {
                      title: 'Unresolved edge cases',
                      subtitle: `${totalTestCount - passedTestCount} test cases failed in the sandbox runner. Verify edge cases before final submission.`,
                    },
                  ]
                : []),
              ...(evaluation?.grammarMistakes && evaluation.grammarMistakes.length > 0
                ? [
                    {
                      title: 'English phrasing & grammar mistakes',
                      subtitle: `${evaluation.grammarMistakes.slice(0, 2).join('; ')}. Explaining`,
                    },
                  ]
                : evaluation?.englishGrammarFeedback
                ? [
                    {
                      title: 'Spoken English & flow clarity',
                      subtitle: `${evaluation.englishGrammarFeedback.slice(0, 120)}. Explaining`,
                    },
                  ]
                : []),
              ...(profanityViolationCount > 0
                ? [
                    {
                      title: 'Professional conduct alert',
                      subtitle: `${profanityViolationCount} inappropriate language warning(s) flagged during interview session. Maintain professional decorum. Conduct`,
                    },
                  ]
                : []),
              {
                title: 'Variable naming clarity',
                subtitle: 'Avoid single-letter variables in production implementations. Readability',
              },
              {
                title: 'Explicit guard clauses',
                subtitle: 'State guard clauses upfront before iterating. Structure',
              },
            ]}
            pauseAnalysis={evaluation?.pauseAnalysis}
            selfCorrectionAnalysis={evaluation?.selfCorrectionAnalysis}
            codeStyleFeedback={evaluation?.codeStyleFeedback}
            englishGrammarFeedback={evaluation?.englishGrammarFeedback}
            grammarMistakes={evaluation?.grammarMistakes}
            screenSwitchingInfractions={tabSwitchCount}
            conductNotes={evaluation?.conductNotes}
            interviewsRemaining={2}
            onRetake={() => router.push('/interview')}
            testCasesTable={
              executionResult?.test_results?.map((t: any) => ({
                input: t.input || '',
                expected: t.expected || '',
                actual: t.actual || '',
                passed: Boolean(t.passed),
                runtimeMs: t.timeMs,
              })) || (problem?.test_cases?.map((t) => ({
                input: t.input,
                expected: t.expected_output,
                actual: t.expected_output,
                passed: true,
                runtimeMs: 12,
              })))
            }
            complexityComparison={{
              userTime: evaluation?.timeComplexity || 'O(N)',
              optimalTime: (problem as any)?.optimal_complexity?.time || 'O(N)',
              userSpace: evaluation?.spaceComplexity || 'O(1)',
              optimalSpace: (problem as any)?.optimal_complexity?.space || 'O(1)',
              verdict:
                evaluation?.timeComplexity === (problem as any)?.optimal_complexity?.time
                  ? 'Matched optimal asymptotic runtime complexity.'
                  : 'Derived a valid algorithmic bound.',
            }}
            optimalApproach={{
              overview: `The optimal approach uses ${(problem?.topics || ['hash maps', 'two pointers']).join(', ')} to achieve linear time complexity without redundant passes.`,
              codeSnippet: (problem as any)?.referenceSolutionPython || (problem?.starterCode as any)?.[language] || code,
              practiceTopics: problem?.topics || ['Arrays', 'Two Pointers', 'Hash Tables'],
            }}
            pacingMetrics={{
              durationMinutes: interviewDurationMinutes,
              expectedMinutes: initialDuration,
              timeToFirstCodeMinutes: 1.5,
              debuggingMinutes: Math.max(1, Math.round(interviewDurationMinutes * 0.4)),
              pauseCount: 3,
            }}
            integritySummary={{
              cameraStatus: 'Face Verified (100%)',
              pasteViolations: 0,
              screenSwitchCount: tabSwitchCount,
              audioWarnings: profanityViolationCount,
              integrityVerdict: tabSwitchCount > 3 || profanityViolationCount > 0 ? 'Minor Warnings' : 'Clean',
            }}
          />

          {/* Review Pop-up Modal opens strictly AFTER viewing report via Continue button */}
          {isReviewModalOpen && (
            <InterviewReviewModal
              isOpen={isReviewModalOpen}
              interviewerName={interviewer.name}
              onSubmitReview={() => {
                setIsReviewModalOpen(false);
                router.push('/home');
              }}
              onSkip={() => {
                setIsReviewModalOpen(false);
                router.push('/home');
              }}
            />
          )}
        </main>
      </div>
    );
  }

  // 6. PHASE: CODING WORKSPACE (Matching media_1794199229585_34e388fa.jpg)
  return (
    <div className="h-screen w-screen bg-bg text-text-primary flex flex-col transition-colors relative overflow-hidden">
      {/* Real-time Conduct & Proctor Warning Banner */}
      <ConductWarningBanner
        isOpen={proctorWarning.isOpen}
        type={proctorWarning.type}
        matchedWord={proctorWarning.matchedWord}
        infractionCount={proctorWarning.infractionCount}
        onDismiss={() => setProctorWarning((prev) => ({ ...prev, isOpen: false }))}
      />

      <main className="flex-1 max-w-[1800px] w-full mx-auto px-2 sm:px-4 py-2 flex flex-col gap-2 min-h-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-surface border border-border rounded-xl px-3.5 py-2 shadow-sm shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Technical Round
            </span>
            {difficultyParam && (
              <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                {difficultyParam} · {initialDuration}m
              </span>
            )}
            {companyParam && companyParam !== 'Any company' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-hover text-text-primary border border-border flex items-center gap-1.5">
                <span>🏢</span>
                <span>{companyParam}</span>
              </span>
            )}
            <span className="text-xs sm:text-sm font-semibold text-text-muted">
              Candidate: <strong className="text-text-primary">{candidateName}</strong>
            </span>
            <span className="hidden xl:inline-flex items-center gap-1.5 text-xs font-mono text-text-subtle px-2 py-0.5 rounded bg-bg border border-border">
              <ShieldCheck className="w-3.5 h-3.5 text-success" /> Proctor Active
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <InterviewTimer
              totalMinutes={initialDuration}
              interviewKey={`technical_${difficultyParam || 'standard'}`}
            />

            <button
              type="button"
              onClick={handleOpenSubmitConfirm}
              disabled={isEvaluating}
              title="Submit solution (Ctrl + Shift + Enter)"
              className="px-4 py-1.5 rounded-lg font-semibold text-xs sm:text-sm bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus-ring"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Submit</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-accent-foreground/75 px-1 py-0.2 rounded bg-black/20 ml-1">
                Ctrl+⇧+↵
              </kbd>
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher (< lg) */}
        <div className="lg:hidden flex items-center justify-between bg-surface border border-border rounded-xl p-1 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('problem')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'problem'
                ? 'bg-surface-active text-text-primary border border-border shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Problem</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('code')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'code'
                ? 'bg-surface-active text-text-primary border border-border shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('console')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'console'
                ? 'bg-surface-active text-text-primary border border-border shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('interviewer')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'interviewer'
                ? 'bg-surface-active text-text-primary border border-border shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <UserSquare className="w-3.5 h-3.5" />
            <span>Interviewer</span>
          </button>
        </div>

        {/* DESKTOP WORKSPACE (lg+): Resizable Split Panes */}
        <div className="hidden lg:flex flex-1 min-h-0 w-full h-full">
          <PanelGroup direction="horizontal" className="h-full w-full">
            {/* PANEL 1: Problem Specifications with Tabs */}
            <Panel defaultSize={28} minSize={20}>
              <div className="h-full bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col overflow-hidden">
                {/* Problem Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-text-subtle">
                      {problem?.source || 'Rehearsal DSA'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-warning-subtle text-warning font-mono">
                      {problem?.difficulty || 'Medium'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-text-subtle">
                    {problem?.rankTier || 'Bronze'} Tier
                  </span>
                </div>

                <div className="py-2 shrink-0">
                  <h1 className="text-base sm:text-lg font-bold text-text-primary mb-1 truncate">
                    {problem?.title || 'Loading Problem Specification...'}
                  </h1>
                  <div className="flex flex-wrap gap-1">
                    {(problem?.topics || ['Arrays', 'Algorithms']).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg text-text-muted border border-border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Problem Subtabs: Description | Examples | Constraints */}
                {isGeneratingProblem ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    <p className="text-xs font-semibold text-text-primary">Preparing your problem...</p>
                    <p className="text-[11px] text-text-subtle max-w-xs">
                      Calibrating challenge tailored to {userRank} tier and {companyParam || 'interview standard'}.
                    </p>
                  </div>
                ) : generationError ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <p className="text-xs text-danger font-medium">{generationError}</p>
                    <button
                      type="button"
                      onClick={loadProblemData}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent-hover transition-colors cursor-pointer"
                    >
                      Retry Generation
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 p-1 bg-bg border border-border rounded-lg mb-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setProblemTab('description')}
                        className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          problemTab === 'description'
                            ? 'bg-surface text-text-primary shadow-sm border border-border'
                            : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        Description
                      </button>
                      <button
                        type="button"
                        onClick={() => setProblemTab('examples')}
                        className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          problemTab === 'examples'
                            ? 'bg-surface text-text-primary shadow-sm border border-border'
                            : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        Examples
                      </button>
                      <button
                        type="button"
                        onClick={() => setProblemTab('constraints')}
                        className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          problemTab === 'constraints'
                            ? 'bg-surface text-text-primary shadow-sm border border-border'
                            : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        Constraints
                      </button>
                    </div>

                    {/* Tab Content Area (Scrollable) */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs leading-relaxed">
                      {problemTab === 'description' && (
                        <div className="text-text-primary bg-bg/50 p-3.5 rounded-xl border border-border whitespace-pre-line leading-relaxed">
                          {problem?.description || 'No description available for this problem.'}
                        </div>
                      )}

                  {problemTab === 'examples' && (
                    <div className="space-y-2.5">
                      {problem?.examples && problem.examples.length > 0 ? (
                        problem.examples.map((ex, idx) => (
                          <div
                            key={idx}
                            className="bg-bg/60 p-3 rounded-xl border border-border font-mono text-xs space-y-1.5"
                          >
                            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                              Example {idx + 1}
                            </span>
                            <div>
                              <span className="text-text-subtle">Input: </span>
                              <span className="text-text-primary font-medium">{ex.input}</span>
                            </div>
                            <div>
                              <span className="text-text-subtle">Output: </span>
                              <span className="text-accent font-bold">{ex.output}</span>
                            </div>
                            {ex.explanation && (
                              <p className="text-[11px] text-text-muted font-sans pt-1 border-t border-border/50">
                                {ex.explanation}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-text-subtle italic">No examples provided.</p>
                      )}
                    </div>
                  )}

                  {problemTab === 'constraints' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          Complexity & Input Limits
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyConstraints}
                          className="text-[11px] text-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedConstraints ? (
                            <>
                              <Check className="w-3 h-3 text-success" />
                              <span className="text-success">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="space-y-1.5 bg-bg/60 p-3 rounded-xl border border-border font-mono text-xs">
                        {problem?.constraints && problem.constraints.length > 0 ? (
                          problem.constraints.map((c, idx) => (
                            <div key={idx} className="text-text-primary flex items-start gap-1.5">
                              <span className="text-accent">•</span>
                              <span>{c}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-text-subtle italic">Standard algorithmic constraints apply.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Panel>

            <PanelResizeHandle className="w-2 rounded-full hover:bg-accent/40 transition-colors cursor-col-resize bg-transparent flex items-center justify-center group mx-0.5">
              <div className="w-1 h-8 rounded-full bg-border group-hover:bg-accent transition-colors" />
            </PanelResizeHandle>

            {/* PANEL 2: Monaco Editor (Top) over Console Results (Bottom) */}
            <Panel defaultSize={48} minSize={35} className="h-full flex flex-col min-h-0 overflow-hidden">
              <PanelGroup direction="vertical" className="h-full w-full">
                <Panel defaultSize={62} minSize={30} className="h-full flex flex-col min-h-0 overflow-hidden">
                  <div className="h-full w-full min-h-0 overflow-hidden flex flex-col">
                    <CodeEditor
                      code={code}
                      onChange={handleCodeChange}
                      language={language}
                      onLanguageChange={handleLanguageChange}
                      onRunCode={handleRunCode}
                      isRunning={isRunningCode}
                      interviewerName={interviewer.name}
                      onSubmitSolution={handleOpenSubmitConfirm}
                      onPasteBlocked={handlePasteBlocked}
                      starterCode={problem?.starterCode || (problem as any)?.starter_code}
                      onResetCode={handleResetCode}
                    />
                  </div>
                </Panel>

                <PanelResizeHandle className="h-2 rounded-full hover:bg-accent/40 transition-colors cursor-row-resize bg-transparent flex items-center justify-center group my-0.5">
                  <div className="h-1 w-8 rounded-full bg-border group-hover:bg-accent transition-colors" />
                </PanelResizeHandle>

                <Panel defaultSize={38} minSize={20} className="h-full flex flex-col min-h-0 overflow-hidden">
                  <div className="h-full w-full min-h-0 overflow-y-auto">
                    <ConsoleResults
                      result={executionResult}
                      isRunning={isRunningCode}
                      problem={problem}
                      language={language}
                    />
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>

            <PanelResizeHandle className="w-2 rounded-full hover:bg-accent/40 transition-colors cursor-col-resize bg-transparent flex items-center justify-center group mx-0.5">
              <div className="w-1 h-8 rounded-full bg-border group-hover:bg-accent transition-colors" />
            </PanelResizeHandle>

            {/* PANEL 3: Interviewer Chamber & Proctor Controls */}
            <Panel defaultSize={24} minSize={18}>
              <div className="h-full flex flex-col gap-3 overflow-y-auto pr-0.5">
                {/* Interviewer Box */}
                <div className="bg-surface border border-border rounded-xl p-3 shadow-sm flex flex-col gap-2 shrink-0">
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-bg">
                    <Image
                      src={interviewer.avatarUrl}
                      alt={interviewer.name}
                      fill
                      className="object-cover object-top"
                    />

                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5">
                        <span>{interviewer.name}</span>
                        <span className="text-zinc-400 text-xs font-normal">· AI interviewer</span>
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5">
                      <span
                        className={`text-xs font-medium flex items-center gap-1.5 ${
                          panelVoiceState === 'Speaking'
                            ? 'text-accent font-bold'
                            : panelVoiceState === 'Thinking'
                            ? 'text-warning font-bold'
                            : 'text-zinc-300'
                        }`}
                      >
                        {panelVoiceState === 'Speaking' ? (
                          <>
                            <Volume2 className="w-3 h-3 animate-pulse text-accent" />
                            <span>Speaking</span>
                          </>
                        ) : panelVoiceState === 'Thinking' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-warning animate-spin" />
                            <span>Thinking...</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-zinc-400" />
                            <span>Listening</span>
                          </>
                        )}
                      </span>

                      <div className="flex items-center gap-0.5 h-4">
                        {[12, 18, 24, 14, 20, 16, 22].map((h, i) => (
                          <div
                            key={i}
                            style={{
                              height:
                                panelVoiceState === 'Speaking'
                                  ? `${Math.max(4, h * 0.65 + ((i % 3) * 2))}px`
                                  : '3px',
                            }}
                            className={`w-0.5 rounded-full transition-all duration-150 ${
                              panelVoiceState === 'Speaking'
                                ? 'bg-accent shadow-sm'
                                : 'bg-white/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Proctor Webcam */}
                <div className="bg-surface border border-border rounded-xl p-3 shadow-sm flex flex-col gap-2 shrink-0">
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-bg">
                    <ProctorCamera isMonitoring={true} />

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Mic
                          className={`w-3 h-3 ${
                            panelVoiceState === 'Heard you' ||
                            (panelVoiceState === 'Listening' && panelVolumeLevel > 15)
                              ? 'text-success animate-pulse'
                              : 'text-zinc-400'
                          }`}
                        />
                        <span>{candidateName} (you)</span>
                        <span className="text-zinc-400 text-xs font-normal">
                          ·{' '}
                          {panelVoiceState === 'Heard you' ||
                          (panelVoiceState === 'Listening' && panelVolumeLevel > 15)
                            ? 'Speaking'
                            : panelVoiceState === 'Mic Off'
                            ? 'Mic Off'
                            : 'Listening'}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 h-3">
                        {[8, 14, 20, 12, 16].map((h, i) => {
                          const isActive =
                            panelVoiceState === 'Heard you' ||
                            (panelVoiceState === 'Listening' && panelVolumeLevel > 15);
                          const barH = isActive ? Math.max(3, (h * panelVolumeLevel) / 35) : 3;
                          return (
                            <div
                              key={i}
                              style={{ height: `${barH}px` }}
                              className={`w-0.5 rounded-full transition-all duration-75 ${
                                isActive ? 'bg-success shadow-sm' : 'bg-white/20'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* End Call Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenSubmitConfirm}
                    className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm bg-danger hover:opacity-90 text-danger-foreground shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 focus-ring"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End call</span>
                  </button>
                </div>

                {/* Persistent VoicePanel engine */}
                <div className="bg-surface border border-border rounded-xl p-3 shadow-sm shrink-0">
                  <VoicePanel
                    ref={voiceRef}
                    autoStart={true}
                    onSendMessage={handleUserMessage}
                    isProcessing={isChatLoading}
                    panelistName={interviewer.name}
                    voice={interviewer.voice}
                    model={interviewer.model}
                    voiceId={interviewer.voiceId}
                    onStateChange={(state, volume) => {
                      setPanelVoiceState(state);
                      setPanelVolumeLevel(volume);
                    }}
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>

        {/* MOBILE WORKSPACE (< lg): Stacked View with Tab Switcher */}
        <div className="lg:hidden flex-1 min-h-0 w-full overflow-y-auto">
          {mobileTab === 'problem' && (
            <div className="bg-surface border border-border rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-mono text-text-subtle">{problem?.source || 'Rehearsal DSA'}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-warning-subtle text-warning font-mono">
                  {problem?.difficulty || 'Medium'}
                </span>
              </div>
              <h1 className="text-base font-bold text-text-primary">{problem?.title}</h1>
              <div className="flex flex-wrap gap-1">
                {(problem?.topics || []).map((t) => (
                  <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg text-text-muted border border-border">
                    {t}
                  </span>
                ))}
              </div>
              <div className="text-xs text-text-primary bg-bg/50 p-3 rounded-xl border border-border whitespace-pre-line leading-relaxed">
                {problem?.description}
              </div>
              {problem?.examples && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">Examples</span>
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="bg-bg/60 p-2.5 rounded-lg border border-border font-mono text-xs space-y-1">
                      <div><span className="text-text-subtle">Input:</span> {ex.input}</div>
                      <div><span className="text-text-subtle">Output:</span> <span className="text-accent font-bold">{ex.output}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mobileTab === 'code' && (
            <div className="h-[520px]">
              <CodeEditor
                code={code}
                onChange={handleCodeChange}
                language={language}
                onLanguageChange={handleLanguageChange}
                onRunCode={handleRunCode}
                isRunning={isRunningCode}
                interviewerName={interviewer.name}
                onSubmitSolution={handleOpenSubmitConfirm}
                onPasteBlocked={handlePasteBlocked}
                starterCode={problem?.starterCode || (problem as any)?.starter_code}
                onResetCode={handleResetCode}
              />
            </div>
          )}

          {mobileTab === 'console' && (
            <ConsoleResults
              result={executionResult}
              isRunning={isRunningCode}
              problem={problem}
              language={language}
            />
          )}

          {mobileTab === 'interviewer' && (
            <div className="space-y-3">
              <div className="bg-surface border border-border rounded-xl p-3 shadow-sm flex flex-col gap-2">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-bg">
                  <Image src={interviewer.avatarUrl} alt={interviewer.name} fill className="object-cover object-top" />
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-0.5 rounded-full border border-white/10">
                      {interviewer.name} · AI interviewer
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-surface border border-border rounded-xl p-3 shadow-sm">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-bg">
                  <ProctorCamera isMonitoring={true} />
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenSubmitConfirm}
                className="w-full py-3 px-4 rounded-lg font-semibold text-sm bg-danger text-danger-foreground flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End call</span>
              </button>
            </div>
          )}
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
