import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/bookings/[bookingId]/attendance
 * Reports when a user joins or leaves the classroom.
 * Body: { event: 'join' | 'leave' }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  const params = await context.params;
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: request.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { event } = body;
    if (!event || !['join', 'leave'].includes(event)) {
      return NextResponse.json({ error: 'event must be "join" or "leave"' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { studentProfile: true, tutorProfile: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isTutor = user.role === 'TUTOR' && booking.tutorId === user.tutorProfile?.id;
    const isStudent = user.role === 'STUDENT' && booking.studentId === user.studentProfile?.id;
    if (!isTutor && !isStudent) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const now = new Date();
    const updateData: any = {};
    const sessionStart = new Date(booking.date);
    const attendanceStatusData: any = {};

    if (event === 'join') {
      if (isStudent) {
        updateData.studentJoined = true;
        updateData.studentJoinedAt = now;
        // Determine if late (> 5 minutes after scheduled start)
        const lateThreshold = new Date(sessionStart.getTime() + 5 * 60 * 1000);
        if (now > lateThreshold) {
          attendanceStatusData.late = true;
        }
      }
      if (isTutor) {
        updateData.tutorJoined = true;
        updateData.tutorJoinedAt = now;
        // Determine if tutor joined early or on time
        const earlyThreshold = new Date(sessionStart.getTime() - 5 * 60 * 1000);
        if (now < earlyThreshold) {
          attendanceStatusData.early = true;
        }
      }
    } else if (event === 'leave') {
      if (isStudent) {
        updateData.studentLeftAt = now;
      }
      if (isTutor) {
        updateData.tutorLeftAt = now;
      }
    }

    // Determine attendance status for students
    if (isStudent && event === 'leave') {
      const bookingStart = new Date(booking.date);
      const bookingEnd = new Date(bookingStart.getTime() + 60 * 60 * 1000); // 1 hour default
      
      if (!updateData.studentJoined) {
        // Student never joined — also check if tutor was present
        updateData.attendanceStatus = 'ABSENT';
      } else if (attendanceStatusData.late) {
        updateData.attendanceStatus = 'LATE';
      } else if (now < bookingEnd) {
        updateData.attendanceStatus = 'EARLY_ONLY';
      } else {
        updateData.attendanceStatus = 'PRESENT';
      }
    }

    await prisma.booking.update({
      where: { id: params.bookingId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[POST /api/bookings/[bookingId]/attendance]', err);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}