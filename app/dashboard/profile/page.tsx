'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrentUser, getInitials } from '@/lib/hooks/useCurrentUser';
import {
  User, Mail, School, Calendar, BookOpen,
  Edit3, Check, X, Sparkles, GraduationCap,
  DollarSign, FileText, ShieldCheck, Camera, Video, Clock, Upload, Loader2,
  TrendingUp, Star, Brain, Target, AlertCircle, Award, Users, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import CameraCapture from '../_components/CameraCapture';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PH_SUBJECTS = ['Mathematics', 'Science', 'English', 'Filipino'];

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AttemptData {
  id: string;
  score: number;
  total: number;
  mastery: string | null;
  grade: string | null;
  grade_label?: string;
  strengths: any;
  weaknesses: any;
  studyPlan: string | null;
  timestamp: string;
  subject_name?: string;
}

export default function ProfilePage() {
  const { user, loading, refetch } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const TIME_OPTIONS: string[] = [];
  for (let h = 6; h <= 22; h++) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 22) TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:30`);
  }

  const [form, setForm] = useState({
    name: '', age: '', schoolName: '', schoolLevel: '',
    headline: '', bio: '', pricingPerHour: '', introVideoUrl: '',
    university: '', degree: '', photoUrl: '',
  });

  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? '',
      age: user.studentProfile?.age?.toString() ?? '',
      schoolName: user.studentProfile?.schoolName ?? '',
      schoolLevel: user.studentProfile?.schoolLevel ?? '',
      headline: user.tutorProfile?.headline ?? '',
      bio: user.tutorProfile?.bio ?? '',
      pricingPerHour: user.tutorProfile?.pricingPerHour?.toString() ?? '',
      introVideoUrl: user.tutorProfile?.introVideoUrl ?? '',
      university: '',
      degree: '',
      photoUrl: '',
    });
    if (user.tutorProfile?.education && user.tutorProfile.education.length > 0) {
      const edu = user.tutorProfile.education[0];
      setForm(prev => ({ ...prev, university: edu.university || '', degree: edu.degree || '' }));
    }
    if (user.tutorProfile?.availability) {
      setAvailability(user.tutorProfile.availability.map((a: any) => ({
        dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime,
      })));
    }
    if (user.tutorProfile?.subjects) {
      setSubjects(user.tutorProfile.subjects.map((ts: any) => ts.subject.name));
    }
  }, [user]);

  // Fetch test history for student
  useEffect(() => {
    if (!user?.studentProfile?.id) return;
    fetch('/api/test-history')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) setAttempts(data.filter((a: any) => a.type === 'ai_assessment'));
      })
      .catch(() => {});
  }, [user?.studentProfile?.id]);

  // Fetch booking stats
  useEffect(() => {
    if (!user) return;
    fetch('/api/bookings')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setSessionCount(data.filter((b: any) => b.status === 'COMPLETED').length);
          setPendingCount(data.filter((b: any) => b.status === 'PENDING').length);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadToCloudinary(file, 'image');
      setForm(prev => ({ ...prev, photoUrl: url }));
    } catch { setSaveMsg('Upload failed');
    } finally { setUploadingImage(false); }
  };

  const startRecording = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (liveVideoRef.current) liveVideoRef.current.srcObject = s;
      const mr = new MediaRecorder(s);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch { alert('Camera access denied'); }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    stream?.getTracks().forEach(t => t.stop());
    setRecording(false);
    setStream(null);
  };

  const uploadVideo = async () => {
    if (!videoBlob) return;
    setUploadingVideo(true);
    try {
      const url = await uploadToCloudinary(videoBlob, 'video');
      setForm(prev => ({ ...prev, introVideoUrl: url }));
      setPreviewUrl(null);
      setVideoBlob(null);
      setSaveMsg('Video saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch { setSaveMsg('Upload failed');
    } finally { setUploadingVideo(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const payload: any = { ...form };
      if (user?.role === 'STUDENT') {
        delete payload.headline; delete payload.bio;
        delete payload.pricingPerHour; delete payload.introVideoUrl;
        delete payload.university; delete payload.degree;
      }
      if (user?.role === 'TUTOR') {
        payload.availability = availability;
        payload.subjects = subjects;
      }
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg(data.error ?? 'Failed to save'); return; }
      setSaveMsg('Saved!');
      setEditing(false);
      setTimeout(() => refetch(), 100);
    } catch { setSaveMsg('Unexpected error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const toggleAvailabilityDay = (idx: number) => {
    setAvailability(prev => {
      const existing = prev.find(s => s.dayOfWeek === idx);
      if (existing) return prev.filter(s => s.dayOfWeek !== idx);
      return [...prev, { dayOfWeek: idx, startTime: '09:00', endTime: '17:00' }];
    });
  };

  const updateAvailabilityTime = (dayIdx: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => prev.map(s => s.dayOfWeek === dayIdx ? { ...s, [field]: value } : s));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-[32px]" />
        <Skeleton className="h-64 w-full rounded-[32px]" />
      </div>
    );
  }
  if (!user) return null;

  const isStudent = user.role === 'STUDENT';
  const isTutor = user.role === 'TUTOR';
  const initials = getInitials(user.name);
  const latestAttempt = attempts[0];
  const prevAttempt = attempts[1];
  const improved = latestAttempt && prevAttempt ? latestAttempt.score > prevAttempt.score : null;

  // Profile completion score for tutor
  const tutorFields = [form.headline, form.bio, form.pricingPerHour, form.introVideoUrl, form.university, form.photoUrl || user.image];
  const tutorFilled = tutorFields.filter(Boolean).length;
  const tutorCompletion = Math.round((tutorFilled / tutorFields.length) * 100);
  const hasSubjects = subjects.length > 0;
  const hasAvailability = availability.length > 0;
  const adjustedCompletion = Math.min(100, tutorCompletion + (hasSubjects ? 10 : 0) + (hasAvailability ? 10 : 0));

  // Derive strengths/weaknesses from latest attempt
  const strengths: string[] = latestAttempt?.strengths
    ? (typeof latestAttempt.strengths === 'string' ? JSON.parse(latestAttempt.strengths) : latestAttempt.strengths)
    : [];
  const weaknesses: string[] = latestAttempt?.weaknesses
    ? (typeof latestAttempt.weaknesses === 'string' ? JSON.parse(latestAttempt.weaknesses) : latestAttempt.weaknesses)
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showCamera && (
        <CameraCapture
          onCapture={async (imageData: string) => {
            setUploadingImage(true);
            try {
              const base64Data = imageData.split(',')[1];
              const byteString = atob(base64Data);
              const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
              const blob = new Blob([ab], { type: mimeString });
              const url = await uploadToCloudinary(blob, 'image');
              setForm(prev => ({ ...prev, photoUrl: url }));
            } catch { setSaveMsg('Capture failed');
            } finally { setUploadingImage(false); }
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-text-main">
            My <span className="text-primary">Profile</span>
          </h2>
          <p className="text-text-muted font-bold text-xs uppercase tracking-widest mt-1">
            {isStudent ? 'View your academic journey' : 'Manage your tutor profile'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isTutor && !editing && (
            <Link href={`/dashboard/tutors/${user.tutorProfile?.id}`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all gap-1.5">
              <Eye size={14} /> View Public
            </Link>
          )}
        </div>
      </div>

      {saveMsg && (
        <Alert className={saveMsg === 'Saved!' || saveMsg.includes('saved') ? 'bg-p-green/20 border-p-green text-teal-800' : 'bg-red-50 border-red-200 text-red-700'}>
          <AlertDescription className="text-[10px] font-black uppercase tracking-widest">{saveMsg}</AlertDescription>
        </Alert>
      )}

      {/* Avatar + Identity Card */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="shrink-0 relative group">
              <div className="w-24 h-24 rounded-[28px] overflow-hidden shadow-xl shadow-primary/20">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : user.image ? (
                  <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-black text-3xl">
                    {initials}
                  </div>
                )}
              </div>
              {editing && (
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <button onClick={() => document.getElementById('profile-photo-input')?.click()}
                    className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-accent-strong transition-colors">
                    {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  </button>
                  <button onClick={() => setShowCamera(true)}
                    className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-accent-strong transition-colors">
                    <Camera size={16} />
                  </button>
                </div>
              )}
              <input id="profile-photo-input" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h3 className="text-xl font-black text-text-main">{user.name ?? user.email}</h3>
                <p className="text-text-muted font-bold text-xs mt-0.5">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest">
                  {isStudent ? <User size={11} className="mr-1" /> : <GraduationCap size={11} className="mr-1" />}
                  {user.role}
                </Badge>
                {isTutor && user.tutorProfile?.verificationStatus === 'APPROVED' && (
                  <Badge className="bg-p-green/30 text-teal-700 border-p-green text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={11} className="mr-1" /> Verified
                  </Badge>
                )}
                {isTutor && (user as any).tutorProfile?.averageRating && (
                  <Badge variant="outline" className="text-[10px] font-black">
                    <Star size={11} className="mr-1 text-amber-500" />
                    {(user as any).tutorProfile.averageRating.toFixed(1)}
                  </Badge>
                )}
              </div>
            </div>

            <Button
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
              className="shrink-0 text-[10px] uppercase tracking-widest font-black"
            >
              {saving ? <><Loader2 size={14} className="animate-spin mr-1" /> Saving...</>
                : editing ? <><Check size={14} className="mr-1" /> Save</>
                : <><Edit3 size={14} className="mr-1" /> Edit</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tutor: Profile Completion */}
      {isTutor && !editing && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Award size={14} className="text-primary" /> Profile Completion
              </p>
              <span className="text-sm font-black text-primary">{adjustedCompletion}%</span>
            </div>
            <Progress value={adjustedCompletion} className="h-2" />
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              {[
                { label: 'Details', filled: tutorFilled, total: tutorFields.length },
                { label: 'Subjects', filled: hasSubjects ? 1 : 0, total: 1 },
                { label: 'Availability', filled: hasAvailability ? 1 : 0, total: 1 },
              ].map(s => (
                <div key={s.label} className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{s.label}</p>
                  <p className={`text-xs font-black ${s.filled >= s.total ? 'text-teal-600' : 'text-text-muted'}`}>
                    {s.filled}/{s.total}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      {!editing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isTutor && (
            <>
              <Card className="border-border/60">
                <CardContent className="p-4 text-center space-y-1">
                  <TrendingUp size={18} className="mx-auto text-primary" />
                  <p className="text-lg font-black text-text-main">{sessionCount}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Sessions</p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 text-center space-y-1">
                  <Star size={18} className="mx-auto text-amber-500" />
                  <p className="text-lg font-black text-text-main">{(user as any).tutorProfile?.reviewCount ?? 0}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Reviews</p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 text-center space-y-1">
                  <DollarSign size={18} className="mx-auto text-emerald-500" />
                  <p className="text-lg font-black text-text-main">${form.pricingPerHour || '—'}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Per Hour</p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 text-center space-y-1">
                  <Users size={18} className="mx-auto text-purple-500" />
                  <p className="text-lg font-black text-text-main">{pendingCount}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Pending</p>
                </CardContent>
              </Card>
            </>
          )}
          {isStudent && (
            <>
              <Card className="border-border/60">
                <CardContent className="p-4 text-center space-y-1">
                  <Brain size={18} className="mx-auto text-primary" />
                  <p className="text-lg font-black text-text-main">{attempts.length}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Assessments</p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 text-center space-y-1">
                  <TrendingUp size={18} className="mx-auto text-emerald-500" />
                  <p className="text-lg font-black text-text-main">{sessionCount}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Sessions</p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 text-center space-y-1">
                  <Target size={18} className="mx-auto text-amber-500" />
                  <p className="text-lg font-black text-text-main">
                    {latestAttempt ? Math.round((latestAttempt.score / latestAttempt.total) * 100) + '%' : '—'}
                  </p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Latest Score</p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 text-center space-y-1">
                  <Calendar size={18} className="mx-auto text-purple-500" />
                  <p className="text-lg font-black text-text-main">{(user as any).studentProfile?.gradeLevel ?? '—'}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Grade Level</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Student: Assessment & Progress Section */}
      {isStudent && !editing && latestAttempt && (
        <>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Brain size={16} className="text-primary" /> Latest Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-black text-text-main">
                    {latestAttempt.score}/{latestAttempt.total}
                  </p>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {latestAttempt.grade_label || latestAttempt.grade || 'Placement Test'}
                    {improved !== null && (
                      <span className={`ml-2 ${improved ? 'text-emerald-600' : 'text-red-500'}`}>
                        {improved ? '↑ Improved' : '↓ Declined'}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${latestAttempt.score / latestAttempt.total >= 0.8 ? 'text-teal-600' : latestAttempt.score / latestAttempt.total >= 0.6 ? 'text-amber-600' : 'text-red-500'}`}>
                    {Math.round((latestAttempt.score / latestAttempt.total) * 100)}%
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                    {new Date(latestAttempt.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {(strengths.length > 0 || weaknesses.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {strengths.length > 0 && (
                    <div className="bg-p-green/20 rounded-2xl p-4 border border-p-green/30">
                      <p className="text-[9px] font-black uppercase tracking-widest text-teal-700 mb-2 flex items-center gap-1.5">
                        <Award size={12} /> Strengths
                      </p>
                      <ul className="space-y-1">
                        {strengths.map((s: string, i: number) => (
                          <li key={i} className="text-[11px] font-bold text-teal-800 flex items-start gap-2">
                            <Check size={10} className="mt-0.5 shrink-0 text-teal-600" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {weaknesses.length > 0 && (
                    <div className="bg-p-rose/20 rounded-2xl p-4 border border-p-rose/30">
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-700 mb-2 flex items-center gap-1.5">
                        <Target size={12} /> Needs Improvement
                      </p>
                      <ul className="space-y-1">
                        {weaknesses.map((w: string, i: number) => (
                          <li key={i} className="text-[11px] font-bold text-rose-800 flex items-start gap-2">
                            <AlertCircle size={10} className="mt-0.5 shrink-0 text-rose-600" /> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {latestAttempt.studyPlan && (
                <div className="bg-p-sky/20 rounded-2xl p-4 border border-p-sky/30">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-700 mb-2 flex items-center gap-1.5">
                    <BookOpen size={12} /> Study Plan
                  </p>
                  <p className="text-[11px] font-bold text-sky-800 leading-relaxed">
                    {typeof latestAttempt.studyPlan === 'string' ? latestAttempt.studyPlan : JSON.stringify(latestAttempt.studyPlan)}
                  </p>
                </div>
              )}

              <Link href="/dashboard/test">
                <Button className="w-full text-[10px] uppercase tracking-widest font-black">
                  <Brain size={14} className="mr-1" /> Take New Assessment
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Subject Mastery */}
          {PH_SUBJECTS.map(subject => {
            const subjectWeaknesses = weaknesses.filter((w: string) => w.toLowerCase().includes(subject.toLowerCase()));
            const subjectStrengths = strengths.filter((s: string) => s.toLowerCase().includes(subject.toLowerCase()));
            const mastery = subjectStrengths.length > 0 ? Math.min(100, (subjectStrengths.length / (subjectStrengths.length + subjectWeaknesses.length)) * 100) : 0;
            return (
              <Card key={subject} className="border-border/60">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-p-blue flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-text-main">{subject}</p>
                    <Progress value={mastery || 0} className="h-1.5 mt-2" />
                  </div>
                  <p className="text-sm font-black text-text-main">{Math.round(mastery)}%</p>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}

      {/* Tutor: Video Section */}
      {isTutor && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Video size={16} className="text-primary" /> Introduction Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(form.introVideoUrl || previewUrl) ? (
              <div className="rounded-2xl overflow-hidden bg-black/5 border border-border">
                <video
                  src={previewUrl || form.introVideoUrl}
                  controls
                  className="w-full aspect-video"
                />
              </div>
            ) : recording ? (
              <div className="rounded-2xl overflow-hidden bg-black/5 border border-border aspect-video flex items-center justify-center">
                <video ref={liveVideoRef} autoPlay muted className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-elevated border-2 border-dashed border-border p-10 text-center">
                <Video size={40} className="mx-auto text-text-muted mb-3 opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  {editing ? 'Record or paste a video URL' : 'No intro video yet'}
                </p>
              </div>
            )}

            {editing && (
              <div className="flex flex-wrap gap-2">
                {!recording && !previewUrl && (
                  <Button variant="outline" size="sm" onClick={startRecording}
                    className="text-[10px] uppercase tracking-widest font-black">
                    <Video size={14} className="mr-1" /> Record Video
                  </Button>
                )}
                {recording && (
                  <Button variant="destructive" size="sm" onClick={stopRecording}
                    className="text-[10px] uppercase tracking-widest font-black">
                    <Loader2 size={14} className="animate-spin mr-1" /> Stop Recording
                  </Button>
                )}
                {previewUrl && !uploadingVideo && (
                  <Button size="sm" onClick={uploadVideo}
                    className="text-[10px] uppercase tracking-widest font-black">
                    <Upload size={14} className="mr-1" /> Upload Video
                  </Button>
                )}
                {uploadingVideo && (
                  <Button size="sm" disabled className="text-[10px] uppercase tracking-widest font-black">
                    <Loader2 size={14} className="animate-spin mr-1" /> Uploading...
                  </Button>
                )}
                {!recording && (
                  <div className="flex-1">
                    <input
                      type="url"
                      value={form.introVideoUrl}
                      onChange={(e) => setForm({ ...form, introVideoUrl: e.target.value })}
                      placeholder="Or paste a video URL..."
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Info Card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <User size={16} className="text-primary" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name" value={form.name} icon={User} editing={editing} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Email" value={user.email} icon={Mail} editing={false} />

            {isStudent && (
              <>
                <Field label="Age" value={form.age} icon={Calendar} editing={editing} type="number" onChange={(v) => setForm({ ...form, age: v })} />
                <Field label="School Name" value={form.schoolName} icon={School} editing={editing} onChange={(v) => setForm({ ...form, schoolName: v })} />
                <SelectField label="Academic Level" value={form.schoolLevel} icon={BookOpen} editing={editing}
                  options={[{ value: 'ELEMENTARY', label: 'Elementary School' }, { value: 'HIGH_SCHOOL', label: 'High School' }]}
                  onChange={(v) => setForm({ ...form, schoolLevel: v })} />
              </>
            )}

            {isTutor && (
              <>
                <Field label="Headline" value={form.headline} icon={GraduationCap} editing={editing} onChange={(v) => setForm({ ...form, headline: v })} />
                <Field label="Hourly Rate (USD)" value={form.pricingPerHour} icon={DollarSign} editing={editing} type="number" onChange={(v) => setForm({ ...form, pricingPerHour: v })} />
                <Field label="University" value={form.university} icon={GraduationCap} editing={editing} onChange={(v) => setForm({ ...form, university: v })} />
                <Field label="Degree" value={form.degree} icon={FileText} editing={editing} onChange={(v) => setForm({ ...form, degree: v })} />
                <div className="sm:col-span-2">
                  <Field label="Bio" value={form.bio} icon={FileText} editing={editing} onChange={(v) => setForm({ ...form, bio: v })} textarea />
                </div>
              </>
            )}
          </div>

          {/* Tutor: Subjects + Availability */}
          {isTutor && (
            <>
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <BookOpen size={12} className="text-primary" /> Subjects I Teach
                </h4>
                {editing ? (
                  <div className="flex flex-wrap gap-2">
                    {PH_SUBJECTS.map((sub) => {
                      const isSelected = subjects.includes(sub);
                      return (
                        <button key={sub} type="button" onClick={() => setSubjects(prev => isSelected ? prev.filter(s => s !== sub) : [...prev, sub])}
                          className={cn("px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-2 transition-all",
                            isSelected ? 'bg-primary text-white border-primary' : 'bg-surface-elevated border-border text-text-muted hover:border-primary hover:text-primary')}>
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subjects.length > 0 ? subjects.map(s => (
                      <Badge key={s} variant="secondary" className="text-[9px] font-black uppercase tracking-widest">{s}</Badge>
                    )) : <p className="text-[10px] font-bold text-text-muted">No subjects selected</p>}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <Clock size={12} className="text-primary" /> Available Hours
                </h4>
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-7 gap-1.5">
                      {DAYS.map((day, idx) => {
                        const isSelected = availability.some(s => s.dayOfWeek === idx);
                        return (
                          <button key={day} type="button" onClick={() => toggleAvailabilityDay(idx)}
                            className={cn("py-2 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest border-2",
                              isSelected ? 'bg-primary text-white border-primary' : 'bg-surface-elevated border-border text-text-muted hover:border-primary')}>
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    {availability.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availability.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(slot => (
                          <div key={slot.dayOfWeek} className="flex items-center gap-2 p-2.5 bg-surface-elevated rounded-xl border border-border">
                            <span className="font-black text-[10px] text-primary uppercase w-8">{DAYS[slot.dayOfWeek]}</span>
                            <select value={slot.startTime} onChange={(e) => updateAvailabilityTime(slot.dayOfWeek, 'startTime', e.target.value)}
                              className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-[9px] font-bold focus:outline-none focus:border-primary">
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-[8px] font-black text-text-muted">to</span>
                            <select value={slot.endTime} onChange={(e) => updateAvailabilityTime(slot.dayOfWeek, 'endTime', e.target.value)}
                              className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-[9px] font-bold focus:outline-none focus:border-primary">
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availability.length > 0 ? availability.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(slot => (
                      <Badge key={slot.dayOfWeek} variant="outline" className="text-[9px] font-black uppercase tracking-widest gap-1">
                        <Clock size={10} /> {DAYS[slot.dayOfWeek]} {slot.startTime}-{slot.endTime}
                      </Badge>
                    )) : <p className="text-[10px] font-bold text-text-muted">No availability set</p>}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Edit/Save buttons */}
          {editing && (
            <div className="flex gap-3 pt-6 mt-6 border-t border-border">
              <Button onClick={handleSave} disabled={saving} className="text-[10px] uppercase tracking-widest font-black">
                <Check size={14} className="mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}
                className="text-[10px] uppercase tracking-widest font-black text-text-muted">
                <X size={14} className="mr-1" /> Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-elevated rounded-2xl p-4 space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Member Since</p>
              <p className="text-sm font-black text-text-main">
                {new Date(user.createdAt ?? Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-surface-elevated rounded-2xl p-4 space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Status</p>
              <p className="text-sm font-black text-emerald-600">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, icon: Icon, editing, onChange, type = 'text', textarea = false }: {
  label: string; value: string; icon: any; editing: boolean;
  onChange?: (v: string) => void; type?: string; textarea?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted ml-1 flex items-center gap-1.5">
        <Icon size={11} /> {label}
      </label>
      {editing && onChange ? (
        textarea ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
            className="bg-surface-elevated border-2 border-primary/30 rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all resize-none" />
        ) : (
          <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
            className="bg-surface-elevated border-2 border-primary/30 rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all" />
        )
      ) : (
        <div className="bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-main">
          {value || <span className="text-text-muted/50 font-normal">—</span>}
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, icon: Icon, editing, options, onChange }: {
  label: string; value: string; icon: any; editing: boolean;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted ml-1 flex items-center gap-1.5">
        <Icon size={11} /> {label}
      </label>
      {editing ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="bg-surface-elevated border-2 border-primary/30 rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <div className="bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-main">
          {options.find(o => o.value === value)?.label || '—'}
        </div>
      )}
    </div>
  );
}