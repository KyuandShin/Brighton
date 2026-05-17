'use client';

import { useState, useEffect, useCallback } from 'react';
import { authClient } from '@/lib/auth/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronRight, AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, RefreshCw, Check, Sparkles } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

type LoginMode = 'password' | 'forgot' | 'reverify';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser(true);

  // shared
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState<LoginMode>('password');
  const [verificationMessage, setVerificationMessage] = useState('');

  // password login
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  // forgot password
  const [forgotSent, setForgotSent] = useState(false);

  // ── Re-verification flow (Resend email link) ──
  const [reVerifySent, setReVerifySent] = useState(false);
  const [reVerifyLoading, setReVerifyLoading] = useState(false);
  const [reVerifyError, setReVerifyError] = useState('');

  // Track which email the last sign-in attempt used (for re-verify)
  const [lastLoginEmail, setLastLoginEmail] = useState('');

  useEffect(() => {
    setMode('password');

    // Check for verification success/error query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setVerificationMessage('Email verified! You can now log in.');
    }
    if (params.get('verified') === 'sent') {
      setVerificationMessage('Verification link sent! Check your email inbox.');
    }
    const errorParam = params.get('error');
    if (errorParam === 'already_verified') {
      setVerificationMessage('Your email is already verified. You can log in.');
    } else if (errorParam === 'expired_token') {
      setError('The verification link has expired. Please sign up again to receive a new link.');
    } else if (errorParam === 'invalid_token' || errorParam === 'missing_token') {
      setError('Invalid verification link. Please try signing up again.');
    } else if (errorParam === 'verification_failed') {
      setError('Verification failed. Please try signing up again.');
    }
  }, []);

  // ── afterSignIn with retry logic + re-verify support ──────────────
  const afterSignIn = useCallback(async (retries = 5) => {
    setError('');
    setLoading(true);

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const meRes = await fetch('/api/me', { credentials: 'include' });

        if (meRes.status === 403) {
          const meData = await meRes.json();
          if (meData.error === 'STUDENT_UNVERIFIED') {
            // Transition to re-verify mode instead of showing an error and logging out
            try { await authClient.signOut(); } catch {}
            setLoading(false);
            setMode('reverify');
            setReVerifySent(false);
            return;
          }
          if (meData.error === 'TUTOR_PENDING') {
            setError('Your tutor account is pending verification. You will be notified once approved.');
            try { await authClient.signOut(); } catch {}
            setLoading(false);
            return;
          }
        }

        if (meRes.ok) {
          window.location.href = '/dashboard';
          return;
        }

        // If 401, session may not be ready yet
        if (meRes.status === 401 && attempt < retries - 1) {
          const delay = Math.min(500 * Math.pow(2, attempt), 3000);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        const meData = await meRes.json();
        setError(meData.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      } catch (err) {
        if (attempt < retries - 1) {
          const delay = Math.min(500 * Math.pow(2, attempt), 3000);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        setError('Login successful, but profile could not be loaded. Please refresh.');
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  }, []);

  // Handle social auth callback return
  useEffect(() => {
    if (window.location.search.includes('auth=complete')) {
      const timer = setTimeout(() => {
        afterSignIn(8);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [afterSignIn]);

  // ── handlers ─────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    setLastLoginEmail(email);
    try {
      const { error: signInError } = await authClient.signIn.email({ email, password });
      if (signInError) { setError(signInError.message || 'Invalid email or password.'); setLoading(false); return; }
      await afterSignIn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as any)?.statusText || 'An unexpected error occurred. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError('');
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: '/login?auth=complete' });
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { error: fpError } = await (authClient as any).forgetPassword({ email, redirectTo: '/reset-password' });
      if (fpError) {
        setError(fpError.message || 'Failed to send reset email. Please try again.');
        setLoading(false);
        return;
      }
      setForgotSent(true);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || 'Failed to send reset email. Please try again.');
    }
    finally { setLoading(false); }
  };

  // ── Re-verification handler (Resend email link) ───────────────────────
  const handleReVerify = async () => {
    setReVerifyError('');
    setReVerifyLoading(true);
    try {
      // Call the server to resend the verification email via Resend
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lastLoginEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReVerifyError(data.error || 'Failed to resend verification email.');
        return;
      }
      setReVerifySent(true);
    } catch {
      setReVerifyError('Something went wrong. Please try again.');
    } finally {
      setReVerifyLoading(false);
    }
  };

  const resetMode = (m: LoginMode) => {
    setMode(m); setError('');
    setForgotSent(false);
    setReVerifySent(false); setReVerifyError('');
  };

  // ── Re-verify success screen ─────────────────────────────────────────
  if (mode === 'reverify' && reVerifySent) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-mint rounded-full shadow-sm">
            <Sparkles size={12} className="text-teal-600" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-teal-700">Email Sent!</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            <span className="gradient-text">Check Your Email</span>
          </h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
            Verification link on its way
          </p>
        </div>

        <div className="bg-surface border-2 border-border rounded-[20px] p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-p-mint rounded-2xl flex items-center justify-center mx-auto">
            <Mail size={28} className="text-teal-700" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-black text-text-main tracking-tight">Verify your email</p>
            <p className="text-[11px] font-bold text-text-muted leading-relaxed max-w-sm mx-auto">
              We sent a verification link to <span className="text-primary font-black">{lastLoginEmail}</span>. Click the link to activate your account, then log in.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              onClick={() => resetMode('password')}
              className="block w-full py-3.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-accent-strong transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>

        <p className="text-[8px] font-bold text-text-muted text-center">
          Didn't receive it? Check spam, or{' '}
          <button onClick={handleReVerify} className="text-primary font-black hover:underline">
            click to resend
          </button>
        </p>

        <button
          onClick={() => resetMode('password')}
          className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all text-center"
        >
          ← Back to Login
        </button>
      </div>
    );
  }

  // ── Re-verify screen (send email) ──────────────────────────────
  if (mode === 'reverify') {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-purple rounded-full shadow-sm">
            <Mail size={12} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Verify Email</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            <span className="gradient-text">Verify Your Email</span>
          </h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
            You need to verify before signing in
          </p>
        </div>

        {reVerifyError && (
          <div className="flex items-start gap-2.5 bg-p-yellow border-2 border-[#fcc419]/30 text-[#e67700] p-3 rounded-xl">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{reVerifyError}</p>
          </div>
        )}

        <div className="bg-surface border-2 border-border rounded-[20px] p-5 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-p-purple rounded-2xl flex items-center justify-center">
            <Mail size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-black text-text-main">We'll send a verification link</p>
            <p className="text-[10px] font-bold text-text-muted mt-1">
              to <span className="text-primary font-black">{lastLoginEmail}</span>
            </p>
          </div>
          <button
            onClick={handleReVerify}
            disabled={reVerifyLoading}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-accent-strong transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {reVerifyLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Sending...</>
            ) : (
              <><Mail size={14} /> Send Verification Link</>
            )}
          </button>
        </div>

        <button
          onClick={() => resetMode('password')}
          className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all text-center"
        >
          ← Back to Login
        </button>
      </div>
    );
  }

  // ── Normal render ─────────────────────────────────────────────────────
  const title = mode === 'forgot' ? 'Reset Password' : 'Welcome Back';
  const subtitle =
    mode === 'password' ? 'Sign in to your account' :
                          'We\'ll email you a reset link';

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-text-main">{title}</h2>
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{subtitle}</p>
      </div>

      {verificationMessage && (
        <div className="bg-[#d3f9d8] border border-[#8ce99a] text-[#2b8a3e] p-3 rounded-xl flex items-start gap-2.5">
          <Check size={14} className="shrink-0 mt-0.5" />
          <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{verificationMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-p-yellow border border-[#fcc419]/20 text-[#f08c00] p-3 rounded-xl flex items-start gap-2.5">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      {/* ── PASSWORD MODE ── */}
      {mode === 'password' && (
        <>
          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-surface border-2 border-border hover:border-primary/30 rounded-xl py-3.5 font-black text-[10px] uppercase tracking-widest text-text-main transition-all hover:shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl pl-10 pr-3 py-3 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
                  placeholder="email@academic.edu" required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Password</label>
                <button type="button" onClick={() => resetMode('forgot')}
                  className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl pl-10 pr-10 py-3 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="bg-primary hover:bg-accent-strong text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-xl mt-1 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Signing In...</>
              ) : (
                <><ChevronRight size={14} /> Sign In</>
              )}
            </button>
          </form>

        </>
      )}

      {/* ── FORGOT PASSWORD MODE ── */}
      {mode === 'forgot' && (
        <>
          <button type="button" onClick={() => resetMode('password')}
            className="flex items-center gap-2 text-text-muted text-[10px] font-bold uppercase tracking-widest hover:text-text-main transition-colors">
            <ArrowLeft size={12} /> Back to login
          </button>

          {forgotSent ? (
            <div className="bg-[#d3f9d8] border border-[#8ce99a] p-5 rounded-xl text-center space-y-1.5">
              <p className="text-sm font-black text-[#2b8a3e] uppercase tracking-widest">Reset Email Sent!</p>
              <p className="text-[11px] font-bold text-[#2b8a3e]/70">Check your inbox at <span className="font-black">{email}</span> and follow the link to reset your password.</p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl pl-10 pr-3 py-3 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
                    placeholder="email@academic.edu" required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="bg-primary hover:bg-accent-strong text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Sending...' : 'Send Reset Link'}
                {!loading && <ChevronRight size={14} />}
              </button>
            </form>
          )}
        </>
      )}

      <div className="text-center pt-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-black ml-1">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}