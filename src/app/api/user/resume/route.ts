import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseAndSaveResume, MAX_RESUME_SIZE_BYTES } from '@/lib/resume/parser';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const userId = authUser?.id || 'anonymous_candidate';
    const userEmail = authUser?.email;

    const formData = await req.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No resume file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum 5 MB limit' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await parseAndSaveResume(buffer, file.name, userId);

    // Save to database if configured and user email exists
    if (userEmail && isDatabaseConfigured() && db) {
      try {
        await db
          .update(users)
          .set({
            resumeUrl: result.url,
            resumeText: result.text,
          })
          .where(eq(users.email, userEmail));
      } catch (dbErr) {
        console.error('Error updating user resume in DB:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      resumeUrl: result.url,
      resumeText: result.text,
      wordCount: result.wordCount,
    });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process resume' },
      { status: 500 }
    );
  }
}
