'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { X, Trophy, CheckCircle2, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { RANK_ORDER, RANKS, RankTier } from '@/config/ranks';

interface AllRanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRank?: RankTier;
  points?: number;
}

export function AllRanksModal({
  isOpen,
  onClose,
  currentRank = 'Bronze',
  points = 100,
}: AllRanksModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentOrder = RANKS[currentRank]?.order ?? 1;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-5 bg-overlay backdrop-blur-md animate-in fade-in-50 duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent shadow-sm shrink-0">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-text-primary tracking-tight">
                All Six Competitive Ranks
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Earn rating points in technical & HR interviews to rank up.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer focus-ring"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Current Standing Banner */}
        <div className="px-5 sm:px-7 py-3 bg-accent-subtle/50 border-b border-accent/15 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-text-muted">Your current rating:</span>
            <strong className="text-text-primary font-mono font-bold">{points} pts</strong>
            <span className="text-text-subtle">•</span>
            <span className="text-text-muted">Tier:</span>
            <strong className="text-accent font-bold uppercase">{currentRank}</strong>
          </div>
          <span className="text-[11px] font-mono text-text-subtle">
            Tier {currentOrder} of {RANK_ORDER.length}
          </span>
        </div>

        {/* Modal Body: Grid of all 6 ranks */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {RANK_ORDER.map((tier) => {
              const rank = RANKS[tier];
              const isCurrent = tier === currentRank;
              const isUnlocked = points >= (rank.pointsRequired as number);
              const pointsNeeded = Math.max(0, (rank.pointsRequired as number) - points);

              return (
                <div
                  key={tier}
                  className={`relative rounded-xl border p-4 sm:p-4.5 transition-all flex items-start gap-3.5 ${
                    isCurrent
                      ? 'border-accent bg-accent-subtle/20 shadow-md ring-2 ring-accent/30'
                      : isUnlocked
                      ? 'border-border bg-surface hover:bg-surface-hover'
                      : 'border-border/60 bg-bg-subtle/60 opacity-65'
                  }`}
                >
                  {/* Rank SVG Badge */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 drop-shadow">
                    <Image
                      src={rank.badgeUrl}
                      alt={`${rank.displayName} Rank Emblem`}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Rank Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <h3 className="font-serif font-black text-base sm:text-lg tracking-wide text-text-primary uppercase">
                        {rank.displayName}
                      </h3>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-surface border border-border text-text-muted shrink-0">
                        {rank.pointsRequired}+ pts
                      </span>
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-2 font-normal">
                      {rank.description}
                    </p>

                    {/* Status Pill */}
                    <div className="flex items-center gap-1.5">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent text-accent-foreground shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> YOU ARE HERE
                        </span>
                      ) : isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-success-subtle text-success border border-success/20">
                          <CheckCircle2 className="w-3 h-3" /> UNLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-text-subtle px-2 py-0.5 rounded-full bg-bg border border-border">
                          <Lock className="w-2.5 h-2.5" /> {pointsNeeded} pts to unlock
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-t border-border bg-surface shrink-0">
          <span className="text-xs text-text-subtle font-mono">
            Points are awarded after each evaluated interview round.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer focus-ring"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

