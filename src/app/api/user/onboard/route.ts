import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { username, resumeUrl, resumeText } = body;

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

    const userEmail = authUser?.email;

    if (isDatabaseConfigured() && db) {
      // Check username uniqueness
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, trimmed))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].email !== userEmail) {
        return NextResponse.json(
          { error: 'Username is already taken. Please choose another.' },
          { status: 409 }
        );
      }

      let finalResumeUrl: string | null = null;
      let finalResumeText: string | null = null;

      if (userEmail) {
        // Fetch existing user to preserve previously saved resume
        const existingUserByEmail = await db
          .select()
          .from(users)
          .where(eq(users.email, userEmail))
          .limit(1);

        const existingRecord = existingUserByEmail[0];

        // Only overwrite resume fields if a new, non-empty value was explicitly provided
        finalResumeUrl =
          typeof resumeUrl === 'string' && resumeUrl.trim()
            ? resumeUrl.trim()
            : existingRecord?.resumeUrl || null;

        finalResumeText =
          typeof resumeText === 'string' && resumeText.trim()
            ? resumeText.trim()
            : existingRecord?.resumeText || null;

        const updateSet: Record<string, any> = {
          username: trimmed,
        };

        if (finalResumeUrl) {
          updateSet.resumeUrl = finalResumeUrl;
        }
        if (finalResumeText) {
          updateSet.resumeText = finalResumeText;
        }

        await db
          .insert(users)
          .values({
            id: authUser?.id || `user_${Date.now()}`,
            email: userEmail,
            googleId: authUser?.id || null,
            username: trimmed,
            resumeUrl: finalResumeUrl,
            resumeText: finalResumeText,
            rank: existingRecord?.rank || 'Bronze',
            points: existingRecord?.points ?? 0,
          })
          .onConflictDoUpdate({
            target: users.email,
            set: updateSet,
          });
      }
    }

    return NextResponse.json({
      success: true,
      username: trimmed,
      rank: 'Bronze',
      points: 0,
    });
  } catch (error: any) {
    console.error('Onboard route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
