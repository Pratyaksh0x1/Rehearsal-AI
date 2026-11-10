import { NextRequest, NextResponse } from 'next/server';
import { db, isDatabaseConfigured } from '@/db';
import { reviews } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { requireUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isDatabaseConfigured() || !db) {
      return NextResponse.json({ reviews: [] });
    }

    const rows = await db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.createdAt))
      .limit(30);

    return NextResponse.json({
      reviews: rows.map((r) => ({
        id: r.id,
        name: r.name,
        text: r.text,
        rating: r.rating ?? 5,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Please log in to submit a review.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, rating, text } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please write a review description of at least 5 characters.' },
        { status: 400 }
      );
    }

    const candidateName =
      (name && typeof name === 'string' && name.trim()) ||
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      'Candidate';

    const cleanRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const cleanText = text.trim();
    const newId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newReview = {
      id: newId,
      name: candidateName.slice(0, 128),
      text: cleanText,
      rating: cleanRating,
      createdAt: new Date(),
    };

    if (isDatabaseConfigured() && db) {
      try {
        await db.insert(reviews).values(newReview);
      } catch (dbErr) {
        console.error('Error writing review to database:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      review: newReview,
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
