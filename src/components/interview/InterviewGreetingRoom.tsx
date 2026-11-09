'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Mic, ArrowRight, Volume2, Sparkles, Shield, User } from 'lucide-react';
import { AIPanelist } from '@/config/panels';

interface InterviewGreetingRoomProps {
  candidateName: string;
  interviewer: AIPanelist;
  problemTitle?: string;
  onProceedToCoding: () => void;
  speakFn?: (text: string) => Promise<void>;
  stopSpeakingFn?: () => void;
}

export function InterviewGreetingRoom({
  candidateName,
  interviewer,
  problemTitle,
  onProceedToCoding,
  speakFn,
  stopSpeakingFn,
}: InterviewGreetingRoomProps) {
  const [greetingPhase, setGreetingPhase] = useState<
    'interviewer_greeting' | 'candidate_answering' | 'interviewer_transition' | 'ready_to_code'
  >('interviewer_greeting');
  const [candidateReply, setCandidateReply] = useState<string>('');
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
  const [candidateSpeaking, setCandidateSpeaking] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([14, 26, 38, 20, 32, 44, 28, 16, 22]);

  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const candidateReplyRef = useRef('');
  candidateReplyRef.current = candidateReply;

  // Initialize candidate camera reliably
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

  // Ensure video element plays as soon as ref or permission changes
  useEffect(() => {
    if (userVideoRef.current && streamRef.current) {
      if (userVideoRef.current.srcObject !== streamRef.current) {
        userVideoRef.current.srcObject = streamRef.current;
      }
      userVideoRef.current.play().catch(console.warn);
    }
  }, [hasCameraPermission]);

  // Audio level analyser on microphone for live speech detection
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
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;

          // If sound level is above ambient noise, candidate is speaking
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

  // Browser Speech Recognition for candidate answering
  useEffect(() => {
    if (greetingPhase !== 'candidate_answering') return;

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    let recognition: any = null;
    let silenceTimer: NodeJS.Timeout;

    try {
      recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        const trimmed = transcript.trim();
        if (trimmed.length > 0) {
          setCandidateReply(trimmed);
          clearTimeout(silenceTimer);
          // When candidate pauses after speaking, auto-submit reply
          silenceTimer = setTimeout(() => {
            if (trimmed.length > 2) {
              void handleCandidateResponse(trimmed);
            }
          }, 1400);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition notice:', e);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
    }

    return () => {
      clearTimeout(silenceTimer);
      try {
        recognition?.stop();
      } catch {}
    };
  }, [greetingPhase]);

  // Animate audio waveform bars when speaking
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

  // Conversational Greeting Script
  useEffect(() => {
    let isCancelled = false;

    async function runGreetingScript() {
      setInterviewerSpeaking(true);
      const greetingMessage = `Hi ${candidateName}! I'm ${interviewer.name}, and I will be taking your technical interview today. How are you doing today?`;

      if (speakFn) {
        await speakFn(greetingMessage);
      } else {
        await new Promise((r) => setTimeout(r, 3200));
      }

      if (isCancelled) return;
      setInterviewerSpeaking(false);
      setGreetingPhase('candidate_answering');
    }

    const timer = setTimeout(() => {
      void runGreetingScript();
    }, 600);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      stopSpeakingFn?.();
    };
  }, [candidateName, interviewer.name, speakFn, stopSpeakingFn]);

  // When candidate answers (via voice or quick reply chip)
  const handleCandidateResponse = async (replyText: string) => {
    if (greetingPhase !== 'candidate_answering') return;
    setCandidateReply(replyText);
    setCandidateSpeaking(true);

    // Short confirmation delay
    await new Promise((r) => setTimeout(r, 900));
    setCandidateSpeaking(false);
    setGreetingPhase('interviewer_transition');
    setInterviewerSpeaking(true);

    const transitionMessage = `Wonderful! Let's start with your coding round. Take a look at your problem specification, and let's discuss your approach.`;

    if (speakFn) {
      await speakFn(transitionMessage);
    } else {
      await new Promise((r) => setTimeout(r, 2600));
    }

    setInterviewerSpeaking(false);
    setGreetingPhase('ready_to_code');

    // Automatically shift to coding environment after a brief pause
    setTimeout(() => {
      onProceedToCoding();
    }, 1200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 px-4 animate-in fade-in-50 duration-300">
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
          className="text-xs font-semibold text-text-muted hover:text-[#f59e0b] dark:text-zinc-400 dark:hover:text-[#f59e0b] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Jump to coding</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2 Big Video Boxes Side-by-Side matching media_1794199028518_3bafee3a.jpg */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-8">
        {/* LEFT BOX: AI Interviewer Video Box */}
        <div className="rounded-3xl border border-border dark:border-white/10 bg-[#161224] p-2 sm:p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between aspect-[4/3] sm:aspect-[16/11]">
          {/* Interviewer Studio Headshot / Video stream */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#1c1626]">
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
                <Volume2 className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>{interviewer.name}</span>
                <span className="text-zinc-400 text-[10px]">({interviewer.role})</span>
              </span>
            </div>

            {/* Live Audio Waveform at bottom of Interviewer box */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    interviewerSpeaking ? 'bg-[#f59e0b] animate-ping' : 'bg-emerald-500'
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
                      interviewerSpeaking ? 'bg-[#f59e0b]' : 'bg-zinc-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BOX: Candidate Live Camera Feed */}
        <div className="rounded-3xl border border-border dark:border-white/10 bg-[#161224] p-2 sm:p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between aspect-[4/3] sm:aspect-[16/11]">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#120e1e] flex items-center justify-center">
            {/* Live Camera Feed - Always in DOM to prevent ref detachment */}
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

            {/* Center glowing rank emblem */}
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-black/60 backdrop-blur-md text-amber-400 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/30 shadow-sm flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Rank: Soldier</span>
              </span>
            </div>

            {/* Candidate Bottom-Left Badge matching screenshot */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-white/10 shadow-sm flex items-center gap-2">
                <Mic className={`w-3.5 h-3.5 ${candidateSpeaking ? 'text-emerald-400 animate-pulse' : 'text-[#f59e0b]'}`} />
                <span>{candidateName} (you)</span>
                <span className={`${candidateSpeaking ? 'text-emerald-400 font-semibold' : 'text-zinc-300'} text-[11px]`}>
                  {candidateSpeaking ? '· Speaking' : '· Listening'}
                </span>
              </div>
            </div>

            {/* Session Timer at bottom right */}
            <div className="absolute bottom-4 right-4 z-10">
              <span className="text-xs font-mono font-bold text-zinc-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                45:00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Speech & Reply Bar */}
      <div className="rounded-2xl border border-border dark:border-white/10 bg-surface dark:bg-[#181324] p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#f59e0b] block">
              {interviewerSpeaking
                ? `${interviewer.name.toUpperCase()} IS SPEAKING:`
                : candidateSpeaking
                ? 'HEARING YOU SPEAK:'
                : 'SPEAK INTO YOUR MICROPHONE OR PICK A RESPONSE:'}
            </span>
            <p className="text-sm sm:text-base font-serif text-text-primary dark:text-white italic">
              {greetingPhase === 'interviewer_greeting' &&
                `"Hi ${candidateName}! I'm ${interviewer.name}, and I will be taking your technical interview today. How are you doing today?"`}
              {greetingPhase === 'candidate_answering' &&
                (candidateReply
                  ? `"${candidateReply}"`
                  : 'Speak into your microphone or pick a response below...')}
              {greetingPhase === 'interviewer_transition' &&
                `"Wonderful! Let's start with your coding round."`}
              {greetingPhase === 'ready_to_code' &&
                `Switching to coding workspace...`}
            </p>
          </div>

          {/* Quick-reply chips for fast conversational responses */}
          {greetingPhase === 'candidate_answering' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void handleCandidateResponse("I'm doing great, excited to be here!")
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-[#f59e0b] border border-amber-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                🎙 &ldquo;I&apos;m doing great, excited to be here!&rdquo;
              </button>
              <button
                type="button"
                onClick={() =>
                  void handleCandidateResponse('Doing well, thank you! Ready.')
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                🎙 &ldquo;Doing well, thank you! Ready.&rdquo;
              </button>
            </div>
          )}

          {greetingPhase === 'ready_to_code' && (
            <button
              type="button"
              onClick={onProceedToCoding}
              className="px-6 py-2.5 rounded-full font-bold text-slate-950 text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:brightness-105 shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <span>Entering workspace</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
