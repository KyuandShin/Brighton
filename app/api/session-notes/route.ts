import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// GET /api/session-notes?bookingId=xxx — fetch notes for a booking (student or tutor)
export async function GET(request: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { studentProfile: true, tutorProfile: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { studentId: true, tutorId: true },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const isTutor = user.tutorProfile?.id === booking.tutorId;
    const isStudent = user.studentProfile?.id === booking.studentId;
    const isAdmin = user.role === 'ADMIN';

    if (!isTutor && !isStudent && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to view these notes' }, { status: 403 });
    }

    const note = await prisma.sessionNote.findUnique({
      where: { bookingId },
      include: {
        tutor: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
    });

    return NextResponse.json(note ?? { error: 'No notes yet' });
  } catch (error) {
    console.error('Failed to fetch session note:', error);
    return NextResponse.json({ error: 'Failed to fetch session note' }, { status: 500 });
  }
}

// POST /api/session-notes — create or update session notes (tutor only)
export async function POST(request: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { tutorProfile: true },
    });

    if (!user?.tutorProfile) {
      return NextResponse.json({ error: 'Only tutors can create session notes' }, { status: 403 });
    }

    const { bookingId, content } = await request.json();
    if (!bookingId || !content?.trim()) {
      return NextResponse.json({ error: 'bookingId and content are required' }, { status: 400 });
    }

    // Verify tutor owns this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { tutorId: true, studentId: true },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.tutorId !== user.tutorProfile.id) {
      return NextResponse.json({ error: 'You can only add notes to your own sessions' }, { status: 403 });
    }

    // Upsert: create or update the note for this booking
    const note = await prisma.sessionNote.upsert({
      where: { bookingId },
      update: { content: content.trim() },
      create: {
        bookingId,
        tutorId: user.tutorProfile.id,
        content: content.trim(),
      },
    });

    // Notify student that notes are available
    const studentUser = await prisma.user.findUnique({
      where: { id: (await prisma.student.findUnique({ where: { id: booking.studentId } }))?.userId },
    });
    if (studentUser) {
      await prisma.notification.create({
        data: {
          userId: studentUser.id,
          title: 'Session Notes Available 📝',
          message: `Your tutor has shared session notes for your completed session.`,
          link: `/dashboard/classes`,
          isRead: false,
        },
      });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Failed to save session note:', error);
    return NextResponse.json({ error: 'Failed to save session note' }, { status: 500 });
  }
}