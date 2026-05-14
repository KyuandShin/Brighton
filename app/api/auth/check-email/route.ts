import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Checks if an email already exists in the database.
 * POST /api/auth/check-email
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { role: true, email: true },
    });

    if (user) {
      return NextResponse.json({ exists: true, role: user.role });
    }

    return NextResponse.json({ exists: false });
  } catch (err: unknown) {
    console.error('[CHECK EMAIL]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}