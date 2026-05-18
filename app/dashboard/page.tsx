'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, Video, User,
  ChevronRight, Sparkles, BookOpen, ExternalLink, Users,
  TrendingUp, Sun, Star, GraduationCap, Brain, Rocket,
  Hourglass, Award, AlertCircle, CheckCircle, ShieldCheck,
  Bell, Wallet, School, Mail
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
        <Skeleton className="h-40 w-full rounded-[32px]" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Hero Header ──────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden rounded-[32px] p-6 sm:p-8"
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
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface/80 rounded-full shadow-sm">
                <Sparkles size={12} className="text-primary" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-text-main leading-tight">
                Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Friend'}</span>
              </h2>
              <p className="text-text-muted font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                {isStudent && (todaysClasses.length > 0 ? `${todaysClasses.length} session${todaysClasses.length > 1 ? 's' : ''} today` : 'No sessions today')}
                {isTutor && `${pendingSchedule.length} pending booking${pendingSchedule.length !== 1 ? 's' : ''}`}
                {isAdmin && 'System overview'}
              </p>
            </div>
            {isStudent && (
              <Link href="/dashboard/test"
                className="rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all inline-flex shrink-0 items-center justify-center gap-2.5 px-5 py-3"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white' }}>
                <Brain size={14} /> AI Assessment <Sparkles size={10} className="animate-sparkle" />
              </Link>
            )}
            {isTutor && (
              <Link href="/dashboard/bookings"
                className="rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all inline-flex shrink-0 items-center justify-center gap-2.5 px-5 py-3"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white' }}>
                <Hourglass size={14} /> Review Bookings
              </Link>
            )}
          </div>

          {/* Stats row — visible for tutors and admins only */}
          {!loading && (isTutor || isAdmin) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 mt-6"
            >
              {isTutor && (
                <>
                  <StatCard icon={Hourglass} value={pendingSchedule.length} label="Pending" color="#f59e0b" isDark={isDark} />
                  <StatCard icon={CheckCircle} value={schedule.filter(b => b.status === 'CONFIRMED').length} label="Confirmed" color="#10b981" isDark={isDark} />
                  <StatCard icon={TrendingUp} value={schedule.filter(b => b.status === 'COMPLETED').length} label="Completed" color="#3b82f6" isDark={isDark} />
                </>
              )}
              {isAdmin && (
                <>
                  <StatCard icon={Users} value={sysStats?.totals?.students ?? 0} label="Students" color="#3b82f6" isDark={isDark} />
                  <StatCard icon={GraduationCap} value={sysStats?.totals?.tutors ?? 0} label="Tutors" color="#10b981" isDark={isDark} />
                  <StatCard icon={CalendarIcon} value={sysStats?.totals?.bookings ?? 0} label="Bookings" color="#8b5cf6" isDark={isDark} />
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
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Brain size={16} className="text-primary" /> Latest Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-text-main">{latestAttempt.score}/{latestAttempt.total}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">
                      {latestAttempt.grade_label || 'Placement Test'}
                      {improved !== null && (
                        <span className={`ml-2 ${improved ? 'text-emerald-600' : 'text-red-500'}`}>
                          {improved ? '↑ Improved' : '↓ Declined'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-black", 
                      (latestAttempt.score / latestAttempt.total) >= 0.8 ? 'text-teal-600' : 
                      (latestAttempt.score / latestAttempt.total) >= 0.6 ? 'text-amber-600' : 'text-red-500')}>
                      {Math.round((latestAttempt.score / latestAttempt.total) * 100)}%
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">
                      {new Date(latestAttempt.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {(strengths.length > 0 || weaknesses.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {strengths.length > 0 && (
                      <div className="bg-p-green/20 rounded-2xl p-3 border border-p-green/30">
                        <p className="text-[9px] font-black uppercase tracking-widest text-teal-700 mb-1.5 flex items-center gap-1">
                          <Award size={12} /> Strengths
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {strengths.slice(0, 3).map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[8px] border-teal-300 text-teal-700 bg-teal-50">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {weaknesses.length > 0 && (
                      <div className="bg-p-rose/20 rounded-2xl p-3 border border-p-rose/30">
                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-700 mb-1.5 flex items-center gap-1">
                          <AlertCircle size={12} /> Needs Work
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {weaknesses.slice(0, 3).map((w: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[8px] border-rose-300 text-rose-700 bg-rose-50">{w}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href="/dashboard/test" className="flex-1">
                    <Button className="w-full text-[10px] uppercase tracking-widest font-black">
                      <Brain size={14} className="mr-1" /> Take New Assessment
                    </Button>
                  </Link>
                  <Link href="/dashboard/test-history">
                    <Button variant="outline" className="text-[10px] uppercase tracking-widest font-black">
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
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{subject}</p>
                        <p className="text-[10px] font-black">{mastery}%</p>
                      </div>
                      <Progress value={mastery} className="h-1.5" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* No sessions CTA */}
          {!loading && confirmedSchedule.length === 0 && pendingSchedule.length === 0 && (
            <Alert className="border-dashed border-primary/30 bg-primary/5">
              <Rocket size={16} className="text-primary" />
              <AlertDescription className="text-[10px] font-black uppercase tracking-widest">
                No upcoming sessions.{' '}
                <Link href="/dashboard/tutors" className="text-primary underline">Find a tutor</Link> to get started.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* ── TUTOR VIEW ───────────────────────────────────────────── */}
      {isTutor && (
        <>
          {/* Pending Bookings Alert */}
          {pendingSchedule.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50/50">
              <Hourglass size={16} className="text-amber-600" />
              <AlertDescription className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                You have {pendingSchedule.length} pending booking request{pendingSchedule.length > 1 ? 's' : ''}.{' '}
                <Link href="/dashboard/bookings" className="underline">Review now</Link>.
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Completion */}
          {(!user.tutorProfile?.headline || !user.tutorProfile?.bio) && (
            <Card className="border-border/60 bg-p-sky/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-primary" />
                  <p className="text-[9px] font-bold text-text-muted">Complete your profile to get more bookings</p>
                </div>
                <Link href="/dashboard/profile">
                  <Button size="sm" className="text-[9px] uppercase tracking-widest font-black">Update</Button>
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
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-500" /> Pending Tutor Approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingTutors.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl">
                    <div>
                      <p className="text-xs font-black text-text-main">{t.user.name || 'Unnamed'}</p>
                      <p className="text-[9px] text-text-muted">{t.user.email}</p>
                    </div>
                    <Link href={`/dashboard/admin/tutors/${t.id}`}>
                      <Button size="sm" variant="outline" className="text-[9px] uppercase tracking-widest font-black">Review</Button>
                    </Link>
                  </div>
                ))}
                {pendingTutors.length > 5 && (
                  <Link href="/dashboard/admin/tutors">
                    <Button variant="link" size="sm" className="text-[10px] w-full">View all {pendingTutors.length} pending</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* System Stats */}
          {sysStats?.totals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Students', value: sysStats.totals.students, icon: Users, color: '#3b82f6' },
                { label: 'Tutors', value: sysStats.totals.tutors, icon: GraduationCap, color: '#10b981' },
                { label: 'Bookings', value: sysStats.totals.bookings, icon: CalendarIcon, color: '#8b5cf6' },
                { label: 'Admins', value: sysStats.totals.admins, icon: ShieldCheck, color: '#f59e0b' },
              ].map(s => (
                <Card key={s.label} className="border-border/60">
                  <CardContent className="p-4 text-center space-y-1">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto" style={{ background: `${s.color}15` }}>
                      <s.icon size={16} style={{ color: s.color }} />
                    </div>
                    <p className="text-lg font-black text-text-main">{s.value}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SCHEDULE SECTION (shared) ────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black tracking-tight uppercase flex items-center gap-2.5 text-text-main">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
              <CalendarIcon size={14} className="text-white" />
            </div>
            {isStudent ? 'Upcoming Sessions' : isTutor ? 'Your Schedule' : 'Recent Bookings'}
          </h3>
          {schedule.length > 0 && (
            <Link href="/dashboard/classes"
              className="text-[10px] font-black uppercase tracking-widest text-primary underline-offset-4 hover:underline inline-flex items-center gap-1.5">
              View All <ChevronRight size={12} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-border">
                <Skeleton className="h-20 w-full rounded-none" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full mt-4" />
                </CardContent>
              </Card>
            ))
          ) : schedule.filter(b => b.status !== 'CANCELLED').length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg mb-4"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)' }}>
                <CalendarIcon size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-black text-text-main">No sessions yet</h3>
              {isStudent && (
                <Link href="/dashboard/tutors" className="mt-3">
                  <Button className="text-[10px] uppercase tracking-widest font-black">
                    <Users size={14} className="mr-1" /> Find a Tutor
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
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => setSelectedClass(item)}
                className="bg-surface border-2 border-border rounded-[24px] overflow-hidden cursor-pointer group hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="h-16 relative flex items-end px-4 pb-2"
                  style={{ background: `linear-gradient(135deg, ${isDark ? item.bannerDarkFrom : item.bannerFrom}, ${isDark ? item.bannerDarkTo : item.bannerTo})` }}>
                  <span className="relative px-3 py-1 bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                    {item.time}
                  </span>
                  <Badge className={`absolute top-2 right-3 text-[7px] py-0.5 ${
                    item.status === 'CONFIRMED' ? 'bg-emerald-500' :
                    item.status === 'PENDING' ? 'bg-amber-500' :
                    item.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-red-500'}`}>
                    {item.status}
                  </Badge>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <p className="font-black text-xs text-text-main line-clamp-1">{item.topic}</p>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-muted">
                    <User size={10} /> {item.teacher}
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">{item.date}</span>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                      <ChevronRight size={12} />
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
        <DialogContent className="sm:max-w-lg p-0 gap-0 rounded-[32px] border-border overflow-hidden">
          {selectedClass && (
            <>
              <div className="h-24 relative"
                style={{ background: `linear-gradient(135deg, ${isDark ? selectedClass.bannerDarkFrom : selectedClass.bannerFrom}, ${isDark ? selectedClass.bannerDarkTo : selectedClass.bannerTo})` }}>
                <DialogHeader className="sr-only">
                  <DialogTitle>{selectedClass.topic}</DialogTitle>
                </DialogHeader>
                <div className="absolute -bottom-6 left-6 w-12 h-12 bg-surface rounded-2xl shadow-md border-4 border-surface flex items-center justify-center">
                  <BookOpen size={20} className={selectedClass.iconColor} />
                </div>
                <Badge className={`absolute top-3 right-3 text-[8px] ${
                  selectedClass.status === 'CONFIRMED' ? 'bg-emerald-500' :
                  selectedClass.status === 'PENDING' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                  {selectedClass.status}
                </Badge>
              </div>

              <div className="p-5 pt-8 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight text-text-main">{selectedClass.topic}</h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {selectedClass.subject} · {selectedClass.teacher}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-border space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Time</p>
                    <p className="text-sm font-black text-text-main">{selectedClass.time}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-border space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Date</p>
                    <p className="text-sm font-black text-text-main">{selectedClass.date}</p>
                  </div>
                </div>

                {selectedClass.meetLink && (
                  <a href={selectedClass.meetLink} target="_blank" rel="noopener noreferrer"
                    className="group relative overflow-hidden w-full p-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-white hover:shadow-lg font-black text-[10px] uppercase tracking-widest"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
                    <Video size={14} /> Join Classroom <ExternalLink size={12} />
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

function StatCard({ icon: Icon, value, label, color, isDark }: { icon: any; value: string | number; label: string; color: string; isDark: boolean }) {
  return (
    <Card className="border-border/60 shadow-sm bg-transparent">
      <CardContent className="flex items-center gap-3 p-3 sm:p-4">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)' }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-lg sm:text-xl font-black text-text-main leading-none">{value}</p>
          <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-text-muted mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}