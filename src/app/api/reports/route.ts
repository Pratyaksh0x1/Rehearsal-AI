import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { db, isDatabaseConfigured } from '@/db';
import { reports } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    const body = await req.json();
    const { category, description } = body;

    if (!category || !description) {
      return NextResponse.json(
        { error: 'Category and description are required' },
        { status: 400 }
      );
    }

    const reportId = `rep_${Date.now()}`;

    if (isDatabaseConfigured() && db) {
      try {
        await db.insert(reports).values({
          id: reportId,
          userId,
          category,
          description,
        });
      } catch (dbErr) {
        console.error('Error saving report to DB:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Thank you for your feedback!',
      id: reportId,
    });
  } catch (error: any) {
    console.error('Report submission error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit report' },
      { status: 500 }
    );
  }
}
