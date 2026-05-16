import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, bookingConfirmationStudent, bookingCancelledEmail } from '@/lib/email';

// PATCH /api/bookings/[bookingId] — update booking status or reschedule
export async function PATCH(
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
    const { status, date } = body;

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { tutorProfile: true, studentProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        student: { include: { user: true } },
        tutor: { include: { user: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isTutor = user.role === 'TUTOR' && booking.tutorId === user.tutorProfile?.id;
    const isStudent = user.role === 'STUDENT' && booking.studentId === user.studentProfile?.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isTutor && !isStudent && !isAdmin) {
      return NextResponse.json({ error: 'You can only manage your own bookings' }, { status: 403 });
    }

    // Handle different status transitions
    if (status === 'CONFIRMED') {
      if (!isTutor && !isAdmin) {
        return NextResponse.json({ error: 'Only tutors can confirm bookings' }, { status: 403 });
      }
      if (booking.status !== 'PENDING') {
        return NextResponse.json({ error: 'This booking is no longer pending' }, { status: 400 });
      }
    }

    if (status === 'CANCELLED') {
      // Students can cancel pending/confirmed, tutors can cancel pending
      if (isStudent && (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED')) {
        return NextResponse.json({ error: 'This booking cannot be cancelled' }, { status: 400 });
      }
      if (isTutor && booking.status !== 'PENDING') {
        return NextResponse.json({ error: 'This booking cannot be cancelled' }, { status: 400 });
      }
    }

    if (status === 'COMPLETED') {
      if (!isTutor && !isAdmin) {
        return NextResponse.json({ error: 'Only tutors can mark sessions as completed' }, { status: 403 });
      }
      if (booking.status !== 'CONFIRMED') {
        return NextResponse.json({ error: 'Only confirmed sessions can be marked as completed' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (date) updateData.date = new Date(date);

    const updated = await prisma.booking.update({
      where: { id: params.bookingId },
      data: updateData,
      include: {
        student: { include: { user: { select: { name: true, image: true, email: true } } } },
        tutor: { include: { user: { select: { name: true, image: true, email: true } } } },
      },
    });

    // Use updated date for email (handles reschedule + cancel scenario)
    const sessionDate = new Date(date ? new Date(date) : booking.date);
    const formattedDate = sessionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const origin = request.headers.get('origin') ?? '';
    const classroomUrl = `${origin}${booking.meetLink ?? `/dashboard/classroom/${booking.id}`}`;

    const studentName = booking.student.user.name ?? booking.student.user.email;
    const tutorName = booking.tutor.user.name ?? booking.tutor.user.email;

    // Send notifications based on action
    if (status === 'CONFIRMED') {
      await prisma.notification.create({
        data: {
          userId: booking.student.userId,
          title: 'Session Confirmed! ✅',
          message: `${tutorName} has accepted your session on ${formattedDate} at ${formattedTime}.`,
          link: booking.meetLink ?? '/dashboard/classes',
        },
      });

      sendEmail({
        to: booking.student.user.email,
        subject: `✅ Session Confirmed with ${tutorName}`,
        html: bookingConfirmationStudent({
          studentName,
          tutorName,
          date: formattedDate,
          time: formattedTime,
          classroomUrl,
        }),
      });
    } else if (status === 'CANCELLED') {
      const notifyUserId = isStudent ? booking.tutor.userId : booking.student.userId;
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          title: 'Session Cancelled ❌',
          message: `${isStudent ? 'The student' : tutorName} has cancelled the session on ${formattedDate} at ${formattedTime}.`,
          link: '/dashboard/bookings',
        },
      });

      const cancelledByName = isStudent ? studentName : tutorName;
      const recipientName = isStudent ? booking.tutor.user.name ?? booking.tutor.user.email : booking.student.user.name ?? booking.student.user.email;
      sendEmail({
        to: isStudent ? booking.tutor.user.email : booking.student.user.email,
        subject: `❌ Session Cancelled`,
        html: bookingCancelledEmail({
          recipientName,
          cancelledByName,
          date: formattedDate,
          time: formattedTime,
        }),
      });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error('[PATCH /api/bookings/[bookingId]]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}