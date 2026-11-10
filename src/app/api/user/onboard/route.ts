import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { parseAndSaveResume, MAX_RESUME_SIZE_BYTES } from '@/lib/resume/parser';
import { generateWithSchema, Message } from '@/lib/llm';
import { ResumeEvaluationSchema } from '@/lib/llm/schemas';

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    if (!isDatabaseConfigured() || !db) {
      return NextResponse.json(
        { error: 'Database is not configured. Please set a valid DATABASE_URL in your .env file.' },
        { status: 503 }
      );
    }

    let username = '';
    let candidateResumeText: string | null = null;
    let candidateResumeUrl: string | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      username = (formData.get('username') as string) || '';
      const resumeFile = formData.get('resume') as File | null;

      if (resumeFile && resumeFile.size > 0) {
        if (resumeFile.size > MAX_RESUME_SIZE_BYTES) {
          return NextResponse.json(
            { error: 'File size exceeds maximum 5 MB limit' },
            { status: 400 }
          );
        }
        const arrayBuffer = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parseResult = await parseAndSaveResume(buffer, resumeFile.name, authUser.id);
        candidateResumeText = parseResult.text;
        candidateResumeUrl = parseResult.url || null;
      }
    } else {
      const body = await req.json();
      username = body.username || '';
      if (typeof body.resumeText === 'string' && body.resumeText.trim()) {
        candidateResumeText = body.resumeText.trim();
      }
      if (typeof body.resumeUrl === 'string' && body.resumeUrl.trim()) {
        candidateResumeUrl = body.resumeUrl.trim();
      }
    }

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 24) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 24 characters' },
        { status: 400 }
      );
    }

    const validChars = /^[a-zA-Z0-9_]+$/.test(trimmed);
    if (!validChars) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    const userEmail = authUser.email;

    // Check username uniqueness
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, trimmed))
      .limit(1);

    if (existingUsername.length > 0 && existingUsername[0].email !== userEmail) {
      return NextResponse.json(
        { error: 'Username is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // Fetch existing user to preserve previously saved data
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    const existingRecord = existingUser[0];

    const finalResumeText = candidateResumeText || existingRecord?.resumeText || null;
    const finalResumeUrl = candidateResumeUrl || existingRecord?.resumeUrl || null;
    const now = new Date();

    const updateSet: Record<string, any> = {
      username: trimmed,
      onboardedAt: existingRecord?.onboardedAt || now,
    };

    if (candidateResumeText) {
      updateSet.resumeText = candidateResumeText;
    }
    if (candidateResumeUrl) {
      updateSet.resumeUrl = candidateResumeUrl;
    }

    await db
      .insert(users)
      .values({
        id: authUser.id,
        email: userEmail,
        googleId: authUser.id,
        username: trimmed,
        resumeUrl: finalResumeUrl,
        resumeText: finalResumeText,
        onboardedAt: now,
        rank: existingRecord?.rank || 'Bronze',
        points: existingRecord?.points ?? 100,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: updateSet,
      });

    // Optional ATS score evaluation if resume was provided
    let atsScore = 97;
    let topChanges: string[] = [];

    if (candidateResumeText && candidateResumeText.length > 30) {
      try {
        const messages: Message[] = [
          {
            role: 'system',
            content: `You are an elite Applicant Tracking System (ATS) and Senior Hiring Manager.
Evaluate the candidate's resume for SDE roles.
Return strict JSON with:
- score: integer from 60 to 99
- sectionWiseNotes: notes for summary, skills, projects, experience, education, formattingAts
- topChanges: array of 2-4 concise actionable feedback strings
- rewrittenBullets: array of object { original, improved }`,
          },
          {
            role: 'user',
            content: `Resume Content:\n\n${candidateResumeText.substring(0, 4000)}`,
          },
        ];
        const { data } = await generateWithSchema(messages, ResumeEvaluationSchema);
        if (data?.score) atsScore = data.score;
        if (data?.topChanges) topChanges = data.topChanges;
      } catch (atsErr) {
        console.warn('ATS evaluation fallback during onboarding:', atsErr);
      }
    }

    return NextResponse.json({
      success: true,
      username: trimmed,
      onboardedAt: (existingRecord?.onboardedAt || now).toISOString(),
      rank: existingRecord?.rank || 'Bronze',
      points: existingRecord?.points ?? 100,
      resumeText: finalResumeText,
      resumeUrl: finalResumeUrl,
      atsScore,
      topChanges,
    });
  } catch (error: any) {
    console.error('Onboard route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
