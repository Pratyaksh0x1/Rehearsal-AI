'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VoicePanel } from '@/components/voice/VoicePanel';
import { EvaluationModal } from '@/components/interview/EvaluationModal';
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

interface RewrittenBullet {
  original: string;
  improved: string;
}

interface ResumeBrainstormData {
  score: number;
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
  const { user } = useAuth();

  // Random executive resume strategist selected from 8-agent Gnani catalog (default Nalini)
  const [resumePanelist, setResumePanelist] = useState<AIPanelist>(AI_PANELISTS[4]);

  const [resumeText, setResumeText] = useState(user?.resumeText || '');
  const [resumeUrl, setResumeUrl] = useState(user?.resumeUrl || '');
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [brainstormData, setBrainstormData] = useState<ResumeBrainstormData | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Chat / Argument state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Evaluation modal
  const [showModal, setShowModal] = useState(false);

  // Initialize random Gnani agent and welcome message
  useEffect(() => {
    const picked = getRandomAgent('resume') || AI_PANELISTS[4];
    setResumePanelist(picked);

    const welcome = `Hello! I'm ${picked.name}, your Executive Resume Strategist at Rehearsal AI. Today, we're going to do an interactive resume brainstorming session. Review or paste your resume text in the editor, and click "Start Resume Brainstorming". I'll analyze your background, suggest high-impact changes (such as replacing passive verbs with quantified engineering metrics), and speak through them with you. When I suggest changes, you can argue or push back anytime — we'll brainstorm the strongest phrasing together!`;

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
      const wantsStream = Boolean(options?.onChunk);

      const res = await fetch('/api/interviews/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(wantsStream ? { Accept: 'text/event-stream' } : {}),
        },
        signal: options?.signal,
        body: JSON.stringify({
          messages: updatedMessages,
          type: 'Resume Review',
          stream: wantsStream,
          resumeSnippet: resumeText.slice(0, 3000),
          interviewerName: resumePanelist.name,
          interviewerRole: resumePanelist.role,
          interviewerPersonality: resumePanelist.personality,
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

        const reply =
          fullReply ||
          'I see your perspective. Let us find an alternative phrasing that highlights your technical ownership without exaggerating metrics.';
        setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
        return reply;
      }

      const data = await res.json();
      const reply =
        data.reply ||
        'I see your perspective. Let us find an alternative phrasing that highlights your technical ownership without exaggerating metrics.';
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

  // Run full LLM resume brainstorm & generate spoken suggestions
  const handleStartBrainstorming = async () => {
    if (!resumeText.trim()) return;
    setIsBrainstorming(true);
    captureEvent('resume_brainstorming_started', { agent: resumePanelist.name });

    try {
      const res = await fetch('/api/interviews/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Resume Review',
          resumeText,
        }),
      });

      const data = await res.json();
      if (data.evaluation) {
        setBrainstormData(data.evaluation);

        // Frame the LLM suggested changes into conversational spoken speech
        const topItem = data.evaluation.topChanges?.[0] || 'quantify your project achievements';
        const sampleBullet = data.evaluation.rewrittenBullets?.[0];

        let spokenIntro = `I've analyzed your resume! Here is my initial assessment: Your overall ATS score is ${data.evaluation.score} out of 100. Our top priority is to ${topItem.toLowerCase()}. `;

        if (sampleBullet) {
          spokenIntro += `For example, instead of "${sampleBullet.original}", I recommend: "${sampleBullet.improved}". How does that feel to you? If you don't have exact metrics or disagree with this rewrite, argue with me and we'll refine it together!`;
        } else {
          spokenIntro += `Take a look at the suggested changes on your right. Feel free to push back or argue on any bullet point!`;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: spokenIntro,
          },
        ]);

        captureEvent('resume_brainstorming_completed', { score: data.evaluation.score });
      }
    } catch (err) {
      console.error('Resume brainstorm error:', err);
    } finally {
      setIsBrainstorming(false);
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
      <Navbar />

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
            {brainstormData && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-bg border border-border hover:bg-surface-hover text-text-primary font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-accent" />
                <span>View Full Audit Report</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStartBrainstorming}
              disabled={isBrainstorming || !resumeText.trim()}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isBrainstorming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Brainstorming Changes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{brainstormData ? 'Re-Analyze Resume' : 'Start Resume Brainstorming'}</span>
                </>
              )}
            </button>
          </div>
        </div>

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

                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
                    Gnani {resumePanelist.model}
                  </span>
                </div>
              </div>

              {/* Debate / Conversation Transcript */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                  >
                    <span className="text-[10px] font-mono text-text-subtle mb-1">
                      {m.role === 'user' ? 'You (Candidate)' : resumePanelist.name}
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
                    {resumePanelist.name} is formulating a response...
                  </div>
                )}
              </div>

              {/* Live Voice & Audio Controls (Strict No-Barge-In with Automatic Voice Activity Detection) */}
              <VoicePanel
                onSendMessage={handleUserMessage}
                isProcessing={isChatLoading}
                panelistName={resumePanelist.name}
                voice={resumePanelist.voice}
                model={resumePanelist.model}
                voiceId={resumePanelist.voiceId}
                initialMessage={messages[0]?.content}
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
                  Ready to Brainstorm Your Resume?
                </h3>
                <p className="text-xs text-text-muted max-w-lg mx-auto leading-relaxed">
                  Paste or review your resume text below and click <strong>&ldquo;Start Resume Brainstorming&rdquo;</strong>. {resumePanelist.name} will analyze your bullet points, identify missing metrics, and speak the suggested changes out loud. You can debate and refine any bullet together.
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

      {/* Scored Evaluation Modal */}
      <EvaluationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type="Resume Review"
        evaluation={brainstormData}
      />

      <Footer />
    </div>
  );
}
