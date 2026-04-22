import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      select: { id: true, role: true },
    });

    return NextResponse.json({
      exists: !!user,
      role: user?.role || null,
    });
  } catch (err: any) {
    console.error('[CHECK EMAIL ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
