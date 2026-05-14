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
    // Neon Auth automatically reads session cookies from Next.js request context
    const { data: session, error } = await auth.getSession({
      fetchOptions: { headers: req.headers }
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
    // Retry once after 250ms if user not found (handles OAuth sync race condition)
    let user = await prisma.user.findUnique({
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
      // User may not have been created yet by Neon Auth — retry once
      await new Promise(resolve => setTimeout(resolve, 250));
      user = await prisma.user.findUnique({
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
    }

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

    // Block unverified users
    if (!user.isVerified) {
      const errorType = user.role === 'TUTOR' ? 'TUTOR_PENDING' : 'STUDENT_UNVERIFIED';
      const errorMessage = user.role === 'TUTOR'
        ? 'Your tutor account is pending verification. You will be notified once approved.'
        : 'Please verify your email address before logging in. Check your inbox for the verification link.';
      return NextResponse.json(
        { error: errorType, message: errorMessage },
        { status: 403,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Retry-After': '0'
          }
        }
      );
    }

    // Block unverified tutors (additional check for tutor verification status)
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
  } catch (err: unknown) {
    console.error('[GET /api/me]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Retry-After': '0'
      }
    });
  }
}