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
    const { data } = await auth.getSession();

    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = data.user.id;
    const session = data;

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
        { status: 403 }
      );
    }

    return NextResponse.json(user);
  } catch (err: any) {
    console.error('[GET /api/me]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
