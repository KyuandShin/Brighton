'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [step, setStep]         = useState<'email' | 'otp'>('email');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!userLoading && user) {
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({ 
        email,
        type: 'sign-in'
      });

      if (sendError) {
        setError(sendError.message || 'Failed to send verification code.');
        return;
      }

      setStep('otp');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await authClient.signIn.emailOtp({ email, otp });

      if (signInError) {
        setError(signInError.message || 'Invalid verification code.');
        return;
      }

      // Verify the user is allowed in
      const meRes  = await fetch('/api/me');
      const meData = await meRes.json();

      if (meRes.status === 403 && meData.error === 'TUTOR_PENDING') {
        setError('Your tutor account is pending verification. You will be notified once approved.');
        await authClient.signOut();
        return;
      }

      if (!meRes.ok) {
        setError(meData.error || 'Login failed. Please try again.');
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setOtp('');
    setError('');
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-text-main">Welcome Back</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {step === 'email' ? 'Sign in to your account' : 'Enter verification code'}
        </p>
      </div>

      {error && (
        <div className="bg-p-yellow border border-[#fcc419]/20 text-[#f08c00] p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#f1f3f5] rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-[#adb5bd]/50"
                placeholder="email@academic.edu"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-[#5c7cfa] text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl mt-4 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Sending Code...' : 'Send Verification Code'}
            {!loading && <ChevronRight size={16} />}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest mb-2 hover:text-text-main transition-colors"
          >
            <ArrowLeft size={14} />
            Back to email
          </button>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
            <p className="text-xs font-bold text-blue-800">
              We sent a 6-digit verification code to <span className="font-black">{email}</span>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Verification Code</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors" size={16} />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-[#f8f9fa] border border-[#f1f3f5] rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-[#adb5bd]/50 text-center tracking-[1em]"
                placeholder="000000"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="bg-primary hover:bg-[#5c7cfa] text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl mt-4 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
            {!loading && <ChevronRight size={16} />}
          </button>
        </form>
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