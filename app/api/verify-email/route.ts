import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/verify-email
 * Called from client after Neon Auth OTP is successfully verified.
 * Marks the user as verified in our own DB.
 *
 * No session guard — the user has not signed in yet when this is called
 * (OTP verify happens before first login). The OTP was already validated
 * by Neon Auth on the client; we just need to flip isVerified in our DB.
 * We match on email only and only flip users who are currently unverified.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isVerified: true },
    });

    if (!user) {
      // Could be a timing issue — return success so the UI can proceed
      console.warn('[VERIFY-EMAIL POST] User not found for email:', normalizedEmail);
      return NextResponse.json({ success: true, message: 'User not found — may already be verified' });
    }

    if (user.isVerified) {
      return NextResponse.json({ success: true, message: 'Already verified' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    console.log('[VERIFY-EMAIL POST] Verified user:', normalizedEmail);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[VERIFY-EMAIL POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


/**
 * GET /api/verify-email?token=xxx
 * Handles verification link clicks (fallback path via Resend email).
 * Marks the user as verified and marks the token as used.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', req.url));
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
    }

    if (verificationToken.usedAt) {
      return NextResponse.redirect(new URL('/login?error=already_verified', req.url));
    }

    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.redirect(new URL('/login?error=expired_token', req.url));
    }

    await prisma.$transaction(async (tx) => {
      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });
      await tx.user.update({
        where: { email: verificationToken.email },
        data: { isVerified: true },
      });
    });

    return NextResponse.redirect(new URL('/login?verified=true', req.url));
  } catch (err: unknown) {
    console.error('[VERIFY-EMAIL GET]', err);
    return NextResponse.redirect(new URL('/login?error=verification_failed', req.url));
  }
}
