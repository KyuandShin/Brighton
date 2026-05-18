'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, GraduationCap, ChevronRight, Mail, Lock, Sparkles, UserCircle, School, Calendar,
  Upload, X, Star, Rocket, Heart, Search, Eye, EyeOff, AlertCircle, Check, Loader2, BookOpen
} from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PH_GRADES = [
  { value: 1, label: 'G1' }, { value: 2, label: 'G2' }, { value: 3, label: 'G3' },
  { value: 4, label: 'G4' }, { value: 5, label: 'G5' }, { value: 6, label: 'G6' },
  { value: 7, label: 'G7' }, { value: 8, label: 'G8' }, { value: 9, label: 'G9' },
  { value: 10, label: 'G10' },
];

const PH_SUBJECTS = ['Mathematics', 'Science', 'English', 'Filipino'];

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TUTOR'>('STUDENT');
  const [gradeLevel, setGradeLevel] = useState<number>(7);
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolResults, setSchoolResults] = useState<string[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [age, setAge] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [verified, setVerified] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const schoolLevel: 'ELEMENTARY' | 'HIGH_SCHOOL' = gradeLevel <= 6 ? 'ELEMENTARY' : 'HIGH_SCHOOL';

  const searchSchools = useCallback(async (query: string) => {
    if (query.length < 2) { setSchoolResults([]); return; }
    try {
      const res = await fetch(`/api/schools?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) setSchoolResults(data);
    } catch { /* silent */ }
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(e.target as Node)) setShowSchoolDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!userLoading && user) router.push('/dashboard');
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
    } finally { setUploadingImage(false); }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkRes.json();
      if (checkData.exists) {
        setError(checkData.role === 'TUTOR'
          ? 'A tutor account with this email already exists. Please log in instead.'
          : 'An account with this email already exists. Please log in instead.');
        setLoading(false);
        return;
      }
      if (role === 'TUTOR') {
        sessionStorage.setItem('tutor_draft', JSON.stringify({ email, password, name: fullName }));
        window.location.href = '/signup/tutor';
        return;
      }
      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 5) { setError('Please enter a valid age.'); setLoading(false); return; }
      if (parsedAge < 18 && !parentEmail.trim()) { setError('Parent/guardian email is required for students under 18.'); setLoading(false); return; }

      const res = await fetch('/api/signup/student', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, fullName, schoolName, age,
          parentEmail: parsedAge < 18 ? parentEmail : null,
          schoolLevel, gradeLevel, image: profileImage,
          subjects: selectedSubjects.length > 0 ? selectedSubjects : ['Mathematics', 'Science', 'Filipino', 'English'],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); return; }

      // Wait a moment for Neon Auth to propagate the newly created user
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const { error: otpSendError } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
        setOtpSent(!otpSendError);
        if (otpSendError) {
          // Silently queue a retry — the resend button will still work
          setTimeout(async () => {
            try { await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' }); } catch {}
          }, 2000);
        }
      } catch { setOtpSent(false); }
      setOtpStep(true);
    } catch { setError('An unexpected error occurred'); }
    finally { setLoading(false); }
  };

  const handleVerifyStudentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError('');
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp });
      if ((result as any)?.error) { setOtpError((result as any).error.message || 'Invalid code.'); return; }
      try { await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); } catch {}
      setVerified(true);
    } catch (err: any) { setOtpError(err?.message || 'Something went wrong.'); }
    finally { setOtpLoading(false); }
  };

  const handleResendOtp = async () => {
    setOtpError(''); setResendCount(prev => prev + 1);
    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
      if (sendError) { setOtpError('Failed to resend.'); return; }
      setOtpSent(true);
    } catch { setOtpError('Failed to resend.'); }
  };

  const handleSendLinkFallback = async () => {
    setOtpError('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || 'Failed to send.'); return; }
      window.location.href = '/login?verified=sent';
    } catch { setOtpError('Failed to send link.'); }
  };

  // ── OTP Screen ──
  if (otpStep && !verified) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-[0.3em]">
            <Mail size={12} className="mr-1" /> Verify Email
          </Badge>
          <h2 className="text-2xl font-black tracking-tight"><span className="gradient-text">Enter Your Code</span></h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
            We sent a 6-digit code to <span className="text-primary font-black">{email}</span>
          </p>
        </div>

        {otpError && (
          <Alert variant="destructive">
            <AlertCircle size={14} />
            <AlertDescription className="text-[9px] font-black uppercase tracking-widest">{otpError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerifyStudentOtp} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Verification Code</label>
            <Input
              type="text" inputMode="numeric" maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              autoFocus
              className="text-2xl font-black text-center tracking-[0.5em] h-14"
            />
          </div>
          <Button type="submit" disabled={otpLoading || otp.length !== 6} className="w-full text-[10px] uppercase tracking-[0.2em]">
            {otpLoading ? <><Loader2 size={14} className="animate-spin mr-1" /> Verifying...</> : <><Check size={14} className="mr-1" /> Verify & Complete Signup</>}
          </Button>
        </form>

        <p className="text-[8px] font-bold text-text-muted text-center">
          Didn't receive it?{' '}
          <button onClick={handleResendOtp} className="text-primary font-black hover:underline" disabled={otpLoading}>Resend code</button>
          {resendCount >= 2 && (
            <span className="block mt-1.5">
              Still not getting it?{' '}
              <button onClick={handleSendLinkFallback} className="text-accent-strong font-black hover:underline">Send me a verification link instead</button>
            </span>
          )}
        </p>
      </div>
    );
  }

  // ── Verified Screen ──
  if (verified) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <Badge className="bg-p-green/30 text-teal-700 border-p-green text-[8px] font-black uppercase tracking-[0.3em]">
            <Sparkles size={12} className="mr-1" /> Email Verified!
          </Badge>
          <h2 className="text-2xl font-black tracking-tight"><span className="gradient-text">You're All Set!</span></h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Your account is verified and ready</p>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-p-green rounded-2xl flex items-center justify-center mx-auto">
              <Check size={28} className="text-teal-700" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-black text-text-main tracking-tight">Email Verified Successfully!</p>
              <p className="text-[11px] font-bold text-text-muted leading-relaxed max-w-sm mx-auto">
                Your account for <span className="text-primary font-black">{email}</span> is now active.
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full text-[10px] uppercase tracking-widest font-black">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>

        <div className="text-center pt-1">
          <p className="text-[9px] font-bold tracking-widest text-text-muted">
            Already logged in? <Link href="/dashboard" className="text-primary hover:underline font-black ml-1">Go to Dashboard</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Main Signup Form ──
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-2 pb-1">
        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-[0.3em]">
          <Sparkles size={12} className="mr-1" /> New Student
        </Badge>
        <h2 className="text-2xl font-black tracking-tight"><span className="gradient-text">Create Account</span></h2>
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Join Brighton's Learning Community</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle size={14} />
          <AlertDescription className="text-[9px] font-black uppercase tracking-widest">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {/* Role Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
            <Rocket size={10} className="text-primary" /> I want to join as
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-gradient-to-r from-p-blue/40 to-p-sky/30 rounded-[16px] border-2 border-border">
            <Button type="button" variant={role === 'STUDENT' ? 'default' : 'ghost'} size="sm"
              onClick={() => setRole('STUDENT')}
              className={cn("relative text-[10px] uppercase tracking-widest font-black h-10", role === 'STUDENT' && 'scale-[1.02]')}>
              <User size={14} className="mr-1" /> Student
              {role === 'STUDENT' && <Heart size={8} className="absolute -top-1 -right-1 text-pink-400" />}
            </Button>
            <Button type="button" variant={role === 'TUTOR' ? 'default' : 'ghost'} size="sm"
              onClick={() => setRole('TUTOR')}
              className={cn("relative text-[10px] uppercase tracking-widest font-black h-10", role === 'TUTOR' && 'scale-[1.02]')}>
              <GraduationCap size={14} className="mr-1" /> Tutor
              {role === 'TUTOR' && <Sparkles size={8} className="absolute -top-1 -right-1 text-primary" />}
            </Button>
          </div>
        </div>

        {/* Tutor notice */}
        {role === 'TUTOR' && (
          <Alert className="border-primary/20 bg-primary/5">
            <Sparkles size={14} className="text-primary" />
            <AlertDescription className="text-[9px] font-black uppercase tracking-widest">
              Click <span className="text-primary">"Proceed to Onboarding"</span> to complete your tutor profile.
            </AlertDescription>
          </Alert>
        )}

        {/* Student Fields */}
        {role === 'STUDENT' && (
          <div className="flex flex-col gap-4">
            {/* Profile Picture */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                <UserCircle size={10} /> Profile Picture
              </label>
              <div onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer bg-gradient-to-br from-p-blue/20 to-p-sky/10 border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 transition-all">
                {profileImage ? (
                  <>
                    <div className="relative">
                      <img src={profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/40 ring-offset-2" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-surface flex items-center justify-center">
                        <Check size={8} className="text-white" />
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setProfileImage(null); }}
                      className="absolute top-1 right-1 p-1 bg-rose-400 rounded-full text-white hover:bg-rose-500 transition-all shadow-md">
                      <X size={10} />
                    </button>
                    <span className="text-[9px] font-bold text-text-muted">Click to change</span>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-blue-200/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {uploadingImage ? <Loader2 size={18} className="animate-spin text-primary" /> : <Upload size={18} className="text-primary/60" />}
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-wider text-text-muted group-hover:text-primary transition-colors">Upload Photo</p>
                      <p className="text-[7px] font-bold text-text-muted/50">PNG, JPG</p>
                    </div>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Name + Age */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                  <UserCircle size={10} /> Full Name
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" className="pl-10 h-12" required />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                  <Calendar size={10} /> Age
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 12" className="pl-10 h-12" required min="5" max="100" />
                </div>
              </div>
            </div>

            {/* School Search */}
            <div className="flex flex-col gap-1.5 relative" ref={schoolDropdownRef}>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                <School size={10} /> Current School
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <Input type="text" value={schoolSearch}
                  onChange={(e) => { handleSchoolInputChange(e.target.value); setSchoolName(e.target.value); }}
                  onFocus={() => { if (schoolSearch.length >= 2) setShowSchoolDropdown(true); }}
                  placeholder="Start typing school name..." className="pl-10 h-12" required />
              </div>
              {schoolName && schoolSearch === schoolName && <p className="text-[8px] font-bold text-primary ml-1">✓ {schoolName}</p>}
              {showSchoolDropdown && schoolResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-surface border-2 border-border rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                  {schoolResults.map((school, i) => (
                    <button key={i} type="button" onClick={() => selectSchool(school)}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-text-main hover:bg-p-blue/30 transition-all border-b border-border/50 last:border-0">
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
                  return (
                    <Button key={g.value} type="button" size="sm"
                      onClick={() => setGradeLevel(g.value)}
                      variant={isSelected ? 'default' : 'outline'}
                      style={isSelected ? { background: isElementary ? '#2b8a3e' : '#1971c2', borderColor: isElementary ? '#2b8a3e' : '#1971c2' } : undefined}
                      className="text-[9px] font-black uppercase tracking-wider h-10">
                      {g.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Subject Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                <BookOpen size={10} /> Subjects I Want to Study
              </label>
              <p className="text-[8px] font-bold text-text-muted ml-1 -mt-1">Pick subjects you need help with.</p>
              <div className="grid grid-cols-2 gap-2">
                {PH_SUBJECTS.map((subject) => {
                  const isSelected = selectedSubjects.includes(subject);
                  return (
                    <Button key={subject} type="button" variant={isSelected ? 'default' : 'outline'} size="sm"
                      onClick={() => setSelectedSubjects(prev => isSelected ? prev.filter(s => s !== subject) : [...prev, subject])}
                      className="text-[10px] font-black uppercase tracking-wider h-10">
                      {isSelected ? <Check size={12} className="mr-1" /> : <BookOpen size={12} className="mr-1" />}
                      {subject}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Parent Email */}
            {age && parseInt(age) < 18 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-600 ml-1 flex items-center gap-1.5">
                  <Heart size={10} /> Parent/Guardian Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" size={14} />
                  <Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@email.com" className="pl-10 h-12 border-rose-200 focus:border-rose-500" required />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Account Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-10 h-12" required />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Secure Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <Input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="pl-10 pr-10 h-12" required minLength={8} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={loading} className="w-full h-12 text-xs uppercase tracking-[0.2em] mt-1">
          {loading ? (
            <><Loader2 size={14} className="animate-spin mr-1" /> Creating Account...</>
          ) : (
            <><Rocket size={14} className="mr-1" /> {role === 'TUTOR' ? 'Proceed to Onboarding' : 'Create Account'} <ChevronRight size={14} className="ml-1" /></>
          )}
        </Button>
      </form>

      <div className="text-center pt-1">
        <p className="text-[9px] font-bold tracking-widest text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-black ml-1">Login</Link>
        </p>
      </div>
    </div>
  );
}