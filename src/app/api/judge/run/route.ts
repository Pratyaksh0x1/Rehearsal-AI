import { NextRequest, NextResponse } from 'next/server';
import { executeCode } from '@/lib/judge';
import { checkRateLimit } from '@/lib/llm/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local-client';
    const rate = checkRateLimit(`judge-${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rate.resetInSec}s` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { code, language, stdin, problemId } = body;

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    const result = await executeCode({ code, language, stdin, problemId });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Judge route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Code execution failed' },
      { status: 500 }
    );
  }
}

