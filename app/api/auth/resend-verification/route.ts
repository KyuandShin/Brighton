import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

/**
 * Resends the verification email for an existing unverified user.
 * POST /api/auth/resend-verification
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check user exists and is NOT already verified
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { name: true, isVerified: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'This account is already verified. Please log in.' }, { status: 400 });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete old tokens for this email
    await prisma.verificationToken.deleteMany({ where: { email: trimmedEmail } });

    await prisma.verificationToken.create({
      data: {
        email: trimmedEmail,
        token: verificationToken,
        expiresAt,
      },
    });

    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: trimmedEmail,
      subject: 'Verify your Brighton Academic account',
      html: emailVerificationEmail({
        name: user.name || 'Student',
        email: trimmedEmail,
        verificationUrl,
      }),
    });

    return NextResponse.json({ success: true, message: 'Verification email resent.' });
  } catch (err: unknown) {
    console.error('[RESEND VERIFICATION]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}