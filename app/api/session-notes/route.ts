import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

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

    const { bookingId, content, subject, topics, skills, homework } = await request.json();
    if (!bookingId || !content?.trim()) {
      return NextResponse.json({ error: 'bookingId and content are required' }, { status: 400 });
    }
    if (content.trim().length > 5000) {
      return NextResponse.json({ error: 'Notes must be under 5000 characters' }, { status: 400 });
    }

    // Verify tutor owns this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { student: { include: { user: { select: { id: true } } } } },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.tutorId !== user.tutorProfile.id) {
      return NextResponse.json({ error: 'You can only add notes to your own sessions' }, { status: 403 });
    }

    // Validate subject if provided
    const VALID_SUBJECTS = ['Mathematics', 'Science', 'Filipino', 'English'];
    const validSubject = subject && VALID_SUBJECTS.includes(subject) ? subject : null;

    // Validate skills shape
    let validSkills: Record<string, string[]> | undefined = undefined;
    if (skills && typeof skills === 'object') {
      validSkills = {
        Confident: Array.isArray(skills.Confident) ? skills.Confident : [],
        NeedsPractice: Array.isArray(skills.NeedsPractice) ? skills.NeedsPractice : [],
        Struggling: Array.isArray(skills.Struggling) ? skills.Struggling : [],
      };
    }

    // Upsert: create or update the note for this booking
    const note = await prisma.sessionNote.upsert({
      where: { bookingId },
      update: {
        content: content.trim(),
        subject: validSubject,
        topics: Array.isArray(topics) ? topics : [],
        skills: validSkills,
        homework: homework?.trim() || null,
      },
      create: {
        bookingId,
        tutorId: user.tutorProfile.id,
        content: content.trim(),
        subject: validSubject,
        topics: Array.isArray(topics) ? topics : [],
        skills: validSkills,
        homework: homework?.trim() || null,
      },
    });

    // Notify student that notes are available
    const studentUserId = booking.student?.user?.id;
    if (studentUserId) {
      await prisma.notification.create({
        data: {
          userId: studentUserId,
          title: 'Session Notes Available',
          message: `Your tutor has shared session notes for your completed session.`,
          link: `/dashboard/classes`,
          isRead: false,
        },
      });

      // Send email notification too
      try {
        const studentUser = await prisma.user.findUnique({
          where: { id: studentUserId },
          select: { email: true, name: true },
        });
        if (studentUser?.email) {
          const tutorName = user.tutorProfile ? (await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } }))?.name || 'Your tutor' : 'Your tutor';
          sendEmail({
            to: studentUser.email,
            subject: 'Session Notes Available — Brighton Academic',
            html: `
              <div style="max-width:560px;margin:40px auto;background:white;border-radius:32px;overflow:hidden;border:1px solid #f1f3f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                <div style="background:linear-gradient(135deg,#20c997,#0ca678);padding:40px 48px;">
                  <p style="font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin:0 0 8px;">Brighton Academic</p>
                  <h1 style="margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">Session Notes Ready 📝</h1>
                </div>
                <div style="padding:40px 48px;">
                  <p style="font-size:15px;color:#7f8c8d;line-height:1.6;margin:0 0 16px;">Hi <strong style="color:#2c3e50;">${studentUser.name || 'Student'}</strong>,</p>
                  <p style="font-size:15px;color:#7f8c8d;line-height:1.6;margin:0 0 16px;">Your tutor has shared session notes for your completed session.</p>
                  <p style="font-size:15px;color:#7f8c8d;line-height:1.6;margin:0 0 24px;">Log in to view the full notes, homework assignments, and AI-generated feedback tailored to your session.</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://brighton-jstu.vercel.app'}/dashboard/classes" style="display:block;text-align:center;color:white;text-decoration:none;padding:18px 32px;border-radius:16px;font-weight:900;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;background:#748ffc;">View Session Notes →</a>
                </div>
                <div style="padding:24px 48px;background:#f8f9fa;border-top:1px solid #f1f3f5;">
                  <p style="margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;color:#adb5bd;text-align:center;">Brighton Academic • 2026</p>
                </div>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.error('[SESSION NOTES] Failed to send email notification:', emailErr);
      }
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Failed to save session note:', error);
    return NextResponse.json({ error: 'Failed to save session note' }, { status: 500 });
  }
}