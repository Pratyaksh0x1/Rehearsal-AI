'use client';

import React from 'react';
import Image from 'next/image';
import { AI_PANELISTS } from '@/config/panels';
import { Mic, Sparkles } from 'lucide-react';

export function AIPanelsSection() {
  return (
    <section className="w-full py-16 sm:py-20 border-t border-border bg-bg-subtle/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Gnani.ai Timbre Voice Roster
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            Meet your AI panelists
          </h2>
          <p className="mt-3 text-text-muted text-sm sm:text-base">
            Each interview randomly pairs you with one of 8 specialized voice agents powered by Gnani.ai Timbre models.
          </p>
        </div>

        {/* 8 Voice Agents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AI_PANELISTS.map((panelist, index) => (
            <div
              key={panelist.id}
              className="rounded-2xl border border-white/10 bg-surface/70 backdrop-blur-xl p-5 shadow-lg hover:border-accent/50 hover:shadow-accent/15 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div>
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="relative w-13 h-13 rounded-full overflow-hidden ring-2 ring-accent/30 group-hover:ring-accent/80 transition-all bg-bg flex-shrink-0 shadow-md">
                    <Image
                      src={panelist.avatarUrl}
                      alt={panelist.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-text-primary truncate">
                        {panelist.name}
                      </h3>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-accent/15 text-accent font-semibold">
                        {panelist.category}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-accent truncate">{panelist.role}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-text-muted border border-white/10 line-clamp-1">
                    {panelist.specialty}
                  </span>
                </div>

                <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{panelist.bio}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-text-subtle font-mono">
                <span className="flex items-center gap-1 text-accent font-semibold">
                  <Mic className="w-3 h-3" />
                  {panelist.voice}
                </span>
                <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/10 text-[10px] text-text-muted">
                  {panelist.model}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
