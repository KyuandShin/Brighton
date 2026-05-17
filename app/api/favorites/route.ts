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

    const favorites = await prisma.savedTutor.findMany({
      where: { userId: data.user.id },
      include: {
        tutor: {
          include: {
            user: { select: { name: true, image: true } },
            subjects: { include: { subject: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { tutorId } = await request.json();
    
    if (!tutorId) {
      return NextResponse.json({ error: 'tutorId is required' }, { status: 400 });
    }

    // Verify tutor exists
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { id: true },
    });
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    // Use upsert to toggle: deletes if exists, creates if not — race condition safe
    const existing = await prisma.savedTutor.findUnique({
      where: { userId_tutorId: { userId: data.user.id, tutorId } },
    });

    if (existing) {
      await prisma.savedTutor.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    await prisma.savedTutor.create({
      data: { userId: data.user.id, tutorId },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
