'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VoicePanel, VoiceStateLabel } from '@/components/voice/VoicePanel';
import { sendChatMessage } from '@/lib/interview/chatClient';
import { ResumeRoastReportSlideOver } from '@/components/interview/ResumeRoastReportSlideOver';
import { InterviewReviewModal } from '@/components/interview/InterviewReviewModal';
import { InterviewTimer, resetInterviewTimer } from '@/components/interview/InterviewTimer';
import { captureEvent } from '@/lib/analytics/posthog';
import {
  FileCheck2,
  Sparkles,
  Loader2,
  ArrowRight,
  MessageSquare,
  Volume2,
  CheckCircle2,
  Copy,
  Check,
  Scale,
  Send,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { AI_PANELISTS, getRandomAgent, AIPanelist } from '@/config/panels';
import { AuthGate } from '@/components/auth/AuthGate';

interface RewrittenBullet {
  original: string;
  improved: string;
}

interface ResumeBrainstormData {
  score: number;
  accuracyAssessment?: string;
  candidateStrengths?: string[];
  resumeImprovements?: string[];
  sectionWiseNotes: {
    summary: string;
    skills: string;
    projects: string;
    experience: string;
    education: string;
    formattingAts: string;
  };
  topChanges: string[];
  rewrittenBullets: RewrittenBullet[];
}

export default function ResumeReviewPage() {
  return (
    <AuthGate>
      <ResumeReviewContent />
    </AuthGate>
  );
}

function ResumeReviewContent() {
  const router = useRouter();
  const { user } = useAuth();

  // Random executive resume strategist selected from 8-agent Gnani catalog (default Nalini)
  const [resumePanelist, setResumePanelist] = useState<AIPanelist>(AI_PANELISTS[4]);

  const [resumeText, setResumeText] = useState(user?.resumeText || '');
  const [resumeUrl, setResumeUrl] = useState(user?.resumeUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brainstormData, setBrainstormData] = useState<ResumeBrainstormData | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [evaluationSource, setEvaluationSource] = useState<{ provider: string; model: string } | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Chat / Argument state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceStateLabel>('Mic Off');
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Sliding report drawer & review modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Initialize random Gnani agent and welcome message
  useEffect(() => {
    const picked = getRandomAgent('resume') || AI_PANELISTS[4];
    setResumePanelist(picked);

    const welcome = `Hello! I'm ${picked.name}, your Executive Resume Strategist at Rehearsal AI. I have your resume loaded and ready. Before we finalize your audit report, let's drill into the work you've done. Can you walk me through the most technically challenging project or internship listed on your resume? What was your core architecture, why did you choose that tech stack, and what metrics did you move?`;

    setMessages([
      {
        role: 'assistant',
        content: welcome,
      },
    ]);
  }, []);

  // Pre-load user profile resume if available
  useEffect(() => {
    async function loadResume() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.resumeText && !resumeText) {
            setResumeText(data.user.resumeText);
          }
          if (data.user?.resumeUrl && !resumeUrl) {
            setResumeUrl(data.user.resumeUrl);
          }
        }
      } catch (err) {
        console.warn('Failed to load user resume:', err);
      }
    }
    loadResume();
  }, [resumeText, resumeUrl]);

  // Handle user speech or text message to the AI resume coach
  const handleUserMessage = async (
    userText: string,
    options?: { onChunk?: (token: string) => void; signal?: AbortSignal }
  ): Promise<string> => {
    const updatedMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(updatedMessages);
    setIsChatLoading(true);
    captureEvent('resume_argument_sent', { agent: resumePanelist.name });

    try {
      const reply = await sendChatMessage({
        body: {
          messages: updatedMessages,
          type: 'Resume Review',
          resumeSnippet: resumeText.slice(0, 3000),
          interviewerName: resumePanelist.name,
          interviewerRole: resumePanelist.role,
          interviewerPersonality: resumePanelist.personality,
        },
        signal: options?.signal,
        onChunk: options?.onChunk,
        fallbackReply:
          'I see your perspective. Let us find an alternative phrasing that highlights your technical ownership without exaggerating metrics.',
      });

      setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
      return reply;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.log('[Resume] Chat request aborted by candidate resumption');
        return '';
      }
      console.error('Chat error:', err);
      const fallbackReply =
        'Fair point on that constraint. We can focus on the architectural complexity and tools used instead of raw user numbers.';
      setMessages([...updatedMessages, { role: 'assistant', content: fallbackReply }]);
      return fallbackReply;
    } finally {
      setIsChatLoading(false);
    }
  };

  // Submit resume & interview discussion for full LLM evaluation
  const handleSubmitResumeRoast = async () => {
    if (!resumeText.trim()) return;
    setIsSubmitting(true);
    setEvaluationError(null);
    captureEvent('resume_roast_submitted', { agent: resumePanelist.name });

    try {
      const res = await fetch('/api/interviews/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Resume Review',
          resumeText,
          conversation: messages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate the resume review.');
      if (!data.evaluation) throw new Error('The resume review response was empty. Please try again.');
      setBrainstormData(data.evaluation);
      setEvaluationSource(data.evaluationSource || null);

      // Frame the LLM evaluation into conversational spoken speech
      const score = data.evaluation.score;
      let spokenIntro = `I've evaluated your project explanations and analyzed your resume! Your overall ATS & defense score is ${score} out of 100. `;
      if (data.evaluation.accuracyAssessment) {
        spokenIntro += `${data.evaluation.accuracyAssessment.slice(0, 160)}. `;
      }
      spokenIntro += `Here is your full audit report with concrete improvements and bullet rewrites.`;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: spokenIntro,
        },
      ]);

      // Automatically bring up the sliding popup with the report and evaluation
      setIsReportOpen(true);
      captureEvent('resume_roast_evaluation_received', { score: data.evaluation.score });
    } catch (err) {
      console.error('Resume submission error:', err);
      setEvaluationError(err instanceof Error ? err.message : 'Failed to generate the resume review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-fill a debate or pushback argument in the chat
  const handleArgueChange = (topic: string, original?: string) => {
    const prompt = original
      ? `I'd like to push back on the suggested rewrite for: "${original}". I don't have those exact metrics because of team constraints. How else can we frame my impact strongly?`
      : `I want to debate this recommendation: "${topic}". Why is this important from a hiring manager's perspective?`;

    handleUserMessage(prompt);
  };

  // Copy improved bullet to clipboard
  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors">
      {/* Hide Navbar during active live interview */}
      {brainstormData && <Navbar />}

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Top Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-accent-subtle text-accent border border-accent/20">
              Interactive Resume Brainstorming
            </span>
            <span className="text-sm font-semibold text-text-muted">
              Strategist: <strong className="text-text-primary">{resumePanelist.name}</strong> ({resumePanelist.role})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Exactly 20-Minute Countdown Timer */}
            <InterviewTimer totalMinutes={20} interviewKey="resume" />

            {brainstormData && (
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="px-4 py-2 rounded-xl bg-bg border border-border hover:bg-surface-hover text-text-primary font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-accent" />
                <span>View Full Audit Report</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmitResumeRoast}
              disabled={isSubmitting || !resumeText.trim()}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit</span>
                </>
              )}
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
          {/* LEFT COLUMN: AI Voice & Argument Chamber (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border border-accent/40 bg-bg flex-shrink-0">
                    <Image
                      src={resumePanelist.avatarUrl}
                      alt={resumePanelist.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">
                      {resumePanelist.name}
                    </h3>
                    <p className="text-[11px] text-text-muted truncate max-w-[220px]">
                      {resumePanelist.role}
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

              {/* Voice-First Experience: Hero Strategist Avatar & Sound Aura */}
              <div className="py-6 px-4 flex flex-col items-center justify-center gap-4 bg-bg/50 rounded-2xl border border-border/60">
                <div className="relative">
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

                  <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 transition-all duration-300 shadow-xl ${
                    voiceState === 'Speaking'
                      ? 'border-accent ring-4 ring-accent/30 scale-105'
                      : voiceState === 'Thinking'
                      ? 'border-amber-400 ring-4 ring-amber-400/30'
                      : voiceState === 'Heard you' || (voiceState === 'Listening' && volumeLevel > 15)
                      ? 'border-emerald-400 ring-4 ring-emerald-400/30 scale-105'
                      : 'border-border ring-1 ring-border'
                  }`}>
                    <Image
                      src={resumePanelist.avatarUrl}
                      alt={resumePanelist.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h4 className="font-bold text-base text-text-primary">
                    {resumePanelist.name}
                  </h4>
                  <p className="text-xs text-text-muted font-mono">
                    {voiceState === 'Speaking'
                      ? `${resumePanelist.name} is advising out loud...`
                      : voiceState === 'Thinking'
                      ? 'Analyzing resume phrasing & metrics...'
                      : voiceState === 'Heard you'
                      ? 'Processing your pushback...'
                      : voiceState === 'Listening'
                      ? 'Listening for your arguments or ideas...'
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
                        {m.role === 'user' ? 'You' : resumePanelist.name}
                      </strong>
                      <p>{m.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Live Voice & Audio Controls */}
              <VoicePanel
                onSendMessage={handleUserMessage}
                isProcessing={isChatLoading}
                panelistName={resumePanelist.name}
                voice={resumePanelist.voice}
                model={resumePanelist.model}
                voiceId={resumePanelist.voiceId}
                initialMessage={messages[0]?.content}
                onStateChange={(state, volume) => {
                  setVoiceState(state);
                  setVolumeLevel(volume);
                }}
              />

              {/* Quick Argument Chips */}
              <div className="pt-2 border-t border-border">
                <span className="text-[10px] font-mono text-text-subtle uppercase tracking-wider block mb-2">
                  Quick Pushback & Debate Prompts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleArgueChange('Lack of quantitative telemetry in my past company')
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-bg hover:bg-surface-hover text-text-muted border border-border text-left transition-colors flex items-center gap-1"
                  >
                    <Scale className="w-3 h-3 text-warning" />
                    <span>&ldquo;I don&apos;t have exact metrics&rdquo;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleArgueChange('Keeping an Objective Statement vs Professional Summary')
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-bg hover:bg-surface-hover text-text-muted border border-border text-left transition-colors flex items-center gap-1"
                  >
                    <Scale className="w-3 h-3 text-warning" />
                    <span>&ldquo;Why remove my Objective?&rdquo;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleArgueChange('Putting Projects before Experience for career switchers')
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-bg hover:bg-surface-hover text-text-muted border border-border text-left transition-colors flex items-center gap-1"
                  >
                    <Scale className="w-3 h-3 text-warning" />
                    <span>&ldquo;Projects vs Experience order&rdquo;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Brainstorming Suggestions & Resume Editor (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Brainstorming Suggested Changes View */}
            {brainstormData ? (
              <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-xs font-mono text-text-subtle uppercase tracking-wider">
                      Brainstorm Assessment
                    </span>
                    <h2 className="text-xl font-black text-text-primary mt-0.5">
                      Recommended Bullet Rewrites & Changes
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-text-subtle block">ATS Impact Score</span>
                    <span className="text-2xl font-black text-accent">{brainstormData.score}/100</span>
                  </div>
                </div>

                {/* Priority Improvements */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-warning" /> Top Priority Action Items
                  </h4>
                  <div className="space-y-2">
                    {brainstormData.topChanges.map((change, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 text-xs text-text-muted bg-bg p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-accent font-bold">{idx + 1}.</span>
                          <span>{change}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleArgueChange(change)}
                          className="text-[11px] text-accent hover:underline flex-shrink-0 font-medium flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Debate</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rewritten Bullets (Original vs Improved) */}
                {brainstormData.rewrittenBullets && brainstormData.rewrittenBullets.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent" /> High-Impact Bullet Rewrites
                    </h4>
                    <div className="space-y-3">
                      {brainstormData.rewrittenBullets.map((bullet, idx) => (
                        <div
                          key={idx}
                          className="bg-bg border border-border rounded-xl p-4 text-xs space-y-3 shadow-sm"
                        >
                          <div>
                            <span className="text-[10px] font-mono text-danger uppercase tracking-wider font-bold block mb-1">
                              Original Bullet:
                            </span>
                            <p className="text-text-muted bg-bg-subtle/50 p-2.5 rounded-lg border border-border/60">
                              {bullet.original}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono text-success uppercase tracking-wider font-bold block mb-1">
                              Suggested FAANG-Caliber Rewrite:
                            </span>
                            <p className="text-text-primary font-medium bg-accent-subtle/30 p-2.5 rounded-lg border border-accent/20">
                              {bullet.improved}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => handleArgueChange('Bullet metric feasibility', bullet.original)}
                              className="text-[11px] text-text-muted hover:text-accent flex items-center gap-1 transition-colors"
                            >
                              <Scale className="w-3 h-3 text-warning" />
                              <span>Argue / Adjust with {resumePanelist.name}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyBullet(bullet.improved, idx)}
                              className="text-[11px] px-2.5 py-1 rounded bg-bg border border-border hover:bg-surface-hover text-text-primary font-semibold flex items-center gap-1 transition-colors"
                            >
                              {copiedIdx === idx ? (
                                <>
                                  <Check className="w-3 h-3 text-success" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Bullet</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Pre-Brainstorm Instructions Banner */
              <div className="bg-surface border border-dashed border-border rounded-xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-accent-subtle text-accent flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-text-primary">
                  Ready to Audit & Defend Your Resume?
                </h3>
                <p className="text-xs text-text-muted max-w-lg mx-auto leading-relaxed">
                  Paste or review your resume text below and click <strong>&ldquo;Submit&rdquo;</strong>. {resumePanelist.name} will analyze your bullet points, identify missing metrics, and generate your comprehensive audit report. You can also debate and refine any bullet together using live voice.
                </p>
              </div>
            )}

            {/* Resume Content View / Editor */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary">
                    Resume Working Draft
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg text-text-muted border border-border">
                    Editable Text
                  </span>
                </div>
                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>View Stored PDF</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste or review your resume text here (Summary, Skills, Work Experience, Projects, Education)..."
                rows={12}
                className="w-full p-3.5 rounded-xl border border-border bg-bg text-text-primary font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent transition-colors resize-y"
              />

              <p className="text-[11px] text-text-subtle font-mono">
                &bull; Update your working draft as you and {resumePanelist.name} agree on improved bullet points.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Sliding Popup with Audit Report and Evaluation */}
      <ResumeRoastReportSlideOver
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        evaluation={brainstormData}
        strategistName={resumePanelist.name}
        strategistRole={resumePanelist.role}
        onContinue={() => {
          setIsReportOpen(false);
          setIsReviewModalOpen(true);
        }}
      />

      {/* Review Modal triggers after user clicks Continue on the report */}
      {isReviewModalOpen && (
        <InterviewReviewModal
          isOpen={isReviewModalOpen}
          interviewerName={resumePanelist.name}
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

      <Footer />
    </div>
  );
}
