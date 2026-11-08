'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  Loader2,
  Sparkles,
  Radio,
  SkipForward,
  AlertTriangle,
  Play,
  Headphones,
  Mic,
  Activity,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Public API & Interfaces                                                    */
/* -------------------------------------------------------------------------- */

export interface VoicePanelHandle {
  /** Speak text with the Gnani TTS voice (resolves when finished or interrupted). */
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  /** true while the agent is speaking/thinking or the candidate is mid-sentence */
  isBusy: () => boolean;
}

export interface VoiceMessageOptions {
  onChunk?: (token: string) => void;
  signal?: AbortSignal;
}

interface VoicePanelProps {
  onSendMessage: (
    text: string,
    options?: VoiceMessageOptions
  ) => Promise<string | void>;
  isProcessing?: boolean;
  panelistName?: string;
  voice?: string;
  model?: string;
  voiceId?: string;
  onUserPause?: () => void;
  /** Called once when the candidate presses "Start voice interview" (a user gesture, so audio is allowed). */
  onStart?: () => void | Promise<void>;
  /** Used when onStart is not provided: spoken once when the candidate presses start. */
  initialMessage?: string;
}

/* -------------------------------------------------------------------------- */
/* Turn-taking & VAD Tuning Constants (Easy to configure)                     */
/* -------------------------------------------------------------------------- */

export const BASE_SILENCE_MS = 1000; // Base pause threshold that ends the candidate's turn
export const UNFINISHED_SILENCE_MS = 1800; // Extended pause when last spoken words indicate incomplete thought
export const SHORT_SPEECH_SILENCE_MS = 700; // Fast submission for brief responses ("yes", "O of n")
export const SHORT_SPEECH_MAX_DURATION_MS = 1500; // Duration under which an utterance is considered short
export const UNFINISHED_WORDS = ['and', 'so', 'because', 'then', 'um', 'uh', 'like', 'but', 'or'];

export const MIN_VOICED_MS = 380; // Ignore tiny clicks, throat clearing or coughs
export const MAX_CHUNK_MS = 25000; // Gnani REST STT accepts max 30 s per clip
export const STT_SAMPLE_RATE = 16000; // Gnani 16 kHz mono WAV
export const NOISE_CALIBRATION_MS = 1500; // Calibrate background noise during initial 1.5s
export const PRE_ROLL_FRAMES = 5; // ~350-420ms pre-roll to preserve first word / plosive
export const RESUME_WINDOW_MS = 1500; // Cancel in-flight request if user resumes talking within 1.5s

export const INTERRUPT_RMS_THRESHOLD = 0.038; // Loud speech threshold for headphones interrupt
export const INTERRUPT_VOICED_MS = 400; // Minimum duration of loud speech to trigger agent interrupt

export const EMPTY_STT_FALLBACK_PHRASE = "Sorry, I didn't catch that, could you repeat?";

const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

/* -------------------------------------------------------------------------- */
/* Audio Encoding & DSP Helpers                                               */
/* -------------------------------------------------------------------------- */

function writeString(view: DataView, offset: number, s: string) {
  for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function downsample(buf: Float32Array, from: number, to: number): Float32Array {
  if (to >= from) return buf;
  const ratio = from / to;
  const len = Math.floor(buf.length / ratio);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(buf.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += buf[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function mergeFrames(frames: Float32Array[]): Float32Array {
  const total = frames.reduce((a, f) => a + f.length, 0);
  const out = new Float32Array(total);
  let o = 0;
  for (const f of frames) {
    out.set(f, o);
    o += f.length;
  }
  return out;
}

/** Convert mathematical notation, Big-O, and code markdown to natural speech phonetics. */
export function toSpeakable(input: string): string {
  let t = input || '';
  t = t.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`([^`]*)`/g, '$1');
  t = t.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(\S[^*\n]*)\*/g, '$1');
  const math = (s: string) =>
    s
      .replace(/(\w)\s*\^\s*2\b/g, '$1 squared')
      .replace(/(\w)\s*\^\s*3\b/g, '$1 cubed')
      .replace(/(\w+)\s*\^\s*(\w+)/g, '$1 to the power $2')
      .replace(/\s*\*\s*/g, ' times ')
      .replace(/\s*\+\s*/g, ' plus ')
      .replace(/\blog\s*n\b/gi, 'log n');
  t = t.replace(
    /\bO\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g,
    (_m, inner: string) => `O of ${math(inner)}`
  );
  t = t
    .replace(/<=/g, ' is at most ')
    .replace(/>=/g, ' is at least ')
    .replace(/!=/g, ' is not equal to ')
    .replace(/->|→/g, ' gives ')
    .replace(/(\w)\s*\^\s*(\d+)/g, '$1 to the power $2')
    .replace(/\s=\s/g, ' equals ')
    .replace(/[#>]+/g, ' ')
    .replace(/[*_]+/g, ' ')
    .replace(/[()[\]{}]/g, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

/** Split into TTS-sized pieces at sentence boundaries. */
export function splitForTts(text: string, max = 260): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = s;
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.flatMap((c) => {
    if (c.length <= max + 80) return [c];
    const parts: string[] = [];
    for (let i = 0; i < c.length; i += max) parts.push(c.slice(i, i + max));
    return parts;
  });
}

function playUrl(
  url: string,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  resolverRef: React.MutableRefObject<(() => void) | null>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const a = new Audio(url);
    audioRef.current = a;
    resolverRef.current = resolve;
    a.onended = () => {
      resolverRef.current = null;
      resolve();
    };
    a.onerror = () => {
      resolverRef.current = null;
      reject(new Error('Audio playback failed'));
    };
    a.play().catch((e) => {
      resolverRef.current = null;
      reject(e);
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Component State & Handlers                                                 */
/* -------------------------------------------------------------------------- */

interface Segment {
  active: boolean;
  frames: Float32Array[];
  pendingVoiced: number;
  voicedMs: number;
  silentMs: number;
  totalMs: number;
}
const freshSegment = (): Segment => ({
  active: false,
  frames: [],
  pendingVoiced: 0,
  voicedMs: 0,
  silentMs: 0,
  totalMs: 0,
});

export type VoiceStateLabel = 'Listening' | 'Heard you' | 'Thinking' | 'Speaking' | 'Mic Off';

export const VoicePanel = forwardRef<VoicePanelHandle, VoicePanelProps>(function VoicePanel(
  props,
  ref
) {
  const { isProcessing = false, panelistName = 'AI Interviewer', voice, model } = props;

  const [started, setStarted] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [headphonesMode, setHeadphonesMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [lastReplyText, setLastReplyText] = useState('');
  const [statusMessage, setStatusMessage] = useState('Press start to begin the voice interview');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fresh props ref to avoid stale closures inside long-lived audio callbacks
  const propsRef = useRef(props);
  propsRef.current = props;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGenRef = useRef(0);
  const micStartedAtRef = useRef(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playResolverRef = useRef<(() => void) | null>(null);

  const segRef = useRef<Segment>(freshSegment());
  const preRollRef = useRef<Float32Array[]>([]);
  const noiseFloorRef = useRef(0.006);
  const sttChainRef = useRef<Promise<void>>(Promise.resolve());
  const partsRef = useRef<string[]>([]);

  const speakTokenRef = useRef(0);
  const isAgentSpeakingRef = useRef(false);
  const busyRef = useRef(false);
  const ignoreUntilRef = useRef(0);
  const isMutedRef = useRef(false);
  const headphonesModeRef = useRef(false);
  const interruptVoicedMsRef = useRef(0);

  // Turn timing & resumption refs
  const speechEndTimestampRef = useRef(0);
  const submitTimestampRef = useRef(0);
  const isAwaitingFirstTokenRef = useRef(false);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const lastSubmittedFramesRef = useRef<Float32Array[]>([]);

  const lastReplyRef = useRef('');
  const lastUserSpeakingRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    headphonesModeRef.current = headphonesMode;
  }, [headphonesMode]);

  const setErr = (m: string | null) => setErrorMsg(m);

  /* ----------------------------- playback ------------------------------- */

  const stopPlayback = useCallback(() => {
    speakTokenRef.current++;
    const a = audioRef.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      a.pause();
      audioRef.current = null;
    }
    const release = playResolverRef.current;
    playResolverRef.current = null;
    release?.();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isAgentSpeakingRef.current = false;
    setIsAgentSpeaking(false);
  }, []);

  // Serialized TTS queue so only 1 Gnani request is active at a time
  const ttsQueueChainRef = useRef<Promise<Blob | null>>(Promise.resolve(null));

  const fetchTts = useCallback((chunk: string): Promise<Blob | null> => {
    const nextCall = ttsQueueChainRef.current.then(async () => {
      const p = propsRef.current;
      try {
        const res = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunk,
            voice: p.voice || p.voiceId,
            model: p.model,
          }),
        });
        if (res.ok && res.headers.get('content-type')?.includes('audio')) {
          setErr(null);
          return await res.blob();
        }
        const data = await res.json().catch(() => null);
        setErr(`Gnani voice failed: ${data?.error || `HTTP ${res.status}`}`);
        return null;
      } catch {
        setErr('Gnani voice failed: could not reach the server');
        return null;
      }
    });
    ttsQueueChainRef.current = nextCall;
    return nextCall;
  }, []);

  const browserSpeak = (text: string) =>
    new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });

  const speak = useCallback(
    async (rawText: string) => {
      const text = (rawText || '').trim();
      if (!text) return;
      lastReplyRef.current = text;
      setLastReplyText(text);
      if (isMutedRef.current) return;

      stopPlayback();
      const token = ++speakTokenRef.current;
      isAgentSpeakingRef.current = true;
      setIsAgentSpeaking(true);
      setStatusMessage(`${propsRef.current.panelistName || 'Interviewer'} is speaking...`);

      const chunks = splitForTts(toSpeakable(text));
      try {
        let next: Promise<Blob | null> | null = chunks.length ? fetchTts(chunks[0]) : null;
        for (let i = 0; i < chunks.length; i++) {
          if (token !== speakTokenRef.current) return;
          const blob = await next;
          next = i + 1 < chunks.length ? fetchTts(chunks[i + 1]) : null;
          if (token !== speakTokenRef.current) return;
          if (!blob) {
            await browserSpeak(chunks[i]);
            continue;
          }
          const url = URL.createObjectURL(blob);
          try {
            await playUrl(url, audioRef, playResolverRef);
          } finally {
            URL.revokeObjectURL(url);
          }
        }
      } catch (e: any) {
        setErr(`Audio playback problem: ${e?.message || e}. Click the page once and press replay.`);
      } finally {
        if (token === speakTokenRef.current) {
          isAgentSpeakingRef.current = false;
          setIsAgentSpeaking(false);
          ignoreUntilRef.current = Date.now() + 600; // brief cooldown to let speaker echoes decay
          setStatusMessage('Listening - speak any time');
        }
      }
    },
    [fetchTts, stopPlayback]
  );

  /* --------------------------- speech -> reply ---------------------------- */

  const requestStt = async (wav: Blob): Promise<string> => {
    const fd = new FormData();
    fd.append('audio', wav, 'recording.wav');
    const res = await fetch('/api/voice/stt', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `STT HTTP ${res.status}`);
    return (data.transcript || '').trim();
  };

  const transcribeChunk = (samples: Float32Array, sampleRate: number) => {
    sttChainRef.current = sttChainRef.current
      .then(async () => {
        const wav = encodeWAV(
          downsample(samples, sampleRate, STT_SAMPLE_RATE),
          Math.min(sampleRate, STT_SAMPLE_RATE)
        );
        const text = await requestStt(wav);
        if (text) partsRef.current.push(text);
        setErr(null);
      })
      .catch((e: any) => setErr(`Gnani speech recognition failed: ${e?.message || e}`));
    return sttChainRef.current;
  };

  /**
   * Pipelined responder:
   * 1. Streams LLM tokens from parent
   * 2. Detects sentence boundaries immediately
   * 3. Sends sentence 1 to Gnani TTS and plays it while sentence 2 is synthesized
   * 4. Logs full turn timings to console
   */
  const respond = useCallback(
    async (text: string) => {
      busyRef.current = true;
      const speechEndedAt = speechEndTimestampRef.current || Date.now();
      const transcriptAt = Date.now();
      let firstTokenAt: number | null = null;
      let firstAudioAt: number | null = null;

      setStatusMessage(`${propsRef.current.panelistName || 'Interviewer'} is thinking...`);

      const controller = new AbortController();
      activeAbortControllerRef.current = controller;
      isAwaitingFirstTokenRef.current = true;

      // Sentence boundary detection accumulator
      let streamBuffer = '';
      const pendingSentences: string[] = [];
      let isStreamingDone = false;

      // Playback pipeline
      const token = ++speakTokenRef.current;
      let playbackPromise = Promise.resolve();

      const queueSentenceForTts = (sentence: string) => {
        const cleaned = toSpeakable(sentence).trim();
        if (!cleaned) return;
        const subChunks = splitForTts(cleaned);

        for (const chunk of subChunks) {
          // Prefetch TTS
          const ttsPromise = fetchTts(chunk);

          playbackPromise = playbackPromise.then(async () => {
            if (token !== speakTokenRef.current || isMutedRef.current) return;
            const blob = await ttsPromise;
            if (token !== speakTokenRef.current || isMutedRef.current) return;

            if (!firstAudioAt) {
              firstAudioAt = Date.now();
              console.log('[Turn Timings]', {
                speechEndToTranscriptMs: transcriptAt - speechEndedAt,
                transcriptToFirstTokenMs: (firstTokenAt || transcriptAt) - transcriptAt,
                firstTokenToFirstAudioMs: firstAudioAt - (firstTokenAt || transcriptAt),
                totalSpeechToAudioLatencyMs: firstAudioAt - speechEndedAt,
              });
            }

            if (!isAgentSpeakingRef.current) {
              isAgentSpeakingRef.current = true;
              setIsAgentSpeaking(true);
              setStatusMessage(`${propsRef.current.panelistName || 'Interviewer'} is speaking...`);
            }

            if (!blob) {
              await browserSpeak(chunk);
              return;
            }

            const url = URL.createObjectURL(blob);
            try {
              await playUrl(url, audioRef, playResolverRef);
            } finally {
              URL.revokeObjectURL(url);
            }
          });
        }
      };

      const processStreamBuffer = (flushRemaining: boolean) => {
        // Match complete sentences ending in . ! ? followed by space, newline, or end
        const sentenceRegex = /([^.!?\n]+[.!?]+)(?:\s+|$)/g;
        let match: RegExpExecArray | null;
        let lastIndex = 0;

        while ((match = sentenceRegex.exec(streamBuffer)) !== null) {
          const sentence = match[1].trim();
          if (sentence) {
            queueSentenceForTts(sentence);
          }
          lastIndex = match.index + match[0].length;
        }

        if (lastIndex > 0) {
          streamBuffer = streamBuffer.slice(lastIndex);
        }

        if (flushRemaining && streamBuffer.trim()) {
          queueSentenceForTts(streamBuffer.trim());
          streamBuffer = '';
        }
      };

      try {
        const reply = await propsRef.current.onSendMessage(text, {
          signal: controller.signal,
          onChunk: (chunk: string) => {
            if (!firstTokenAt) {
              firstTokenAt = Date.now();
              isAwaitingFirstTokenRef.current = false;
            }
            streamBuffer += chunk;
            processStreamBuffer(false);
          },
        });

        isStreamingDone = true;
        processStreamBuffer(true);

        if (reply) {
          lastReplyRef.current = reply;
          setLastReplyText(reply);
        }

        // Wait for all pipelined sentence audio playback to finish
        await playbackPromise;
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          console.log('[VoicePanel] Turn aborted by candidate resuming speech');
          return;
        }
        setErr(`Interviewer error: ${e?.message || e}`);
      } finally {
        if (token === speakTokenRef.current) {
          isAgentSpeakingRef.current = false;
          setIsAgentSpeaking(false);
          busyRef.current = false;
          isAwaitingFirstTokenRef.current = false;
          ignoreUntilRef.current = Date.now() + 600;
          setStatusMessage('Listening - speak any time');
        }
      }
    },
    [fetchTts]
  );

  const finishUtterance = useCallback(
    async (samples: Float32Array, sampleRate: number) => {
      speechEndTimestampRef.current = Date.now();
      submitTimestampRef.current = Date.now();
      busyRef.current = true;
      setIsTranscribing(true);
      setStatusMessage('Transcribing with Gnani STT...');

      if (samples.length > 0) {
        await transcribeChunk(samples, sampleRate);
      } else {
        await sttChainRef.current;
      }

      const text = partsRef.current.join(' ').trim();
      partsRef.current = [];
      setIsTranscribing(false);

      if (text.length > 1) {
        await respond(text);
      } else {
        // Requirement 5: Speak polite prompt if STT transcript was empty
        console.log('[VoicePanel] Empty STT transcript -> voicing fallback prompt');
        busyRef.current = false;
        setStatusMessage("I didn't catch that - try again");
        await speak(EMPTY_STT_FALLBACK_PHRASE);
      }
    },
    [respond, speak]
  );

  /* ------------------------------- mic / VAD ------------------------------ */

  const endSegment = useCallback(() => {
    const seg = segRef.current;
    if (!seg.active) return;
    const frames = seg.frames;
    const voicedMs = seg.voicedMs;
    lastSubmittedFramesRef.current = [...frames];
    segRef.current = freshSegment();
    lastUserSpeakingRef.current = false;
    setIsUserSpeaking(false);

    const sr = audioCtxRef.current?.sampleRate || 48000;
    if (voicedMs < MIN_VOICED_MS) {
      if (partsRef.current.length) void finishUtterance(new Float32Array(0), sr);
      return;
    }

    propsRef.current.onUserPause?.();
    void finishUtterance(mergeFrames(frames), sr);
  }, [finishUtterance]);

  const stopMic = useCallback(() => {
    micGenRef.current++;
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    segRef.current = freshSegment();
    preRollRef.current = [];
    setIsMicActive(false);
    setIsUserSpeaking(false);
    setVolumeLevel(0);
  }, []);

  const startMic = useCallback(async () => {
    const gen = ++micGenRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (gen !== micGenRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      sourceRef.current = source;
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(ctx.destination);

      micStartedAtRef.current = Date.now();

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const frameMs = (input.length / ctx.sampleRate) * 1000;
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);
        setVolumeLevel(Math.min(100, Math.round(rms * 450)));

        const now = Date.now();

        // 1. Noise Floor Calibration during the initial 1.5s
        const isCalibrating = now - micStartedAtRef.current < NOISE_CALIBRATION_MS;
        if (isCalibrating) {
          noiseFloorRef.current = Math.max(0.003, noiseFloorRef.current * 0.85 + rms * 0.15);
        }

        // 2. Turn-taking & Headphones Interruption Mode
        if (isAgentSpeakingRef.current) {
          if (headphonesModeRef.current) {
            // Check for loud candidate speech interrupting the agent
            if (rms > Math.max(INTERRUPT_RMS_THRESHOLD, noiseFloorRef.current * 3.5)) {
              interruptVoicedMsRef.current += frameMs;
              if (interruptVoicedMsRef.current >= INTERRUPT_VOICED_MS) {
                console.log('[VoicePanel] Candidate interrupted agent in Headphones mode');
                stopPlayback();
                interruptVoicedMsRef.current = 0;
                segRef.current.active = true;
                segRef.current.frames = [...preRollRef.current];
                segRef.current.voicedMs = INTERRUPT_VOICED_MS;
                segRef.current.totalMs = segRef.current.frames.length * frameMs;
                segRef.current.silentMs = 0;
                setIsUserSpeaking(true);
                setStatusMessage('Listening...');
                return;
              }
            } else {
              interruptVoicedMsRef.current = Math.max(0, interruptVoicedMsRef.current - frameMs * 0.5);
            }
          }
          // Do not accumulate audio while agent is speaking (strict turn-taking)
          segRef.current = freshSegment();
          preRollRef.current = [];
          return;
        }

        // Speaker tail cooldown
        if (now < ignoreUntilRef.current) {
          segRef.current = freshSegment();
          preRollRef.current = [];
          return;
        }

        // Dynamic thresholding
        const threshold = Math.max(0.012, noiseFloorRef.current * 2.8);
        const voiced = rms > threshold;
        const seg = segRef.current;
        const copy = new Float32Array(input);

        // 3. Speech resumption check within 1.5s of submit
        if (
          voiced &&
          isAwaitingFirstTokenRef.current &&
          now - submitTimestampRef.current < RESUME_WINDOW_MS
        ) {
          console.log('[VoicePanel] Candidate resumed speech within 1.5s - merging turns');
          activeAbortControllerRef.current?.abort();
          isAwaitingFirstTokenRef.current = false;
          busyRef.current = false;
          setIsTranscribing(false);
          seg.active = true;
          seg.frames = [...lastSubmittedFramesRef.current, ...preRollRef.current, copy];
          seg.voicedMs = 500;
          seg.totalMs = seg.frames.length * frameMs;
          seg.silentMs = 0;
          setIsUserSpeaking(true);
          setStatusMessage('Listening...');
          return;
        }

        // If busy processing (and not resuming), ignore frames
        if (busyRef.current) {
          return;
        }

        // 4. Inactive Segment / Idle Listening
        if (!seg.active) {
          // Adapt noise floor only when completely idle
          if (!voiced && !isCalibrating) {
            noiseFloorRef.current = Math.max(0.003, noiseFloorRef.current * 0.97 + rms * 0.03);
          }

          // Pre-roll ring buffer (maintains ~350-420ms)
          preRollRef.current.push(copy);
          if (preRollRef.current.length > PRE_ROLL_FRAMES) preRollRef.current.shift();

          if (voiced) {
            seg.pendingVoiced++;
            if (seg.pendingVoiced >= 2) {
              seg.active = true;
              seg.frames = [...preRollRef.current];
              seg.voicedMs = seg.pendingVoiced * frameMs;
              seg.totalMs = seg.frames.length * frameMs;
              seg.silentMs = 0;
              if (!lastUserSpeakingRef.current) {
                lastUserSpeakingRef.current = true;
                setIsUserSpeaking(true);
                setStatusMessage('Listening...');
              }
            }
          } else {
            seg.pendingVoiced = 0;
          }
          return;
        }

        // 5. Active Candidate Speech Segment
        seg.frames.push(copy);
        seg.totalMs += frameMs;

        if (voiced) {
          seg.voicedMs += frameMs;
          seg.silentMs = 0;
        } else {
          seg.silentMs += frameMs;
        }

        // 6. Smarter Dynamic End-of-Turn Silence Evaluation
        let requiredSilenceMs = BASE_SILENCE_MS; // 1000ms base

        if (seg.voicedMs < SHORT_SPEECH_MAX_DURATION_MS) {
          // Short answers such as "yes" or "O of n"
          requiredSilenceMs = SHORT_SPEECH_SILENCE_MS; // 700ms
        } else {
          // Check if partial speech ends with unfinished trailing words or comma
          const partialText = partsRef.current.join(' ').toLowerCase().trim();
          const endsWithUnfinished =
            UNFINISHED_WORDS.some(
              (w) => partialText.endsWith(` ${w}`) || partialText === w
            ) || partialText.endsWith(',');

          if (endsWithUnfinished) {
            requiredSilenceMs = UNFINISHED_SILENCE_MS; // 1800ms
          }
        }

        if (seg.silentMs >= requiredSilenceMs) {
          endSegment();
        } else if (seg.totalMs >= MAX_CHUNK_MS) {
          // Long explanation: ship 25s chunk to Gnani STT now, keep listening
          const chunk = mergeFrames(seg.frames);
          seg.frames = [];
          seg.totalMs = 0;
          void transcribeChunk(chunk, ctx.sampleRate);
        }
      };

      setIsMicActive(true);
      setStatusMessage('Listening - speak any time');
    } catch (err: any) {
      console.warn('Microphone unavailable:', err);
      setIsMicActive(false);
      setErr(
        'Microphone blocked or unavailable - allow mic access in the browser, or type your answers below.'
      );
      setStatusMessage('Mic off - you can type your answers');
    }
  }, [endSegment, stopPlayback]);

  /* ------------------------------ lifecycle ------------------------------- */

  const handleStart = async () => {
    setStarted(true);
    setErr(null);
    try {
      const a = new Audio(SILENT_WAV);
      await a.play().catch(() => undefined);
    } catch {
      /* ignore */
    }
    void startMic();
    const p = propsRef.current;
    if (p.onStart) await p.onStart();
    else if (p.initialMessage) await speak(p.initialMessage);
  };

  useEffect(() => {
    return () => {
      stopMic();
      stopPlayback();
    };
  }, [stopMic, stopPlayback]);

  useImperativeHandle(
    ref,
    () => ({
      speak,
      stopSpeaking: stopPlayback,
      isBusy: () => isAgentSpeakingRef.current || busyRef.current || segRef.current.active,
    }),
    [speak, stopPlayback]
  );

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = textInput.trim();
    if (!message || isProcessing || busyRef.current) return;
    stopPlayback();
    setTextInput('');
    await respond(message);
  };

  const active = started;

  // Determine State Label for UI badge
  const voiceState: VoiceStateLabel = !active || !isMicActive
    ? 'Mic Off'
    : isAgentSpeaking
      ? 'Speaking'
      : isTranscribing || isProcessing || busyRef.current
        ? 'Thinking'
        : isUserSpeaking
          ? 'Heard you'
          : 'Listening';

  /* --------------------------------- UI ----------------------------------- */

  return (
    <div className="w-full bg-[#0d1424]/90 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col gap-3 transition-all">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full transition-all ${
              voiceState === 'Speaking'
                ? 'bg-accent animate-ping'
                : voiceState === 'Thinking'
                  ? 'bg-amber-400 animate-spin'
                  : voiceState === 'Heard you'
                    ? 'bg-emerald-400 scale-125'
                    : voiceState === 'Listening'
                      ? 'bg-emerald-500/80 animate-pulse'
                      : 'bg-slate-500'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">{panelistName}</span>
              <span className="text-[10px] font-mono text-accent bg-accent/15 px-2 py-0.5 rounded-full border border-accent/25">
                Gnani.ai &bull; {model || 'Timbre'}
              </span>

              {/* Requirement 2: Prominent State Label */}
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border transition-all ${
                  voiceState === 'Listening'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : voiceState === 'Heard you'
                      ? 'bg-teal-500/20 border-teal-400 text-teal-200 animate-pulse font-bold'
                      : voiceState === 'Thinking'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                        : voiceState === 'Speaking'
                          ? 'bg-accent/25 border-accent text-accent font-bold animate-pulse'
                          : 'bg-white/5 border-white/10 text-text-muted'
                }`}
              >
                {voiceState}
              </span>
            </div>
            <p className="text-[11px] text-text-muted font-mono mt-0.5">{statusMessage}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Headphones Interrupt Mode Toggle */}
          <button
            type="button"
            onClick={() => setHeadphonesMode(!headphonesMode)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1.5 border transition-all ${
              headphonesMode
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-sm'
                : 'bg-white/5 border-white/10 text-text-subtle hover:text-text-primary'
            }`}
            title="Enable Headphones Mode to interrupt the interviewer by speaking loudly"
          >
            <Headphones className="w-3 h-3" />
            <span>{headphonesMode ? 'Headphones ON' : 'Headphones'}</span>
          </button>

          <button
            type="button"
            disabled={!active}
            onClick={() => (isMicActive ? stopMic() : void startMic())}
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1.5 border transition-all disabled:opacity-40 ${
              isMicActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-text-subtle hover:text-text-primary'
            }`}
            title="Toggle microphone"
          >
            <Radio className="w-3 h-3" />
            <span>{isMicActive ? 'Mic ON' : 'Mic OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => void speak(lastReplyRef.current)}
            disabled={!lastReplyText}
            className="p-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
            title="Replay last speech"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isMuted) stopPlayback();
              setIsMuted(!isMuted);
            }}
            className="p-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-danger" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-accent" />
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 text-[11px] leading-snug text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            {errorMsg}{' '}
            <span className="text-red-300/70">(check microphone permissions and network)</span>
          </span>
        </div>
      )}

      {!started ? (
        <button
          type="button"
          onClick={() => void handleStart()}
          className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Play className="w-4 h-4" />
          <span>Start voice interview</span>
        </button>
      ) : (
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-center gap-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
            <span className="flex items-center gap-1.5">
              {voiceState === 'Heard you' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Heard you &bull; Speaking...
                </span>
              ) : voiceState === 'Speaking' ? (
                <span className="text-accent font-bold flex items-center gap-1">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  {panelistName} is speaking...
                </span>
              ) : voiceState === 'Thinking' ? (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-emerald-400" />
                  Listening for your answer...
                </span>
              )}
            </span>

            {/* Requirement 2: Live mic-level meter pill */}
            <div className="flex items-center gap-2">
              {isMicActive && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10"
                  title="Mic input volume"
                >
                  <Activity className="w-2.5 h-2.5 text-emerald-400" />
                  <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${Math.min(100, volumeLevel)}%` }}
                    />
                  </div>
                </div>
              )}

              {isAgentSpeaking && (
                <button
                  type="button"
                  onClick={stopPlayback}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-white/15 hover:bg-white/10"
                  title="Skip the rest of what the interviewer is saying"
                >
                  <SkipForward className="w-3 h-3" /> Skip
                </button>
              )}
            </div>
          </div>

          {/* Visualizer bars */}
          <div className="flex items-center justify-center gap-1 h-8">
            {[12, 24, 38, 55, 30, 48, 65, 28, 50, 40, 60, 32, 20, 44, 25, 15].map((h, i) => {
              const activeHeight = isUserSpeaking
                ? Math.max(8, (h * volumeLevel) / 50)
                : isAgentSpeaking
                  ? h * 0.45 + (i % 4) * 3
                  : 4;
              return (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isUserSpeaking
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : isAgentSpeaking
                        ? 'bg-accent shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse'
                        : 'bg-white/10'
                  }`}
                  style={{ height: `${activeHeight}px`, animationDelay: `${i * 60}ms` }}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type your thoughts/explanation here..."
            disabled={isProcessing}
            className="flex-1 px-3.5 py-2 text-xs rounded-full border border-white/10 bg-white/5 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 text-text-primary placeholder:text-text-subtle"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isProcessing}
            className="px-4 py-2 rounded-full bg-accent text-accent-foreground hover:bg-accent-hover text-xs font-semibold disabled:opacity-40 transition-all shadow-md flex items-center gap-1"
            title="Send text answer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

        {isUserSpeaking && (
          <button
            type="button"
            onClick={endSegment}
            className="px-3.5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-lg animate-pulse flex items-center gap-1.5 transition-all"
            title="Done speaking now (optional override)"
          >
            <span>Done speaking &rarr;</span>
          </button>
        )}
      </div>
    </div>
  );
});
