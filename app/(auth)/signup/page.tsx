'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, GraduationCap, ChevronRight, Mail, Lock, Sparkles, UserCircle, School, Calendar, Upload, X, Star, Rocket, Heart, Search, Eye, EyeOff, AlertCircle, KeyRound, Check as CheckIcon, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { uploadToCloudinary } from '@/lib/cloudinary';

const PH_GRADES = [
  { value: 1,  label: 'Grade 1' },
  { value: 2,  label: 'Grade 2' },
  { value: 3,  label: 'Grade 3' },
  { value: 4,  label: 'Grade 4' },
  { value: 5,  label: 'Grade 5' },
  { value: 6,  label: 'Grade 6' },
  { value: 7,  label: 'Grade 7' },
  { value: 8,  label: 'Grade 8' },
  { value: 9,  label: 'Grade 9' },
  { value: 10, label: 'Grade 10' },
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
  const [verificationSent, setVerificationSent] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
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

      // Account created — send OTP and show verification input
      try {
        await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
      } catch {
        // non-fatal
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
      const { error: verifyError } = await authClient.signIn.emailOtp({ email, otp });
      if (verifyError) {
        setOtpError(verifyError.message || 'Invalid code. Please check and try again.');
        return;
      }
      // Mark as verified in our DB
      await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setVerificationSent(true);
    } catch {
      setOtpError('Something went wrong. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── OTP verification screen (student) ──────────────────────────────
  if (otpStep && !verificationSent) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center space-y-3 pb-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-p-purple rounded-full shadow-sm">
            <KeyRound size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Verify Email</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">
            <span className="gradient-text">Enter Your Code</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            We sent a 6-digit code to <span className="text-primary font-black">{email}</span>
          </p>
        </div>

        {otpError && (
          <div className="flex items-start gap-3 bg-p-yellow border-2 border-[#fcc419]/30 text-[#e67700] p-4 rounded-2xl">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{otpError}</p>
          </div>
        )}

        <form onSubmit={handleVerifyStudentOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              autoFocus
              className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-6 py-5 text-4xl font-black text-text-main text-center tracking-[0.5em] focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={otpLoading || otp.length !== 6}
            className="group relative overflow-hidden bg-gradient-to-r from-primary to-pink-500 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2.5"
          >
            {otpLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Verifying...</>
            ) : (
              <><CheckIcon size={16} /> Verify & Complete Signup</>
            )}
          </button>
        </form>

        <p className="text-[9px] font-bold text-text-muted text-center">
          Didn't receive it?{' '}
          <button
            onClick={async () => {
              setOtpError('');
              try { await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' }); }
              catch { setOtpError('Failed to resend. Please try again.'); }
            }}
            className="text-primary font-black hover:underline"
          >
            Resend code
          </button>
        </p>
      </div>
    );
  }

  // ── Verification sent screen ──────────────────────────────────────────
  if (verificationSent) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center space-y-3 pb-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-p-mint rounded-full shadow-sm">
            <Sparkles size={14} className="text-teal-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-700">Email Verified!</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">
            <span className="gradient-text">You're All Set!</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Your account is verified and ready
          </p>
        </div>

        <div className="bg-surface border-2 border-border rounded-[32px] p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-p-mint rounded-3xl flex items-center justify-center mx-auto">
            <CheckIcon size={36} className="text-teal-700" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-black text-text-main tracking-tight">Email Verified Successfully!</p>
            <p className="text-xs font-bold text-text-muted leading-relaxed max-w-sm mx-auto">
              Your account for <span className="text-primary font-black">{email}</span> is now active. You can log in right away.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/login" className="block w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-accent-strong transition-all">
              Go to Login
            </Link>
          </div>
        </div>

        <div className="text-center pt-2 pb-6">
          <p className="text-[10px] font-bold tracking-widest text-text-muted">
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
    <div className="flex flex-col gap-6">
      {/* Header with sakura decoration */}
      <div className="text-center space-y-3 pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-p-sakura rounded-full shadow-sm">
          <Sparkles size={14} className="text-pink-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-pink-600">New Student</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight">
          <span className="gradient-text">Create Account</span>
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Join Brighton's Learning Community
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-p-yellow border-2 border-[#fcc419]/30 text-[#e67700] p-4 rounded-2xl">
          <Star size={16} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {/* Role Picker - Premium Redesign */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
            <Rocket size={12} className="text-primary" /> I want to join as
          </label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-gradient-to-r from-p-purple/40 to-p-sakura/30 rounded-[20px] border-2 border-border">
            <button type="button" onClick={() => setRole('STUDENT')}
              className={`group relative flex items-center justify-center gap-2.5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                role === 'STUDENT' 
                  ? 'bg-surface text-primary shadow-lg shadow-primary/10 scale-[1.02]' 
                  : 'text-text-muted hover:text-text-main hover:bg-surface/40'
              }`}>
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${role === 'STUDENT' ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.04), rgba(236,72,153,0.04))' }} />
              <User size={16} className={role === 'STUDENT' ? 'text-primary' : ''} />
              <span className="relative z-10">Student</span>
              {role === 'STUDENT' && (
                <Heart size={10} className="absolute -top-1 -right-1 text-pink-400 animate-bounce-cute" />
              )}
            </button>
            <button type="button" onClick={() => setRole('TUTOR')}
              className={`group relative flex items-center justify-center gap-2.5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                role === 'TUTOR' 
                  ? 'bg-surface text-primary shadow-lg shadow-primary/10 scale-[1.02]' 
                  : 'text-text-muted hover:text-text-main hover:bg-surface/40'
              }`}>
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${role === 'TUTOR' ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.04), rgba(236,72,153,0.04))' }} />
              <GraduationCap size={16} className={role === 'TUTOR' ? 'text-primary' : ''} />
              <span className="relative z-10">Tutor</span>
              {role === 'TUTOR' && (
                <Sparkles size={10} className="absolute -top-1 -right-1 text-primary animate-sparkle" />
              )}
            </button>
          </div>
        </div>

        {/* Tutor notice card */}
        {role === 'TUTOR' && (
          <div className="group relative overflow-hidden p-5 bg-gradient-to-br from-primary/5 to-pink-100/40 border-2 border-primary/20 rounded-2xl transition-all hover:border-primary/40">
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Star size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-1">Tutor Verification Required</p>
                <p className="text-[10px] font-bold text-text-muted leading-relaxed">
                  Tutor accounts require admin verification. Click <span className="text-primary">"Proceed to Onboarding"</span> to complete your tutor profile with certifications and availability.
                </p>
              </div>
            </div>
          </div>
        )}

         {/* STUDENT FIELDS */}
         {role === 'STUDENT' && (
           <div className="flex flex-col gap-4">
             {/* Profile Picture Upload */}
             <div className="flex flex-col gap-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                 <UserCircle size={12} /> Profile Picture
               </label>
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="group relative cursor-pointer bg-gradient-to-br from-p-purple/20 to-p-sakura/10 border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:from-p-purple/30 hover:to-p-sakura/20 transition-all duration-300"
               >
                 {profileImage ? (
                   <>
                     <div className="relative">
                       <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/40 ring-offset-2" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-surface flex items-center justify-center">
                         <Check2Icon size={10} className="text-white" />
                       </div>
                     </div>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setProfileImage(null); }}
                       className="absolute top-2 right-2 p-1.5 bg-rose-400 rounded-full text-white hover:bg-rose-500 transition-all shadow-md hover:scale-110"
                     >
                       <X size={12} />
                     </button>
                     <span className="text-[10px] font-bold text-text-muted mt-1">Click to change</span>
                   </>
                 ) : (
                   <>
                     <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-pink-200/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                       <Upload size={22} className="text-primary/60 group-hover:text-primary transition-colors" />
                     </div>
                     <div className="text-center">
                       <p className="text-[10px] font-black uppercase tracking-wider text-text-muted group-hover:text-primary transition-colors">Upload Profile Picture</p>
                       <p className="text-[8px] font-bold text-text-muted/50 mt-0.5">PNG, JPG · Max 5MB</p>
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
             <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                  <UserCircle size={12} /> Full Name
                </label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface-elevated border-2 border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
                    placeholder="Juan Dela Cruz" required />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                  <Calendar size={12} /> Age
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-surface-elevated border-2 border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
                    placeholder="e.g. 12" required min="5" max="100" />
                </div>
              </div>
            </div>

            {/* School - Autocomplete Search */}
            <div className="flex flex-col gap-2 relative" ref={schoolDropdownRef}>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                <School size={12} /> Current School
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => { handleSchoolInputChange(e.target.value); setSchoolName(e.target.value); }}
                  onFocus={() => { if (schoolSearch.length >= 2) setShowSchoolDropdown(true); }}
                  className="w-full bg-surface-elevated border-2 border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
                  placeholder="Start typing your school name..." required />
              </div>
              {schoolName && schoolSearch && schoolName === schoolSearch && (
                <p className="text-[9px] font-bold text-primary ml-1">✓ {schoolName}</p>
              )}
              {showSchoolDropdown && schoolResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-surface border-2 border-border rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {schoolResults.map((school, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSchool(school)}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-text-main hover:bg-p-purple transition-all border-b border-border/50 last:border-0"
                    >
                      {school}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grade Level - Philippine K-12 style */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                <GraduationCap size={12} /> Grade Level
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PH_GRADES.map((g) => {
                  const isElementary = g.value <= 6;
                  const isSelected = gradeLevel === g.value;
                  const activeColor = isElementary ? '#2b8a3e' : '#1971c2';
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGradeLevel(g.value)}
                      className={`py-3 rounded-xl border-2 text-center transition-all font-black text-[10px] uppercase tracking-wider ${
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
              <p className="text-[9px] font-bold text-text-muted/50 ml-1">
                {schoolLevel === 'ELEMENTARY' ? '📚 Elementary (Grades 1–6)' : '🎓 High School (Grades 7–10)'}
              </p>
            </div>

            {/* Parent Email */}
            {age && parseInt(age) < 18 && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e03131] ml-1 flex items-center gap-2">
                  <Heart size={12} /> Parent/Guardian Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#e03131] group-focus-within:text-[#e03131]" size={16} />
              <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full bg-surface border-2 border-[#ffc9c9] rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-[#e03131] focus:bg-surface transition-all placeholder:text-[#ff8787]/40"
                    placeholder="parent@email.com" required />
                </div>
                <p className="text-[9px] font-bold text-[#e03131]/60 ml-1">We'll notify your parent when you book sessions</p>
              </div>
            )}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Account Email</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-focus-within:bg-primary/20 transition-colors">
              <Mail className="text-primary" size={14} />
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-elevated border-2 border-border rounded-2xl pl-16 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
              placeholder="you@email.com" required />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Secure Password</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-focus-within:bg-primary/20 transition-colors">
              <Lock className="text-primary" size={14} />
            </div>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-elevated border-2 border-border rounded-2xl pl-16 pr-12 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-text-muted/30"
              placeholder="••••••••" required minLength={8} />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit Button - Premium */}
        <button type="submit" disabled={loading}
          className="group relative overflow-hidden bg-gradient-to-r from-primary to-pink-500 hover:from-accent-strong hover:to-pink-600 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl mt-2 transition-all duration-300 shadow-xl shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2.5">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <Rocket size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span>{role === 'TUTOR' ? 'Proceed to Onboarding' : 'Create Account'}</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="text-center pt-2 pb-6">
        <p className="text-[10px] font-bold tracking-widest text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-accent-strong font-black hover:underline transition-all ml-1">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Helper icon components ──────────────────────────────────────────────
function Check2Icon({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
