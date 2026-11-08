import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/voice/gnani';
import { checkRateLimit } from '@/lib/llm/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local-client';
    const rate = checkRateLimit(`voice-stt-${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rate.resetInSec}s` },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const transcript = await transcribeAudio(buffer, file.type || 'audio/webm');

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error('STT Route Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

