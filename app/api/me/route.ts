import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

/**
 * Fetches the authenticated user's profile data from the database.
 * Includes student or tutor profiles and related nested information.
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate and retrieve session data using Neon Auth
    // CRITICAL FIX: Pass request headers so auth can find the session token
    const { data: session, error } = await auth.getSession({
      fetchOptions: {
        headers: req.headers
      }
    });

    if (error || !session?.user?.id) {
      // Disable auto-retry for this endpoint by returning proper cache headers
      // Prevents React Query / Next.js from infinitely retrying on 401
      return NextResponse.json({ error: 'Not authenticated' }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Retry-After': '0'
        }
      });
    }

    const userId = session.user.id;

    // Query database for complete profile including related profile models
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        tutorProfile: {
          include: {
            subjects: { include: { subject: true } },
            availability: true,
          },
        },
      },
    });

    if (!user) {
      // User is authed but no DB record yet — return basic info from session
      return NextResponse.json({
        id: userId,
        email: session.user.email,
        name: session.user.name ?? session.user.email,
        role: 'STUDENT',
        isVerified: false,
        studentProfile: null,
        tutorProfile: null,
      });
    }

    // Block unverified tutors
    if (user.role === 'TUTOR' && user.tutorProfile?.verificationStatus !== 'APPROVED') {
      return NextResponse.json(
        {
          error: 'TUTOR_PENDING',
          message:
            'Your tutor account is pending verification. You will be notified once approved.',
        },
        { 
          status: 403,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Retry-After': '0'
          }
        }
      );
    }

    return NextResponse.json(user);
  } catch (err: any) {
    console.error('[GET /api/me]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Retry-After': '0'
      }
    });
  }
}