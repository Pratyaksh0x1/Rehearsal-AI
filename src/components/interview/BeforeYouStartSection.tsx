'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Headphones, Shield, ChevronDown, Check, ArrowLeft } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';

interface BeforeYouStartSectionProps {
  onBack?: () => void;
  onStartInterview: () => void;
  remainingInterviews?: number;
}

interface AudioDevice {
  deviceId: string;
  label: string;
}

export function BeforeYouStartSection({
  onBack,
  onStartInterview,
  remainingInterviews = 3,
}: BeforeYouStartSectionProps) {
  const [micStatus, setMicStatus] = useState<'testing' | 'working' | 'denied' | 'prompt'>('testing');
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([12, 18, 28, 22, 14, 26, 32, 18, 10]);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Microphone & Web Audio Analyser
  useEffect(() => {
    let isCancelled = false;

    async function initMic(deviceId?: string) {
      try {
        setMicStatus('testing');

        // Stop any existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setMicStatus('working');

        // Enumerate devices once permission is granted
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const inputs = devices
            .filter((d) => d.kind === 'audioinput')
            .map((d, idx) => ({
              deviceId: d.deviceId,
              label: d.label || `Microphone ${idx + 1}`,
            }));

          setAudioDevices(inputs);
          if (!deviceId && inputs.length > 0) {
            setSelectedDeviceId(inputs[0].deviceId);
          }
        } catch {
          // fallback device list
        }

        // Connect Analyser for real-time waveform bars
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (isCancelled || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate energy
          let sum = 0;
          const bars: number[] = [];
          const step = Math.floor(dataArray.length / 9) || 1;

          for (let i = 0; i < 9; i++) {
            const val = dataArray[i * step] || 0;
            sum += val;
            // Map 0-255 to min 8px, max 36px
            const height = Math.max(8, Math.round((val / 255) * 32) + 6);
            bars.push(height);
          }

          const avg = sum / (dataArray.length || 1);
          setAudioLevel(avg);
          setWaveformBars(bars);

          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (err) {
        console.warn('Microphone permission or audio initialization error:', err);
        if (!isCancelled) {
          setMicStatus('denied');
        }
      }
    }

    void initMic(selectedDeviceId || undefined);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close();
      }
    };
  }, [selectedDeviceId]);

  const selectedDeviceLabel =
    audioDevices.find((d) => d.deviceId === selectedDeviceId)?.label ||
    (audioDevices.length > 0 ? audioDevices[0].label : 'Default Microphone');

  const handleStart = () => {
    captureEvent('interview_started_from_step3', {
      selectedDevice: selectedDeviceLabel,
      micStatus,
    });
    // Stop local preview audio analyser so it doesn't collide with the live interview VoicePanel
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close();
    }
    onStartInterview();
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 sm:py-10 animate-in fade-in-50 duration-300">
      {/* Top Navigation: Back Button */}
      {onBack && (
        <div className="mb-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Section Title matching screenshot */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text-primary dark:text-white tracking-tight">
          Set up your interview
        </h1>
        <div className="mt-2.5 flex items-baseline">
          <span className="font-serif italic text-purple-600 dark:text-amber-500/90 text-lg sm:text-xl font-normal mr-2.5">
            3
          </span>
          <p className="text-xs sm:text-sm text-text-muted dark:text-zinc-400">
            Before you start
          </p>
        </div>
      </div>

      {/* Main Container Card matching media_1794198956489_d3f7b7e8.jpg */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-9 shadow-2xl relative backdrop-blur-2xl dark:bg-[#15101a]/95 dark:border-white/10 dark:shadow-[0_12px_45px_rgba(0,0,0,0.55)]">
        {/* Ambient subtle warm glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="space-y-6 sm:space-y-7 relative z-10">
          {/* 1. Microphone Test Box */}
          <div className="rounded-2xl bg-amber-50/50 dark:bg-[#201718] border border-amber-500/20 dark:border-[#3d2a28] p-4 sm:p-5 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3.5">
              {/* Mic Icon Squircle */}
              <div className="w-11 h-11 rounded-2xl bg-[#3d2b17] border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] flex-shrink-0 shadow-sm">
                <Mic className="w-5 h-5 text-[#f59e0b]" />
              </div>

              <div>
                <h3 className="font-semibold text-sm sm:text-base text-text-primary dark:text-white">
                  Microphone
                </h3>
                <p className="text-xs text-text-muted dark:text-zinc-400 mt-0.5">
                  {micStatus === 'working' && 'Working. We can hear you.'}
                  {micStatus === 'testing' && 'Testing audio input...'}
                  {micStatus === 'denied' && 'Microphone access blocked. Please allow mic in browser.'}
                </p>
              </div>
            </div>

            {/* Live Audio Waveform Bars matching screenshot */}
            <div className="flex items-center gap-1 h-9 px-2">
              {waveformBars.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}px` }}
                  className="w-1 rounded-full bg-[#f59e0b] dark:bg-[#e0a055] transition-all duration-75"
                />
              ))}
            </div>
          </div>

          {/* 2. Input Device Dropdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-medium text-text-muted dark:text-zinc-400">
                Input device
              </label>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full rounded-2xl bg-slate-50 dark:bg-[#0f0c1e] border border-border dark:border-white/10 px-4 py-3 text-sm text-text-primary dark:text-white flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 hover:border-border-hover dark:hover:border-white/20 transition-all shadow-sm"
              >
                <span className="font-medium truncate pr-2">{selectedDeviceLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted dark:text-zinc-400 flex-shrink-0 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-amber-500' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-surface dark:bg-[#161226] border border-border dark:border-white/15 shadow-2xl overflow-hidden py-1.5 max-h-56 overflow-y-auto backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150">
                  {audioDevices.length === 0 ? (
                    <div className="px-4 py-2.5 text-xs text-text-muted dark:text-zinc-400">
                      Default System Microphone
                    </div>
                  ) : (
                    audioDevices.map((dev) => {
                      const isSelected = selectedDeviceId === dev.deviceId;
                      return (
                        <button
                          key={dev.deviceId}
                          type="button"
                          onClick={() => {
                            setSelectedDeviceId(dev.deviceId);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-amber-500/10 text-amber-600 dark:text-[#f6ad55] font-semibold'
                              : 'text-text-primary dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className="truncate pr-2">{dev.label}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. Advisory Warnings (Headphones & Monitored Interview) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-text-primary dark:text-zinc-200 font-medium">
              <Headphones className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Headphones recommended.</span>
            </div>

            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-text-muted dark:text-zinc-400 leading-relaxed font-normal">
              <Shield className="w-4 h-4 text-amber-500/80 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-text-primary dark:text-zinc-300 font-semibold">
                  This interview is monitored.
                </strong>{' '}
                Abusive language or misconduct will be dealt with accordingly. Please keep the
                conversation respectful.
              </span>
            </div>
          </div>

          {/* 4. Golden Start Interview Button matching media_1794198956489_d3f7b7e8.jpg */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleStart}
              className="w-full py-4 px-8 rounded-full font-bold text-slate-950 text-base sm:text-lg bg-gradient-to-r from-[#d8973c] via-[#f7d688] to-[#d8973c] hover:brightness-105 active:scale-[0.99] shadow-[0_0_30px_rgba(247,214,136,0.32)] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Mic className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              <span>Start interview</span>
            </button>

            {/* Note below button */}
            <p className="text-center text-xs text-text-muted dark:text-zinc-400 mt-3 font-normal">
              Starting uses 1 of your {remainingInterviews} interviews. If the call fails on our
              side, you get it back.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

