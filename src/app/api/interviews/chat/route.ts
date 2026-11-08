import { NextRequest, NextResponse } from 'next/server';
import { generate, generateStream, Message } from '@/lib/llm';
import { checkRateLimit } from '@/lib/llm/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local-client';
    const rate = checkRateLimit(`chat-${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rate.resetInSec}s` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      messages,
      type,
      problemTitle,
      currentCode,
      problem,
      phase,
      complexityAsked,
      resumeSnippet,
      interviewerName,
      interviewerRole,
      interviewerPersonality,
      stream: wantsStreamParam,
    } = body;

    let systemPrompt = '';
    const nameRoleStr = interviewerName
      ? `${interviewerName} (${interviewerRole || 'Staff Interviewer'})`
      : 'a Staff Software Engineer';
    const personaStr = interviewerPersonality
      ? `Your interviewing persona: ${interviewerPersonality}.`
      : '';

    if (type === 'Technical') {
      const p = problem || {};
      const examples = (p.examples || [])
        .slice(0, 2)
        .map((e: any, i: number) => `Example ${i + 1}: input ${e.input} -> output ${e.output}`)
        .join('\n');
      systemPrompt = `You are ${nameRoleStr}, running a LIVE VOICE technical coding interview. Everything you write is read aloud by a text-to-speech voice, and the candidate's words reach you through speech recognition (so expect small transcription slips; interpret them charitably).
${personaStr}

THE PROBLEM THE CANDIDATE IS SOLVING
Title: ${p.title || problemTitle || 'Coding Exercise'} (${p.difficulty || 'medium'})
${p.description || ''}
${examples}
${(p.constraints || []).length ? `Constraints: ${(p.constraints || []).join('; ')}` : ''}
${p.optimal_complexity ? `PRIVATE grading notes (never reveal unless the candidate has already stated it): optimal time ${p.optimal_complexity.time}, optimal space ${p.optimal_complexity.space}.` : ''}
${p.solution_approach ? `PRIVATE reference approach (never reveal; use only to judge the candidate): ${p.solution_approach}` : ''}

HOW YOU RUN THE INTERVIEW (current phase: ${phase || 'discussion'})
1. The candidate explains their plan out loud. Listen, then react to what they actually said: confirm what is right, probe what is vague, challenge what is wrong.
2. If they ask "should I use approach A or approach B?" (or similar), compare the two in one or two sentences (trade-offs in time, space, simplicity), say which you would lean towards and why, then ask them what they will choose.
3. Give hints only when asked or when they are clearly stuck, and start with the smallest hint. Never hand over the full solution.
4. Once they have an approach, ask for its time and space complexity${complexityAsked ? ' (you have ALREADY asked once this session; do not repeat, just discuss their answer)' : ''}. If they answer, say whether it is right and why.
5. When they say they are finished or happy with the code, make sure complexity has been discussed, then tell them to press the Submit Interview button for your final evaluation.
6. You can see their editor below. Refer to it when relevant, but do not read code aloud.

SPOKEN STYLE (strict): at most 3 short sentences. Plain speech only: no markdown, no bullet points, no code blocks, no asterisks. Say Big-O in words, for example "O of n log n". Warm, professional, encouraging. Ask at most one question per turn.

CURRENT EDITOR CONTENT
\`\`\`
${currentCode || '// Empty editor'}
\`\`\``;
    } else if (type === 'HR') {
      systemPrompt = `You are ${nameRoleStr} conducting a behavioral HR round using the STAR methodology (Situation, Task, Action, Result).
${personaStr}
Candidate Resume Context (if available):
${resumeSnippet || 'General Software Engineering Candidate'}

Guidelines:
1. Ask one targeted behavioral question at a time. Total questions: 5.
2. Probe into specific details if their response lacks Situation, Task, Action, or measurable Result.
3. Keep your conversational tone warm, professional, and concise. Your words are spoken aloud by a text-to-speech voice: at most 3 short sentences, plain speech only, no markdown or bullet points.`;
    } else if (type === 'Resume' || type === 'Resume Review') {
      systemPrompt = `You are ${nameRoleStr}, an Executive Tech Hiring Manager & Senior Resume Strategist at Rehearsal AI.
${personaStr}

Candidate Resume Context:
"""
${resumeSnippet || '// No resume text provided yet'}
"""

Resume Brainstorming & Interactive Debate Protocol:
1. Welcome & Framing: Conduct an engaging, interactive resume brainstorming session. Explain that you will analyze their background, suggest high-impact improvements (action verbs, quantifiable metrics, ATS structure), and that they are encouraged to debate, argue, or explain their constraints.
2. Suggesting Changes: Propose high-impact bullet improvements and explain the engineering hiring rationale.
3. Handling Candidate Pushback & Arguments:
   - When the candidate argues or pushes back (e.g. "I don't have exact metrics", "I want to keep my objective", "Why change this bullet?"), engage constructively and collegially.
   - Don't just cave in or repeat yourself. Provide the recruiter/hiring manager reality, or help them brainstorm creative proxies (e.g. hours saved, workflow adoption, reliability, architecture trade-offs).
4. Spoken Delivery: Keep turns crisp, punchy (2-4 sentences max), and natural for text-to-speech voicing via the Gnani API. Avoid asterisks, tables, or unpronounceable markdown.`;
    } else {
      systemPrompt = `You are ${nameRoleStr}, an AI interview coach for Rehearsal AI. ${personaStr} Assist the user with clear, concise, and constructive guidance.`;
    }

    const fullMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...(messages || []),
    ];

    const wantsStream =
      wantsStreamParam === true || req.headers.get('accept')?.includes('text/event-stream');

    if (wantsStream) {
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          try {
            let fullText = '';
            for await (const chunk of generateStream(fullMessages, {
              temperature: 0.7,
              maxTokens: 400,
            })) {
              fullText += chunk;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`)
              );
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true, fullText })}\n\n`)
            );
            controller.close();
          } catch (streamErr: any) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: streamErr?.message || 'Stream error' })}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      return new Response(customStream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    const result = await generate(fullMessages, {
      temperature: 0.7,
      maxTokens: 400,
    });

    return NextResponse.json({ reply: result.text, provider: result.providerUsed });
  } catch (error: any) {
    console.error('Interview chat error:', error);
    return NextResponse.json(
      { error: error?.message || 'Chat generation failed' },
      { status: 500 }
    );
  }
}

