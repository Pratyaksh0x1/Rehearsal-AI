'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface ConductWarningBannerProps {
  isOpen: boolean;
  onDismiss: () => void;
  matchedWord?: string;
  type?: 'profanity' | 'screen_switch' | 'copy_paste';
  infractionCount?: number;
}

export function ConductWarningBanner({
  isOpen,
  onDismiss,
  matchedWord,
  type = 'profanity',
  infractionCount = 1,
}: ConductWarningBannerProps) {
  if (!isOpen) return null;

  const isScreenSwitch = type === 'screen_switch';
  const isCopyPaste = type === 'copy_paste';

  const title = isScreenSwitch
    ? 'Proctor Alert: Screen Switching Detected'
    : isCopyPaste
    ? 'Proctor Alert: External Copy-Pasting Blocked'
    : 'Professional Conduct Warning';

  const badgeText = isScreenSwitch
    ? `Infraction #${infractionCount}`
    : isCopyPaste
    ? 'Clipboard Locked'
    : matchedWord
    ? 'language flagged'
    : 'Language Flagged';

  const message = isScreenSwitch
    ? `Switching tabs, applications, or windows is strictly prohibited during proctored rounds. All focus lost events are recorded in your final interview report.`
    : isCopyPaste
    ? `Pasting code from outside sources into the editor is prohibited. Please type and construct your algorithmic solution directly.`
    : `Inappropriate or profane language was detected. Please maintain respectful and professional communication. Continued violations will be recorded in your final interview report.`;

  const borderClass = isScreenSwitch || isCopyPaste
    ? 'border-amber-500/80 bg-amber-950/95 text-amber-100 shadow-[0_0_40px_rgba(245,158,11,0.45)]'
    : 'border-rose-500/80 bg-rose-950/95 text-rose-100 shadow-[0_0_40px_rgba(244,63,94,0.45)]';

  const iconBg = isScreenSwitch || isCopyPaste
    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
    : 'bg-rose-500/20 border-rose-500/40 text-rose-400';

  const badgeClass = isScreenSwitch || isCopyPaste
    ? 'bg-black/40 border-amber-500/30 text-amber-300'
    : 'bg-black/40 border-rose-500/30 text-rose-300';

  const btnClass = isScreenSwitch || isCopyPaste
    ? 'bg-amber-500 hover:bg-amber-600 text-black'
    : 'bg-rose-500 hover:bg-rose-600 text-white';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`rounded-2xl border-2 ${borderClass} p-4 sm:p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse ${iconBg}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeClass}`}>
                {badgeText}
              </span>
            </h4>
            <p className="text-xs leading-relaxed opacity-90">
              {message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className={`self-end sm:self-center px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 flex-shrink-0 ${btnClass}`}
        >
          I understand
        </button>
      </div>
    </div>
  );
}

