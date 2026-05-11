import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { studentProfile: true },
    });

    if (!user?.studentProfile) {
      return NextResponse.json({ error: 'Only students can view test history' }, { status: 403 });
    }

    const attempts = await prisma.attempt.findMany({
      where: { studentId: user.studentProfile.id },
      include: {
        test: {
          include: { subject: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error('Failed to fetch test history:', error);
    return NextResponse.json({ error: 'Failed to fetch test history' }, { status: 500 });
  }
}
