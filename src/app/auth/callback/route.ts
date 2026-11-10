import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isUserOnboarded } from '@/lib/user';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') || '/home';
  const safeNext = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/home';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email && isDatabaseConfigured() && db) {
        try {
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existing.length === 0) {
            // New user: route to onboarding
            await db.insert(users).values({
              id: user.id,
              email: user.email,
              googleId: user.id,
              username: null,
              rank: 'Bronze',
              points: 0,
            });
            return NextResponse.redirect(`${origin}/onboarding`);
          } else if (!isUserOnboarded(existing[0])) {
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        } catch (dbErr) {
          console.error('Error syncing Supabase user with DB:', dbErr);
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return user to login or home if exchange fails
  return NextResponse.redirect(`${origin}/`);
}

