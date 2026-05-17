'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, Video, User,
  ChevronRight, Sparkles, X, BookOpen, ExternalLink, Users,
  TrendingUp, Sun, Star, GraduationCap, Brain, Rocket, Heart
} from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

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

const COLORS = [
  { color: 'bg-p-purple', iconColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/50', bannerFrom: '#ede9fe', bannerTo: '#c4b5fd', bannerDarkFrom: '#2a1a45', bannerDarkTo: '#1e1035' },
  { color: 'bg-p-pink',   iconColor: 'text-pink-600 dark:text-pink-400',   iconBg: 'bg-pink-100 dark:bg-pink-900/50',   bannerFrom: '#fce7f3', bannerTo: '#f9a8d4', bannerDarkFrom: '#3d1f3a', bannerDarkTo: '#2d152a' },
  { color: 'bg-p-mint',   iconColor: 'text-teal-600 dark:text-teal-400',   iconBg: 'bg-teal-100 dark:bg-teal-900/50',   bannerFrom: '#d1fae5', bannerTo: '#6ee7b7', bannerDarkFrom: '#1a3a2e', bannerDarkTo: '#0f2a1e' },
  { color: 'bg-p-yellow', iconColor: 'text-amber-600 dark:text-amber-400',  iconBg: 'bg-amber-100 dark:bg-amber-900/50',  bannerFrom: '#fef9c3', bannerTo: '#fcd34d', bannerDarkFrom: '#3d3520', bannerDarkTo: '#2d2515' },
  { color: 'bg-p-peach',  iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/50', bannerFrom: '#ffedd5', bannerTo: '#fdba74', bannerDarkFrom: '#3d2a1a', bannerDarkTo: '#2d1a0f' },
];

const quickActions = [
  { label: 'Find a Tutor', href: '/dashboard/tutors', icon: Users,        iconBg: '#2563eb', iconBgTo: '#1d4ed8', cardBg: '#f8fafc', cardBorder: '#e2e8f0', desc: 'Browse experts'   },
  { label: 'Take Test',    href: '/dashboard/test',   icon: Brain,        iconBg: '#2563eb', iconBgTo: '#1d4ed8', cardBg: '#f8fafc', cardBorder: '#e2e8f0', desc: 'AI assessment'    },
  { label: 'My Classes',  href: '/dashboard/classes', icon: BookOpen,     iconBg: '#1d4ed8', iconBgTo: '#1e40af', cardBg: '#f8fafc', cardBorder: '#e2e8f0', desc: 'View schedule'    },
  { label: 'Bookings',    href: '/dashboard/bookings', icon: CalendarIcon, iconBg: '#1d4ed8', iconBgTo: '#1e40af', cardBg: '#f8fafc', cardBorder: '#e2e8f0', desc: 'Manage sessions'  },
];

export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const pathname = usePathname();
  const [schedule, setSchedule]           = useState<ScheduleItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);
  const [isDark, setIsDark]               = useState(false);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
          const sessionDate   = new Date(booking.date);
          const isValidDate   = !isNaN(sessionDate.getTime());
          const formattedDate = isValidDate
            ? sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : 'Scheduled';
          const formattedTime = isValidDate
            ? sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'TBD';
          const tutorName     = booking.tutor?.user?.name || 'Tutor';
          const tutorHeadline = booking.tutor?.headline   || 'Tutoring Session';

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

  const isToday = (isoString: string) => {
    const today    = new Date();
    const itemDate = new Date(isoString);
    return itemDate.toDateString() === today.toDateString();
  };

  const now = new Date();
  const activeSchedule = schedule.filter((item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED');
  const confirmedSchedule = schedule.filter((item) => item.status === 'CONFIRMED');
  const pendingSchedule = schedule.filter((item) => item.status === 'PENDING');
  const todaysClasses   = confirmedSchedule.filter((item) => isToday(item.rawDate));
  const upcomingClasses = confirmedSchedule.filter((item) => new Date(item.rawDate) >= now);

  const stats = [
    { label: 'Upcoming', value: upcomingClasses.length, icon: TrendingUp, iconColor: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.14)' },
    { label: 'Today',    value: todaysClasses.length,   icon: Sun,         iconColor: '#2563eb', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.14)' },
    { label: 'Total',    value: activeSchedule.length,  icon: BookOpen,    iconColor: '#1d4ed8', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.14)' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <header
        className="relative overflow-hidden rounded-[40px] p-6 sm:p-8 md:p-10"
        style={{
            background: isDark
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0b1120 100%)'
              : 'linear-gradient(140deg, #f8fafc 0%, #f1f5f9 45%, #f8fafc 75%, #ffffff 100%)',
            border: isDark ? '1.5px solid #1e293b' : '1.5px solid #e2e8f0',
            boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.25)' : '0 4px 32px rgba(0,0,0,0.04)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.04)' }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: isDark ? 'rgba(59,130,246,0.04)' : 'rgba(37,99,235,0.02)' }} />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full blur-2xl pointer-events-none"
          style={{ background: isDark ? 'rgba(59,130,246,0.03)' : 'rgba(37,99,235,0.015)' }} />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface/80 rounded-full shadow-sm">
              <Sparkles size={12} className="text-primary" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-text-main">
              Welcome back,{' '}
              <span className="gradient-text">{user?.name?.split(' ')[0] || 'Friend'}</span>
            </h2>
            <p className="text-text-muted font-bold text-[10px] sm:text-xs uppercase tracking-widest">
              {loading ? 'Loading your academic overview...' :
               todaysClasses.length === 0 ? 'No sessions scheduled for today -- time to book one!' :
               `You have ${todaysClasses.length} session${todaysClasses.length > 1 ? 's' : ''} today.`}
            </p>
          </div>
          <Link
            href="/dashboard/test"
            className="group relative overflow-hidden w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-primary to-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2.5 shrink-0"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Brain size={14} className="relative z-10" />
            <span className="relative z-10">AI Assessment</span>
            <Sparkles size={10} className="relative z-10 animate-sparkle" />
          </Link>
        </div>

        {/* Stats row */}
        {!loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-2 sm:gap-3 mt-8"
          >
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 hover:shadow-md transition-all hover:-translate-y-0.5"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : s.bg,
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.10)' : s.border}`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)' }}
                  >
                    <Icon size={16} style={{ color: s.iconColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-black text-text-main leading-none">{s.value}</p>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-text-muted mt-0.5">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </header>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <div
                className="group relative overflow-hidden p-4 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                style={{
                  background: isDark ? 'var(--color-surface)' : action.cardBg,
                  border: `1.5px solid ${isDark ? 'var(--color-border)' : action.cardBorder}`,
                }}
              >
                <div className="relative z-10 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
                    style={{ background: `linear-gradient(135deg, ${action.iconBg}, ${action.iconBgTo})` }}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-text-main">{action.label}</p>
                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{action.desc}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </motion.div>

      {/* Schedule Section */}
      <section className="space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-sm sm:text-base font-black tracking-tight uppercase flex items-center gap-2.5 text-text-main">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
              <CalendarIcon size={14} className="text-white" />
            </div>
            Your Academic Schedule
          </h3>
          {schedule.length > 0 && (
            <Link
              href="/dashboard/classes"
              className="group flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-accent-strong transition-colors"
            >
              View All <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border-2 border-border rounded-[32px] overflow-hidden animate-pulse">
                <div className="h-20 bg-surface-elevated" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-surface-elevated rounded-xl w-3/4" />
                  <div className="h-3 bg-surface-elevated rounded-xl w-1/2" />
                  <div className="h-8 bg-surface-elevated rounded-xl w-full mt-4" />
                </div>
              </div>
            ))
          ) : confirmedSchedule.length === 0 && pendingSchedule.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-16 text-center space-y-6">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)' }}
                >
                  <BookOpen size={32} className="text-white drop-shadow-sm" />
                </div>
                <div
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center animate-sparkle shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)' }}
                >
                  <Star size={12} className="text-primary" fill="currentColor" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-text-main">No scheduled classes yet</h3>
                <p className="text-sm text-text-muted max-w-md leading-relaxed">
                  Browse available tutors and book your first session to start your learning adventure.
                </p>
              </div>
              <Link
                href="/dashboard/tutors"
                className="group px-8 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2.5"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 8px 24px rgba(37,99,235,0.2)' }}
              >
                <Users size={14} /> Find Tutors <Rocket size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ) : (
            confirmedSchedule.filter((item) => new Date(item.rawDate) >= now).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => setSelectedClass(item)}
                className="bg-surface border-2 border-border rounded-[32px] overflow-hidden cursor-pointer group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all"
              >
                {/* Colored banner */}
                <div
                  className="h-20 relative flex items-end px-5 pb-3"
                  style={{ background: `linear-gradient(135deg, ${isDark ? item.bannerDarkFrom : item.bannerFrom}, ${isDark ? item.bannerDarkTo : item.bannerTo})` }}
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border-[12px] border-white/20 dark:border-white/5" />
                  <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full border-8 border-white/10 dark:border-white/5" />
                  <span className="relative px-4 py-1.5 bg-white/70 dark:bg-white/10 dark:text-white backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-widest text-text-main shadow-sm">
                    {item.time}
                  </span>
                  <div className={`absolute top-4 right-5 p-2 ${item.iconBg} rounded-xl ${item.iconColor} shadow-sm`}>
                    <Video size={14} />
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                  <div className="space-y-0.5">
                    <h4 className="font-black text-sm text-text-main line-clamp-1 group-hover:text-primary transition-colors">
                      {item.topic}
                    </h4>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight line-clamp-1">
                      {item.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
                    <User size={11} /> {item.teacher}
                  </div>
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-muted">
                      <Clock size={11} /> {item.date}
                    </div>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm transition-all group-hover:scale-110"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                    >
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClass(null)}
              className="absolute inset-0 bg-text-main/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-surface rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-border dark:border-[#1e293b] overflow-hidden relative z-10"
            >
              <div
                className="h-28 relative"
                style={{ background: `linear-gradient(135deg, ${isDark ? selectedClass.bannerDarkFrom : selectedClass.bannerFrom}, ${isDark ? selectedClass.bannerDarkTo : selectedClass.bannerTo})` }}
              >
                <button
                  onClick={() => setSelectedClass(null)}
                  className="absolute top-5 right-5 p-2 bg-surface/60 hover:bg-surface rounded-full transition-all text-text-main hover:shadow-md z-10"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
                <div className="absolute -bottom-7 left-8 w-14 h-14 bg-surface rounded-2xl shadow-md border-4 border-surface flex items-center justify-center">
                  <BookOpen size={24} className={selectedClass.iconColor} />
                </div>
              </div>

              <div className="p-6 sm:p-8 pt-11 space-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-primary">*</span>
                    <span className="text-primary">Confirmed Session</span>
                    <span className="text-primary">*</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-text-main">{selectedClass.topic}</h3>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                    {selectedClass.subject} . {selectedClass.teacher}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl space-y-1.5 border border-border">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Time</p>
                    <p className="text-sm font-black text-text-main">{selectedClass.time}</p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl space-y-1.5 border border-border">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Date</p>
                    <p className="text-sm font-black text-text-main">{selectedClass.date}</p>
                  </div>
                </div>

                <a
                  href={selectedClass.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden w-full p-4 rounded-2xl flex items-center justify-between transition-all text-white hover:shadow-xl hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 8px 24px rgba(37,99,235,0.25)' }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl"><Video size={17} /></div>
                    <span className="font-black text-xs uppercase tracking-widest">Join Classroom</span>
                  </div>
                  <ExternalLink size={16} className="relative z-10 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>

              <div className="px-8 py-4 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border-t border-border text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">Brighton Academic Framework v2.0</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}