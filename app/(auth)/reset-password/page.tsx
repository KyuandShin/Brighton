'use client';

import { useState, useEffect, Suspense } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token: token,
      });

      if (resetError) {
        setError(resetError.message || 'Failed to reset password.');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-text-main">New Password</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Enter your new secure password</p>
      </div>

      {error && (
        <div className="bg-p-yellow border border-[#fcc419]/20 text-[#f08c00] p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      {success ? (
        <div className="bg-[#d3f9d8] border border-[#8ce99a] p-6 rounded-2xl text-center space-y-2">
          <p className="text-sm font-black text-[#2b8a3e] uppercase tracking-widest">Password Reset!</p>
          <p className="text-xs font-bold text-[#2b8a3e]/70">Your password has been updated. Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors" size={16} />
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#f1f3f5] rounded-2xl pl-12 pr-12 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-[#adb5bd]/50"
                placeholder="••••••••" required minLength={8} />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adb5bd] hover:text-primary transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors" size={16} />
              <input type={showPw ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#f1f3f5] rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-[#adb5bd]/50"
                placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="bg-primary hover:bg-[#5c7cfa] text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl mt-2 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Updating...' : 'Reset Password'}
            {!loading && <ChevronRight size={16} />}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-text-main">New Password</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}