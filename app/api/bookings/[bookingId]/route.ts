import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, bookingConfirmationStudent, bookingCancelledEmail } from '@/lib/email';

// GET /api/bookings/[bookingId] — fetch a single booking by ID
export async function GET(
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

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        student: { include: { user: { select: { name: true, image: true } } } },
        tutor: { include: { user: { select: { name: true, image: true } } } },
        notes: {
          select: { id: true, content: true, subject: true, topics: true, skills: true, homework: true, createdAt: true }
        },
        review: {
          select: { id: true, rating: true, comment: true }
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify the user is authorized to view this booking
    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { studentProfile: true, tutorProfile: true },
    });

    if (user?.role !== 'ADMIN') {
      const isTutor = user?.tutorProfile?.id === booking.tutorId;
      const isStudent = user?.studentProfile?.id === booking.studentId;
      if (!isTutor && !isStudent) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    return NextResponse.json(booking);
  } catch (err: unknown) {
    console.error('[GET /api/bookings/[bookingId]]', err);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

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
      // 24-hour cancellation policy: neither tutors nor students can cancel a CONFIRMED session within 24h
      if (booking.status === 'CONFIRMED') {
        const hoursUntilSession = (new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilSession < 24) {
          return NextResponse.json({
            error: 'Sessions cannot be cancelled within 24 hours of the scheduled time.'
          }, { status: 400 });
        }
      }
    }

    if (status === 'COMPLETED') {
      // Both tutors and students can mark as completed when leaving the classroom
      if (!isTutor && !isStudent && !isAdmin) {
        return NextResponse.json({ error: 'Not authorized to complete this session' }, { status: 403 });
      }
      if (booking.status !== 'CONFIRMED') {
        return NextResponse.json({ error: 'Only confirmed sessions can be marked as completed' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (date) {
      const newDate = new Date(date);
      if (isNaN(newDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      if (newDate <= new Date()) {
        return NextResponse.json({ error: 'Rescheduled date must be in the future' }, { status: 400 });
      }
      updateData.date = newDate;

      // Check for tutor availability conflicts on the new date
      const tutorConflict = await prisma.booking.findFirst({
        where: {
          tutorId: booking.tutorId,
          date: newDate,
          status: { in: ['PENDING', 'CONFIRMED'] },
          id: { not: params.bookingId },
        },
      });
      if (tutorConflict) {
        return NextResponse.json({ error: 'This tutor is not available at that time. Please choose another slot.' }, { status: 409 });
      }

      // If rescheduling a confirmed booking, reset to PENDING so tutor must re-confirm
      if (!status && booking.status === 'CONFIRMED') {
        updateData.status = 'PENDING';
      }
    }

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

    // Notify tutor when student reschedules (date change without status change)
    if (date && !status && isStudent) {
      await prisma.notification.create({
        data: {
          userId: booking.tutor.userId,
          title: 'Session Rescheduled 📅',
          message: `${studentName} has rescheduled the session to ${formattedDate} at ${formattedTime}. ${booking.status === 'CONFIRMED' ? 'Please re-confirm the new time.' : ''}`,
          link: '/dashboard/bookings',
        },
      });
    }

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
    } else if (status === 'COMPLETED') {
      await prisma.notification.create({
        data: {
          userId: booking.student.userId,
          title: 'Session Completed! 🎉',
          message: `Your session with ${tutorName} on ${formattedDate} at ${formattedTime} has been marked as completed. Please leave a review!`,
          link: `/dashboard/bookings`,
        },
      });

      await prisma.notification.create({
        data: {
          userId: booking.tutor.userId,
          title: 'Session Completed ✅',
          message: `Session with ${studentName} on ${formattedDate} at ${formattedTime} is now complete.`,
          link: '/dashboard/bookings',
        },
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