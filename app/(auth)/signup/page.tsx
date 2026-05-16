'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, GraduationCap, ChevronRight, Mail, Lock, Sparkles, UserCircle, School, Calendar, Upload, X, Star, Rocket, Heart, Search, Eye, EyeOff, AlertCircle, Check, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { uploadToCloudinary } from '@/lib/cloudinary';

const PH_GRADES = [
  { value: 1,  label: 'G1' },
  { value: 2,  label: 'G2' },
  { value: 3,  label: 'G3' },
  { value: 4,  label: 'G4' },
  { value: 5,  label: 'G5' },
  { value: 6,  label: 'G6' },
  { value: 7,  label: 'G7' },
  { value: 8,  label: 'G8' },
  { value: 9,  label: 'G9' },
  { value: 10, label: 'G10' },
];

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser(true);
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [role, setRole]               = useState<'STUDENT' | 'TUTOR'>('STUDENT');
  const [gradeLevel, setGradeLevel]   = useState<number>(7);
  const [fullName, setFullName]       = useState('');
  const [schoolName, setSchoolName]   = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolResults, setSchoolResults] = useState<string[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [age, setAge]                 = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [verified, setVerified] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derive school level from grade
  const schoolLevel: 'ELEMENTARY' | 'HIGH_SCHOOL' = gradeLevel <= 6 ? 'ELEMENTARY' : 'HIGH_SCHOOL';

  // School search with debounce
  const searchSchools = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSchoolResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/schools?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) setSchoolResults(data);
    } catch {
      // fallback silently
    }
  }, []);

  const handleSchoolInputChange = (value: string) => {
    setSchoolSearch(value);
    setShowSchoolDropdown(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchSchools(value), 200);
  };

  const selectSchool = (name: string) => {
    setSchoolName(name);
    setSchoolSearch(name);
    setShowSchoolDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(e.target as Node)) {
        setShowSchoolDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError('');
      const url = await uploadToCloudinary(file);
      setProfileImage(url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

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

      // For tutors, redirect to tutor onboarding
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
          gradeLevel: gradeLevel,
          image: profileImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Account created — try to send OTP via Neon Auth
      try {
        const { error: otpSendError } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
        if (otpSendError) {
          console.error('[SIGNUP] Neon Auth OTP send error:', otpSendError);
          setOtpSent(false);
        } else {
          setOtpSent(true);
        }
      } catch (sendErr) {
        console.error('[SIGNUP] Neon Auth OTP send exception:', sendErr);
        setOtpSent(false);
      }
      setOtpStep(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStudentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError('');
    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({ email, otp });
      if (verifyError) {
        console.error('[SIGNUP] OTP verify error:', verifyError);
        setOtpError(verifyError.message || 'Invalid code. Please check and try again.');
        return;
      }
      // Mark as verified in our DB
      const verifyRes = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json();
        console.error('[SIGNUP] DB verify error:', verifyData);
        // Non-fatal - OTP was valid, DB update may have failed
      }
      setVerified(true);
    } catch (err) {
      console.error('[SIGNUP] OTP verify exception:', err);
      setOtpError('Something went wrong. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError('');
    setResendCount(prev => prev + 1);
    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
      if (sendError) {
        console.error('[SIGNUP] Resend OTP error:', sendError);
        setOtpError('Failed to resend. Please try the verification link instead.');
        return;
      }
      setOtpSent(true);
    } catch (err) {
      console.error('[SIGNUP] Resend OTP exception:', err);
      setOtpError('Failed to resend. Please try the verification link instead.');
    }
  };

  // Fallback: send verification link via Resend
  const handleSendLinkFallback = async () => {
    setOtpError('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to send verification link.');
        return;
      }
      // Redirect to login page with success message
      window.location.href = '/login?verified=sent';
    } catch {
      setOtpError('Failed to send link. Please try again later.');
    }
  };

  // ── OTP verification screen ──────────────────────────────
  if (otpStep && !verified) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-purple rounded-full shadow-sm">
            <Mail size={12} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Verify Email</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            <span className="gradient-text">Enter Your Code</span>
          </h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
            We sent a 6-digit code to <span className="text-primary font-black">{email}</span>
          </p>
        </div>

        {otpError && (
          <div className="flex items-start gap-2.5 bg-p-yellow border-2 border-[#fcc419]/30 text-[#e67700] p-3 rounded-xl">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{otpError}</p>
          </div>
        )}

        <form onSubmit={handleVerifyStudentOtp} className="flex flex-col gap-3">
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
            disabled={otpLoading || otp.length !== 6}
            className="group relative overflow-hidden bg-gradient-to-r from-primary to-pink-500 text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all shadow-xl shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {otpLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Verifying...</>
            ) : (
              <><Check size={14} /> Verify & Complete Signup</>
            )}
          </button>
        </form>

        <p className="text-[8px] font-bold text-text-muted text-center">
          Didn't receive it?{' '}
          <button onClick={handleResendOtp} className="text-primary font-black hover:underline" disabled={otpLoading}>
            Resend code
          </button>
          {resendCount >= 2 && (
            <span className="block mt-1.5">
              Still not getting it?{' '}
              <button onClick={handleSendLinkFallback} className="text-accent-strong font-black hover:underline">
                Send me a verification link instead
              </button>
            </span>
          )}
        </p>
      </div>
    );
  }

  // ── Verified success screen ────────────────────────────
  if (verified) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-mint rounded-full shadow-sm">
            <Sparkles size={12} className="text-teal-600" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-teal-700">Email Verified!</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            <span className="gradient-text">You're All Set!</span>
          </h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
            Your account is verified and ready
          </p>
        </div>

        <div className="bg-surface border-2 border-border rounded-[20px] p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-p-mint rounded-2xl flex items-center justify-center mx-auto">
            <Check size={28} className="text-teal-700" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-black text-text-main tracking-tight">Email Verified Successfully!</p>
            <p className="text-[11px] font-bold text-text-muted leading-relaxed max-w-sm mx-auto">
              Your account for <span className="text-primary font-black">{email}</span> is now active. You can log in right away.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-1">
            <Link href="/login" className="block w-full py-3.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-accent-strong transition-all text-center">
              Go to Login
            </Link>
          </div>
        </div>

        <div className="text-center pt-1 pb-0">
          <p className="text-[9px] font-bold tracking-widest text-text-muted">
            Already logged in?{' '}
            <Link href="/dashboard" className="text-primary hover:text-accent-strong font-black hover:underline transition-all ml-1">
              Go to Dashboard
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="text-center space-y-2 pb-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p-sakura rounded-full shadow-sm">
          <Sparkles size={12} className="text-pink-500" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-pink-600">New Student</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight">
          <span className="gradient-text">Create Account</span>
        </h2>
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
          Join Brighton's Learning Community
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-p-yellow border-2 border-[#fcc419]/30 text-[#e67700] p-3 rounded-xl">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        {/* Role Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
            <Rocket size={10} className="text-primary" /> I want to join as
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-gradient-to-r from-p-purple/40 to-p-sakura/30 rounded-[16px] border-2 border-border">
            <button type="button" onClick={() => setRole('STUDENT')}
              className={`group relative flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                role === 'STUDENT' 
                  ? 'bg-surface text-primary shadow-lg shadow-primary/10 scale-[1.02]' 
                  : 'text-text-muted hover:text-text-main hover:bg-surface/40'
              }`}>
              <User size={14} className={role === 'STUDENT' ? 'text-primary' : ''} />
              <span className="relative z-10">Student</span>
              {role === 'STUDENT' && (
                <Heart size={8} className="absolute -top-1 -right-1 text-pink-400 animate-bounce-cute" />
              )}
            </button>
            <button type="button" onClick={() => setRole('TUTOR')}
              className={`group relative flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                role === 'TUTOR' 
                  ? 'bg-surface text-primary shadow-lg shadow-primary/10 scale-[1.02]' 
                  : 'text-text-muted hover:text-text-main hover:bg-surface/40'
              }`}>
              <GraduationCap size={14} className={role === 'TUTOR' ? 'text-primary' : ''} />
              <span className="relative z-10">Tutor</span>
              {role === 'TUTOR' && (
                <Sparkles size={8} className="absolute -top-1 -right-1 text-primary animate-sparkle" />
              )}
            </button>
          </div>
        </div>

        {/* Tutor notice card */}
        {role === 'TUTOR' && (
          <div className="group relative overflow-hidden p-4 bg-gradient-to-br from-primary/5 to-pink-100/40 border-2 border-primary/20 rounded-xl transition-all hover:border-primary/40">
            <div className="absolute -top-8 -right-8 w-16 h-16 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-start gap-2.5">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Star size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Tutor Verification Required</p>
                <p className="text-[9px] font-bold text-text-muted leading-relaxed">
                  Click <span className="text-primary">"Proceed to Onboarding"</span> to complete your tutor profile.
                </p>
              </div>
            </div>
          </div>
        )}

         {/* STUDENT FIELDS */}
         {role === 'STUDENT' && (
           <div className="flex flex-col gap-3">
             {/* Profile Picture Upload */}
             <div className="flex flex-col gap-1.5">
               <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                 <UserCircle size={10} /> Profile Picture
               </label>
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="group relative cursor-pointer bg-gradient-to-br from-p-purple/20 to-p-sakura/10 border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:from-p-purple/30 hover:to-p-sakura/20 transition-all duration-300"
               >
                 {profileImage ? (
                   <>
                     <div className="relative">
                       <img src={profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/40 ring-offset-2" />
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-surface flex items-center justify-center">
                         <Check size={8} className="text-white" />
                       </div>
                     </div>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setProfileImage(null); }}
                       className="absolute top-1 right-1 p-1 bg-rose-400 rounded-full text-white hover:bg-rose-500 transition-all shadow-md"
                     >
                       <X size={10} />
                     </button>
                     <span className="text-[9px] font-bold text-text-muted mt-0.5">Click to change</span>
                   </>
                 ) : (
                   <>
                     <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-pink-200/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                       <Upload size={18} className="text-primary/60 group-hover:text-primary transition-colors" />
                     </div>
                     <div className="text-center">
                       <p className="text-[9px] font-black uppercase tracking-wider text-text-muted group-hover:text-primary transition-colors">Upload Photo</p>
                       <p className="text-[7px] font-bold text-text-muted/50 mt-0.5">PNG, JPG · Max 5MB</p>
                     </div>
                   </>
                 )}
               </div>
               <input 
                 ref={fileInputRef} 
                 type="file" 
                 accept="image/*" 
                 onChange={handleImageUpload} 
                 className="hidden" 
               />
             </div>

             {/* Name + Age row */}
             <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                  <UserCircle size={10} /> Full Name
                </label>
                <div className="relative group">
                  <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface-elevated border-2 border-border rounded-xl pl-10 pr-3 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
                    placeholder="Juan Dela Cruz" required />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                  <Calendar size={10} /> Age
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-surface-elevated border-2 border-border rounded-xl pl-10 pr-3 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
                    placeholder="e.g. 12" required min="5" max="100" />
                </div>
              </div>
            </div>

            {/* School - Autocomplete Search */}
            <div className="flex flex-col gap-1.5 relative" ref={schoolDropdownRef}>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                <School size={10} /> Current School
              </label>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => { handleSchoolInputChange(e.target.value); setSchoolName(e.target.value); }}
                  onFocus={() => { if (schoolSearch.length >= 2) setShowSchoolDropdown(true); }}
                  className="w-full bg-surface-elevated border-2 border-border rounded-xl pl-10 pr-3 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
                  placeholder="Start typing school name..." required />
              </div>
              {schoolName && schoolSearch && schoolName === schoolSearch && (
                <p className="text-[8px] font-bold text-primary ml-1">✓ {schoolName}</p>
              )}
              {showSchoolDropdown && schoolResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-surface border-2 border-border rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                  {schoolResults.map((school, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSchool(school)}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-text-main hover:bg-p-purple transition-all border-b border-border/50 last:border-0"
                    >
                      {school}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grade Level */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                <GraduationCap size={10} /> Grade Level
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {PH_GRADES.map((g) => {
                  const isElementary = g.value <= 6;
                  const isSelected = gradeLevel === g.value;
                  const activeColor = isElementary ? '#2b8a3e' : '#1971c2';
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGradeLevel(g.value)}
                      className={`py-2 rounded-lg border-2 text-center transition-all font-black text-[9px] uppercase tracking-wider ${
                        isSelected
                          ? 'text-white shadow-md'
                : 'border-border bg-surface text-text-muted hover:border-primary/30'
                      }`}
                      style={isSelected ? { background: activeColor, borderColor: activeColor } : undefined}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Parent Email */}
            {age && parseInt(age) < 18 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#e03131] ml-1 flex items-center gap-1.5">
                  <Heart size={10} /> Parent/Guardian Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e03131] group-focus-within:text-[#e03131]" size={14} />
              <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full bg-surface border-2 border-[#ffc9c9] rounded-xl pl-10 pr-3 py-3 text-sm font-bold focus:outline-none focus:border-[#e03131] focus:bg-surface transition-all placeholder:text-[#ff8787]/40"
                    placeholder="parent@email.com" required />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Account Email</label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-focus-within:bg-primary/20 transition-colors">
              <Mail className="text-primary" size={12} />
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-elevated border-2 border-border rounded-xl pl-[44px] pr-3 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
              placeholder="you@email.com" required />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Secure Password</label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-focus-within:bg-primary/20 transition-colors">
              <Lock className="text-primary" size={12} />
            </div>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-elevated border-2 border-border rounded-xl pl-[44px] pr-10 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
              placeholder="••••••••" required minLength={8} />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading}
          className="group relative overflow-hidden bg-gradient-to-r from-primary to-pink-500 hover:from-accent-strong hover:to-pink-600 text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl mt-1 transition-all duration-300 shadow-xl shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2.5">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <Rocket size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span>{role === 'TUTOR' ? 'Proceed to Onboarding' : 'Create Account'}</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="text-center pt-1 pb-0">
        <p className="text-[9px] font-bold tracking-widest text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-accent-strong font-black hover:underline transition-all ml-1">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}