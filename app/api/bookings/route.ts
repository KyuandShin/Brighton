import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, bookingConfirmationStudent, bookingNotificationTutor } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    const { data } = await auth.getSession();
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { studentProfile: true, tutorProfile: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let bookings: any[] = [];

    if (user.role === 'STUDENT' && user.studentProfile) {
        bookings = await prisma.booking.findMany({
          where: { studentId: user.studentProfile.id },
          include: {
            tutor: { 
              select: { 
                headline: true,
                user: { select: { name: true, image: true } } 
              } 
            },
          },
          orderBy: { date: 'asc' },
        });
    } else if (user.role === 'TUTOR' && user.tutorProfile) {
      bookings = await prisma.booking.findMany({
        where: { tutorId: user.tutorProfile.id },
        include: {
          student: { include: { user: { select: { name: true, image: true } } } },
          tutor: { include: { user: { select: { name: true, image: true } } } },
        },
        orderBy: { date: 'asc' },
      });
    }

    return NextResponse.json(bookings);
  } catch (err: any) {
    console.error('[GET /api/bookings]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: postData } = await auth.getSession();
    if (!postData?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { tutorDbId, date } = body;
    if (!tutorDbId || !date) {
      return NextResponse.json({ error: 'tutorDbId and date are required' }, { status: 400 });
    }

    // Load student
    const studentUser = await prisma.user.findUnique({
      where: { id: postData.user.id },
      include: { studentProfile: true },
    });
    if (!studentUser?.studentProfile) {
      return NextResponse.json({ error: 'Only students can create bookings' }, { status: 403 });
    }

    // Load tutor (to get email for notification)
    const tutorRecord = await prisma.tutor.findUnique({
      where: { id: tutorDbId },
      include: { user: true },
    });
    if (!tutorRecord) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        studentId: studentUser.studentProfile.id,
        tutorId: tutorDbId,
        date: new Date(date),
        status: 'CONFIRMED',
      },
    });

    // Set meetLink using booking ID
    const meetLink = `/dashboard/classroom/${booking.id}`;
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { meetLink },
      include: {
        tutor: { 
          select: { 
            headline: true,
            user: { select: { name: true, image: true, email: true } } 
          } 
        },
        student: { 
          include: { 
            user: { select: { name: true, image: true, email: true } } 
          } 
        },
      },
    });

    // Format date/time for emails
    const sessionDate = new Date(date);
    const formattedDate = sessionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const origin = req.headers.get('origin') ?? 'https://your-domain.com';
    const classroomUrl = `${origin}${meetLink}`;

    const studentName = studentUser.name ?? studentUser.email;
    const tutorName = tutorRecord.user.name ?? tutorRecord.user.email;

    // ── In-app notifications ──────────────────────────────────────────────
    await prisma.notification.createMany({
      data: [
        {
          userId: studentUser.id,
          title: 'Session Confirmed!',
          message: `Your session with ${tutorName} on ${formattedDate} at ${formattedTime} is confirmed.`,
          link: meetLink,
        },
        {
          userId: tutorRecord.user.id,
          title: 'New Student Booked!',
          message: `${studentName} booked a session with you on ${formattedDate} at ${formattedTime}.`,
          link: meetLink,
        },
      ],
    });

    // ── Email notifications (fire and forget — don't block response) ──────
    sendEmail({
      to: studentUser.email,
      subject: `✅ Session Confirmed with ${tutorName}`,
      html: bookingConfirmationStudent({
        studentName: studentName ?? 'Student',
        tutorName: tutorName ?? 'Tutor',
        date: formattedDate,
        time: formattedTime,
        classroomUrl,
      }),
    });

    sendEmail({
      to: tutorRecord.user.email,
      subject: `📚 New Booking from ${studentName}`,
      html: bookingNotificationTutor({
        tutorName: tutorName ?? 'Tutor',
        studentName: studentName ?? 'Student',
        date: formattedDate,
        time: formattedTime,
        classroomUrl,
      }),
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[POST /api/bookings]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
