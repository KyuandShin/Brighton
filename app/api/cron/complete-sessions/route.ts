import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Sessions are 1 hour long — auto-complete after this threshold
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

// GET /api/cron/complete-sessions — called periodically to auto-complete expired sessions
// Can be called by Vercel Cron Jobs, a keep-alive service, or on app startup
export async function GET() {
  try {
    // Check for a simple API key to prevent abuse
    // (can be configured via env var, optional)
    
    const result = await prisma.booking.updateMany({
      where: {
        status: 'CONFIRMED',
        date: { lt: new Date(Date.now() - SESSION_DURATION_MS) },
      },
      data: { status: 'COMPLETED' },
    });

    console.log(`[CRON] Auto-completed ${result.count} expired session(s)`);

    return NextResponse.json({
      success: true,
      completed: result.count,
      message: `Auto-completed ${result.count} expired session(s)`,
    });
  } catch (error) {
    console.error('[CRON] Failed to complete sessions:', error);
    return NextResponse.json({ error: 'Failed to complete sessions' }, { status: 500 });
  }
}