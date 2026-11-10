import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSpeech, GnaniError } from '@/lib/voice/gnani';
import { checkRateLimit } from '@/lib/llm/rate-limit';
import { requireUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`voice-tts-${authUser.id}`, 180);
    if (!rate.allowed) {
      return NextResponse.json({ error: `Rate limit exceeded. Try again in ${rate.resetInSec}s` }, { status: 429 });
    }

    const { text, voice, model, voiceId, language } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required for TTS' }, { status: 400 });
    }

    const r = await synthesizeSpeech(text.slice(0, 700), voice || voiceId, model, language);
    return new NextResponse(new Uint8Array(r.audioBuffer), {
      headers: {
        'Content-Type': r.contentType,
        'Cache-Control': 'no-store',
        'X-Gnani-Voice': r.voiceUsed,
        'X-Gnani-Model': r.modelUsed,
      },
    });
  } catch (error: any) {
    // Surface the REAL reason to the UI instead of silently falling back.
    if (error instanceof GnaniError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 502 });
    }
    console.error('TTS Route Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to synthesize speech' }, { status: 500 });
  }
}
