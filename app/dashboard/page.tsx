'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, Video, User,
  ChevronRight, Sparkles, BookOpen, ExternalLink, Users,
  TrendingUp, Sun, Star, GraduationCap, Brain, Rocket,
  Hourglass, Award, AlertCircle, CheckCircle, ShieldCheck,
  Bell, Wallet, School, Mail, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  time: string;
  date: string;
  rawDate: string;
  meetLink: string;
  topic: string;
  status: string;
  color: string;
  iconColor: string;
  iconBg: string;
  bannerFrom: string;
  bannerTo: string;
  bannerDarkFrom: string;
  bannerDarkTo: string;
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

interface PendingTutor {
  id: string;
  user: { name: string | null; email: string; createdAt: string };
  headline: string | null;
}

const COLORS = [
  { color: 'bg-p-purple', iconColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/50', bannerFrom: '#ede9fe', bannerTo: '#c4b5fd', bannerDarkFrom: '#2a1a45', bannerDarkTo: '#1e1035' },
  { color: 'bg-p-pink',   iconColor: 'text-pink-600 dark:text-pink-400',   iconBg: 'bg-pink-100 dark:bg-pink-900/50',   bannerFrom: '#fce7f3', bannerTo: '#f9a8d4', bannerDarkFrom: '#3d1f3a', bannerDarkTo: '#2d152a' },
  { color: 'bg-p-mint',   iconColor: 'text-teal-600 dark:text-teal-400',   iconBg: 'bg-teal-100 dark:bg-teal-900/50',   bannerFrom: '#d1fae5', bannerTo: '#6ee7b7', bannerDarkFrom: '#1a3a2e', bannerDarkTo: '#0f2a1e' },
  { color: 'bg-p-yellow', iconColor: 'text-amber-600 dark:text-amber-400',  iconBg: 'bg-amber-100 dark:bg-amber-900/50',  bannerFrom: '#fef9c3', bannerTo: '#fcd34d', bannerDarkFrom: '#3d3520', bannerDarkTo: '#2d2515' },
  { color: 'bg-p-peach',  iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/50', bannerFrom: '#ffedd5', bannerTo: '#fdba74', bannerDarkFrom: '#3d2a1a', bannerDarkTo: '#2d1a0f' },
];

// ── Colour palette for stat icons ────────────────────────────────────
const statGradients = [
  'bg-gradient-to-br from-sky-400 to-blue-500',
  'bg-gradient-to-br from-emerald-400 to-teal-500',
  'bg-gradient-to-br from-violet-400 to-purple-500',
  'bg-gradient-to-br from-rose-400 to-pink-500',
];

export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const pathname = usePathname();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [pendingTutors, setPendingTutors] = useState<PendingTutor[]>([]);
  const [sysStats, setSysStats] = useState<any>(null);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Fetch bookings
  useEffect(() => {
    if (userLoading) return;
    if (!user) { setLoading(false); return; }

    let cancelled = false;
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (cancelled) return;
        if (!res.ok) { setSchedule([]); return; }
        const data = await res.json();
        if (cancelled) return;
        if (!Array.isArray(data)) { setSchedule([]); return; }

        const formattedSchedule = data.map((booking: any, index: number) => {
          const sessionDate = new Date(booking.date);
          const isValidDate = !isNaN(sessionDate.getTime());
          const formattedDate = isValidDate
            ? sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : 'Scheduled';
          const formattedTime = isValidDate
            ? sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'TBD';
          const tutorName = booking.tutor?.user?.name || 'Tutor';
          const tutorHeadline = booking.tutor?.headline || 'Tutoring Session';

          return {
            id: booking.id,
            subject: tutorHeadline,
            teacher: tutorName,
            time: formattedTime,
            date: formattedDate,
            rawDate: booking.date,
            meetLink: booking.meetLink || '',
            topic: `Session with ${tutorName}`,
            status: booking.status || 'CONFIRMED',
            ...COLORS[index % COLORS.length],
          };
        });
        if (cancelled) return;
        setSchedule(formattedSchedule);
      } catch (error) {
        if (!cancelled) console.error('Failed to load schedule:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBookings();
    return () => { cancelled = true; };
  }, [user, userLoading, pathname]);

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

  // Fetch pending tutors for admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    fetch('/api/admin/tutors')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) setPendingTutors(data.filter((t: any) => t.verificationStatus === 'PENDING'));
      })
      .catch(() => {});
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(data => setSysStats(data))
      .catch(() => {});
  }, [user?.role]);

  const isToday = (isoString: string) => {
    const today = new Date();
    const itemDate = new Date(isoString);
    return itemDate.toDateString() === today.toDateString();
  };

  const now = new Date();
  const activeSchedule = schedule.filter((item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED');
  const confirmedSchedule = schedule.filter((item) => item.status === 'CONFIRMED');
  const pendingSchedule = schedule.filter((item) => item.status === 'PENDING');
  const todaysClasses = confirmedSchedule.filter((item) => isToday(item.rawDate));
  const upcomingClasses = confirmedSchedule.filter((item) => new Date(item.rawDate) >= now);

  const isStudent = user?.role === 'STUDENT';
  const isTutor = user?.role === 'TUTOR';
  const isAdmin = user?.role === 'ADMIN';

  const latestAttempt = attempts[0];
  const prevAttempt = attempts[1];
  const improved = latestAttempt && prevAttempt ? latestAttempt.score > prevAttempt.score : null;

  const strengths: string[] = latestAttempt?.strengths
    ? (typeof latestAttempt.strengths === 'string' ? JSON.parse(latestAttempt.strengths) : latestAttempt.strengths)
    : [];
  const weaknesses: string[] = latestAttempt?.weaknesses
    ? (typeof latestAttempt.weaknesses === 'string' ? JSON.parse(latestAttempt.weaknesses) : latestAttempt.weaknesses)
    : [];

  if (loading && !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-[32px]" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Header ──────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden rounded-[32px] p-5 sm:p-6"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0b1120 100%)'
            : 'linear-gradient(140deg, #f8fafc 0%, #f1f5f9 45%, #f8fafc 75%, #ffffff 100%)',
          border: isDark ? '1.5px solid #1e293b' : '1.5px solid #e2e8f0',
        }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.04)' }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: isDark ? 'rgba(59,130,246,0.04)' : 'rgba(37,99,235,0.02)' }} />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface/80 rounded-full shadow-sm">
                <Sparkles size={10} className="text-primary" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-text-muted">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-text-main leading-tight">
                Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Friend'}</span>
              </h2>
              <p className="text-text-muted font-bold text-[9px] sm:text-[11px] uppercase tracking-widest">
                {isStudent && (todaysClasses.length > 0 ? `${todaysClasses.length} session${todaysClasses.length > 1 ? 's' : ''} today` : 'No sessions today')}
                {isTutor && `${pendingSchedule.length} pending booking${pendingSchedule.length !== 1 ? 's' : ''}`}
                {isAdmin && 'System overview'}
              </p>
            </div>
            {isStudent && (
              <Link href="/dashboard/test"
                className="rounded-xl font-black text-[9px] uppercase tracking-[0.15em] shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white' }}>
                <Brain size={12} /> AI Assessment <Sparkles size={8} className="animate-sparkle" />
              </Link>
            )}
            {isTutor && (
              <Link href="/dashboard/bookings"
                className="rounded-xl font-black text-[9px] uppercase tracking-[0.15em] shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white' }}>
                <Hourglass size={12} /> Review Bookings
              </Link>
            )}
          </div>

          {/* Stats row — visible for students, tutors and admins */}
          {!loading && (isStudent || isTutor || isAdmin) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 mt-4"
            >
              {isStudent && (
                <>
                  <MiniStats icon={CalendarIcon} value={todaysClasses.length} label="Today" gradient="bg-gradient-to-br from-sky-400 to-blue-500" />
                  <MiniStats icon={TrendingUp} value={upcomingClasses.length} label="Upcoming" gradient="bg-gradient-to-br from-emerald-400 to-teal-500" />
                  <MiniStats icon={CheckCircle} value={schedule.filter(b => b.status === 'COMPLETED').length} label="Completed" gradient="bg-gradient-to-br from-violet-400 to-purple-500" />
                </>
              )}
              {isTutor && (
                <>
                  <MiniStats icon={CalendarIcon} value={todaysClasses.length} label="Today" gradient="bg-gradient-to-br from-sky-400 to-blue-500" />
                  <MiniStats icon={TrendingUp} value={upcomingClasses.length} label="Upcoming" gradient="bg-gradient-to-br from-emerald-400 to-teal-500" />
                  <MiniStats icon={CheckCircle} value={schedule.filter(b => b.status === 'COMPLETED').length} label="Completed" gradient="bg-gradient-to-br from-violet-400 to-purple-500" />
                </>
              )}
              {isAdmin && (
                <>
                  <MiniStats icon={Users} value={sysStats?.totals?.students ?? 0} label="Students" gradient="bg-gradient-to-br from-sky-400 to-blue-500" />
                  <MiniStats icon={GraduationCap} value={sysStats?.totals?.tutors ?? 0} label="Tutors" gradient="bg-gradient-to-br from-emerald-400 to-teal-500" />
                  <MiniStats icon={CalendarIcon} value={sysStats?.totals?.bookings ?? 0} label="Bookings" gradient="bg-gradient-to-br from-violet-400 to-purple-500" />
                </>
              )}
            </motion.div>
          )}
        </div>
      </header>

      {/* ── STUDENT VIEW ─────────────────────────────────────────── */}
      {isStudent && (
        <>
          {/* Latest Assessment */}
          {latestAttempt && (
            <Card className="border-border/60 overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                    <Brain size={12} className="text-white" />
                  </div>
                  Latest Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-black text-text-main">{latestAttempt.score}/{latestAttempt.total}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                      {latestAttempt.grade_label || 'Placement Test'}
                      {improved !== null && (
                        <span className={`ml-2 ${improved ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {improved ? '↑ Improved' : '↓ Declined'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-black", 
                      (latestAttempt.score / latestAttempt.total) >= 0.8 ? 'text-teal-600' : 
                      (latestAttempt.score / latestAttempt.total) >= 0.6 ? 'text-amber-600' : 'text-rose-500')}>
                      {Math.round((latestAttempt.score / latestAttempt.total) * 100)}%
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted mt-0.5">
                      {new Date(latestAttempt.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {(strengths.length > 0 || weaknesses.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {strengths.length > 0 && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-2.5 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-[8px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-400 mb-1 flex items-center gap-1">
                          <Award size={10} /> Strengths
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {strengths.slice(0, 3).map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[7px] border-teal-300 text-teal-700 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-700">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {weaknesses.length > 0 && (
                      <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-2.5 border border-rose-200 dark:border-rose-800">
                        <p className="text-[8px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1">
                          <AlertCircle size={10} /> Needs Work
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {weaknesses.slice(0, 3).map((w: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[7px] border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-700">{w}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Link href="/dashboard/test" className="flex-1">
                    <Button className="w-full text-[9px] uppercase tracking-widest font-black h-8">
                      <Brain size={12} className="mr-1" /> Take New Assessment
                    </Button>
                  </Link>
                  <Link href="/dashboard/test-history">
                    <Button variant="outline" className="text-[9px] uppercase tracking-widest font-black h-8">
                      History
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subject Mastery Mini */}
          {weaknesses.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {['Mathematics', 'Science', 'English', 'Filipino'].map(subject => {
                const subWeak = weaknesses.filter((w: string) => w.toLowerCase().includes(subject.toLowerCase()));
                const subStrong = strengths.filter((s: string) => s.toLowerCase().includes(subject.toLowerCase()));
                const mastery = (subStrong.length + subWeak.length) > 0
                  ? Math.round((subStrong.length / (subStrong.length + subWeak.length)) * 100)
                  : 50;
                return (
                  <Card key={subject} className="border-border/60">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">{subject}</p>
                        <p className="text-[10px] font-black">{mastery}%</p>
                      </div>
                      <Progress value={mastery} className="h-1.5" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

        </>
      )}

      {/* ── TUTOR VIEW ───────────────────────────────────────────── */}
      {isTutor && (
        <>
          {/* Pending Bookings Alert */}
          {pendingSchedule.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50/50 p-3">
              <Hourglass size={14} className="text-amber-600" />
              <AlertDescription className="text-[9px] font-black uppercase tracking-widest text-amber-800">
                You have {pendingSchedule.length} pending booking request{pendingSchedule.length > 1 ? 's' : ''}.{' '}
                <Link href="/dashboard/bookings" className="underline">Review now</Link>.
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Completion */}
          {(!user.tutorProfile?.headline || !user.tutorProfile?.bio) && (
            <Card className="border-border/60 bg-sky-50/50 dark:bg-sky-950/20">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-primary" />
                  <p className="text-[8px] font-bold text-text-muted">Complete your profile to get more bookings</p>
                </div>
                <Link href="/dashboard/profile">
                  <Button size="sm" className="text-[8px] uppercase tracking-widest font-black h-7 px-2.5">Update</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── ADMIN VIEW ───────────────────────────────────────────── */}
      {isAdmin && (
        <>
          {pendingTutors.length > 0 && (
            <Card className="border-border/60 overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <ShieldCheck size={12} className="text-white" />
                  </div>
                  Pending Tutor Approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {pendingTutors.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 bg-surface-elevated rounded-xl">
                    <div>
                      <p className="text-[10px] font-black text-text-main">{t.user.name || 'Unnamed'}</p>
                      <p className="text-[8px] text-text-muted">{t.user.email}</p>
                    </div>
                    <Link href={`/dashboard/admin/tutors/${t.id}`}>
                      <Button size="sm" variant="outline" className="text-[8px] uppercase tracking-widest font-black h-7 px-2.5">Review</Button>
                    </Link>
                  </div>
                ))}
                {pendingTutors.length > 5 && (
                  <Link href="/dashboard/admin/tutors">
                    <Button variant="link" size="sm" className="text-[9px] w-full">View all {pendingTutors.length} pending</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* System Stats */}
          {sysStats?.totals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Students', value: sysStats.totals.students, icon: Users, gradient: 'from-sky-400 to-blue-500' },
                { label: 'Tutors', value: sysStats.totals.tutors, icon: GraduationCap, gradient: 'from-emerald-400 to-teal-500' },
                { label: 'Bookings', value: sysStats.totals.bookings, icon: CalendarIcon, gradient: 'from-violet-400 to-purple-500' },
                { label: 'Admins', value: sysStats.totals.admins, icon: ShieldCheck, gradient: 'from-rose-400 to-pink-500' },
              ].map(s => (
                <Card key={s.label} className="border-border/60">
                  <CardContent className="p-3 text-center space-y-1">
                    <div className={`w-7 h-7 bg-gradient-to-br ${s.gradient} rounded-lg flex items-center justify-center mx-auto shadow-sm`}>
                      <s.icon size={13} className="text-white" />
                    </div>
                    <p className="text-base font-black text-text-main">{s.value}</p>
                    <p className="text-[7px] font-black uppercase tracking-widest text-text-muted">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SCHEDULE SECTION (shared) ────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-black tracking-tight uppercase flex items-center gap-2 text-text-main">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-sm">
              <CalendarIcon size={12} className="text-white" />
            </div>
            {isStudent ? 'Upcoming Sessions' : isTutor ? 'Your Schedule' : 'Recent Bookings'}
          </h3>
          {schedule.length > 0 && (
            <Link href="/dashboard/classes"
              className="text-[9px] font-black uppercase tracking-widest text-primary underline-offset-4 hover:underline inline-flex items-center gap-1">
              View All <ChevronRight size={10} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-border">
                <Skeleton className="h-16 w-full rounded-none" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                  <Skeleton className="h-7 w-full mt-3" />
                </CardContent>
              </Card>
            ))
          ) : schedule.filter(b => b.status !== 'CANCELLED').length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-md mb-3">
                <CalendarIcon size={24} className="text-white" />
              </div>
              <h3 className="text-base font-black text-text-main">No sessions yet</h3>
              {isStudent && (
                <Link href="/dashboard/tutors" className="mt-2">
                  <Button className="text-[9px] uppercase tracking-widest font-black h-8">
                    <Users size={12} className="mr-1" /> Find a Tutor
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            schedule.filter(b => b.status !== 'CANCELLED').slice(0, 6).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => setSelectedClass(item)}
                className="bg-surface border-2 border-border rounded-[20px] overflow-hidden cursor-pointer group hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="h-14 relative flex items-end px-3 pb-1.5"
                  style={{ background: `linear-gradient(135deg, ${isDark ? item.bannerDarkFrom : item.bannerFrom}, ${isDark ? item.bannerDarkTo : item.bannerTo})` }}>
                  <span className="relative px-2.5 py-1 bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm">
                    {item.time}
                  </span>
                  <Badge className={`absolute top-2 right-3 text-[6px] py-0.5 px-1.5 ${
                    item.status === 'CONFIRMED' ? 'bg-emerald-500' :
                    item.status === 'PENDING' ? 'bg-amber-500' :
                    item.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-red-500'}`}>
                    {item.status}
                  </Badge>
                </div>
                <div className="px-3 py-2.5 space-y-1.5">
                  <p className="font-black text-[11px] text-text-main line-clamp-1">{item.topic}</p>
                  <div className="flex items-center gap-1.5 text-[8px] font-bold text-text-muted">
                    <User size={9} /> {item.teacher}
                  </div>
                  <div className="pt-1.5 border-t border-border flex items-center justify-between">
                    <span className="text-[7px] font-black uppercase tracking-widest text-text-muted">{item.date}</span>
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                      <ChevronRight size={10} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* ── Session Detail Dialog ────────────────────────────────── */}
      <Dialog open={!!selectedClass} onOpenChange={(open) => !open && setSelectedClass(null)}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 rounded-[28px] border-border overflow-hidden">
          {selectedClass && (
            <>
              <div className="h-20 relative"
                style={{ background: `linear-gradient(135deg, ${isDark ? selectedClass.bannerDarkFrom : selectedClass.bannerFrom}, ${isDark ? selectedClass.bannerDarkTo : selectedClass.bannerTo})` }}>
                <DialogHeader className="sr-only">
                  <DialogTitle>{selectedClass.topic}</DialogTitle>
                </DialogHeader>
                <div className="absolute -bottom-5 left-5 w-10 h-10 bg-surface rounded-xl shadow-md border-4 border-surface flex items-center justify-center">
                  <BookOpen size={16} className={selectedClass.iconColor} />
                </div>
                <Badge className={`absolute top-3 right-3 text-[7px] ${
                  selectedClass.status === 'CONFIRMED' ? 'bg-emerald-500' :
                  selectedClass.status === 'PENDING' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                  {selectedClass.status}
                </Badge>
              </div>

              <div className="p-4 pt-6 space-y-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black tracking-tight text-text-main">{selectedClass.topic}</h3>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    {selectedClass.subject} · {selectedClass.teacher}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-border space-y-0.5">
                    <p className="text-[7px] font-black uppercase tracking-widest text-text-muted">Time</p>
                    <p className="text-sm font-black text-text-main">{selectedClass.time}</p>
                  </div>
                  <div className="p-2.5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-border space-y-0.5">
                    <p className="text-[7px] font-black uppercase tracking-widest text-text-muted">Date</p>
                    <p className="text-sm font-black text-text-main">{selectedClass.date}</p>
                  </div>
                </div>

                {selectedClass.meetLink && (
                  <a href={selectedClass.meetLink} target="_blank" rel="noopener noreferrer"
                    className="group relative overflow-hidden w-full p-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-white hover:shadow-md font-black text-[9px] uppercase tracking-widest"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
                    <Video size={12} /> Join Classroom <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Richer stat card with gradient icon ──────────────────────────────
function MiniStats({ icon: Icon, value, label, gradient }: { icon: any; value: string | number; label: string; gradient: string }) {
  return (
    <Card className="border-border/60 shadow-sm bg-transparent">
      <CardContent className="flex items-center gap-2.5 p-2.5 sm:p-3">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 ${gradient} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon size={13} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-base sm:text-lg font-black text-text-main leading-none">{value}</p>
          <p className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-text-muted mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}