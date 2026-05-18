import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, bookingConfirmationStudent, bookingNotificationTutor, bookingRequestSentStudent, bookingRequestSentTutor } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: {
        headers: req.headers
      }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { studentProfile: true, tutorProfile: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let bookings: any[] = [];

    if (user.role === 'ADMIN') {
      // Admin sees all bookings
      bookings = await prisma.booking.findMany({
        include: {
          student: { include: { user: { select: { name: true, image: true } } } },
          tutor: { include: { user: { select: { name: true, image: true } } } },
        },
        orderBy: { date: 'asc' },
      });
    } else if (user.role === 'STUDENT' && user.studentProfile) {
        bookings = await prisma.booking.findMany({
          where: { studentId: user.studentProfile.id },
          select: {
            id: true,
            date: true,
            meetLink: true,
            status: true,
            tutor: { 
              select: { 
                id: true,
                headline: true,
                user: { select: { name: true, image: true } } 
              } 
            },
            notes: {
              select: { id: true, content: true, subject: true, topics: true, skills: true, homework: true, createdAt: true }
            },
            review: {
              select: { id: true, rating: true, comment: true }
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
          notes: {
            select: { id: true, content: true, subject: true, topics: true, skills: true, homework: true, createdAt: true }
          },
          review: {
            select: { id: true, rating: true, comment: true }
          },
        },
        orderBy: { date: 'asc' },
      });
    }

    return NextResponse.json(bookings, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Vary': 'Cookie'
      }
    });
  } catch (err: unknown) {
    console.error('[GET /api/bookings]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: postData } = await auth.getSession({
      fetchOptions: {
        headers: req.headers
      }
    });
    if (!postData?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { tutorDbId, date } = body;
    if (!tutorDbId || !date) {
      return NextResponse.json({ error: 'tutorDbId and date are required' }, { status: 400 });
    }

    const studentUser = await prisma.user.findUnique({
      where: { id: postData.user.id },
      include: { studentProfile: true },
    });
    
    // Admins can book on behalf of themselves without needing a real studentProfile.
    // We use a dedicated admin booking path instead of mutating their user record.
    const isAdmin = studentUser?.role === 'ADMIN';
    let studentProfileId: string;

    if (isAdmin) {
      // For admins: upsert a hidden studentProfile — safe under concurrent requests
      const adminProfile = await prisma.student.upsert({
        where: { userId: studentUser!.id },
        update: {},
        create: { userId: studentUser!.id, schoolLevel: 'HIGH_SCHOOL' },
      });
      studentProfileId = adminProfile.id;
    } else {
      if (!studentUser?.studentProfile) {
        return NextResponse.json({ error: 'Only students and admins can create bookings' }, { status: 403 });
      }
      studentProfileId = studentUser.studentProfile.id;
    }

    // Load tutor (to get email for notification)
    const tutorRecord = await prisma.tutor.findUnique({
      where: { id: tutorDbId },
      include: { user: true },
    });
    if (!tutorRecord) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    // Validate that the date is valid and in the future
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    if (bookingDate <= new Date()) {
      return NextResponse.json({ error: 'Cannot book a session in the past' }, { status: 400 });
    }

    // Check for duplicate booking (same student + tutor + time)
    const existing = await prisma.booking.findFirst({
      where: {
        studentId: studentProfileId,
        tutorId: tutorDbId,
        date: bookingDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'You already have a booking request for this time slot.' }, { status: 409 });
    }

    // Check for tutor double-booking (another student already has this slot)
    const tutorConflict = await prisma.booking.findFirst({
      where: {
        tutorId: tutorDbId,
        date: bookingDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
        studentId: { not: studentProfileId },
      },
    });
    if (tutorConflict) {
      return NextResponse.json({ error: 'This tutor is not available at that time. Please choose another slot.' }, { status: 409 });
    }

    // Generate booking ID upfront so meetLink can be set in a single write (no race condition)
    const bookingId = crypto.randomUUID();
    const meetLink = `/dashboard/classroom/${bookingId}`;
    const updated = await prisma.booking.create({
      data: {
        id: bookingId,
        studentId: studentProfileId,
        tutorId: tutorDbId,
        date: bookingDate,
        status: isAdmin ? 'CONFIRMED' : 'PENDING',
        meetLink,
      },
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
    const sessionDate = bookingDate;
    const formattedDate = sessionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://brighton-tutoring.vercel.app';
    const classroomUrl = `${origin}${meetLink}`;

    const studentName = studentUser.name ?? studentUser.email;
    const tutorName = tutorRecord.user.name ?? tutorRecord.user.email;

    // ── In-app notifications ──────────────────────────────────────────────
    if (isAdmin) {
      await prisma.notification.createMany({
        data: [
          {
            userId: studentUser.id,
            title: 'Session Booked! ✅',
            message: `You booked a session with ${tutorName} on ${formattedDate} at ${formattedTime}. It has been auto-confirmed.`,
            link: '/dashboard/classes',
          },
          {
            userId: tutorRecord.user.id,
            title: 'New Session Confirmed!',
            message: `${studentName} (admin) has booked a session with you on ${formattedDate} at ${formattedTime}. It's automatically confirmed.`,
            link: '/dashboard/bookings',
          },
        ],
      });
    } else {
      await prisma.notification.createMany({
        data: [
          {
            userId: studentUser.id,
            title: 'Booking Request Sent!',
            message: `Your session request with ${tutorName} on ${formattedDate} at ${formattedTime} has been sent. Waiting for tutor to confirm.`,
            link: '/dashboard/classes',
          },
          {
            userId: tutorRecord.user.id,
            title: 'New Booking Request!',
            message: `${studentName} wants to book a session with you on ${formattedDate} at ${formattedTime}. Review and confirm.`,
            link: '/dashboard/bookings',
          },
        ],
      });
    }

    // ── Email notifications (fire and forget — don't block response) ──────
    if (isAdmin) {
      // Admin auto-confirm: send confirmation to both
      sendEmail({
        to: tutorRecord.user.email ?? '',
        subject: `New Session Booked by ${studentName}`,
        html: bookingNotificationTutor({
          tutorName: tutorName ?? 'Tutor',
          studentName: studentName ?? 'Student',
          date: formattedDate,
          time: formattedTime,
          classroomUrl,
        }),
      }).catch((emailErr) => {
        console.error('[POST /api/bookings] Failed to send tutor email:', emailErr);
      });

      sendEmail({
        to: studentUser.email,
        subject: `Session Confirmed with ${tutorName}`,
        html: bookingConfirmationStudent({
          studentName: studentName ?? 'Student',
          tutorName: tutorName ?? 'Tutor',
          date: formattedDate,
          time: formattedTime,
          classroomUrl,
        }),
      }).catch((emailErr) => {
        console.error('[POST /api/bookings] Failed to send student email:', emailErr);
      });
    } else {
      // Student-initiated PENDING: send request notifications
      const bookingUrl = `${origin}/dashboard/bookings`;
      sendEmail({
        to: tutorRecord.user.email ?? '',
        subject: `New Booking Request from ${studentName}`,
        html: bookingRequestSentTutor({
          tutorName: tutorName ?? 'Tutor',
          studentName: studentName ?? 'Student',
          date: formattedDate,
          time: formattedTime,
          bookingUrl,
        }),
      }).catch((emailErr) => {
        console.error('[POST /api/bookings] Failed to send tutor email:', emailErr);
      });

      sendEmail({
        to: studentUser.email,
        subject: `Booking Request Sent to ${tutorName}`,
        html: bookingRequestSentStudent({
          studentName: studentName ?? 'Student',
          tutorName: tutorName ?? 'Tutor',
          date: formattedDate,
          time: formattedTime,
        }),
      }).catch((emailErr) => {
        console.error('[POST /api/bookings] Failed to send student email:', emailErr);
      });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error('[POST /api/bookings]', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}