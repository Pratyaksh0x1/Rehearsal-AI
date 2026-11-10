'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { VoicePanel, VoiceStateLabel } from '@/components/voice/VoicePanel';
import { sendChatMessage } from '@/lib/interview/chatClient';
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
import { AuthGate } from '@/components/auth/AuthGate';
import { checkProfanity } from '@/lib/moderation/profanity';
import { ConductWarningBanner } from '@/components/interview/ConductWarningBanner';

const TOTAL_HR_QUESTIONS = 5;

export default function HRRoundPage() {
  return (
    <AuthGate>
      <HRRoundContent />
    </AuthGate>
  );
}

function HRRoundContent() {
  const { user } = useAuth();

  // Random HR interviewer picked per session (e.g. Shubhra, Meera, Tia)
  const [hrInterviewer, setHrInterviewer] = useState<AIPanelist>(AI_PANELISTS[2]);

  const [questionCount, setQuestionCount] = useState(1);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [evaluationSource, setEvaluationSource] = useState<{ provider: string; model: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceStateLabel>('Mic Off');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [conductWarning, setConductWarning] = useState<{ isOpen: boolean; matchedWord?: string }>({
    isOpen: false,
  });

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

    // Check for abusive or profane language
    const profCheck = checkProfanity(userText);
    if (profCheck.hasProfanity) {
      setConductWarning({ isOpen: true, matchedWord: profCheck.matchedWord });
      const conductReminder =
        "Please maintain respectful and professional communication throughout this interview round.";
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userText },
        { role: 'assistant', content: conductReminder },
      ]);
      return conductReminder;
    }

    const updatedMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(updatedMessages);
    setIsProcessing(true);
    captureEvent('hr_user_message_sent', { questionCount });

    const isFinalQuestion = questionCount >= TOTAL_HR_QUESTIONS;

    try {
      const reply = await sendChatMessage({
        body: {
          messages: [
            ...updatedMessages,
            {
              role: 'user',
              content: `[Context: Candidate answered Question ${questionCount} of ${TOTAL_HR_QUESTIONS}. ${
                isFinalQuestion
                  ? 'All 5 questions are complete! Congratulate the candidate, provide a positive closing remark, and invite them to click "Finish & Evaluate" for their STAR report.'
                  : `Briefly acknowledge their STAR points (1-2 sentences), then dynamically generate Question ${
                      questionCount + 1
                    } of ${TOTAL_HR_QUESTIONS} exploring ownership, ambiguity, deadlines, or technical leadership.`
              }]`,
            },
          ],
          type: 'HR',
          resumeSnippet: user?.resumeText?.slice(0, 1500) || '',
          interviewerName: hrInterviewer.name,
          interviewerRole: hrInterviewer.role,
          interviewerPersonality: hrInterviewer.personality,
        },
        signal: options?.signal,
        onChunk: options?.onChunk,
        fallbackReply: isFinalQuestion
          ? 'Thank you for completing all questions! Please click "Finish & Evaluate" to view your behavioral evaluation report.'
          : `Thank you for sharing that context. For Question ${
              questionCount + 1
            }: Can you describe a project where requirements shifted unexpectedly, and how you adapted?`,
      });

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
    setEvaluationError(null);
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
      if (!res.ok) throw new Error(data.error || 'Failed to generate the evaluation.');
      if (!data.evaluation) throw new Error('The evaluation response was empty. Please try again.');
      setEvaluation(data.evaluation);
      setEvaluationSource(data.evaluationSource || null);
      setShowModal(true);
      captureEvent('hr_evaluation_completed', {
        communicationScore: data.evaluation.communicationScore,
        starStructureScore: data.evaluation.starStructureScore,
      });
    } catch (err) {
      console.error('HR evaluation error:', err);
      setEvaluationError(err instanceof Error ? err.message : 'Failed to generate the evaluation. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors relative">
      {/* Hide Navbar during active live interview */}
      {showModal && <Navbar />}

      {/* Real-time Conduct / Profanity Warning Banner */}
      <ConductWarningBanner
        isOpen={conductWarning.isOpen}
        matchedWord={conductWarning.matchedWord}
        onDismiss={() => setConductWarning({ isOpen: false })}
      />

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
            <InterviewTimer totalMinutes={10} interviewKey="hr" />

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

        {evaluationError && (
          <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {evaluationError}
          </div>
        )}
        {evaluationSource && (
          <p className="text-xs text-text-subtle">
            Report generated by {evaluationSource.provider} ({evaluationSource.model})
          </p>
        )}

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

                <div className="flex items-center gap-2">
                  {/* Captions toggle - off by default */}
                  <button
                    type="button"
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1 border transition-all ${
                      showCaptions
                        ? 'bg-accent/20 border-accent/40 text-accent font-semibold'
                        : 'bg-bg text-text-muted border-border hover:text-text-primary'
                    }`}
                    title="Toggle speech captions"
                  >
                    <span>CC</span>
                    <span>{showCaptions ? 'Captions On' : 'Captions Off'}</span>
                  </button>

                  <span
                    className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      voiceState === 'Speaking'
                        ? 'bg-accent/20 border-accent text-accent animate-pulse font-bold'
                        : voiceState === 'Thinking'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 animate-pulse'
                        : voiceState === 'Heard you'
                        ? 'bg-teal-500/20 border-teal-400 text-teal-400 animate-pulse'
                        : voiceState === 'Listening'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-bg text-text-subtle border-border'
                    }`}
                  >
                    {voiceState}
                  </span>
                </div>
              </div>

              {/* Voice-First Experience: Hero Avatar & Reactive Sound Orb */}
              <div className="py-8 px-4 flex flex-col items-center justify-center gap-4 bg-bg/50 rounded-2xl border border-border/60">
                <div className="relative">
                  {/* Ambient soundwave halo */}
                  <div
                    className={`absolute -inset-3 rounded-full transition-all duration-300 pointer-events-none ${
                      voiceState === 'Speaking'
                        ? 'bg-accent/30 blur-xl scale-110 animate-pulse'
                        : voiceState === 'Thinking'
                        ? 'bg-amber-400/25 blur-xl scale-105'
                        : voiceState === 'Heard you' || (voiceState === 'Listening' && volumeLevel > 15)
                        ? 'bg-emerald-500/30 blur-xl scale-110'
                        : 'bg-transparent'
                    }`}
                  />

                  <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 transition-all duration-300 shadow-xl ${
                    voiceState === 'Speaking'
                      ? 'border-accent ring-4 ring-accent/30 scale-105'
                      : voiceState === 'Thinking'
                      ? 'border-amber-400 ring-4 ring-amber-400/30'
                      : voiceState === 'Heard you' || (voiceState === 'Listening' && volumeLevel > 15)
                      ? 'border-emerald-400 ring-4 ring-emerald-400/30 scale-105'
                      : 'border-border ring-1 ring-border'
                  }`}>
                    <Image
                      src={hrInterviewer.avatarUrl}
                      alt={hrInterviewer.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h4 className="font-bold text-base text-text-primary">
                    {hrInterviewer.name}
                  </h4>
                  <p className="text-xs text-text-muted font-mono">
                    {voiceState === 'Speaking'
                      ? `${hrInterviewer.name} is speaking...`
                      : voiceState === 'Thinking'
                      ? 'Thinking & evaluating STAR context...'
                      : voiceState === 'Heard you'
                      ? 'Processing your answer...'
                      : voiceState === 'Listening'
                      ? 'Listening for your response...'
                      : 'Microphone inactive'}
                  </p>
                </div>
              </div>

              {/* Optional Captions Drawer (Only shown when toggled ON) */}
              {showCaptions && (
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-xl bg-bg border border-border text-xs leading-relaxed">
                  <div className="text-[10px] font-mono text-text-subtle uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Live Captions (Accessibility)</span>
                    <button
                      onClick={() => setShowCaptions(false)}
                      className="hover:underline text-text-muted"
                    >
                      Hide
                    </button>
                  </div>
                  {messages.slice(-3).map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg ${
                        m.role === 'user'
                          ? 'bg-accent/10 border border-accent/20 text-accent font-medium'
                          : 'bg-surface border border-border text-text-primary'
                      }`}
                    >
                      <strong className="block text-[10px] uppercase font-mono mb-0.5 text-text-muted">
                        {m.role === 'user' ? 'You' : hrInterviewer.name}
                      </strong>
                      <p>{m.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Live Voice & Audio Controls */}
              <VoicePanel
                onSendMessage={handleUserMessage}
                isProcessing={isProcessing}
                panelistName={hrInterviewer.name}
                voice={hrInterviewer.voice}
                model={hrInterviewer.model}
                voiceId={hrInterviewer.voiceId}
                initialMessage={messages[0]?.content}
                onStateChange={(state, volume) => {
                  setVoiceState(state);
                  setVolumeLevel(volume);
                }}
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
