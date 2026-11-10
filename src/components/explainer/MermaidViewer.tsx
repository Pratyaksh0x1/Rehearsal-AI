'use client';

import React, { useEffect, useState, useId } from 'react';
import { Code, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface MermaidViewerProps {
  chart: string;
  diagramType?: 'mermaid' | 'ascii' | 'none';
  className?: string;
}

export function MermaidViewer({ chart, diagramType = 'mermaid', className = '' }: MermaidViewerProps) {
  const [svg, setSvg] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [zoom, setZoom] = useState(1.0);
  const uniqueId = useId().replace(/:/g, '_');

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
  };

  useEffect(() => {
    let isCancelled = false;

    async function renderMermaid() {
      if (!chart || !chart.trim()) {
        setSvg('');
        setHasError(false);
        return;
      }

      setSvg('');

      if (diagramType === 'ascii') {
        setHasError(false);
        return;
      }

      try {
        setHasError(false);
        setErrorMessage('');

        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            background: 'transparent',
            primaryColor: '#fffdf5',
            primaryTextColor: '#26352d',
            primaryBorderColor: '#5d806a',
            secondaryColor: '#e7efe4',
            secondaryTextColor: '#26352d',
            secondaryBorderColor: '#809985',
            tertiaryColor: '#f6e8c9',
            tertiaryTextColor: '#3e3524',
            tertiaryBorderColor: '#a98b59',
            lineColor: '#526b59',
            textColor: '#26352d',
            edgeLabelBackground: '#f7f1df',
            clusterBkg: '#f5f0df',
            clusterBorder: '#809985',
          },
          securityLevel: 'strict',
          fontFamily: 'Segoe Print, Comic Sans MS, cursive',
        });

        let cleaned = chart
          .replace(/```mermaid/gi, '')
          .replace(/```/g, '')
          .trim();

        const renderId = `mermaid_diag_${uniqueId}_${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(renderId, cleaned);

        if (!isCancelled) {
          setSvg(renderedSvg);
        }
      } catch (err: any) {
        console.warn('Mermaid rendering notice:', err);
        if (!isCancelled) {
          setHasError(true);
          setErrorMessage(err?.message || 'Syntax parsing notice');
        }
      }
    }

    void renderMermaid();

    return () => {
      isCancelled = true;
    };
  }, [chart, diagramType, uniqueId]);

  if (diagramType === 'ascii') {
    return (
      <pre className={`sketchbook-diagram whitespace-pre-wrap overflow-x-auto rounded-xl p-5 text-sm leading-relaxed ${className}`}>
        {chart}
      </pre>
    );
  }

  if (hasError) {
    return (
      <div className={`sketchbook-diagram p-4 rounded-xl font-mono text-xs whitespace-pre-wrap overflow-x-auto ${className}`}>
        <div className="flex items-center gap-2 mb-2 font-semibold text-[11px] uppercase tracking-wider">
          <Code className="w-3.5 h-3.5" />
          <span>Diagram source (rendering issue)</span>
        </div>
        {errorMessage && <p className="mb-2 opacity-70">{errorMessage}</p>}
        <code>{chart}</code>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center p-8 text-xs font-mono text-emerald-800/60 animate-pulse">
        Drawing diagram on blackboard...
      </div>
    );
  }

  return (
    <div
      className={`sketchbook-diagram relative w-full max-w-full rounded-xl shadow-inner overflow-hidden flex flex-col group ${className}`}
    >
      {/* Interactive Zoom & Pan Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-emerald-900/20 text-xs font-mono text-emerald-900/80 shrink-0">
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-emerald-800" />
          <span className="text-[11px] tracking-wide">Sketchbook Diagram</span>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5 bg-white/70 px-2 py-0.5 rounded-lg border border-emerald-900/20">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="Zoom out"
            className="p-1 rounded text-emerald-800 hover:text-black hover:bg-emerald-500/20 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset to 100%"
            className="px-1.5 py-0.5 text-[11px] font-bold text-emerald-800 hover:text-black transition-colors cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 2.0}
            title="Zoom in"
            className="p-1 rounded text-emerald-800 hover:text-black hover:bg-emerald-500/20 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-1 ml-1 rounded text-emerald-800/70 hover:text-emerald-900 hover:bg-emerald-500/20 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Diagram Viewport with Scroll & Zoom Transform */}
      <div className="relative w-full min-h-[300px] overflow-auto max-h-[580px] p-4 sm:p-6 cursor-grab active:cursor-grabbing select-none min-w-0">
        <div
          className="sketchbook-diagram__svg w-full min-w-0 transition-transform duration-150 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
