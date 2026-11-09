'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { VoicePanel } from '@/components/voice/VoicePanel';
import { EvaluationModal } from '@/components/interview/EvaluationModal';
import { ProctorCamera } from '@/components/interview/ProctorCamera';
import { InterviewTimer, resetInterviewTimer } from '@/components/interview/InterviewTimer';
import { captureEvent } from '@/lib/analytics/posthog';
import {
  Users,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Award,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { AI_PANELISTS, getRandomAgent, AIPanelist } from '@/config/panels';

const TOTAL_HR_QUESTIONS = 5;

export default function HRRoundPage() {
  const { user } = useAuth();

  // Random HR interviewer picked per session (e.g. Shubhra, Meera, Tia)
  const [hrInterviewer, setHrInterviewer] = useState<AIPanelist>(AI_PANELISTS[2]);

  const [questionCount, setQuestionCount] = useState(1);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Silence & pause detector state refs
  const lastActiveTimeRef = useRef(Date.now());
  const hasNudgedRef = useRef(false);

  // Initialize random HR interviewer & warm greeting
  useEffect(() => {
    const picked = getRandomAgent('hr');
    setHrInterviewer(picked);

    const greeting = `Hello and welcome to your Behavioral HR Interview! I'm ${picked.name}, ${picked.role} at Rehearsal AI. In this round, we'll explore 5 behavioral scenarios using the STAR framework: Situation, Task, Action, and Result. Let's start with Question 1: Could you tell me about a challenging technical conflict you had with a teammate or stakeholder, and how you worked to resolve it?`;

    setMessages([
      {
        role: 'assistant',
        content: greeting,
      },
    ]);
  }, []);

  // Update activity timestamp whenever user speaks or types
  const updateActivity = () => {
    lastActiveTimeRef.current = Date.now();
    hasNudgedRef.current = false;
  };

  // Silence / Natural Pause detector (2–4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActiveTimeRef.current;
      if (
        elapsed >= 3500 &&
        !hasNudgedRef.current &&
        !isProcessing &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'assistant'
      ) {
        hasNudgedRef.current = true;
        // Supportive reminder to the candidate
        const gentlePrompts = [
          "Take your time to structure your thoughts using the STAR format.",
          "Feel free to take a moment to recall a specific project or situation.",
          "I'm listening whenever you're ready to share your story.",
        ];
        const prompt = gentlePrompts[Math.floor(Math.random() * gentlePrompts.length)];

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: prompt,
          },
        ]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, messages]);

  // Handle candidate speech or text message
  const handleUserMessage = async (
    userText: string,
    options?: { onChunk?: (token: string) => void; signal?: AbortSignal }
  ): Promise<string> => {
    updateActivity();

    const updatedMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(updatedMessages);
    setIsProcessing(true);
    captureEvent('hr_user_message_sent', { questionCount });

    try {
      const isFinalQuestion = questionCount >= TOTAL_HR_QUESTIONS;
      const wantsStream = Boolean(options?.onChunk);

      const res = await fetch('/api/interviews/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(wantsStream ? { Accept: 'text/event-stream' } : {}),
        },
        signal: options?.signal,
        body: JSON.stringify({
          messages: [
            ...updatedMessages,
            {
              role: 'user',
              content: `[Context: Candidate answered Question ${questionCount} of ${TOTAL_HR_QUESTIONS}. ${isFinalQuestion
                  ? 'All 5 questions are complete! Congratulate the candidate, provide a positive closing remark, and invite them to click "Finish & Evaluate" for their STAR report.'
                  : `Briefly acknowledge their STAR points (1-2 sentences), then dynamically generate Question ${questionCount + 1
                  } of ${TOTAL_HR_QUESTIONS} exploring ownership, ambiguity, deadlines, or technical leadership.`
                }]`,
            },
          ],
          type: 'HR',
          stream: wantsStream,
          resumeSnippet: user?.resumeText?.slice(0, 1500) || '',
          interviewerName: hrInterviewer.name,
          interviewerRole: hrInterviewer.role,
          interviewerPersonality: hrInterviewer.personality,
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
                  // ignore
                }
              }
            }
          }
        }

        const reply = fullReply || (isFinalQuestion
          ? 'Thank you for completing all questions! Please click "Finish & Evaluate" to view your behavioral evaluation report.'
          : `Thank you for sharing that context. For Question ${questionCount + 1}: Can you describe a project where requirements shifted unexpectedly, and how you adapted?`);

        setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
        if (questionCount < TOTAL_HR_QUESTIONS) {
          setQuestionCount((prev) => prev + 1);
        }
        return reply;
      }

      const data = await res.json();
      const reply =
        data.reply ||
        (isFinalQuestion
          ? 'Thank you for completing all questions! Please click "Finish & Evaluate" to view your behavioral evaluation report.'
          : `Thank you for sharing that context. For Question ${questionCount + 1}: Can you describe a project where requirements shifted unexpectedly, and how you adapted?`);

      setMessages([...updatedMessages, { role: 'assistant', content: reply }]);

      if (questionCount < TOTAL_HR_QUESTIONS) {
        setQuestionCount((prev) => prev + 1);
      }

      return reply;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.log('[HR] Chat request aborted by candidate resumption');
        return '';
      }
      console.error('HR chat error:', err);
      const fallback =
        'Understood. Could you share what the measurable result was, and what you learned from that experience?';
      setMessages([...updatedMessages, { role: 'assistant', content: fallback }]);
      return fallback;
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit interview for final STAR evaluation
  const handleFinishRound = async () => {
    setIsEvaluating(true);
    captureEvent('hr_evaluation_requested');

    try {
      const res = await fetch('/api/interviews/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'HR',
          conversation: messages,
        }),
      });

      const data = await res.json();
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setShowModal(true);
        captureEvent('hr_evaluation_completed', {
          communicationScore: data.evaluation.communicationScore,
          starStructureScore: data.evaluation.starStructureScore,
        });
      }
    } catch (err) {
      console.error('HR evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Top Header Card */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-accent-subtle text-accent border border-accent/20">
              Behavioral & Culture Chamber
            </span>
            <span className="text-sm font-semibold text-text-muted">
              Interviewer: <strong className="text-text-primary">{hrInterviewer.name}</strong> ({hrInterviewer.role})
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-text-subtle px-2 py-0.5 rounded bg-bg border border-border">
              <ShieldCheck className="w-3.5 h-3.5 text-success" /> Proctor Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <InterviewTimer totalMinutes={45} interviewKey="hr" />

            <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-bg border border-border text-text-muted">
              Question {Math.min(questionCount, TOTAL_HR_QUESTIONS)} of {TOTAL_HR_QUESTIONS}
            </span>

            <button
              type="button"
              onClick={handleFinishRound}
              disabled={isEvaluating}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isEvaluating ? 'Evaluating Responses...' : 'Finish & Evaluate'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* LEFT COLUMN: Proctor Camera & STAR Protocol Guidelines (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live Camera Proctor & Continuous Screen Monitoring */}
            <ProctorCamera isMonitoring={true} />

            {/* STAR Protocol Guidelines Card */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-accent" /> STAR Rubric Calibration
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg text-text-subtle border border-border">
                  FAANG Standard
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-bg p-3 rounded-lg border border-border space-y-1">
                  <span className="font-bold font-mono text-accent block">S &bull; Situation</span>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Set the context: team scope, technical challenge, and constraints.
                  </p>
                </div>

                <div className="bg-bg p-3 rounded-lg border border-border space-y-1">
                  <span className="font-bold font-mono text-accent block">T &bull; Task</span>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    What was your exact personal responsibility and expected deliverable?
                  </p>
                </div>

                <div className="bg-bg p-3 rounded-lg border border-border space-y-1">
                  <span className="font-bold font-mono text-accent block">A &bull; Action</span>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Specific steps, engineering trade-offs, and how you unblocked others.
                  </p>
                </div>

                <div className="bg-bg p-3 rounded-lg border border-border space-y-1">
                  <span className="font-bold font-mono text-accent block">R &bull; Result</span>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Measurable impact (% latency, users, team velocity) and key takeaways.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-bg-subtle p-3 text-[11px] text-text-subtle border border-border flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Interviewer Tip:</strong> Speak naturally. Focus on &ldquo;I&rdquo; instead of &ldquo;we&rdquo; to highlight your direct ownership.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: HR Conversation Stream & Voice Chamber (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border border-accent/40 bg-bg flex-shrink-0">
                    <Image
                      src={hrInterviewer.avatarUrl}
                      alt={hrInterviewer.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">
                      {hrInterviewer.name}
                    </h3>
                    <p className="text-[11px] text-text-muted truncate max-w-[240px]">
                      {hrInterviewer.role}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
                    Gnani {hrInterviewer.model}
                  </span>
                </div>
              </div>

              {/* Chat Transcript */}
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                  >
                    <span className="text-[10px] font-mono text-text-subtle mb-1">
                      {m.role === 'user' ? 'You (Candidate)' : hrInterviewer.name}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${m.role === 'user'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-bg text-text-primary border border-border'
                        }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex items-center gap-2 text-xs text-text-subtle italic">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent animate-ping" />
                    {hrInterviewer.name} is evaluating your response...
                  </div>
                )}
              </div>

              {/* Live Voice & Audio Controls (Strict No-Barge-In with Automatic Voice Activity Detection) */}
              <VoicePanel
                onSendMessage={handleUserMessage}
                isProcessing={isProcessing}
                panelistName={hrInterviewer.name}
                voice={hrInterviewer.voice}
                model={hrInterviewer.model}
                voiceId={hrInterviewer.voiceId}
                initialMessage={messages[0]?.content}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Scored Evaluation Modal */}
      <EvaluationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type="HR"
        evaluation={evaluation}
      />
    </div>
  );
}
