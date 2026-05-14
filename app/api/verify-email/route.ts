import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Handles email verification links.
 * GET /api/verify-email?token=xxx
 * Marks the user as verified and marks the token as used.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=missing_token', req.url)
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_token', req.url)
      );
    }

    if (verificationToken.usedAt) {
      return NextResponse.redirect(
        new URL('/login?error=already_verified', req.url)
      );
    }

    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.redirect(
        new URL('/login?error=expired_token', req.url)
      );
    }

    // Mark token as used and user as verified in a transaction
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

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL('/login?verified=true', req.url)
    );
  } catch (err: unknown) {
    console.error('[VERIFY EMAIL]', err);
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', req.url)
    );
  }
}