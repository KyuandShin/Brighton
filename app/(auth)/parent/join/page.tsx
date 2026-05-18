'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail, Lock, User, Heart, Sparkles, ChevronRight, Check,
  Loader2, AlertCircle, Eye, EyeOff, School, GraduationCap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LinkedStudent {
  id: string;
  name: string;
  schoolLevel: string;
  gradeLevel: number | null;
  age: number | null;
  schoolName: string | null;
}

function ParentJoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'check' | 'signup' | 'success'>('check');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [studentName, setStudentName] = useState(searchParams.get('student') || '');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [hasExistingParent, setHasExistingParent] = useState(false);

  // Pre-fill from URL params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const studentParam = searchParams.get('student');
    if (emailParam) setEmail(emailParam);
    if (studentParam) setStudentName(studentParam);
  }, [searchParams]);

  // If we have a prefilled email + student name, auto-check
  useEffect(() => {
    if (email && studentName && step === 'check') {
      handleCheckEmail();
    }
  }, [email, studentName]);

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/parent/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to check email');
        return;
      }
      setStudents(data.students);
      setHasExistingParent(data.hasExistingParent);
      setSelectedStudentIds(data.students.map((s: LinkedStudent) => s.id));
      if (data.students.length > 0) {
        setStep('signup');
      } else {
        setError('No students found with this email. Make sure your child used this email when signing up.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student to link');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/parent/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          studentIds: selectedStudentIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }
      setStep('success');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // ── Success Screen ──
  if (step === 'success') {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <Badge className="bg-p-green/30 text-teal-700 border-p-green text-[8px] font-black uppercase tracking-[0.3em]">
            <Sparkles size={12} className="mr-1" /> Account Created!
          </Badge>
          <h2 className="text-2xl font-black tracking-tight"><span className="gradient-text">You're All Set!</span></h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
            Your parent account is ready
          </p>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-p-green rounded-2xl flex items-center justify-center mx-auto">
              <Check size={28} className="text-teal-700" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-black text-text-main tracking-tight">Parent Account Created!</p>
              <p className="text-[11px] font-bold text-text-muted leading-relaxed max-w-sm mx-auto">
                You can now monitor your child's progress, view assessment scores, and track upcoming sessions.
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full text-[10px] uppercase tracking-widest font-black">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Email Check Screen (initial) ──
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-2 pb-1">
        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-[0.3em]">
          <Heart size={12} className="mr-1" /> Parent Portal
        </Badge>
        <h2 className="text-2xl font-black tracking-tight"><span className="gradient-text">Join as Parent</span></h2>
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
          Monitor your child's learning journey
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle size={14} />
          <AlertDescription className="text-[9px] font-black uppercase tracking-widest">{error}</AlertDescription>
        </Alert>
      )}

      {step === 'check' ? (
        /* Step 1: Enter email to find linked students */
        <form onSubmit={(e) => { e.preventDefault(); handleCheckEmail(); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">
              Your Email Address
            </label>
            <p className="text-[8px] font-bold text-text-muted ml-1 -mt-1">
              Enter the email your child used for their parent/guardian contact.
            </p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@email.com"
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-xs uppercase tracking-[0.2em] mt-1">
            {loading ? (
              <><Loader2 size={14} className="animate-spin mr-1" /> Checking...</>
            ) : (
              <><ChevronRight size={14} className="mr-1" /> Continue</>
            )}
          </Button>

          <div className="text-center pt-1">
            <p className="text-[9px] font-bold tracking-widest text-text-muted">
              Already have a parent account?{' '}
              <Link href="/login" className="text-primary hover:underline font-black ml-1">Login</Link>
            </p>
          </div>
        </form>
      ) : (
        /* Step 2: Create account and link students */
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {students.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
                <School size={10} /> Linked Students
              </label>
              <p className="text-[8px] font-bold text-text-muted ml-1 -mt-1">
                Select the students you'd like to monitor.
              </p>
              <div className="space-y-2">
                {students.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'border-text-muted'
                      }`}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-text-main">{student.name}</p>
                        <p className="text-[9px] font-bold text-text-muted">
                          {student.schoolLevel === 'ELEMENTARY' ? 'Elementary' : 'High School'}
                          {student.gradeLevel ? ` · G${student.gradeLevel}` : ''}
                          {student.schoolName ? ` · ${student.schoolName}` : ''}
                        </p>
                      </div>
                      <GraduationCap size={16} className="text-text-muted shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasExistingParent && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle size={14} className="text-amber-600" />
              <AlertDescription className="text-[8px] font-bold text-amber-800">
                A parent account already exists for this email. You can log in to link additional students.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-1.5">
              <User size={10} /> Your Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan dela Cruz"
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <Input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10 h-12"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-xs uppercase tracking-[0.2em] mt-1">
            {loading ? (
              <><Loader2 size={14} className="animate-spin mr-1" /> Creating Account...</>
            ) : (
              <><Heart size={14} className="mr-1" /> Create Parent Account <ChevronRight size={14} className="ml-1" /></>
            )}
          </Button>

          <div className="text-center pt-1">
            <p className="text-[9px] font-bold tracking-widest text-text-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-black ml-1">Login</Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ParentJoinPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-5">
        <div className="text-center space-y-2 pb-1">
          <h2 className="text-2xl font-black tracking-tight"><span className="gradient-text">Loading...</span></h2>
        </div>
      </div>
    }>
      <ParentJoinForm />
    </Suspense>
  );
}