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
    const recipients = Array.isArray(to) ? to : [to];
    
    // If RESEND_API_KEY is set to 're_...', it's the default dev key which might have restrictions
    // but we should still attempt to send if it's provided.
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Brighton <onboarding@resend.dev>',
        to: recipients,
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

// ── Shared Styles ───────────────────────────────────────────────────────────

const BASE_STYLES = `
  body { margin:0;padding:0;background:#fdfcfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .container { max-width:560px;margin:40px auto;background:white;border-radius:32px;overflow:hidden;border:1px solid #f1f3f5;box-shadow:0 20px 60px rgba(0,0,0,0.04); }
  .header-pending { background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px 48px; }
  .header-confirmed { background:linear-gradient(135deg,#748ffc,#5c7cfa);padding:40px 48px; }
  .header-cancel { background:linear-gradient(135deg,#fa5252,#e03131);padding:40px 48px; }
  .header-tutor-notify { background:linear-gradient(135deg,#27ae60,#2b8a3e);padding:40px 48px; }
  .badge { font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin:0 0 8px; }
  .title { margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px; }
  .body-padding { padding:40px 48px;gap:24px;display:flex;flex-direction:column; }
  .info-box { background:#f8f9fa;border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:12px; }
  .info-row { display:flex;justify-content:space-between;align-items:center; }
  .info-label { font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#adb5bd; }
  .info-value { font-size:14px;font-weight:800;color:#2c3e50; }
  .divider { height:1px;background:#f1f3f5; }
  .btn { display:block;text-align:center;color:white;text-decoration:none;padding:18px 32px;border-radius:16px;font-weight:900;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;margin-top:8px; }
  .btn-blue { background:#748ffc; }
  .btn-green { background:#27ae60; }
  .btn-amber { background:#f59e0b; }
  .text-body { margin:0;font-size:15px;color:#7f8c8d;line-height:1.6; }
  .text-small { margin:0;font-size:12px;color:#adb5bd;text-align:center;line-height:1.6; }
  .footer { padding:24px 48px;background:#f8f9fa;border-top:1px solid #f1f3f5; }
  .footer-text { margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;color:#adb5bd;text-align:center; }
`;

function wrapHtml(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body>${content}</body></html>`;
}

// ── Email Templates ─────────────────────────────────────────────────────────

export function emailVerificationEmail({
  name,
  email,
  verificationUrl,
}: {
  name: string;
  email: string;
  verificationUrl: string;
}) {
  return wrapHtml(`
<div class="container">
  <div style="background:linear-gradient(135deg,#748ffc,#5c7cfa);padding:40px 48px;">
    <p class="badge">Brighton Academic</p>
    <h1 class="title">Verify Your Email 📧</h1>
  </div>
  <div class="body-padding">
    <p class="text-body">Hi <strong style="color:#2c3e50;">${name}</strong>, welcome to Brighton Academic!</p>
    <p class="text-body">Please verify your email address by clicking the button below. This link expires in 24 hours.</p>
    <a href="${verificationUrl}" class="btn btn-blue">Verify Email →</a>
    <p class="text-small">Or paste this link in your browser:<br/><span style="font-size:11px;word-break:break-all;color:#748ffc;">${verificationUrl}</span></p>
    <p class="text-small">If you did not create an account, you can safely ignore this email.</p>
  </div>
  <div class="footer"><p class="footer-text">Brighton Academic • 2026</p></div>
</div>`);
}

/**
 * Sent to the student when they send a booking request (pending).
 */
export function bookingRequestSentStudent({
  studentName,
  tutorName,
  date,
  time,
}: {
  studentName: string;
  tutorName: string;
  date: string;
  time: string;
}) {
  return wrapHtml(`
<div class="container">
  <div class="header-pending">
    <p class="badge">Brighton Academic</p>
    <h1 class="title">Booking Request Sent ✉️</h1>
  </div>
  <div class="body-padding">
    <p class="text-body">Hi <strong style="color:#2c3e50;">${studentName}</strong>, your tutoring session request has been sent successfully!</p>
    <p class="text-body">Your tutor will review and confirm your session. You'll get a notification once they respond.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Tutor</span><span class="info-value">${tutorName}</span></div>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${date}</span></div>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${time}</span></div>
    </div>
    <p class="text-small" style="margin-top:16px;">You can track this request from your <strong>Bookings</strong> or <strong>Classes</strong> tab in the dashboard.</p>
  </div>
  <div class="footer"><p class="footer-text">Brighton Academic • 2026</p></div>
</div>`);
}

/**
 * Sent to the tutor when a student books (pending).
 */
export function bookingRequestSentTutor({
  tutorName,
  studentName,
  date,
  time,
  bookingUrl,
}: {
  tutorName: string;
  studentName: string;
  date: string;
  time: string;
  bookingUrl: string;
}) {
  return wrapHtml(`
<div class="container">
  <div class="header-tutor-notify">
    <p class="badge">Brighton Academic</p>
    <h1 class="title">New Booking Request 📚</h1>
  </div>
  <div class="body-padding">
    <p class="text-body">Hi <strong style="color:#2c3e50;">${tutorName}</strong>, a student has sent you a booking request!</p>
    <p class="text-body">Please review and confirm the session to proceed.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Student</span><span class="info-value">${studentName}</span></div>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${date}</span></div>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${time}</span></div>
    </div>
    <a href="${bookingUrl}" class="btn btn-green">Review Booking →</a>
  </div>
  <div class="footer"><p class="footer-text">Brighton Academic • 2026</p></div>
</div>`);
}

/**
 * Sent to the student when their session is confirmed.
 */
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
  return wrapHtml(`
<div class="container">
  <div class="header-confirmed">
    <p class="badge">Brighton Academic</p>
    <h1 class="title">Session Confirmed! 🎉</h1>
  </div>
  <div class="body-padding">
    <p class="text-body">Hi <strong style="color:#2c3e50;">${studentName}</strong>, your tutoring session has been <strong>confirmed</strong>!</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Tutor</span><span class="info-value">${tutorName}</span></div>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${date}</span></div>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${time}</span></div>
    </div>
    <a href="${classroomUrl}" class="btn btn-blue">Enter Classroom →</a>
    <p class="text-small">You can also access this session from your <strong>Classes</strong> or <strong>Calendar</strong> tab in the dashboard.</p>
  </div>
  <div class="footer"><p class="footer-text">Brighton Academic • 2026</p></div>
</div>`);
}

/**
 * Sent to the tutor when a student books (already configured with meetLink).
 * Also used for admin bookings.
 */
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
  return wrapHtml(`
<div class="container">
  <div class="header-tutor-notify">
    <p class="badge">Brighton Academic</p>
    <h1 class="title">New Student Booked! 📚</h1>
  </div>
  <div class="body-padding">
    <p class="text-body">Hi <strong style="color:#2c3e50;">${tutorName}</strong>, a student has booked a session with you.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Student</span><span class="info-value">${studentName}</span></div>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${date}</span></div>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${time}</span></div>
    </div>
    <a href="${classroomUrl}" class="btn btn-green">Enter Classroom →</a>
  </div>
  <div class="footer"><p class="footer-text">Brighton Academic • 2026</p></div>
</div>`);
}

/**
 * Sent to the other party when a session is cancelled.
 */
export function bookingCancelledEmail({
  recipientName,
  cancelledByName,
  date,
  time,
}: {
  recipientName: string;
  cancelledByName: string;
  date: string;
  time: string;
}) {
  return wrapHtml(`
<div class="container">
  <div class="header-cancel">
    <p class="badge">Brighton Academic</p>
    <h1 class="title">Session Cancelled ❌</h1>
  </div>
  <div class="body-padding">
    <p class="text-body">Hi <strong style="color:#2c3e50;">${recipientName}</strong>,</p>
    <p class="text-body">Your session with <strong>${cancelledByName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been cancelled.</p>
    <p class="text-body">If you have any questions, please contact support.</p>
  </div>
  <div class="footer"><p class="footer-text">Brighton Academic • 2026</p></div>
</div>`);
}