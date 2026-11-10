'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Globe,
  Loader2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { ExplainerLanguage } from '@/config/languages';

interface ExplainerVoicePanelProps {
  language: ExplainerLanguage;
  onAskQuestion: (query: string) => Promise<void>;
  isLoading: boolean;
  spokenReply: string | null;
  onOpenLanguageModal: () => void;
}

export function ExplainerVoicePanel({
  language,
  onAskQuestion,
  isLoading,
  spokenReply,
  onOpenLanguageModal,
}: ExplainerVoicePanelProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [waveformBars, setWaveformBars] = useState<number[]>([10, 16, 26, 18, 12, 22, 30, 16, 10]);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Request Microphone Permission ONLY (NO Camera!)
  const requestMicPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false, // Explicitly no camera
      });
      audioStreamRef.current = stream;
      setMicPermission('granted');
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or not available:', err);
      setMicPermission('denied');
      return false;
    }
  };

  // Play spoken response via Gnani TTS (with browser Web Speech synthesis fallback)
  const speakSpokenReply = async (text: string) => {
    if (isMuted || !text.trim()) return;

    // Stop any existing audio
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: language.voiceName,
          model: language.model,
          language: language.gnaniCode,
        }),
      });

      if (res.ok && res.headers.get('content-type')?.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        activeAudioElementRef.current = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => {
            setIsSpeaking(false);
            resolve();
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            resolve();
          };
          audio.play().catch(() => {
            setIsSpeaking(false);
            resolve();
          });
        });

        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      /* fallback to browser speech synthesis */
    }

    // Web Speech API fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language.gnaniCode;
      await new Promise<void>((resolve) => {
        u.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        u.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };
        window.speechSynthesis.speak(u);
      });
    } else {
      setIsSpeaking(false);
    }
  };

  // Trigger speech when a new spoken reply arrives
  useEffect(() => {
    if (spokenReply) {
      void speakSpokenReply(spokenReply);
    }
  }, [spokenReply]);

  // Audio wave animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording || isSpeaking) {
      interval = setInterval(() => {
        setWaveformBars(
          Array.from({ length: 9 }, () => Math.floor(Math.random() * 26) + 8)
        );
      }, 100);
    } else {
      setWaveformBars([8, 12, 16, 12, 8, 12, 16, 12, 8]);
    }
    return () => clearInterval(interval);
  }, [isRecording, isSpeaking]);

  // Start or Stop Microphone Voice Input
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const granted = await requestMicPermission();
    if (!granted) {
      alert('Microphone permission is required to speak your questions. You can also type your question below.');
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. Please type your question in the text box.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      // Speech recognition can accept any language or the preferred language
      rec.lang = language.gnaniCode;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (e: any) => {
        let transcript = '';
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e);
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const q = inputText.trim();
    setInputText('');
    await onAskQuestion(q);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border bg-surface shadow-sm overflow-hidden p-5 justify-between gap-5">
      {/* Top Header: Professor Persona & Language Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-accent/40 bg-bg flex-shrink-0 shadow-sm">
            <Image
              src="/avatars/samarth.jpg"
              alt="Prof. Rehearsal"
              fill
              className="object-cover"
            />
            {isSpeaking && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-surface animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-text-primary">
                Prof. Rehearsal
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent-subtle text-accent border border-accent/20">
                CS Faculty
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Concept Explainer & Visualizer
            </p>
          </div>
        </div>

        {/* Language selector button */}
        <button
          type="button"
          onClick={onOpenLanguageModal}
          className="px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-surface-active text-text-primary border border-border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm focus-ring"
          title="Switch Explanation Language"
        >
          <span className="text-base">{language.flag}</span>
          <span>{language.name}</span>
          <Globe className="w-3.5 h-3.5 text-accent ml-0.5" />
        </button>
      </div>

      {/* Center Voice Visualizer & Spoken Response Card */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-bg border border-border/80 shadow-inner space-y-4">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono text-text-muted">
          <span
            className={`w-2 h-2 rounded-full ${
              isLoading
                ? 'bg-amber-400 animate-pulse'
                : isSpeaking
                ? 'bg-emerald-400 animate-ping'
                : isRecording
                ? 'bg-rose-500 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
          <span>
            {isLoading
              ? 'Analyzing CS Concept...'
              : isSpeaking
              ? `Explaining in ${language.name}...`
              : isRecording
              ? 'Listening in Any Language...'
              : 'Mic Ready · Ask Any CS Topic'}
          </span>
        </div>

        {/* Audio Waveform Bars */}
        <div className="flex items-center justify-center gap-1.5 h-12 w-full max-w-[200px]">
          {waveformBars.map((height, idx) => (
            <div
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-100 ${
                isRecording
                  ? 'bg-rose-500'
                  : isSpeaking
                  ? 'bg-emerald-400'
                  : 'bg-accent/40'
              }`}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>

        {/* Spoken Text Display */}
        {spokenReply ? (
          <div className="p-3.5 rounded-xl bg-surface/90 border border-border text-left w-full max-h-36 overflow-y-auto space-y-1">
            <span className="text-[10px] font-mono text-accent font-semibold uppercase tracking-wider block">
              Professor Spoken Note ({language.nativeName}):
            </span>
            <p className="text-xs text-text-primary leading-relaxed font-medium">
              &ldquo;{spokenReply}&rdquo;
            </p>
          </div>
        ) : (
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            {language.greeting}
          </p>
        )}

        <div className="flex items-center gap-2 text-[11px] font-mono text-text-subtle pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>Microphone only · No camera requested</span>
        </div>
      </div>

      {/* Bottom Interactive Question Bar */}
      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Microphone Record Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm flex-shrink-0 ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                : 'bg-surface-hover hover:bg-surface-active text-text-primary border border-border'
            }`}
            title={isRecording ? 'Stop Recording' : 'Speak Your Question in Any Language'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-accent" />}
          </button>

          {/* Text input for asking in any language */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask in any language (e.g. ${language.sampleQuestion})`}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border text-text-primary placeholder:text-text-subtle text-xs sm:text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          {/* Send question button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-11 h-11 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground flex items-center justify-center transition-all cursor-pointer shadow-sm disabled:opacity-40 flex-shrink-0"
            title="Ask Professor"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Hint text */}
        <p className="text-[11px] text-text-subtle text-center">
          Ask questions in any language. The professor answers on the blackboard in <strong className="text-text-primary">{language.name}</strong>. Non-CS questions will be politely declined.
        </p>
      </form>
    </div>
  );
}

