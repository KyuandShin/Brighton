'use client';

import { useState, useEffect, useCallback } from 'react';
import { authClient } from '@/lib/auth/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronRight, AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, RefreshCw, Check, Sparkles } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type LoginMode = 'password' | 'forgot' | 'reverify';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState<LoginMode>('password');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [reVerifySent, setReVerifySent] = useState(false);
  const [reVerifyLoading, setReVerifyLoading] = useState(false);
  const [reVerifyError, setReVerifyError] = useState('');
  const [lastLoginEmail, setLastLoginEmail] = useState('');

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const forgotForm = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    setMode('password');
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
      setError('The verification link has expired. Go to /verify to get a new one.');
    } else if (errorParam === 'invalid_token' || errorParam === 'missing_token') {
      setError('Invalid verification link. Go to /verify to request a new one.');
    } else if (errorParam === 'verification_failed') {
      setError('Verification failed. Go to /verify to try again.');
    }
  }, []);

  const afterSignIn = useCallback(async (retries = 5, loginEmail?: string) => {
    setError('');
    setLoading(true);

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const meRes = await fetch('/api/me', { credentials: 'include' });

        if (meRes.status === 403) {
          const meData = await meRes.json();
          if (meData.error === 'STUDENT_UNVERIFIED') {
            try { await authClient.signOut(); } catch {}
            setLoading(false);
            const verifyEmail = loginEmail || lastLoginEmail;
            window.location.href = verifyEmail ? `/verify?email=${encodeURIComponent(verifyEmail)}` : '/verify';
            return;
          }
          if (meData.error === 'TUTOR_PENDING') {
            try { await authClient.signOut(); } catch {}
            setLoading(false);
            setError('Your tutor account is pending admin approval. You will be notified once approved.');
            return;
          }
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.profileIncomplete) {
            // User authenticated but profile not yet created — redirect to signup
            try { await authClient.signOut(); } catch {}
            setLoading(false);
            setError('Account setup incomplete. Please complete registration.');
            return;
          }
          window.location.href = '/dashboard';
          return;
        }

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
  }, [lastLoginEmail]);

  useEffect(() => {
    if (window.location.search.includes('auth=complete')) {
      const timer = setTimeout(() => afterSignIn(8), 300);
      return () => clearTimeout(timer);
    }
  }, [afterSignIn]);

  const handlePasswordLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true); setError('');
    const normalizedEmail = values.email.trim().toLowerCase();
    setLastLoginEmail(normalizedEmail);
    try {
      const { error: signInError } = await authClient.signIn.email({ email: normalizedEmail, password: values.password });
      if (signInError) { setError(signInError.message || 'Invalid email or password.'); setLoading(false); return; }
      await afterSignIn(5, normalizedEmail);
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

  const handleForgotPassword = async (values: z.infer<typeof forgotSchema>) => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, redirectTo: '/reset-password' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Failed to send reset email. Please try again.');
        setLoading(false);
        return;
      }
      setForgotSent(true);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || 'Failed to send reset email. Please try again.');
    }
    finally { setLoading(false); }
  };

  const handleReVerify = async () => {
    setReVerifyError(''); setReVerifyLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lastLoginEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setReVerifyError(data.error || 'Failed to resend verification email.'); return; }
      setReVerifySent(true);
    } catch { setReVerifyError('Something went wrong. Please try again.'); }
    finally { setReVerifyLoading(false); }
  };

  const resetMode = (m: LoginMode) => {
    setMode(m); setError(''); setForgotSent(false);
    setReVerifySent(false); setReVerifyError('');
  };

  if (mode === 'reverify' && reVerifySent) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-mint rounded-full shadow-sm">
            <Sparkles size={12} className="text-teal-600" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-teal-700">Email Sent!</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight"><span className="gradient-text">Check Your Email</span></h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Verification code on its way</p>
        </div>
        <div className="bg-surface border-2 border-border rounded-[20px] p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-p-mint rounded-2xl flex items-center justify-center mx-auto"><Mail size={28} className="text-teal-700" /></div>
          <div className="space-y-1.5">
            <p className="text-base font-black text-text-main tracking-tight">Verify your email</p>
            <p className="text-[11px] font-bold text-text-muted leading-relaxed max-w-sm mx-auto">
              We sent a verification code to <span className="text-primary font-black">{lastLoginEmail}</span>. Go to <span className="font-black">/verify</span> and enter the code to activate your account.
            </p>
          </div>
          <Button onClick={() => window.location.href = `/verify?email=${encodeURIComponent(lastLoginEmail)}`} className="w-full">Go to Verify Page</Button>
        </div>
        <p className="text-[8px] font-bold text-text-muted text-center">
          Didn't receive it? Check spam, or{' '}
          <button onClick={handleReVerify} className="text-primary font-black hover:underline">resend code</button>
        </p>
        <button onClick={() => resetMode('password')} className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all text-center">← Back to Login</button>
      </div>
    );
  }

  if (mode === 'reverify') {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-purple rounded-full shadow-sm">
            <Mail size={12} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Account Pending</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight"><span className="gradient-text">Verify or Wait</span></h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Your account needs email verification or admin approval</p>
        </div>
        {reVerifyError && (
          <div className="flex items-start gap-2.5 bg-p-yellow border-2 border-[#fcc419]/30 text-[#e67700] p-3 rounded-xl">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{reVerifyError}</p>
          </div>
        )}
        <div className="bg-surface border-2 border-border rounded-[20px] p-5 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-p-purple rounded-2xl flex items-center justify-center"><Mail size={24} className="text-primary" /></div>
          <div>
            <p className="text-sm font-black text-text-main">Send a verification code</p>
            <p className="text-[10px] font-bold text-text-muted mt-1">to <span className="text-primary font-black">{lastLoginEmail}</span></p>
          </div>
          <Button onClick={handleReVerify} disabled={reVerifyLoading} className="w-full">
            {reVerifyLoading ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Mail size={14} /> Send Verification Code</>}
          </Button>
        </div>
        <button onClick={() => resetMode('password')} className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all text-center">← Back to Login</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-text-main">{mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}</h2>
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
          {mode === 'password' ? 'Sign in to your account' : "We'll email you a reset link"}
        </p>
      </div>

      {verificationMessage && (
        <Alert className="bg-[#d3f9d8] border-[#8ce99a] text-[#2b8a3e]">
          <Check size={14} className="shrink-0" />
          <AlertDescription className="text-[9px] font-black uppercase tracking-widest">{verificationMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle size={14} className="shrink-0" />
          <AlertDescription>
            <p className="text-[9px] font-black uppercase tracking-widest">{error}</p>
            {(error.includes('/verify') || error.toLowerCase().includes('verif')) && (
              <Link href="/verify" className="text-[9px] font-black text-primary hover:underline mt-1 block">→ Go to verification page</Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      {mode === 'password' && (
        <>
          <Button variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-2.5 py-3.5 h-auto text-[10px] uppercase tracking-widest">
            {loading ? <Loader2 size={16} className="animate-spin" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handlePasswordLogin)} className="flex flex-col gap-3">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <Input type="email" placeholder="email@academic.edu" className="pl-10 h-12" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[9px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Password</FormLabel>
                      <button type="button" onClick={() => resetMode('forgot')} className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline">Forgot Password?</button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <Input type={showPw ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-12" {...field} />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[9px]" />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full h-12 text-[10px] uppercase tracking-[0.2em] mt-1">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Signing In...</> : <><ChevronRight size={14} /> Sign In</>}
              </Button>
            </form>
          </Form>
        </>
      )}

      {mode === 'forgot' && (
        <>
          <button type="button" onClick={() => resetMode('password')} className="flex items-center gap-2 text-text-muted text-[10px] font-bold uppercase tracking-widest hover:text-text-main transition-colors">
            <ArrowLeft size={12} /> Back to login
          </button>

          {forgotSent ? (
            <Alert className="bg-[#d3f9d8] border-[#8ce99a] text-[#2b8a3e]">
              <Check size={14} className="shrink-0" />
              <AlertDescription className="space-y-1">
                <p className="text-sm font-black tracking-widest">Reset Email Sent!</p>
                <p className="text-[11px] font-bold text-[#2b8a3e]/70">Check your inbox and follow the link to reset your password.</p>
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...forgotForm}>
              <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="flex flex-col gap-3">
                <FormField
                  control={forgotForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                          <Input type="email" placeholder="email@academic.edu" className="pl-10 h-12" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[9px]" />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full h-12 text-[10px] uppercase tracking-[0.2em]">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                  {!loading && <ChevronRight size={14} />}
                </Button>
              </form>
            </Form>
          )}
        </>
      )}

      <div className="text-center pt-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
          Don't have an account? <Link href="/signup" className="text-primary hover:underline font-black ml-1">Sign Up</Link>
        </p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mt-1">
          Need to verify your email? <Link href="/verify" className="text-primary hover:underline font-black ml-1">Verify here</Link>
        </p>
      </div>
    </div>
  );
}