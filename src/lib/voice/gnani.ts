/**
 * Gnani.ai (Vachana) voice client - server side only.
 *
 * Verified against https://docs.gnani.ai (Nov 2026):
 *  - STT  POST https://api.vachana.ai/stt/v3                 (multipart: audio_file, language_code)  max 30 s / clip
 *  - TTS  POST https://api.vachana.ai/api/v1/tts/inference   (JSON)  models: timbre-v2.5 | timbre-v3.0
 *  - Auth header: X-API-Key-ID
 *  - Some accounts allow only ONE active request at a time -> every call is serialised + retried on 429.
 */

export const GNANI_DEFAULT_STT_URL = 'https://api.vachana.ai/stt/v3';
export const GNANI_DEFAULT_TTS_URL = 'https://api.vachana.ai/api/v1/tts/inference';

export const TTS_MODELS = ['timbre-v2.5', 'timbre-v3.0'] as const;
export type TtsModel = (typeof TTS_MODELS)[number];

/** Voice catalogs per model (docs.gnani.ai/api/TTS/available-voices). A voice only works with its own model. */
export const TIMBRE_V25_VOICES = new Set([
  'Kaveri', 'Trupti', 'Devika', 'Pranav', 'Shlok', 'Girish', // English
  'Nalini', 'Bhavna', 'Yashvi', 'Urmila', 'Jwala', 'Chitra', 'Ambuja', 'Deepak', 'Roopesh', 'Vikrant',
  'Hemraj', 'Jalaj', 'Omkar', // Hindi
  'Poorvi', // Hinglish
  'Asmita', 'Trisha', 'Brinda', 'Vedika', 'Noopur', // Tamil
  'Suhana', 'Lehara', 'Lavanya', 'Yukti', 'Varuni', // Telugu
  'Saanvi', 'Kavin', 'Reshma', 'Riyaan', 'Zahira', 'Ishaan', 'Kirra', 'Dhruva', 'Falak', 'Veera', 'Mehuli', 'Zayan',
]);
export const TIMBRE_V30_VOICES = new Set([
  'Avinash', 'Shivani', 'Lakshmi', 'Kalpana', 'Shubham', 'Prakash', 'Devansh', 'Yashraj', 'Chetana',
  'Vasudha', 'Riyaa', 'Tarika', 'Harshad',
]);

export class GnaniError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 502, code = 'GNANI_ERROR') {
    super(message);
    this.name = 'GnaniError';
    this.status = status;
    this.code = code;
  }
}

export interface GnaniConfig {
  apiKey?: string;
  sttUrl: string;
  ttsUrl: string;
  language: string;
  defaultVoice: string;
  defaultModel: TtsModel;
  ignoredUrlOverrides: string[];
}

function pickUrl(envName: string, fallback: string, ignored: string[]): string {
  const raw = (process.env[envName] || '').trim();
  if (!raw) return fallback;
  try {
    // The old .env.example pointed at asr.gnani.ai / tts.gnani.ai which do not exist -> every call failed.
    if (new URL(raw).hostname !== 'api.vachana.ai') {
      ignored.push(`${envName}=${raw}`);
      return fallback;
    }
    return raw;
  } catch {
    ignored.push(`${envName}=${raw}`);
    return fallback;
  }
}

export function getGnaniConfig(): GnaniConfig {
  const ignoredUrlOverrides: string[] = [];
  const envModel = (process.env.GNANI_MODEL || '').trim();
  return {
    apiKey: (process.env.GNANI_API_KEY || '').trim() || undefined,
    sttUrl: pickUrl('GNANI_STT_URL', GNANI_DEFAULT_STT_URL, ignoredUrlOverrides),
    ttsUrl: pickUrl('GNANI_TTS_URL', GNANI_DEFAULT_TTS_URL, ignoredUrlOverrides),
    language: (process.env.GNANI_LANGUAGE || 'en-IN').trim(),
    defaultVoice: (process.env.GNANI_VOICE || 'Pranav').trim(),
    defaultModel: (TTS_MODELS as readonly string[]).includes(envModel) ? (envModel as TtsModel) : 'timbre-v2.5',
    ignoredUrlOverrides,
  };
}

/* -------------------------------------------------------------------------- */
/* Serialisation + retry (account may allow just 1 active request)            */
/* -------------------------------------------------------------------------- */

const g = globalThis as unknown as { __gnaniChain?: Promise<unknown> };
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const prev = g.__gnaniChain ?? Promise.resolve();
  const run = prev.then(fn, fn);
  g.__gnaniChain = run.catch(() => undefined);
  return run;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readError(res: Response): Promise<{ message: string; code: string }> {
  const raw = await res.text().catch(() => '');
  try {
    const j = JSON.parse(raw);
    const detail = j?.detail;
    const message =
      j?.error?.message ||
      j?.message ||
      (typeof detail === 'string' ? detail : detail?.message) ||
      (Array.isArray(detail) ? detail.map((d: any) => `${(d.loc || []).join('.')}: ${d.msg}`).join('; ') : '') ||
      raw.slice(0, 300);
    const code = j?.error?.type || detail?.error_code || j?.code || `HTTP_${res.status}`;
    return { message: String(message), code: String(code) };
  } catch {
    return { message: raw.slice(0, 300) || res.statusText, code: `HTTP_${res.status}` };
  }
}

function friendly(status: number, code: string, message: string): string {
  if (status === 401) return `Gnani rejected the API key (${code}). Check GNANI_API_KEY in .env.local and restart \`npm run dev\`.`;
  if (status === 402) return 'Gnani says the account has insufficient credit.';
  if (status === 403) return `Gnani key is not allowed to use this service (${message}).`;
  if (status === 429) return 'Gnani rate limit: only one active request at a time. Retried but still busy.';
  return `Gnani ${status} ${code}: ${message}`;
}

async function gnaniFetch(url: string, init: RequestInit & { retries?: number }): Promise<Response> {
  const retries = init.retries ?? 3;
  let last: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
    if (res.status !== 429) return res;
    last = res;
    await res.text().catch(() => '');
    await sleep(500 * (attempt + 1));
  }
  return last as Response;
}

/* -------------------------------------------------------------------------- */
/* TTS                                                                        */
/* -------------------------------------------------------------------------- */

export function resolveVoice(voice?: string, model?: string) {
  const cfg = getGnaniConfig();
  const m: TtsModel = (TTS_MODELS as readonly string[]).includes(model || '') ? (model as TtsModel) : cfg.defaultModel;
  const catalog = m === 'timbre-v3.0' ? TIMBRE_V30_VOICES : TIMBRE_V25_VOICES;
  if (voice && catalog.has(voice)) return { voice, model: m, adjusted: m !== model };
  const fallback = catalog.has(cfg.defaultVoice) ? cfg.defaultVoice : m === 'timbre-v3.0' ? 'Shivani' : 'Pranav';
  return { voice: fallback, model: m, adjusted: true };
}

export async function synthesizeSpeech(
  text: string,
  voice?: string,
  model?: string
): Promise<{ audioBuffer: Buffer; contentType: string; voiceUsed: string; modelUsed: string }> {
  const cfg = getGnaniConfig();
  if (!cfg.apiKey) throw new GnaniError('GNANI_API_KEY is not set in .env.local', 500, 'NO_API_KEY');

  const picked = resolveVoice(voice, model);
  const body = JSON.stringify({
    text: text.trim(),
    voice: picked.voice,
    model: picked.model,
    language: cfg.language,
    speed: 1.0,
    audio_config: { encoding: 'linear_pcm', container: 'wav', num_channels: 1, sample_rate: 24000, sample_width: 2 },
  });

  return serialize(async () => {
    let res: Response;
    try {
      res = await gnaniFetch(cfg.ttsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key-ID': cfg.apiKey! },
        body,
      });
    } catch (e: any) {
      throw new GnaniError(`Could not reach Gnani TTS (${cfg.ttsUrl}): ${e?.message || e}`, 502, 'NETWORK');
    }
    if (!res.ok) {
      const { message, code } = await readError(res);
      console.error(`[Gnani TTS] ${res.status} ${code}: ${message} (voice=${picked.voice} model=${picked.model})`);
      throw new GnaniError(friendly(res.status, code, message), res.status, code);
    }
    const audioBuffer = Buffer.from(await res.arrayBuffer());
    if (audioBuffer.length < 100) throw new GnaniError('Gnani TTS returned empty audio', 502, 'EMPTY_AUDIO');
    return {
      audioBuffer,
      contentType: res.headers.get('content-type') || 'audio/wav',
      voiceUsed: picked.voice,
      modelUsed: picked.model,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* STT                                                                        */
/* -------------------------------------------------------------------------- */

/** Single words (letters only) that Prisma v2.5 tends to miss in coding interviews. */
const TECH_BIAS = [
  'hashmap', 'hashset', 'deque', 'heap', 'trie', 'dfs', 'bfs', 'memoization', 'amortized', 'subarray',
  'substring', 'bitmask', 'dijkstra', 'toposort', 'logarithmic', 'quicksort', 'mergesort', 'leetcode',
];

export async function transcribeAudio(audioBuffer: Buffer, mimeType = 'audio/wav'): Promise<string> {
  const cfg = getGnaniConfig();
  if (!cfg.apiKey) throw new GnaniError('GNANI_API_KEY is not set in .env.local', 500, 'NO_API_KEY');

  const isWav = audioBuffer.length >= 12 && audioBuffer.subarray(0, 4).toString('ascii') === 'RIFF';
  const ext = isWav ? 'wav' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : 'wav';
  const effectiveMime = isWav ? 'audio/wav' : mimeType;

  return serialize(async () => {
    const form = new FormData();
    form.append('audio_file', new Blob([new Uint8Array(audioBuffer)], { type: effectiveMime }), `audio.${ext}`);
    form.append('language_code', cfg.language);
    form.append('format', 'verbatim');
    form.append('bias_list', JSON.stringify(TECH_BIAS));
    form.append('bias_score', '1.0');

    let res: Response;
    try {
      res = await gnaniFetch(cfg.sttUrl, { method: 'POST', headers: { 'X-API-Key-ID': cfg.apiKey! }, body: form });
    } catch (e: any) {
      throw new GnaniError(`Could not reach Gnani STT (${cfg.sttUrl}): ${e?.message || e}`, 502, 'NETWORK');
    }
    if (!res.ok) {
      const { message, code } = await readError(res);
      console.error(`[Gnani STT] ${res.status} ${code}: ${message}`);
      throw new GnaniError(friendly(res.status, code, message), res.status, code);
    }
    const data = await res.json().catch(() => ({}));
    const t = data?.transcript ?? data?.output?.literal ?? data?.text ?? '';
    return (typeof t === 'string' ? t : '').trim();
  });
}
