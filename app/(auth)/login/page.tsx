'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronRight, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

type LoginMode = 'password' | 'otp' | 'forgot';
type OtpStep = 'email' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  // shared
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState<LoginMode>('password');

  // password login
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  // OTP flow
  const [otpStep, setOtpStep]   = useState<OtpStep>('email');
  const [otp, setOtp]           = useState('');

  // forgot password
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    // Force mode to password on first load to be sure
    setMode('password');
  }, []);

  useEffect(() => {
    // Handle social auth callback return FIRST before anything else
    if (window.location.search.includes('auth=complete')) {
      afterSignIn();
      return;
    }

    // DO NOT auto-redirect existing users on login page
    // Users expect to see login form even if already logged in
  }, [user, userLoading]);

  // ── helpers ──────────────────────────────────────────────────────────
  const afterSignIn = async () => {
    try {
        // Clear any existing error state first
        setError('');
        setLoading(true);
        
        const meRes  = await fetch('/api/me', { credentials: 'include' });
        const meData = await meRes.json();
        if (meRes.status === 403 && meData.error === 'TUTOR_PENDING') {
          setError('Your tutor account is pending verification. You will be notified once approved.');
          await authClient.signOut();
          setLoading(false);
          return;
        }
        if (!meRes.ok) { 
          setError(meData.error || 'Login failed. Please try again.');
          setLoading(false);
          return;
        }
        window.location.href = '/dashboard';
    } catch (err) {
        setError('Login successful, but profile could not be loaded. Please refresh.');
        setLoading(false);
    }
  };

  // ── handlers ─────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { error: signInError } = await authClient.signIn.email({ email, password });
      if (signInError) { setError(signInError.message || 'Invalid email or password.'); return; }
      await afterSignIn();
    } catch { setError('An unexpected error occurred. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError('');
    try {
      // Use login page as callback so afterSignIn logic runs after OAuth returns
      await authClient.signIn.social({ provider: 'google', callbackURL: '/login?auth=complete' });
    } catch { setError('Google sign-in failed. Please try again.'); setLoading(false); }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' });
      if (sendError) { setError(sendError.message || 'Failed to send verification code.'); return; }
      setOtpStep('otp');
    } catch { setError('An unexpected error occurred. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { error: signInError } = await authClient.signIn.emailOtp({ email, otp });
      if (signInError) { setError(signInError.message || 'Invalid verification code.'); return; }
      await afterSignIn();
    } catch { setError('An unexpected error occurred. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' });
      setForgotSent(true);
    } catch { setError('Failed to send reset email. Please try again.'); }
    finally { setLoading(false); }
  };

  const resetMode = (m: LoginMode) => {
    setMode(m); setError(''); setOtp(''); setOtpStep('email'); setForgotSent(false);
  };

  // ── render ────────────────────────────────────────────────────────────
  const title = mode === 'forgot' ? 'Reset Password' : 'Welcome Back';
  const subtitle =
    mode === 'password' ? 'Sign in to your account' :
    mode === 'otp'      ? (otpStep === 'email' ? 'Sign in with a one-time code' : 'Enter verification code') :
                          'We\'ll email you a reset link';

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-text-main">{title}</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{subtitle}</p>
      </div>

      {error && (
        <div className="bg-p-yellow border border-[#fcc419]/20 text-[#f08c00] p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
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
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-border hover:border-primary/30 rounded-2xl py-4 font-black text-xs uppercase tracking-widest text-text-main transition-all hover:shadow-md disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
                  placeholder="email@academic.edu" required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Password</label>
                <button type="button" onClick={() => resetMode('forgot')}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-12 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="bg-primary hover:bg-accent-strong text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl mt-2 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Signing In...' : 'Sign In'}
              {!loading && <ChevronRight size={16} />}
            </button>
          </form>

          <button type="button" onClick={() => resetMode('otp')}
            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors text-center">
            Sign in with Email Code instead
          </button>
        </>
      )}

      {/* ── OTP MODE ── */}
      {mode === 'otp' && (
        <>
          <button type="button" onClick={() => resetMode('password')}
            className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest hover:text-text-main transition-colors">
            <ArrowLeft size={14} /> Back to password login
          </button>

          {otpStep === 'email' ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
                    placeholder="email@academic.edu" required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="bg-primary hover:bg-[#7c3aed] text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Sending Code...' : 'Send Verification Code'}
                {!loading && <ChevronRight size={16} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <button type="button" onClick={() => { setOtpStep('email'); setOtp(''); setError(''); }}
                className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest hover:text-text-main transition-colors">
                <ArrowLeft size={14} /> Back to email
              </button>
              <div className="bg-p-purple border border-border p-4 rounded-2xl">
                <p className="text-xs font-bold text-primary">Code sent to <span className="font-black">{email}</span></p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Verification Code</label>
                <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                  <input type="text" inputMode="numeric" maxLength={6} value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all text-center tracking-[1em]"
                    placeholder="000000" required />
                </div>
              </div>
              <button type="submit" disabled={loading || otp.length !== 6}
              className="bg-primary hover:bg-[#7c3aed] text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
                {!loading && <ChevronRight size={16} />}
              </button>
            </form>
          )}
        </>
      )}

      {/* ── FORGOT PASSWORD MODE ── */}
      {mode === 'forgot' && (
        <>
          <button type="button" onClick={() => resetMode('password')}
            className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest hover:text-text-main transition-colors">
            <ArrowLeft size={14} /> Back to login
          </button>

          {forgotSent ? (
            <div className="bg-[#d3f9d8] border border-[#8ce99a] p-6 rounded-2xl text-center space-y-2">
              <p className="text-sm font-black text-[#2b8a3e] uppercase tracking-widest">Reset Email Sent!</p>
              <p className="text-xs font-bold text-[#2b8a3e]/70">Check your inbox at <span className="font-black">{email}</span> and follow the link to reset your password.</p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Email</label>
                <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
                    placeholder="email@academic.edu" required />
                </div>
              </div>
              <button type="submit" disabled={loading}
              className="bg-primary hover:bg-[#7c3aed] text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Sending...' : 'Send Reset Link'}
                {!loading && <ChevronRight size={16} />}
              </button>
            </form>
          )}
        </>
      )}

      <div className="text-center pt-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-black ml-1">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}