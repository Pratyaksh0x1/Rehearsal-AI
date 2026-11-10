'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Mic, ArrowRight, Volume2, Sparkles, Shield, User, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AIPanelist } from '@/config/panels';
import { checkProfanity } from '@/lib/moderation/profanity';
import { ConductWarningBanner } from './ConductWarningBanner';
import { sendGreetingChatMessage } from '@/lib/interview/chatClient';

interface InterviewGreetingRoomProps {
  candidateName: string;
  candidateRank?: string;
  interviewer: AIPanelist;
  problemTitle?: string;
  isProblemLoading: boolean;
  problemLoadError: string | null;
  onRetryProblem: () => void;
  durationMinutes?: number;
  onProceedToCoding: () => void;
  speakFn?: (text: string) => Promise<void>;
  stopSpeakingFn?: () => void;
}

type GreetingPhase =
  | 'interviewer_greeting'
  | 'candidate_answering'
  | 'interviewer_speaking'
  | 'interviewer_transition'
  | 'ready_to_code';

export function InterviewGreetingRoom({
  candidateName,
  candidateRank = 'Bronze',
  interviewer,
  problemTitle,
  isProblemLoading,
  problemLoadError,
  onRetryProblem,
  durationMinutes = 20,
  onProceedToCoding,
  speakFn,
  stopSpeakingFn,
}: InterviewGreetingRoomProps) {
  const [greetingPhase, setGreetingPhase] = useState<GreetingPhase>('interviewer_greeting');
  const [candidateReply, setCandidateReply] = useState<string>('');
  const [interviewerSpeechText, setInterviewerSpeechText] = useState<string>('');
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
  const [candidateSpeaking, setCandidateSpeaking] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([14, 26, 38, 20, 32, 44, 28, 16, 22]);
  const [conductWarning, setConductWarning] = useState<{ isOpen: boolean; matchedWord?: string }>({
    isOpen: false,
  });

  // Critical State & Synchronization Refs
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Conversation Memory Ref: complete history of turns for this meeting room
  const messagesRef = useRef<Array<{ role: 'assistant' | 'user'; content: string }>>([]);

  // Concurrency & Lock Refs
  const processingRef = useRef(false);
  const interviewerSpeakingRef = useRef(false);
  const isCandidateTurnRef = useRef(false);

  // Latest props & callbacks stored in refs to avoid stale closures
  const speakFnRef = useRef(speakFn);
  speakFnRef.current = speakFn;
  const stopSpeakingFnRef = useRef(stopSpeakingFn);
  stopSpeakingFnRef.current = stopSpeakingFn;
  const onProceedToCodingRef = useRef(onProceedToCoding);
  onProceedToCodingRef.current = onProceedToCoding;

  // Initialize candidate camera feed once
  useEffect(() => {
    let mounted = true;
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setHasCameraPermission(true);

        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.play().catch(console.warn);
        }
      } catch (err) {
        console.warn('Could not acquire candidate webcam stream:', err);
      }
    }
    void initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Ensure video element plays as soon as stream or ref mounts
  useEffect(() => {
    if (userVideoRef.current && streamRef.current) {
      if (userVideoRef.current.srcObject !== streamRef.current) {
        userVideoRef.current.srcObject = streamRef.current;
      }
      userVideoRef.current.play().catch(console.warn);
    }
  }, [hasCameraPermission]);

  // Audio volume analyzer: monitors candidate mic level, strictly ignores while interviewer is speaking
  useEffect(() => {
    let mounted = true;
    let animId: number;

    async function initMicAudio() {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (!mounted) {
          audioStream.getTracks().forEach((t) => t.stop());
          return;
        }
        audioStreamRef.current = audioStream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(audioStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!mounted) return;

          // Ignore microphone meter completely while interviewer is speaking
          if (interviewerSpeakingRef.current) {
            setCandidateSpeaking(false);
            animId = requestAnimationFrame(checkVolume);
            return;
          }

          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;

          // Detect active candidate speech
          if (avg > 18) {
            setCandidateSpeaking(true);
          } else {
            setCandidateSpeaking(false);
          }

          animId = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (e) {
        console.warn('Microphone stream init failed for greeting room:', e);
      }
    }

    void initMicAudio();

    return () => {
      mounted = false;
      cancelAnimationFrame(animId);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  // Safe helper to restart browser speech recognition without carrying past transcript buffers
  const restartRecognition = useCallback(() => {
    if (!mountedRef.current || !isCandidateTurnRef.current || processingRef.current || interviewerSpeakingRef.current) {
      return;
    }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let silenceTimer: NodeJS.Timeout | null = null;

      recognition.onresult = (event: any) => {
        // Drop any incoming speech results if locked or if interviewer is speaking
        if (processingRef.current || interviewerSpeakingRef.current || !isCandidateTurnRef.current) {
          return;
        }

        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        const trimmed = transcript.trim();
        if (trimmed.length > 0) {
          setCandidateReply(trimmed);
          if (silenceTimer) clearTimeout(silenceTimer);

          // Auto-submit candidate response after natural speech pause
          silenceTimer = setTimeout(() => {
            if (trimmed.length > 1 && !processingRef.current && isCandidateTurnRef.current) {
              void handleCandidateUtteranceRef.current(trimmed);
            }
          }, 1400);
        }
      };

      recognition.onerror = (e: any) => {
        if (e?.error !== 'no-speech' && e?.error !== 'aborted') {
          console.warn('SpeechRecognition notice:', e?.error || e);
        }
      };

      recognition.onend = () => {
        if (
          mountedRef.current &&
          isCandidateTurnRef.current &&
          !processingRef.current &&
          !interviewerSpeakingRef.current
        ) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
    }
  }, []);

  // Main Candidate Utterance Handler: processes speech or quick chips with LLM intent detection
  const handleCandidateUtterance = async (userText: string) => {
    const trimmed = (userText || '').trim();
    if (!trimmed || processingRef.current) return;

    // Acquire lock synchronously to prevent double submissions or echo
    processingRef.current = true;
    isCandidateTurnRef.current = false;

    // Stop recognition immediately so event.results doesn't buffer past text
    try {
      recognitionRef.current?.abort();
    } catch {}

    // Profanity & conduct check
    const profCheck = checkProfanity(trimmed);
    if (profCheck.hasProfanity) {
      setConductWarning({ isOpen: true, matchedWord: profCheck.matchedWord });
      setCandidateSpeaking(false);
      setInterviewerSpeaking(true);
      interviewerSpeakingRef.current = true;

      const reminder = 'Please keep our discussion respectful and professional.';
      setInterviewerSpeechText(reminder);

      if (speakFnRef.current) {
        await speakFnRef.current(reminder);
      } else {
        await new Promise((r) => setTimeout(r, 2200));
      }

      setInterviewerSpeaking(false);
      interviewerSpeakingRef.current = false;
      setCandidateReply('');
      processingRef.current = false;
      isCandidateTurnRef.current = true;
      restartRecognition();
      return;
    }

    setCandidateReply(trimmed);
    setCandidateSpeaking(true);
    await new Promise((r) => setTimeout(r, 450));
    setCandidateSpeaking(false);

    // Record candidate turn in conversation memory
    messagesRef.current.push({ role: 'user', content: trimmed });

    setGreetingPhase('interviewer_speaking');
    setInterviewerSpeaking(true);
    interviewerSpeakingRef.current = true;

    try {
      // Call LLM for natural answer & intent detection
      const result = await sendGreetingChatMessage({
        body: {
          type: 'Technical',
          phase: 'greeting',
          messages: messagesRef.current,
          candidateName,
          roundDuration: durationMinutes,
          problemTitle: problemTitle || 'Algorithmic Problem',
          interviewerName: interviewer.name,
          interviewerRole: interviewer.role,
          interviewerPersonality: interviewer.personality,
        },
        fallbackReply: 'Do you have any questions before we jump into the problem?',
      });

      const reply = result.reply;
      const intent = result.intent;

      // Record assistant reply in conversation memory
      messagesRef.current.push({ role: 'assistant', content: reply });
      setInterviewerSpeechText(reply);

      // Handle based on LLM-detected intent
      if (intent === 'ready_to_start') {
        setGreetingPhase('interviewer_transition');

        if (speakFnRef.current) {
          await speakFnRef.current(reply);
        } else {
          await new Promise((r) => setTimeout(r, 2400));
        }

        setInterviewerSpeaking(false);
        interviewerSpeakingRef.current = false;
        setGreetingPhase('ready_to_code');

        // Transition into coding workspace only after speech finishes
        setTimeout(() => {
          onProceedToCodingRef.current();
        }, 900);
        return;
      }

      // Candidate had a question or responded to greeting: speak answer and keep listening
      if (speakFnRef.current) {
        await speakFnRef.current(reply);
      } else {
        await new Promise((r) => setTimeout(r, 3200));
      }

      setInterviewerSpeaking(false);
      interviewerSpeakingRef.current = false;
      setCandidateReply('');
      setGreetingPhase('candidate_answering');
      isCandidateTurnRef.current = true;
      processingRef.current = false;
      restartRecognition();
    } catch (err: any) {
      console.error('Greeting room communication error:', err);
      toast.error('Network issue connecting to interviewer. Please try again.');

      setInterviewerSpeaking(false);
      interviewerSpeakingRef.current = false;
      processingRef.current = false;
      isCandidateTurnRef.current = true;
      setGreetingPhase('candidate_answering');
      restartRecognition();
    }
  };

  // Ref to always expose latest handleCandidateUtterance to recognition callbacks
  const handleCandidateUtteranceRef = useRef(handleCandidateUtterance);
  handleCandidateUtteranceRef.current = handleCandidateUtterance;

  // Waveform animation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (interviewerSpeaking || candidateSpeaking) {
      interval = setInterval(() => {
        setWaveformBars(
          Array.from({ length: 9 }, () => Math.floor(Math.random() * 32) + 10)
        );
      }, 90);
    } else {
      setWaveformBars([10, 14, 18, 14, 10, 14, 18, 14, 10]);
    }
    return () => clearInterval(interval);
  }, [interviewerSpeaking, candidateSpeaking]);

  // Initial Greeting Effect: runs once on mount with stable interviewer & candidate IDs
  useEffect(() => {
    mountedRef.current = true;
    let isCancelled = false;

    async function runInitialGreeting() {
      setInterviewerSpeaking(true);
      interviewerSpeakingRef.current = true;
      processingRef.current = true;
      isCandidateTurnRef.current = false;

      const greetingMessage = `Hi ${candidateName}! I'm ${interviewer.name}, and I will be taking your technical interview today. How are you doing today?`;

      // Initialize conversation memory with the opening greeting
      messagesRef.current = [{ role: 'assistant', content: greetingMessage }];
      setInterviewerSpeechText(greetingMessage);

      if (speakFnRef.current) {
        await speakFnRef.current(greetingMessage);
      } else {
        await new Promise((r) => setTimeout(r, 3200));
      }

      if (isCancelled) {
        setInterviewerSpeaking(false);
        interviewerSpeakingRef.current = false;
        processingRef.current = false;
        return;
      }

      setInterviewerSpeaking(false);
      interviewerSpeakingRef.current = false;
      processingRef.current = false;
      isCandidateTurnRef.current = true;
      setGreetingPhase('candidate_answering');
      restartRecognition();
    }

    const timer = setTimeout(() => {
      void runInitialGreeting();
    }, 500);

    return () => {
      mountedRef.current = false;
      isCancelled = true;
      clearTimeout(timer);
      setInterviewerSpeaking(false);
      interviewerSpeakingRef.current = false;
      processingRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {}
      stopSpeakingFnRef.current?.();
    };
  }, [candidateName, interviewer.name, restartRecognition]);

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 px-4 animate-in fade-in-50 duration-300 font-sans relative">
      {/* Real-time Conduct / Profanity Warning Banner */}
      <ConductWarningBanner
        isOpen={conductWarning.isOpen}
        matchedWord={conductWarning.matchedWord}
        onDismiss={() => setConductWarning({ isOpen: false })}
      />

      {/* Top Header Row with status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-mono font-semibold uppercase tracking-wider text-text-muted dark:text-zinc-400">
            Live Video Chamber · Technical Round
          </span>
        </div>

        <button
          type="button"
          onClick={onProceedToCoding}
          disabled={isProblemLoading || Boolean(problemLoadError) || !problemTitle}
          className="text-xs font-semibold text-text-muted hover:text-accent transition-colors flex items-center gap-1 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>
            {isProblemLoading || !problemTitle
              ? 'Generating a fresh AI question...'
              : problemLoadError
              ? 'Question unavailable'
              : 'Jump to coding'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {(isProblemLoading || problemLoadError) && (
        <div
          role={problemLoadError ? 'alert' : 'status'}
          className={`mb-6 rounded-xl border p-4 text-sm ${
            problemLoadError
              ? 'border-danger/30 bg-danger/10 text-danger'
              : 'border-accent/30 bg-accent-subtle text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {isProblemLoading && <Sparkles className="h-4 w-4 animate-pulse text-accent" />}
            {problemLoadError
              ? 'We could not generate your interview question.'
              : 'Generating a fresh interview question with AI...'}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {problemLoadError
              ? problemLoadError
              : 'Questions can repeat too often, so we are creating a new one for you. Please wait here; coding will be available as soon as it is ready.'}
          </p>
          {problemLoadError && (
            <button
              type="button"
              onClick={onRetryProblem}
              className="mt-3 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              Retry question generation
            </button>
          )}
        </div>
      )}

      {/* 2 Big Video Boxes Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-8">
        {/* LEFT BOX: AI Interviewer Video Box */}
        <div className="rounded-2xl border border-border bg-surface p-2 sm:p-3 shadow-sm relative overflow-hidden flex flex-col justify-between aspect-[4/3] sm:aspect-[16/11]">
          {/* Interviewer Studio Headshot / Video stream */}
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-bg">
            <Image
              src={interviewer.avatarUrl}
              alt={interviewer.name}
              fill
              className="object-cover object-top filter brightness-[1.02]"
              priority
            />

            {/* Gradient bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Badge overlay on top-left */}
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10 shadow-sm flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-accent" />
                <span>{interviewer.name}</span>
                <span className="text-zinc-400 text-xs font-normal">({interviewer.role})</span>
              </span>
            </div>

            {/* Live Audio Waveform at bottom of Interviewer box */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    interviewerSpeaking ? 'bg-accent animate-ping' : 'bg-success'
                  }`}
                />
                <span className="text-xs font-medium text-white">
                  {interviewerSpeaking ? `${interviewer.name} is speaking...` : 'Listening'}
                </span>
              </div>

              {/* Waveform Bars */}
              <div className="flex items-center gap-1 h-6">
                {waveformBars.map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h * 0.6}px` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      interviewerSpeaking ? 'bg-accent' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BOX: Candidate Live Camera Feed */}
        <div className="rounded-2xl border border-border bg-surface p-2 sm:p-3 shadow-sm relative overflow-hidden flex flex-col justify-between aspect-[4/3] sm:aspect-[16/11]">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-bg flex items-center justify-center">
            {/* Live Camera Feed */}
            <video
              ref={(el) => {
                userVideoRef.current = el;
                if (el && streamRef.current && el.srcObject !== streamRef.current) {
                  el.srcObject = streamRef.current;
                  el.play().catch(console.warn);
                }
              }}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                hasCameraPermission ? 'block' : 'hidden'
              }`}
            />

            {!hasCameraPermission && (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-3 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                  <User className="w-10 h-10" />
                </div>
                <h3 className="text-sm font-semibold text-white">{candidateName}</h3>
                <p className="text-xs text-zinc-400 mt-1">Starting camera...</p>
              </div>
            )}

            {/* Gradient bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Rank emblem */}
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-black/60 backdrop-blur-md text-amber-400 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/30 shadow-sm flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Rank: {candidateRank}</span>
              </span>
            </div>

            {/* Candidate Bottom-Left Badge */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-white/10 shadow-sm flex items-center gap-2">
                <Mic
                  className={`w-3.5 h-3.5 ${
                    candidateSpeaking ? 'text-success animate-pulse' : 'text-accent'
                  }`}
                />
                <span>{candidateName} (you)</span>
                <span
                  className={`${
                    candidateSpeaking ? 'text-success font-semibold' : 'text-zinc-300'
                  } text-xs`}
                >
                  {candidateSpeaking ? '· Speaking' : '· Listening'}
                </span>
              </div>
            </div>

            {/* Session Timer at bottom right (using configured duration constant) */}
            <div className="absolute bottom-4 right-4 z-10">
              <span className="text-xs font-mono font-bold text-zinc-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                {durationMinutes}:00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Speech & Reply Bar */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent block">
              {interviewerSpeaking
                ? `${interviewer.name.toUpperCase()} IS SPEAKING:`
                : candidateSpeaking
                ? 'HEARING YOU SPEAK:'
                : 'SPEAK INTO YOUR MICROPHONE OR SELECT A RESPONSE:'}
            </span>
            <p className="text-sm sm:text-base text-text-primary italic leading-relaxed">
              {interviewerSpeaking && interviewerSpeechText
                ? `"${interviewerSpeechText}"`
                : greetingPhase === 'interviewer_greeting'
                ? `"Hi ${candidateName}! I'm ${interviewer.name}, and I will be taking your technical interview today. How are you doing today?"`
                : greetingPhase === 'candidate_answering'
                ? candidateReply
                  ? `"${candidateReply}"`
                  : interviewerSpeechText
                  ? `"${interviewerSpeechText}"`
                  : 'Speak into your microphone or select below...'
                : greetingPhase === 'interviewer_speaking'
                ? `"${interviewerSpeechText}"`
                : greetingPhase === 'interviewer_transition'
                ? `"${interviewerSpeechText}"`
                : `Switching to coding workspace...`}
            </p>
          </div>

          {/* Quick-reply chips available during candidate answering phase */}
          {greetingPhase === 'candidate_answering' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCandidateUtterance("I'm doing great, excited to be here!")}
                disabled={processingRef.current}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-subtle hover:bg-accent/20 text-accent border border-accent/30 transition-all cursor-pointer shadow-sm active:scale-95 focus-ring disabled:opacity-50"
              >
                🎙 &ldquo;I&apos;m doing great, excited!&rdquo;
              </button>

              <button
                type="button"
                onClick={() => void handleCandidateUtterance('How long will this interview be?')}
                disabled={processingRef.current}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-surface-hover text-text-muted border border-border transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1 focus-ring disabled:opacity-50"
              >
                <HelpCircle className="w-3 h-3 text-accent" />
                <span>&ldquo;How long is this round?&rdquo;</span>
              </button>

              <button
                type="button"
                onClick={() => void handleCandidateUtterance('Can I ask questions while coding?')}
                disabled={processingRef.current}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-surface-hover text-text-muted border border-border transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1 focus-ring disabled:opacity-50"
              >
                <HelpCircle className="w-3 h-3 text-accent" />
                <span>&ldquo;Can I ask questions while coding?&rdquo;</span>
              </button>

              <button
                type="button"
                onClick={() => void handleCandidateUtterance("No questions, I'm ready to begin!")}
                disabled={processingRef.current}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 focus-ring disabled:opacity-50"
              >
                <span>🎙 &ldquo;No questions, ready to begin!&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {greetingPhase === 'ready_to_code' && (
            <button
              type="button"
              onClick={onProceedToCoding}
              disabled={isProblemLoading || Boolean(problemLoadError) || !problemTitle}
              className="px-6 py-2.5 rounded-full font-bold text-slate-950 text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:brightness-105 shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {isProblemLoading || !problemTitle
                  ? 'Waiting for your fresh question'
                  : problemLoadError
                  ? 'Question unavailable'
                  : 'Entering workspace'}
              </span>
              {isProblemLoading && <Sparkles className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
