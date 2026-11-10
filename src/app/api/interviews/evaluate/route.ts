import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { generateWithSchema, Message } from '@/lib/llm';
import {
  TechnicalEvaluationSchema,
  HREvaluationSchema,
  ResumeEvaluationSchema,
  TechnicalEvaluation,
} from '@/lib/llm/schemas';
import { db, isDatabaseConfigured } from '@/db';
import { interviews, problemAttempts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateRankFromPoints } from '@/config/ranks';
import { checkRateLimit } from '@/lib/llm/rate-limit';
import { getProblemSession } from '@/lib/problems/session';
import { runTestCases } from '@/lib/judge';

export const maxDuration = 120;

// Evaluation JSON is long (many free-text fields). The 2048-token default truncated it and made
// the whole report fail, so give it room and a longer timeout.
const EVAL_LLM_OPTIONS = { maxTokens: 6144, timeoutMs: 45000, maxSchemaAttempts: 1 } as const;

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`evaluate-${authUser.id}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rate.resetInSec}s` },
        { status: 429 }
      );
    }

    const userId = authUser.id;
    const userEmail = authUser.email;

    const body = await req.json();
    const {
      type,
      conversation,
      code,
      language,
      problem,
      resumeText,
      hiddenTestCases,
      executionResult,
      problemSessionId,
      durationMinutes,
    } = body;

    if (!type) {
      return NextResponse.json({ error: 'Interview type is required' }, { status: 400 });
    }

    const interviewId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (type === 'Technical') {
      let finalExecution: any = null;
      let totalTests = 0;
      let passedTests = 0;

      // Always judge the submitted code on the server against the stored problem tests
      // (visible + hidden). A client-supplied result can be stale (last "Run" = visible tests only,
      // possibly older code) or simply forged to inflate score and rank points.
      if (problemSessionId && code && String(code).trim() && language) {
        const sessionProblem = getProblemSession(problemSessionId);
        if (sessionProblem?.test_cases && sessionProblem.test_cases.length > 0) {
          try {
            finalExecution = await runTestCases({
              code,
              language,
              testCases: sessionProblem.test_cases,
            });
          } catch (e) {
            console.error('Server evaluation test execution error:', e);
          }
        }
      }
      // Only if the problem session is gone (e.g. dev server restarted) fall back to the client's result.
      if (!finalExecution) finalExecution = executionResult;

      if (finalExecution?.test_results && Array.isArray(finalExecution.test_results)) {
        totalTests = finalExecution.test_results.length;
        passedTests = finalExecution.test_results.filter((t: any) => t.passed).length;
      }

      const executionSummary = totalTests > 0
        ? `Actual Sandbox Test Execution Results (Real Judge):
Total Tests: ${totalTests} (includes visible & hidden edge cases)
Passed Tests: ${passedTests} / ${totalTests} (${Math.round((passedTests / totalTests) * 100)}%)
Execution Status: ${finalExecution?.status || 'Executed'}
Exit Code: ${finalExecution?.exitCode ?? 0}
Judge Output:
${finalExecution?.stdout || 'No stdout'}
${finalExecution?.stderr ? `Errors:\n${finalExecution.stderr}` : ''}`
        : 'Note: No automated test results provided; evaluate code correctness through strict static algorithmic analysis.';

      const profanityAlert = body.profanityViolations && body.profanityViolations > 0
        ? `\n⚠️ Conduct Notice: Candidate had ${body.profanityViolations} inappropriate language violation(s) flagged during this interview. Reflect this in conductNotes and penalize communication score.`
        : '';

      const screenSwitchAlert = body.screenSwitchCount && body.screenSwitchCount > 0
        ? `\n⚠️ Proctor Alert: Candidate switched tabs/windows ${body.screenSwitchCount} time(s). Reflect this proctoring violation in conductNotes.`
        : '';

      const pauseInfo = body.pauseStats
        ? `\nCandidate Pause Metrics:
- Total Pauses (>4s idle): ${body.pauseStats.pauseCount || 0}
- Cumulative Pause Duration: ${body.pauseStats.totalPauseSec || 0} seconds
- Longest Single Pause: ${body.pauseStats.maxPauseSec || 0} seconds`
        : '';

      const codeEvolutionInfo = body.codeSnapshots && body.codeSnapshots.length > 1
        ? `\nCode Evolution Progression (${body.codeSnapshots.length} checkpoints captured during typing):
Initial Code Draft:
\`\`\`${language || 'python'}
${body.codeSnapshots[0].slice(0, 400)}
\`\`\`
Midway Code Draft:
\`\`\`${language || 'python'}
${body.codeSnapshots[Math.floor(body.codeSnapshots.length / 2)].slice(0, 400)}
\`\`\``
        : '';

      const messages: Message[] = [
        {
          role: 'system',
          content: `You are an elite Staff Software Engineer conducting a rigorous technical coding interview.
Problem: ${problem?.title || 'Coding Problem'} (${problem?.difficulty || 'Medium'})
Source: ${problem?.source || 'Internal'}
Topics: ${problem?.topics?.join(', ') || 'Algorithms'}
${problem?.description ? `Description:\n${problem.description}\n` : ''}
${hiddenTestCases && hiddenTestCases.length > 0 ? `Hidden Edge Test Cases Evaluated on Submission (Strict Check):\n${JSON.stringify(hiddenTestCases, null, 2)}\n` : ''}
${executionSummary}${profanityAlert}${screenSwitchAlert}${pauseInfo}${codeEvolutionInfo}

Evaluate the candidate's code submission, typing evolution, and conversation transcript strictly.
Submitted Code (${language || 'python'}):
\`\`\`${language || 'python'}
${code || '// No code submitted'}
\`\`\`

Evaluate for:
1. Correctness against visible and hidden edge cases (anchor directly to sandbox execution results above if available)
2. Approach (optimality, chosen data structures)
3. Complexity analysis (Big-O time and space)
4. Communication & English Language Fluency:
   - Evaluate the candidate's ability to explain the algorithmic flow and thought process.
   - Scrutinize the candidate's English grammar, sentence flow, and vocabulary.
   - Identify specific grammatical mistakes or awkward phrasing in the transcript and list them in grammarMistakes.
   - Provide constructive englishGrammarFeedback on their verbal communication clarity.
5. Pause Analysis (kitna pause liya candidate ne):
   - Evaluate candidate's pauses. Distinguish between deliberate, thoughtful design contemplation before coding vs prolonged hesitation or being stuck. Detail this in pauseAnalysis.
6. Self-Correction Analysis:
   - Identify where the candidate was initially mistaken (in speech or initial code draft) and subsequently caught their mistake and corrected themselves. Detail this in selfCorrectionAnalysis.
7. Code Style & Craftsmanship:
   - Critique code formatting, indentation, variable naming (flag single-letter names), modular structure, and language-specific idioms in codeStyleFeedback.
8. Professional Conduct:
   - Ensure communication is respectful and professional. Note any inappropriate remarks, profanity, or screen-switching violations in conductNotes.
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

      let data: TechnicalEvaluation;
      try {
        // Never fall back to the canned mock report here: it would show a made-up score.
        ({ data } = await generateWithSchema(messages, TechnicalEvaluationSchema, {
          ...EVAL_LLM_OPTIONS,
          allowMockFallback: false,
        }));
      } catch (llmErr) {
        console.error('Technical evaluation LLM failed, using test-result-only report:', llmErr);
        const pct = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        data = {
          score: pct,
          correctness: pct,
          approach: pct,
          complexityAnalysis: pct,
          communication: pct,
          englishGrammarFeedback: '',
          grammarMistakes: [],
          feedback:
            'The AI feedback service was unavailable, so this report only reflects the automated test results for your code.',
          timeComplexity: 'Not analysed',
          spaceComplexity: 'Not analysed',
          passed: totalTests > 0 && passedTests === totalTests,
        };
      }
      if (body.screenSwitchCount !== undefined) {
        data.screenSwitchingInfractions = body.screenSwitchCount;
      }

      // Anchor correctness and overall score to real test run results if tests were executed
      if (totalTests > 0) {
        const realCorrectness = Math.round((passedTests / totalTests) * 100);
        data.correctness = realCorrectness;
        data.passed = passedTests === totalTests;

        // Balanced composite score weighted by real correctness
        const composite = Math.round(
          data.correctness * 0.45 +
          data.approach * 0.25 +
          data.complexityAnalysis * 0.15 +
          data.communication * 0.15
        );
        data.score = Math.min(100, Math.max(0, composite));
      }

      // An empty submission must never earn score or points, whatever the LLM said.
      if (!code || !String(code).trim()) {
        data.score = 0;
        data.correctness = 0;
        data.passed = false;
      }

      // Save to database
      if (isDatabaseConfigured() && db && userEmail) {
        try {
          await db.insert(interviews).values({
            id: interviewId,
            userId,
            type: 'Technical',
            score: data.score,
            transcript: JSON.stringify(conversation || []),
            feedbackJson: {
              ...data,
              problemTitle: problem?.title || null,
              rankTier: problem?.rankTier || null,
              totalTests,
              passedTests,
              durationMinutes: durationMinutes || null,
            },
          });

          // Award Technical rating points and elevate Technical Rank
          let earnedPoints = 0;
          let newRank = 'Bronze';

          const userRecord = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          const problemExternalId = String(
            problem?.externalId || problem?.id || problem?.title || `prob_${interviewId}`
          );
          const problemDifficulty =
            problem?.rankTier || userRecord[0]?.technicalRank || problem?.difficulty || 'Bronze';

          await db.insert(problemAttempts).values({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId,
            interviewId,
            source: problem?.source || 'Rehearsal AI',
            externalId: problemExternalId,
            difficulty: problemDifficulty,
            solved: Boolean(data.passed),
            submittedCode: code || '',
            language: language || 'python',
          });

          if (userRecord.length > 0) {
            // Points calculated directly from the actual score; no floor so empty submissions do not earn points.
            earnedPoints = Math.round(data.score * (data.passed ? 1.0 : 0.6));
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

      const { data } = await generateWithSchema(messages, HREvaluationSchema, EVAL_LLM_OPTIONS);

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
            earnedHrPoints = Math.max(0, overallScore);
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

      const hasConversation = Array.isArray(conversation) && conversation.length > 1;

      const messages: Message[] = [
        {
          role: 'system',
          content: `You are an executive Tech Career Coach & Staff Hiring Manager conducting an interactive resume brainstorming and project interrogation.
The candidate was asked targeted questions about their resume projects, frameworks, and claimed metrics.
Resume Content:
${resume.substring(0, 4500)}

${hasConversation ? 'Analyze both the resume and the candidate’s answers to interview questions in the conversation transcript below.' : 'Analyze the candidate’s resume content.'}
Return strict JSON matching the schema with:
- score: overall integer score out of 100 based on ATS readability and defense quality
- accuracyAssessment: detailed analysis of whether the candidate was correct, truthful, and technically accurate when defending their projects/internships, or if there were technical hand-waving or factual gaps
- candidateStrengths: array of 2-4 points the candidate explained/defended strongly
- resumeImprovements: array of 3-5 concrete action items the candidate can do to improve and upgrade their resume based on their answers
- sectionWiseNotes: notes for summary, skills, projects, experience, education, formattingAts
- topChanges: array of high-priority actionable bullet changes
- rewrittenBullets: array of { original, improved } concrete bullet transformations`,
        },
        ...(hasConversation
          ? conversation.map((c: any) => ({
              role: c.role === 'assistant' ? ('assistant' as const) : ('user' as const),
              content: c.content,
            }))
          : []),
        {
          role: 'user',
          content: hasConversation
            ? 'Please evaluate my answers, project accuracy, and generate actionable resume improvements and ATS report now.'
            : `Resume Content:\n\n${resume}\n\nPlease generate a comprehensive evaluation.`,
        },
      ];

      const { data } = await generateWithSchema(messages, ResumeEvaluationSchema, EVAL_LLM_OPTIONS);

      if (isDatabaseConfigured() && db && userEmail) {
        try {
          await db.insert(interviews).values({
            id: interviewId,
            userId,
            type: 'Resume Review',
            score: data.score,
            transcript: JSON.stringify(conversation || 'Resume Review Execution'),
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
