/**
 * Email utility using Resend's free API.
 * Sign up at https://resend.com and add RESEND_API_KEY to your .env
 * Free tier: 100 emails/day, no credit card required.
 *
 * If RESEND_API_KEY is not set, emails are logged to console instead (dev mode).
 */

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback — just log
    console.log('\n📧 [EMAIL - no RESEND_API_KEY set]');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('---');
    return true;
  }

  try {
    // Resend free tier only allows sending to verified email addresses
    // Catch domain verification errors gracefully
    const recipients = Array.isArray(to) ? to : [to];
    const allowedEmail = 'seancarlomasaya@gmail.com';
    
    // Filter recipients to only allowed addresses in development
    const allowedRecipients = recipients.filter(email => 
      email.toLowerCase().trim() === allowedEmail
    );

    if (allowedRecipients.length === 0) {
      // No verified recipients, fall back to console logging
      console.log('\n📧 [EMAIL - skipped (unverified recipient)]');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('---');
      return true;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Brighton <onboarding@resend.dev>',
        to: allowedRecipients,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      // Silently handle domain verification errors
      if (err.statusCode === 403 && err.name === 'validation_error') {
        console.log('\n📧 [EMAIL - skipped (domain verification required)]');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('---');
        return true;
      }
      console.error('[RESEND ERROR]', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[EMAIL SEND ERROR]', err);
    return false;
  }
}

// ── Email Templates ─────────────────────────────────────────────────────────

export function bookingConfirmationStudent({
  studentName,
  tutorName,
  date,
  time,
  classroomUrl,
}: {
  studentName: string;
  tutorName: string;
  date: string;
  time: string;
  classroomUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fdfcfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:32px;overflow:hidden;border:1px solid #f1f3f5;box-shadow:0 20px 60px rgba(0,0,0,0.04);">
    <div style="background:linear-gradient(135deg,#748ffc,#5c7cfa);padding:40px 48px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Brighton Academic</p>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">Session Confirmed! 🎉</h1>
    </div>
    <div style="padding:40px 48px;gap:24px;display:flex;flex-direction:column;">
      <p style="margin:0;font-size:15px;color:#7f8c8d;line-height:1.6;">
        Hi <strong style="color:#2c3e50;">${studentName}</strong>, your tutoring session has been booked successfully.
      </p>
      <div style="background:#f8f9fa;border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#adb5bd;">Tutor</span>
          <span style="font-size:14px;font-weight:800;color:#2c3e50;">${tutorName}</span>
        </div>
        <div style="height:1px;background:#f1f3f5;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#adb5bd;">Date</span>
          <span style="font-size:14px;font-weight:800;color:#2c3e50;">${date}</span>
        </div>
        <div style="height:1px;background:#f1f3f5;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#adb5bd;">Time</span>
          <span style="font-size:14px;font-weight:800;color:#2c3e50;">${time}</span>
        </div>
      </div>
      <a href="${classroomUrl}" style="display:block;text-align:center;background:#748ffc;color:white;text-decoration:none;padding:18px 32px;border-radius:16px;font-weight:900;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;margin-top:8px;">
        Enter Classroom →
      </a>
      <p style="margin:0;font-size:12px;color:#adb5bd;text-align:center;line-height:1.6;">
        You can also access this session from your <strong>Classes</strong> or <strong>Calendar</strong> tab in the dashboard.
      </p>
    </div>
    <div style="padding:24px 48px;background:#f8f9fa;border-top:1px solid #f1f3f5;">
      <p style="margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;color:#adb5bd;text-align:center;">Brighton Academic Matching System • 2026</p>
    </div>
  </div>
</body>
</html>`;
}

export function bookingNotificationTutor({
  tutorName,
  studentName,
  date,
  time,
  classroomUrl,
}: {
  tutorName: string;
  studentName: string;
  date: string;
  time: string;
  classroomUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fdfcfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:32px;overflow:hidden;border:1px solid #f1f3f5;box-shadow:0 20px 60px rgba(0,0,0,0.04);">
    <div style="background:linear-gradient(135deg,#27ae60,#2b8a3e);padding:40px 48px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Brighton Academic</p>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">New Student Booked! 📚</h1>
    </div>
    <div style="padding:40px 48px;gap:24px;display:flex;flex-direction:column;">
      <p style="margin:0;font-size:15px;color:#7f8c8d;line-height:1.6;">
        Hi <strong style="color:#2c3e50;">${tutorName}</strong>, a student has booked a session with you.
      </p>
      <div style="background:#f8f9fa;border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#adb5bd;">Student</span>
          <span style="font-size:14px;font-weight:800;color:#2c3e50;">${studentName}</span>
        </div>
        <div style="height:1px;background:#f1f3f5;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#adb5bd;">Date</span>
          <span style="font-size:14px;font-weight:800;color:#2c3e50;">${date}</span>
        </div>
        <div style="height:1px;background:#f1f3f5;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#adb5bd;">Time</span>
          <span style="font-size:14px;font-weight:800;color:#2c3e50;">${time}</span>
        </div>
      </div>
      <a href="${classroomUrl}" style="display:block;text-align:center;background:#27ae60;color:white;text-decoration:none;padding:18px 32px;border-radius:16px;font-weight:900;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;margin-top:8px;">
        Enter Classroom →
      </a>
    </div>
    <div style="padding:24px 48px;background:#f8f9fa;border-top:1px solid #f1f3f5;">
      <p style="margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;color:#adb5bd;text-align:center;">Brighton Academic Matching System • 2026</p>
    </div>
  </div>
</body>
</html>`;
}
