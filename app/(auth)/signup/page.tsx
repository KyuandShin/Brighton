'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, GraduationCap, ChevronRight, Mail, Lock, Sparkles, UserCircle, School, Calendar } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [role, setRole]               = useState<'STUDENT' | 'TUTOR'>('STUDENT');
  const [schoolLevel, setSchoolLevel] = useState<'ELEMENTARY' | 'HIGH_SCHOOL'>('ELEMENTARY');
  const [fullName, setFullName]       = useState('');
  const [schoolName, setSchoolName]   = useState('');
  const [age, setAge]                 = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    if (!userLoading && user) {
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if email already exists before proceeding
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkRes.json();
      if (checkData.exists) {
        setError(
          checkData.role === 'TUTOR'
            ? 'A tutor account with this email already exists. Please log in instead.'
            : 'An account with this email already exists. Please log in instead.'
        );
        setLoading(false);
        return;
      }

      if (role === 'TUTOR') {
        sessionStorage.setItem(
          'tutor_draft',
          JSON.stringify({ email, password, name: fullName })
        );
        window.location.href = '/signup/tutor';
        return;
      }

      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 5) {
        setError('Please enter a valid age.');
        setLoading(false);
        return;
      }
      if (parsedAge < 18 && !parentEmail.trim()) {
        setError('Parent/guardian email is required for students under 18.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/signup/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          schoolName,
          age,
          parentEmail: parsedAge < 18 ? parentEmail : null,
          schoolLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Auto sign-in after successful registration
      const { error: signInErr } = await authClient.signIn.email({ email, password });
      if (signInErr) {
        // Account created but auto-login failed — send to login page
        window.location.href = '/login';
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-text-main">Create Account</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Join the Academic Hub</p>
      </div>

      {error && (
        <div className="bg-p-yellow border border-[#fcc419]/20 text-[#f08c00] p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="flex flex-col gap-5">
        {/* Role Picker */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Path Selection</label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-p-purple/50 rounded-[20px] border border-border">
            <button type="button" onClick={() => setRole('STUDENT')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'STUDENT' ? 'bg-white text-primary shadow-md' : 'text-text-muted hover:text-text-main'}`}>
              <User size={14} /> Student
            </button>
            <button type="button" onClick={() => setRole('TUTOR')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'TUTOR' ? 'bg-white text-primary shadow-md' : 'text-text-muted hover:text-text-main'}`}>
              <GraduationCap size={14} /> Tutor
            </button>
          </div>
        </div>

        {role === 'TUTOR' && (
          <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary text-center leading-relaxed">
            Tutor accounts require verification. Click &quot;Proceed&quot; to fill out your tutor profile.
          </div>
        )}

        {role === 'STUDENT' && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Full Name</label>
                <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all"
                    placeholder="Full Name" required />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Age</label>
                <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all"
                    placeholder="Age" required min="5" max="100" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Current School</label>
              <div className="relative">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all"
                  placeholder="School Name" required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Academic Level</label>
              <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                <select value={schoolLevel} onChange={(e) => setSchoolLevel(e.target.value as any)}
                  className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-10 py-4 text-[10px] font-black uppercase tracking-widest text-text-main focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                  <option value="ELEMENTARY">Elementary School</option>
                  <option value="HIGH_SCHOOL">High School</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted rotate-90" size={14} />
              </div>
            </div>

            {age && parseInt(age) < 18 && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6b6b] ml-1">Parent/Guardian Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff6b6b]" size={16} />
                  <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full bg-[#fff5f5] border border-[#ffc9c9] rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-[#ff6b6b] transition-all"
                    placeholder="parent@email.com" required />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Account Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all"
              placeholder="student@academic.com" required />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Secure Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all"
              placeholder="••••••••" required minLength={8} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="bg-primary hover:bg-accent-strong text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl mt-4 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? 'Initializing...'
            : role === 'TUTOR' ? 'Proceed to Onboarding' : 'Complete Registration'}
          {!loading && <ChevronRight size={16} />}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-black ml-1">Login</Link>
        </p>
      </div>
    </div>
  );
}
