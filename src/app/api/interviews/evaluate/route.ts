import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithSchema, Message } from '@/lib/llm';
import {
  TechnicalEvaluationSchema,
  HREvaluationSchema,
  ResumeEvaluationSchema,
} from '@/lib/llm/schemas';
import { db, isDatabaseConfigured } from '@/db';
import { interviews, problemAttempts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateRankFromPoints } from '@/config/ranks';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const userId = authUser?.id || 'anonymous_user';
    const userEmail = authUser?.email;

    const body = await req.json();
    const { type, conversation, code, language, problem, resumeText, hiddenTestCases } = body;

    if (!type) {
      return NextResponse.json({ error: 'Interview type is required' }, { status: 400 });
    }

    const interviewId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (type === 'Technical') {
      const messages: Message[] = [
        {
          role: 'system',
          content: `You are an elite Staff Software Engineer conducting a rigorous technical coding interview.
Problem: ${problem?.title || 'Coding Problem'} (${problem?.difficulty || 'Medium'})
Source: ${problem?.source || 'LeetCode'}
Topics: ${problem?.topics?.join(', ') || 'Algorithms'}
${problem?.description ? `Description:\n${problem.description}\n` : ''}
${hiddenTestCases && hiddenTestCases.length > 0 ? `Hidden Edge Test Cases Evaluated on Submission (Strict Check):\n${JSON.stringify(hiddenTestCases, null, 2)}\n` : ''}
Evaluate the candidate's code submission and conversation transcript strictly.
Submitted Code (${language || 'python'}):
\`\`\`${language || 'python'}
${code || '// No code submitted'}
\`\`\`

Evaluate for:
1. Correctness against visible and hidden edge cases (syntax, boundary values, empty inputs, algorithmic bugs)
2. Approach (optimality, chosen data structures)
3. Complexity analysis (Big-O time and space)
4. Communication (explanation of thought process)
Return strict JSON matching the schema.`,
        },
        ...(conversation || []).map((c: any) => ({
          role: c.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: c.content,
        })),
        {
          role: 'user',
          content: 'Please evaluate my complete interview performance, code, and complexities now.',
        },
      ];

      const { data } = await generateWithSchema(messages, TechnicalEvaluationSchema);

      // Save to database
      if (isDatabaseConfigured() && db && userEmail) {
        try {
          await db.insert(interviews).values({
            id: interviewId,
            userId,
            type: 'Technical',
            score: data.score,
            transcript: JSON.stringify(conversation || []),
            feedbackJson: data,
          });

          if (problem?.externalId) {
            await db.insert(problemAttempts).values({
              id: `att_${Date.now()}`,
              userId,
              interviewId,
              source: problem.source || 'LeetCode',
              externalId: String(problem.externalId),
              difficulty: problem.difficulty || 'Medium',
              solved: data.passed,
              submittedCode: code || '',
              language: language || 'python',
            });
          }

          // Award Technical rating points and elevate Technical Rank
          let earnedPoints = 0;
          let newRank = 'Bronze';

          const userRecord = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (userRecord.length > 0) {
            // Points calculated directly from LLM score
            earnedPoints = Math.max(10, Math.round(data.score * (data.passed ? 1.0 : 0.6)));
            const currentTechPoints = userRecord[0].technicalPoints ?? userRecord[0].points ?? 0;
            const newTechPoints = currentTechPoints + earnedPoints;
            const newTechRank = calculateRankFromPoints(newTechPoints);
            newRank = newTechRank;

            await db
              .update(users)
              .set({
                technicalPoints: newTechPoints,
                technicalRank: newTechRank,
                points: newTechPoints + (userRecord[0].hrPoints || 0),
                rank: newTechRank,
              })
              .where(eq(users.id, userId));
          }

          return NextResponse.json({
            success: true,
            interviewId,
            evaluation: data,
            rankUpdate: {
              league: 'Technical',
              earnedPoints,
              newRank,
            },
          });
        } catch (dbErr) {
          console.error('Error recording interview in DB:', dbErr);
        }
      }

      return NextResponse.json({ success: true, interviewId, evaluation: data });
    }

    if (type === 'HR') {
      const messages: Message[] = [
        {
          role: 'system',
          content: `You are a Senior Talent Partner conducting a behavioral HR interview.
Evaluate the candidate's answers based on the STAR methodology (Situation, Task, Action, Result), communication clarity, confidence, and cultural ownership.
Return strict JSON matching the schema.`,
        },
        ...(conversation || []).map((c: any) => ({
          role: c.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: c.content,
        })),
        {
          role: 'user',
          content: 'Please provide my final behavioral evaluation, scores, strengths, and areas for improvement.',
        },
      ];

      const { data } = await generateWithSchema(messages, HREvaluationSchema);

      if (isDatabaseConfigured() && db && userEmail) {
        try {
          const overallScore = Math.round(
            (data.communicationScore +
              data.starStructureScore +
              data.confidenceClarityScore +
              data.relevanceScore) /
              4
          );

          await db.insert(interviews).values({
            id: interviewId,
            userId,
            type: 'HR',
            score: overallScore,
            transcript: JSON.stringify(conversation || []),
            feedbackJson: data,
          });

          // Award HR rating points and elevate HR Rank
          let earnedHrPoints = 0;
          let newHrRank = 'Bronze';

          const userRecord = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (userRecord.length > 0) {
            earnedHrPoints = Math.max(10, overallScore);
            const currentHrPoints = userRecord[0].hrPoints ?? 0;
            const newTotalHrPoints = currentHrPoints + earnedHrPoints;
            newHrRank = calculateRankFromPoints(newTotalHrPoints);

            await db
              .update(users)
              .set({
                hrPoints: newTotalHrPoints,
                hrRank: newHrRank,
                points: (userRecord[0].technicalPoints || 0) + newTotalHrPoints,
              })
              .where(eq(users.id, userId));
          }

          return NextResponse.json({
            success: true,
            interviewId,
            evaluation: data,
            rankUpdate: {
              league: 'HR',
              earnedPoints: earnedHrPoints,
              newRank: newHrRank,
            },
          });
        } catch (dbErr) {
          console.error('Error recording HR interview in DB:', dbErr);
        }
      }

      return NextResponse.json({ success: true, interviewId, evaluation: data });
    }

    if (type === 'Resume Review') {
      const resume = resumeText || '';
      if (!resume || resume.trim().length < 20) {
        return NextResponse.json(
          { error: 'Valid resume text is required for review.' },
          { status: 400 }
        );
      }

      const messages: Message[] = [
        {
          role: 'system',
          content: `You are an executive Tech Career Coach & Staff Hiring Manager.
Evaluate the candidate's resume strictly, constructively, and concisely.
Do not fabricate facts or experience not mentioned in the resume.
Return strict JSON matching the schema with:
- score out of 100
- sectionWiseNotes for (summary, skills, projects, experience, education, formattingAts)
- topChanges (actionable bullet list)
- rewrittenBullets (concrete before/after improvements)`,
        },
        {
          role: 'user',
          content: `Resume Content:\n\n${resume}\n\nPlease generate a comprehensive evaluation.`,
        },
      ];

      const { data } = await generateWithSchema(messages, ResumeEvaluationSchema);

      if (isDatabaseConfigured() && db && userEmail) {
        try {
          await db.insert(interviews).values({
            id: interviewId,
            userId,
            type: 'Resume Review',
            score: data.score,
            transcript: 'Resume Review Execution',
            feedbackJson: data,
          });
        } catch (dbErr) {
          console.error('Error recording Resume Review in DB:', dbErr);
        }
      }

      return NextResponse.json({ success: true, interviewId, evaluation: data });
    }

    return NextResponse.json({ error: 'Unsupported interview type' }, { status: 400 });
  } catch (error: any) {
    console.error('Evaluation route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Evaluation failed' },
      { status: 500 }
    );
  }
}
