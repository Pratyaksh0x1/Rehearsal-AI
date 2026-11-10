'use client';

import React, { useState } from 'react';
import { MermaidViewer } from './MermaidViewer';
import { ExplainerResponse } from '@/lib/llm/schemas';
import { ExplainerLanguage } from '@/config/languages';
import {
  Sparkles,
  Eraser,
  Code2,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface BlackboardCanvasProps {
  concept: ExplainerResponse | null;
  language: ExplainerLanguage;
  isLoading: boolean;
  onClearBoard: () => void;
  onSelectSampleTopic: (topic: string) => void;
}

export function BlackboardCanvas({
  concept,
  language,
  isLoading,
  onClearBoard,
  onSelectSampleTopic,
}: BlackboardCanvasProps) {
  const [boardZoom, setBoardZoom] = useState(1.0);

  const handleZoomIn = () => setBoardZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 1.6));
  const handleZoomOut = () => setBoardZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.65));
  const handleResetZoom = () => setBoardZoom(1.0);

  const quickTopics = [
    { label: 'B+ Tree vs B-Tree', desc: 'Database Indexing' },
    { label: 'TCP 3-Way Handshake', desc: 'Computer Networks' },
    { label: 'Consistent Hashing', desc: 'System Design' },
    { label: 'Virtual Memory & Paging', desc: 'Operating Systems' },
    { label: 'Polymorphism & VTables', desc: 'OOPs Principles' },
    { label: 'Cache Coherence & MESI', desc: 'Computer Architecture' },
  ];

  return (
    <div className="sketchbook-board flex flex-col h-full rounded-2xl border-4 border-[#3c2a1a] bg-[#121915] shadow-2xl relative overflow-hidden min-w-0 max-w-full">
      {/* Wooden blackboard frame header with chalk label */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-[#1d1712] border-b-2 border-[#3c2a1a] shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Green chalk dot */}
          <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#d8c3a5] font-semibold">
            CS Fundamental Blackboard · {language.name} ({language.nativeName})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Blackboard Zoom In / Zoom Out Controls */}
          <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-lg border border-[#3c2a1a] text-xs font-mono text-[#d8c3a5]">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={boardZoom <= 0.65}
              title="Zoom out blackboard"
              className="p-1 rounded text-[#c4b5a0] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom to 100%"
              className="px-1 text-[11px] font-bold text-[#d8c3a5] hover:text-white cursor-pointer"
            >
              {Math.round(boardZoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={boardZoom >= 1.6}
              title="Zoom in blackboard"
              className="p-1 rounded text-[#c4b5a0] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="p-1 rounded text-[#c4b5a0]/70 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {concept && (
            <button
              type="button"
              onClick={onClearBoard}
              className="px-2.5 py-1 rounded text-xs font-mono font-medium text-[#c4b5a0] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Wipe the blackboard clean"
            >
              <Eraser className="w-3.5 h-3.5 text-amber-300" />
              <span>Erase Board</span>
            </button>
          )}
        </div>
      </div>

      {/* Blackboard Slate Surface with Zoom Scaling */}
      <div className="sketchbook-page flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-7 relative font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200 min-w-0 max-w-full">

        <div
          style={{ transform: `scale(${boardZoom})`, transformOrigin: 'top center' }}
          className="sketchbook-content transition-transform duration-200 ease-out w-full max-w-full min-w-0"
        >

        {isLoading ? (
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/50 animate-spin" />
              <Sparkles className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg text-emerald-300 font-bold tracking-wide">
                Drawing on the Blackboard...
              </h3>
              <p className="text-xs font-mono text-emerald-400/70">
                Formulating visual architecture and concepts in {language.name}...
              </p>
            </div>
          </div>
        ) : !concept ? (
          /* Empty Blackboard State: Prompt Suggestions */
          <div className="h-full min-h-[420px] flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              <Layers className="w-7 h-7" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-200 tracking-tight mb-3">
              What concept shall we draw today?
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/70 leading-relaxed mb-8 max-w-lg">
              Speak or type any Computer Science fundamental topic. The agent will draw the architecture diagram and teach the core principles in <strong className="text-emerald-300">{language.name} ({language.nativeName})</strong>.
            </p>

            {/* Quick Topic Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {quickTopics.map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectSampleTopic(topic.label)}
                  className="p-3.5 rounded-xl bg-black/40 border border-emerald-800/40 hover:border-emerald-500/60 hover:bg-emerald-950/30 transition-all flex items-center justify-between group cursor-pointer text-left"
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-emerald-200 group-hover:text-emerald-100 transition-colors">
                      {topic.label}
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-400/60">
                      {topic.desc}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : !concept.isCsTopic ? (
          /* OUT OF SCOPE WARNING ON BLACKBOARD */
          <div className="min-h-[350px] flex flex-col items-center justify-center text-center max-w-md mx-auto p-6 rounded-2xl bg-rose-950/40 border-2 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-white mb-2">
              {concept.blackboardTitle}
            </h3>
            <p className="text-sm text-rose-200 font-mono leading-relaxed mb-4">
              &ldquo;{concept.spokenExplanation}&rdquo;
            </p>
            <p className="text-xs text-rose-300/80 leading-relaxed">
              {concept.explanationText}
            </p>
          </div>
        ) : (
          /* ACTIVE CS CONCEPT BLACKBOARD */
          <div className="space-y-6 max-w-4xl mx-auto w-full overflow-hidden">
            {/* Chalkboard Title Banner */}
            <div className="border-b-2 border-dashed border-emerald-500/30 pb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CS Fundamentals Deep-Dive</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-emerald-100 tracking-tight">
                {concept.blackboardTitle}
              </h1>
            </div>

            {/* Diagram Section */}
            {concept.diagram?.trim() && (
              <div className="space-y-2 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400/80">
                  <span>Concept Diagram:</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40">
                    {concept.diagramType}
                  </span>
                </div>
                <MermaidViewer chart={concept.diagram} diagramType={concept.diagramType} />
              </div>
            )}

            {/* Chalkboard Pedagogical Notes */}
            <div className="p-5 rounded-xl bg-black/30 border border-emerald-500/20 shadow-inner">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                <span>Core Concept Explanation</span>
              </h3>
              <div className="space-y-3 text-xs sm:text-sm leading-relaxed font-sans">
                {concept.explanationText.split(/\r?\n/).map((line, idx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;

                  const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
                  if (heading) {
                    return (
                      <h4 key={idx} className="pt-2 text-base font-bold text-emerald-800">
                        {heading[1]}
                      </h4>
                    );
                  }

                  const bullet = trimmed.match(/^(?:[-*]|\d+[.)])\s+(.+)$/);
                  if (bullet) {
                    return (
                      <div key={idx} className="flex items-start gap-2 pl-2">
                        <span className="text-emerald-700" aria-hidden="true">•</span>
                        <p>{bullet[1]}</p>
                      </div>
                    );
                  }

                  return <p key={idx}>{trimmed}</p>;
                })}
              </div>
            </div>

            {/* Code / Pseudocode Snippet */}
            {concept.codeSnippet && concept.codeSnippet.code && (
              <div className="rounded-xl border border-emerald-500/20 bg-black/50 overflow-hidden shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 bg-emerald-950/50 border-b border-emerald-500/20 font-mono text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Implementation Example ({concept.codeSnippet.language})</span>
                  </div>
                </div>
                <pre className="p-4 font-mono text-xs text-emerald-200 overflow-x-auto leading-relaxed">
                  <code>{concept.codeSnippet.code}</code>
                </pre>
              </div>
            )}

            {/* Key Takeaways Chalk Checklist */}
            {concept.keyTakeaways && concept.keyTakeaways.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Key Blackboard Takeaways</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {concept.keyTakeaways.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-black/30 border border-emerald-900/40 text-xs text-emerald-100"
                    >
                      <span className="font-mono text-emerald-400 font-bold">{idx + 1}.</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Wooden Bottom Chalk Tray with Chalk Sticks & Felt Eraser */}
      <div className="h-6 bg-[#2a1d13] border-t-2 border-[#3c2a1a] px-4 flex items-center justify-between shadow-inner">
        {/* Chalk sticks */}
        <div className="flex items-center gap-2">
          {/* White chalk */}
          <div className="w-9 h-2.5 rounded-sm bg-slate-100 shadow-sm border border-slate-300" title="White chalk" />
          {/* Yellow chalk */}
          <div className="w-8 h-2.5 rounded-sm bg-amber-300 shadow-sm border border-amber-400" title="Yellow chalk" />
          {/* Cyan/Green chalk */}
          <div className="w-7 h-2.5 rounded-sm bg-emerald-300 shadow-sm border border-emerald-400" title="Green chalk" />
        </div>

        {/* Felt Eraser */}
        <div
          onClick={onClearBoard}
          className="h-3.5 w-14 rounded-sm bg-[#5c4028] border border-[#3c2a1a] shadow flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
          title="Felt Chalkboard Eraser"
        >
          <div className="w-12 h-1 bg-[#8c6b4d] rounded-xs" />
        </div>
      </div>
    </div>
  );
}
