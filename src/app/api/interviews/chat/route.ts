import { NextRequest, NextResponse } from 'next/server';
import { generate, generateStream, generateWithSchema, Message } from '@/lib/llm';
import { GreetingResponseSchema } from '@/lib/llm/schemas';
import { checkRateLimit } from '@/lib/llm/rate-limit';
import { requireUser } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`chat-${authUser.id}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rate.resetInSec}s` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      type,
      problemTitle,
      problem,
      phase,
      complexityAsked,
      resumeSnippet,
      stream: wantsStreamParam,
    } = body;

    const messages = body.messages || body.conversation || [];
    const currentCode = body.currentCode || body.code || '';
    const interviewerName = body.interviewerName || body.interviewer?.name || '';
    const interviewerRole = body.interviewerRole || body.interviewer?.role || '';
    const interviewerPersonality = body.interviewerPersonality || body.interviewer?.personality || '';

    const interviewDurationMinutes =
      type === 'HR'
        ? 10
        : type === 'Resume' || type === 'Resume Review'
          ? 20
          : type === 'Technical'
            ? 20
            : null;

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

      if (phase === 'greeting') {
        const roundDurationMins = interviewDurationMinutes || 20;
        systemPrompt = `You are ${nameRoleStr}, conducting a LIVE VOICE technical coding interview with candidate ${body.candidateName || 'the candidate'}.
${personaStr}
You are in the opening greeting chamber before entering the coding workspace. The problem the candidate will solve is "${p.title || problemTitle || 'Coding Exercise'}".

ROUND INFORMATION & RULES (YOU MUST KNOW THESE):
- The interview duration is exactly ${roundDurationMins} minutes (matching the ${roundDurationMins}:00 round timer).
- If the candidate asks how long the interview is, answer ${roundDurationMins} minutes. Never state a different duration.
- Supported programming languages are Python, JavaScript, C++, and Java. Candidates can switch languages in the editor at any time.
- The candidate is strongly encouraged to think aloud, communicate edge cases, discuss time and space complexity, and write clean modular code.
- Hints: Yes, the candidate can ask for hints if they get stuck during coding, and you will give gentle nudges.
- Questions during coding: Yes, the candidate is allowed and encouraged to ask questions, verify assumptions, and clarify constraints while coding.
- CRITICAL CONFIDENTIALITY RULE: You must NEVER reveal the solution, algorithm, reference code, data structures, or hints for "${p.title || problemTitle || 'the problem'}" in this greeting room. If they ask about the problem itself, explain that they will see the complete problem specification on their screen as soon as you enter the coding workspace.

CONVERSATION AND TRANSITION:
- Use the entire conversation history to understand the latest candidate turn, including the interviewer's immediately preceding question. Interpret natural affirmative or negative responses in context and allow for speech-recognition transcription errors.
- Return intent "ready_to_start" and action "START_CODING" only when context clearly shows that the candidate wants to begin. In that case, reply with a short, natural transition to the coding workspace.
- Return intent "has_question" and action "CONTINUE_CONVERSATION" when the candidate asks about duration, languages, hints, rules, or anything else that needs an answer. Answer naturally, then invite remaining questions or readiness.
- Return intent "other" and action "CONTINUE_CONVERSATION" for a greeting, status update, or unclear response. Continue naturally and ask a brief follow-up when useful.
- Do not infer readiness merely from a polite acknowledgment. If uncertain, clarify; never trigger coding unless readiness is clear.
- Always return both "intent" and "action". Use "START_CODING" exactly when intent is "ready_to_start"; otherwise use "CONTINUE_CONVERSATION".

SPOKEN STYLE (strict):
- At most 2 to 3 short sentences.
- Plain speech only: NO markdown, NO asterisks, NO bullet points, NO code blocks.
- Warm, professional, human, and encouraging.`;
      } else if (phase === 'coding_intro') {
        systemPrompt = `You are ${nameRoleStr}, conducting a LIVE VOICE technical coding interview with candidate ${body.candidateName || 'the candidate'}.
${personaStr}
This technical interview lasts exactly ${interviewDurationMinutes} minutes. If asked about the time limit, answer ${interviewDurationMinutes} minutes and never state a different duration.
The candidate has just entered the live coding workspace to solve "${p.title || problemTitle || 'the problem'}".
Provide a brief, welcoming opening line inviting them to review the problem specification and share their initial thoughts or ask any questions before coding.
SPOKEN STYLE (strict): at most 2 short sentences. Plain speech only: no markdown, no asterisks, no code blocks. Warm, professional, encouraging.`;
      } else {
        systemPrompt = `You are ${nameRoleStr}, running a LIVE VOICE technical coding interview. Everything you write is read aloud by a text-to-speech voice, and the candidate's words reach you through speech recognition (so expect small transcription slips; interpret them charitably).
${personaStr}
This technical interview lasts exactly ${interviewDurationMinutes} minutes. If asked about the time limit, answer ${interviewDurationMinutes} minutes and never state a different duration.

THE PROBLEM THE CANDIDATE IS SOLVING
Title: ${p.title || problemTitle || 'Coding Exercise'} (${p.difficulty || 'medium'})
${p.description || ''}
${examples}
${(p.constraints || []).length ? `Constraints: ${(p.constraints || []).join('; ')}` : ''}
${p.optimal_complexity ? `PRIVATE grading notes (never reveal unless the candidate has already stated it): optimal time ${p.optimal_complexity.time}, optimal space ${p.optimal_complexity.space}.` : ''}
${p.solution_approach ? `PRIVATE reference approach (never reveal; use only to judge the candidate): ${p.solution_approach}` : ''}

HOW YOU RUN THE INTERVIEW (current phase: ${phase || 'discussion'})
1. CANDIDATE FIRST INTENT & QUESTIONS:
   - If the candidate asks ANY question (about the problem statement, inputs, edge cases, examples, constraints, or if they can start coding), ANSWER IT DIRECTLY, CLEARLY, AND CONCISELY (1-2 sentences). Never reply with a canned or generic line if they asked a direct question!
   - If the candidate explains their plan or approach, react specifically to their algorithmic idea: confirm what is right, probe what is vague, or challenge what is suboptimal.
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
      }
    } else if (type === 'HR') {
      systemPrompt = `You are ${nameRoleStr} conducting a behavioral HR round using the STAR methodology (Situation, Task, Action, Result).
${personaStr}
This HR interview lasts exactly ${interviewDurationMinutes} minutes. If asked about the time limit, answer ${interviewDurationMinutes} minutes and never state a different duration.
Candidate Resume Context (if available):
${resumeSnippet || 'General Software Engineering Candidate'}

Guidelines:
1. Ask one targeted behavioral question at a time. Total questions: 5.
2. Probe into specific details if their response lacks Situation, Task, Action, or measurable Result.
3. Keep your conversational tone warm, professional, and concise. Your words are spoken aloud by a text-to-speech voice: at most 3 short sentences, plain speech only, no markdown or bullet points.`;
    } else if (type === 'Resume' || type === 'Resume Review') {
      systemPrompt = `You are ${nameRoleStr}, an Executive Tech Hiring Manager & Senior Resume Strategist at Rehearsal AI.
${personaStr}
This resume review round lasts exactly ${interviewDurationMinutes} minutes. If asked about the time limit, answer ${interviewDurationMinutes} minutes and never state a different duration.

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
              allowMockFallback: false,
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

    // Structured Greeting & Q&A intent handling
    if (type === 'Technical' && phase === 'greeting') {
      try {
        const { data: validated, providerUsed } = await generateWithSchema(
          fullMessages,
          GreetingResponseSchema,
          {
            provider: 'groq',
            fallbackOrder: ['groq', 'grok', 'gemini', 'deepseek', 'openrouter'],
            allowMockFallback: false,
            temperature: 0.6,
            maxTokens: 250,
          }
        );
        console.info(`[Interview Chat] Greeting response generated by ${providerUsed}`);

        const finalReply = validated.reply.trim();
        const canStart = validated.intent === 'ready_to_start' && validated.action === 'START_CODING';

        return NextResponse.json({
          reply: finalReply,
          intent: canStart
            ? 'ready_to_start'
            : validated.intent === 'ready_to_start'
              ? 'other'
              : validated.intent,
          action: canStart ? 'START_CODING' : 'CONTINUE_CONVERSATION',
          provider: providerUsed,
        });
      } catch (schemaErr: any) {
        console.error('Greeting response could not be validated:', schemaErr);
        return NextResponse.json(
          { error: 'The AI interviewer returned an invalid response. Please try again.' },
          { status: 502 }
        );
      }
    }

    const result = await generate(fullMessages, {
      temperature: 0.7,
      maxTokens: 400,
      provider: 'groq',
      fallbackOrder: ['groq', 'grok', 'gemini', 'deepseek', 'openrouter'],
      allowMockFallback: false,
    });

    console.info(`[Interview Chat] Response generated by ${result.providerUsed}`);
    return NextResponse.json({ reply: result.text, provider: result.providerUsed });
  } catch (error: any) {
    console.error('Interview chat error:', error);
    return NextResponse.json(
      { error: 'The AI interviewer could not respond. Check the configured provider API key and try again.' },
      { status: 500 }
    );
  }
}
