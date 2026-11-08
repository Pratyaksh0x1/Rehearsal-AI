import { NextResponse } from 'next/server';
import { getGnaniConfig, synthesizeSpeech, transcribeAudio, GnaniError } from '@/lib/voice/gnani';
import { generate } from '@/lib/llm';
import { checkRateLimit } from '@/lib/llm/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Open  http://localhost:3000/api/voice/health  to see exactly which part of the voice pipeline is broken:
 * env -> Gnani TTS -> Gnani STT (round trip of the TTS audio) -> LLM.
 */
export async function GET() {
    const rate = checkRateLimit('voice-health');
    if (!rate.allowed) return NextResponse.json({ error: 'Slow down' }, { status: 429 });

    const cfg = getGnaniConfig();
    const report: any = {
        env: {
            GNANI_API_KEY: cfg.apiKey ? `set (${cfg.apiKey.length} chars)` : 'MISSING',
            sttUrl: cfg.sttUrl,
            ttsUrl: cfg.ttsUrl,
            language: cfg.language,
            ignoredBadUrlOverrides: cfg.ignoredUrlOverrides,
            LLM_PROVIDER: process.env.LLM_PROVIDER || 'gemini (default)',
            GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'set' : 'MISSING',
            GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash (default)',
        },
    };

    try {
        const tts = await synthesizeSpeech('Testing one two three. Hello from Rehearsal AI.', 'Pranav', 'timbre-v2.5');
        report.tts = { ok: true, bytes: tts.audioBuffer.length, voice: tts.voiceUsed, model: tts.modelUsed };
        try {
            const transcript = await transcribeAudio(tts.audioBuffer, 'audio/wav');
            report.stt = { ok: true, transcript };
        } catch (e: any) {
            report.stt = { ok: false, error: e?.message, code: e instanceof GnaniError ? e.code : undefined };
        }
    } catch (e: any) {
        report.tts = { ok: false, error: e?.message, code: e instanceof GnaniError ? e.code : undefined };
        report.stt = { ok: false, error: 'skipped because TTS failed' };
    }

    try {
        const r = await generate([{ role: 'user', content: 'Reply with the single word: ready' }], { maxTokens: 20 });
        report.llm = { ok: r.providerUsed !== 'mock', providerUsed: r.providerUsed, model: r.modelUsed, text: r.text.slice(0, 40) };
        if (r.providerUsed === 'mock') report.llm.problem = 'All LLM providers failed or have no key -> the interviewer is giving canned mock replies. Check the server log for "[LLM] Provider ... failed".';
    } catch (e: any) {
        report.llm = { ok: false, error: e?.message };
    }

    return NextResponse.json(report, { status: 200 });
}
