'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, Check, AlertCircle, Loader2, ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

/**
 * /verify — Self-service email verification page.
 *
 * Handles two scenarios:
 * 1. Normal post-signup OTP flow: user arrives with ?email=... and enters their OTP.
 * 2. Stuck user: user arrives without email param (OTP expired/lost),
 *    enters their email, and we send a fresh OTP or a fallback link via Resend.
 *
 * Accessible from: signup confirmation screen, login "reverify" mode,
 * and any error page that detects STUDENT_UNVERIFIED.
 */

type Stage =
  | 'enter-email'   // User needs to type their email to start
  | 'enter-otp'     // OTP sent, waiting for 6-digit input
  | 'success'       // Verified successfully
  | 'link-sent';    // Fallback: verification link emailed via Resend

function VerifyContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState<Stage>('enter-email');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCount, setResendCount] = useState(0);

  // If an email was passed via query string, prefill and jump straight to OTP input
  useEffect(() => {
    const paramEmail = searchParams.get('email');
    if (paramEmail) {
      const normalized = paramEmail.toLowerCase();
      setEmail(normalized);
      setStage('enter-otp');
      sendOtp(normalized);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendOtp = async (targetEmail: string) => {
    setError('');
    setLoading(true);
    try {
      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email: targetEmail,
        type: 'email-verification',
      });
      if (otpError) {
        console.error('[VERIFY] OTP send error:', otpError);
        setError('Could not send verification code. Use the "Send me a link" option below.');
      }
    } catch (err) {
      console.error('[VERIFY] OTP send exception:', err);
      setError('Could not send verification code. Use the "Send me a link" option below.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const normalized = email.trim().toLowerCase();
    setEmail(normalized);
    setStage('enter-otp');
    await sendOtp(normalized);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp });
      const verifyError = (result as any)?.error;
      if (verifyError) {
        setError(verifyError.message || 'Invalid code. Please check and try again.');
        return;
      }
      // Flip isVerified in our DB (no session needed — POST handler accepts email only)
      await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStage('success');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendCount(c => c + 1);
    await sendOtp(email);
  };

  const handleSendLink = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send verification link.');
        return;
      }
      setStage('link-sent');
    } catch {
      setError('Failed to send link. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success ────────────────────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-mint rounded-full shadow-sm">
            <Check size={12} className="text-teal-600" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-teal-700">Verified!</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight gradient-text">Email Verified</h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Your account is now active</p>
        </div>
        <div className="bg-surface border-2 border-border rounded-[20px] p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-p-mint rounded-2xl flex items-center justify-center mx-auto">
            <Check size={28} className="text-teal-700" />
          </div>
          <p className="text-sm font-black text-text-main">{email} is verified.</p>
          <p className="text-[10px] font-bold text-text-muted">You can now log in to Brighton.</p>
        </div>
        <Link
          href="/login"
          className="block w-full py-3.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-accent-strong transition-all text-center"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  // ── Link sent ──────────────────────────────────────────────────────────
  if (stage === 'link-sent') {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-purple rounded-full shadow-sm">
            <Mail size={12} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Link Sent</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight gradient-text">Check Your Email</h2>
        </div>
        <div className="bg-surface border-2 border-border rounded-[20px] p-6 text-center space-y-3">
          <div className="w-16 h-16 bg-p-purple rounded-2xl flex items-center justify-center mx-auto">
            <Mail size={28} className="text-primary" />
          </div>
          <p className="text-sm font-black text-text-main">Verification link sent</p>
          <p className="text-[10px] font-bold text-text-muted leading-relaxed">
            We sent a link to <span className="text-primary font-black">{email}</span>. Click it to activate your account, then log in.
          </p>
          <p className="text-[9px] font-bold text-text-muted">Link expires in 24 hours.</p>
        </div>
        <p className="text-[8px] font-bold text-text-muted text-center">
          Didn't get it? Check spam, or{' '}
          <button onClick={handleSendLink} disabled={loading} className="text-primary font-black hover:underline disabled:opacity-50">
            resend
          </button>
        </p>
        <Link href="/login" className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all text-center">
          ← Back to Login
        </Link>
      </div>
    );
  }

  // ── Enter email ────────────────────────────────────────────────────────
  if (stage === 'enter-email') {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-purple rounded-full shadow-sm">
            <Shield size={12} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Verify Email</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight gradient-text">Verify Your Email</h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
            Enter your email to receive a verification code
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-p-yellow border-2 border-[#fcc419]/30 text-[#e67700] p-3 rounded-xl">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Your Email</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-elevated border-2 border-border rounded-xl pl-10 pr-3 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
                placeholder="you@email.com"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-primary hover:bg-accent-strong text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all shadow-xl shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            {loading ? 'Sending code...' : 'Send Verification Code'}
          </button>
        </form>

        <Link href="/login" className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all text-center">
          ← Back to Login
        </Link>
      </div>
    );
  }

  // ── Enter OTP ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-2 pb-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-purple rounded-full shadow-sm">
          <KeyRound size={12} className="text-primary" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Enter Code</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight gradient-text">Check Your Email</h2>
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
          We sent a 6-digit code to{' '}
          <span className="text-primary font-black">{email}</span>
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-p-yellow border-2 border-[#fcc419]/30 text-[#e67700] p-3 rounded-xl">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="000000"
            autoFocus
            className="w-full bg-surface-elevated border-2 border-border rounded-xl px-4 py-3.5 text-2xl font-black text-text-main text-center tracking-[0.5em] focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full bg-primary hover:bg-accent-strong text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all shadow-xl shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {loading ? 'Verifying...' : 'Verify & Activate Account'}
        </button>
      </form>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[8px] font-bold text-text-muted text-center">
          Didn't receive it?{' '}
          <button
            onClick={handleResendOtp}
            disabled={loading}
            className="text-primary font-black hover:underline disabled:opacity-50"
          >
            <RefreshCw size={10} className="inline mr-0.5" /> Resend code
          </button>
        </p>
        {resendCount >= 1 && (
          <p className="text-[8px] font-bold text-text-muted text-center">
            Still not getting it?{' '}
            <button
              onClick={handleSendLink}
              disabled={loading}
              className="text-accent-strong font-black hover:underline disabled:opacity-50"
            >
              Send me a link instead
            </button>
          </p>
        )}
      </div>

      <button
        onClick={() => { setStage('enter-email'); setOtp(''); setError(''); }}
        className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all text-center flex items-center justify-center gap-1"
      >
        <ArrowLeft size={10} /> Wrong email?
      </button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
