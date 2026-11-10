'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface InterviewTimerProps {
  /** Duration of interview in minutes (defaults to 20 mins) */
  totalMinutes?: number;
  /** Storage key to persist countdown across refreshes */
  interviewKey?: string;
  /** Callback fired when timer reaches 00:00 */
  onTimeUp?: () => void;
  className?: string;
}

export function InterviewTimer({
  totalMinutes = 20,
  interviewKey = 'technical',
  onTimeUp,
  className = '',
}: InterviewTimerProps) {
  const totalSeconds = totalMinutes * 60;
  const storageKey = `rehearsal_timer_start_${interviewKey}`;

  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    // Check if a start timestamp was already recorded for this interview session
    let startTime = Date.now();
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          startTime = parsed;
        }
      } else {
        sessionStorage.setItem(storageKey, String(startTime));
      }
    } catch {
      // ignore storage access issues
    }

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);
      setSecondsRemaining(remaining);

      if (remaining === 0) {
        onTimeUpRef.current?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [totalSeconds, storageKey]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Color & Alert thresholds:
  // > 10m: Normal (neutral/purple)
  // <= 10m: Warning (amber)
  // <= 5m: Critical (red pulse)
  const isWarning = secondsRemaining <= 600 && secondsRemaining > 300;
  const isCritical = secondsRemaining <= 300;
  const isTimeUp = secondsRemaining === 0;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all duration-300 shadow-sm ${
        isTimeUp
          ? 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-200 animate-bounce'
          : isCritical
            ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-300 animate-pulse'
            : isWarning
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
              : 'bg-surface border-border text-text-primary'
      } ${className}`}
      title={`Interview duration: ${totalMinutes} minutes`}
    >
      {isCritical || isTimeUp ? (
        <AlertTriangle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 animate-pulse flex-shrink-0" />
      ) : (
        <Clock
          className={`w-3.5 h-3.5 flex-shrink-0 ${
            isWarning ? 'text-amber-500' : 'text-purple-600 dark:text-purple-300'
          }`}
        />
      )}

      <span className="tracking-widest text-sm">{formattedTime}</span>

      <span className="text-[10px] text-text-muted font-normal uppercase hidden sm:inline">
        {isTimeUp ? 'Time Up' : `${totalMinutes}m limit`}
      </span>
    </div>
  );
}

/** Utility to reset the timer for a given interview key */
export function resetInterviewTimer(interviewKey: string = 'technical') {
  try {
    sessionStorage.removeItem(`rehearsal_timer_start_${interviewKey}`);
  } catch {
    // ignore
  }
}
