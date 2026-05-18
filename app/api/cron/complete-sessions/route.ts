import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, bookingReminderEmail, bookingMissedEmail } from '@/lib/email';

// Sessions are 1 hour long — auto-complete after this threshold
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

// GET /api/cron/complete-sessions — called periodically to:
// 1. Auto-complete expired sessions
// 2. Send 1-hour reminder emails for upcoming sessions
// 3. Send missed session notifications
export async function GET() {
  try {
    const now = new Date();
    const results = {
      completed: 0,
      remindersSent: 0,
      missedEmails: 0,
    };

    // 1. Auto-complete expired sessions
    const completed = await prisma.booking.updateMany({
      where: {
        status: 'CONFIRMED',
        date: { lt: new Date(now.getTime() - SESSION_DURATION_MS) },
      },
      data: { status: 'COMPLETED' },
    });
    results.completed = completed.count;
    console.log(`[CRON] Auto-completed ${completed.count} expired session(s)`);

    // 2. Send 1-hour reminder emails for upcoming confirmed sessions
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const upcomingSessions = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        reminderSent: false,
        date: { gte: oneHourFromNow, lt: twoHoursFromNow },
      },
      include: {
        student: {
          include: { user: { select: { name: true, email: true } } },
        },
        tutor: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    for (const booking of upcomingSessions) {
      const studentName = booking.student.user.name || 'Student';
      const tutorName = booking.tutor.user.name || 'Tutor';
      const dateStr = booking.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = booking.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const meetLink = booking.meetLink || '';

      // Email to student
      await sendEmail({
        to: booking.student.user.email,
        subject: '⏰ Session in 1 Hour — Brighton Academic',
        html: bookingReminderEmail({
          recipientName: studentName,
          otherPartyName: tutorName,
          date: dateStr,
          time: timeStr,
          meetLink,
          role: 'student',
        }),
      });

      // Email to tutor
      await sendEmail({
        to: booking.tutor.user.email,
        subject: '⏰ Session in 1 Hour — Brighton Academic',
        html: bookingReminderEmail({
          recipientName: tutorName,
          otherPartyName: studentName,
          date: dateStr,
          time: timeStr,
          meetLink,
          role: 'tutor',
        }),
      });

      // Mark reminder as sent
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSent: true },
      });
      results.remindersSent++;
    }

    // 3. Send missed session notifications for sessions that ended without being joined
    // Mark a session as "missed" if it was CONFIRMED and the session end time has passed
    // (we use the existing auto-complete window as the threshold)
    const missedSessions = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        missedEmailSent: false,
      },
      include: {
        student: {
          include: { user: { select: { name: true, email: true } } },
        },
        tutor: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    for (const booking of missedSessions) {
      const studentName = booking.student.user.name || 'Student';
      const tutorName = booking.tutor.user.name || 'Tutor';
      const dateStr = booking.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = booking.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // Notify student that tutor may have missed
      await sendEmail({
        to: booking.student.user.email,
        subject: '⚠️ Missed Session — Brighton Academic',
        html: bookingMissedEmail({
          recipientName: studentName,
          otherPartyName: tutorName,
          date: dateStr,
          time: timeStr,
        }),
      });

      // Notify tutor that student may have missed
      await sendEmail({
        to: booking.tutor.user.email,
        subject: '⚠️ Missed Session — Brighton Academic',
        html: bookingMissedEmail({
          recipientName: tutorName,
          otherPartyName: studentName,
          date: dateStr,
          time: timeStr,
        }),
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: { missedEmailSent: true },
      });
      results.missedEmails++;
    }

    console.log(`[CRON] Sent ${results.remindersSent} reminder(s), ${results.missedEmails} missed notification(s)`);

    return NextResponse.json({
      success: true,
      ...results,
      message: `Completed ${results.completed}, reminded ${results.remindersSent}, missed ${results.missedEmails}`,
    });
  } catch (error) {
    console.error('[CRON] Failed:', error);
    return NextResponse.json({ error: 'Failed to process bookings' }, { status: 500 });
  }
}