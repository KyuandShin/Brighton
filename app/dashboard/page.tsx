'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, Video, User,
  ChevronRight, Sparkles, X, BookOpen, ExternalLink, Users,
  TrendingUp, Sun,
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
  color: string;
  iconColor: string;
  iconBg: string;
  bannerFrom: string;
  bannerTo: string;
}

const COLORS = [
  { color: 'bg-p-purple', iconColor: 'text-purple-600', iconBg: 'bg-purple-100', bannerFrom: '#ede9fe', bannerTo: '#c4b5fd' },
  { color: 'bg-p-pink',   iconColor: 'text-pink-600',   iconBg: 'bg-pink-100',   bannerFrom: '#fce7f3', bannerTo: '#f9a8d4' },
  { color: 'bg-p-mint',   iconColor: 'text-teal-600',   iconBg: 'bg-teal-100',   bannerFrom: '#d1fae5', bannerTo: '#6ee7b7' },
  { color: 'bg-p-yellow', iconColor: 'text-amber-600',  iconBg: 'bg-amber-100',  bannerFrom: '#fef9c3', bannerTo: '#fcd34d' },
  { color: 'bg-p-peach',  iconColor: 'text-orange-600', iconBg: 'bg-orange-100', bannerFrom: '#ffedd5', bannerTo: '#fdba74' },
];

export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const pathname = usePathname();
  const [schedule, setSchedule]           = useState<ScheduleItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { setLoading(false); return; }

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
        if (!res.ok) { setSchedule([]); return; }
        const data = await res.json();
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
            ...COLORS[index % COLORS.length],
          };
        });

        setSchedule(formattedSchedule);
      } catch (error) {
        console.error('Failed to load schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, userLoading, pathname]);

  const isToday = (isoString: string) => {
    const today    = new Date();
    const itemDate = new Date(isoString);
    return itemDate.toDateString() === today.toDateString();
  };

  const now             = new Date();
  const todaysClasses   = schedule.filter((item) => isToday(item.rawDate));
  const upcomingClasses = schedule.filter((item) => new Date(item.rawDate) >= now);

  const stats = [
    { label: 'Upcoming', value: upcomingClasses.length, icon: TrendingUp, bg: 'bg-p-purple', text: 'text-purple-600' },
    { label: 'Today',    value: todaysClasses.length,   icon: Sun,         bg: 'bg-p-yellow', text: 'text-amber-600' },
    { label: 'Total',    value: schedule.length,        icon: BookOpen,    bg: 'bg-p-blue',   text: 'text-blue-600'  },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-text-main">
              Welcome back,{' '}
              <span className="gradient-text">{user?.name?.split(' ')[0] || 'Friend'}!</span>
            </h2>
            <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
              {loading ? 'Loading your schedule...' :
               todaysClasses.length === 0 ? 'No sessions scheduled for today.' :
               `You have ${todaysClasses.length} session${todaysClasses.length > 1 ? 's' : ''} today.`}
            </p>
          </div>
          <Link
            href="/dashboard/test"
            className="px-5 py-2.5 bg-p-yellow text-amber-700 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm shadow-amber-200/60 hover:scale-105 transition-all flex items-center gap-2 shrink-0"
          >
            <Sparkles size={13} /> Retake AI Assessment
          </Link>
        </div>

        {/* Stats row */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`${s.bg} border border-white rounded-2xl px-4 py-3 flex items-center gap-3`}>
                  <div className="w-8 h-8 bg-white/60 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={15} className={s.text} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-text-main leading-none">{s.value}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* Schedule Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black tracking-tight uppercase flex items-center gap-2.5 text-text-main">
            <div className="w-7 h-7 bg-p-purple rounded-lg flex items-center justify-center">
              <CalendarIcon size={14} className="text-primary" />
            </div>
            Your Academic Schedule
          </h3>
          {schedule.length > 0 && (
            <Link
              href="/dashboard/classes"
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-accent-strong transition-colors"
            >
              View All <ChevronRight size={12} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white border-2 border-border rounded-[32px] overflow-hidden animate-pulse">
                <div className="h-20 bg-p-purple/50" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-surface-elevated rounded-xl w-3/4" />
                  <div className="h-3 bg-surface-elevated rounded-xl w-1/2" />
                  <div className="h-8 bg-surface-elevated rounded-xl w-full mt-4" />
                </div>
              </div>
            ))
          ) : schedule.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-5">
              <div className="w-16 h-16 bg-p-purple rounded-3xl flex items-center justify-center">
                <BookOpen size={28} className="text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-text-main">No scheduled classes yet</h3>
                <p className="text-sm text-text-muted max-w-md">
                  Browse available tutors and book your first session to start your learning adventure!
                </p>
              </div>
              <Link
                href="/dashboard/tutors"
                className="px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 6px 20px rgba(147,51,234,0.2)' }}
              >
                <Users size={14} /> Find Tutors
              </Link>
            </div>
          ) : (
            schedule.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => setSelectedClass(item)}
                className="bg-white border-2 border-border rounded-[32px] overflow-hidden cursor-pointer group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all"
              >
                {/* Colored banner */}
                <div
                  className="h-20 relative flex items-end px-5 pb-3"
                  style={{ background: `linear-gradient(135deg, ${item.bannerFrom}, ${item.bannerTo})` }}
                >
                  <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full border-[12px] border-white/20" />
                  <span className="relative px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-widest text-text-main">
                    {item.time}
                  </span>
                  <div className={`absolute top-4 right-5 p-1.5 ${item.iconBg} rounded-xl ${item.iconColor}`}>
                    <Video size={15} />
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
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-tight">
                    <User size={11} /> {item.teacher}
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-muted">
                      <Clock size={11} /> {item.date}
                    </div>
                    <div className="w-7 h-7 bg-p-purple rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
              className="w-full max-w-lg bg-white rounded-[40px] shadow-[0_40px_100px_rgba(147,51,234,0.15)] border border-p-purple overflow-hidden relative z-10"
            >
              <div
                className="h-28 relative"
                style={{ background: `linear-gradient(135deg, ${selectedClass.bannerFrom}, ${selectedClass.bannerTo})` }}
              >
                <button
                  onClick={() => setSelectedClass(null)}
                  className="absolute top-5 right-5 p-2 bg-white/60 hover:bg-white rounded-full transition-all text-text-main"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
                <div className="absolute -bottom-7 left-8 w-14 h-14 bg-white rounded-2xl shadow-md border-4 border-white flex items-center justify-center">
                  <BookOpen size={24} className={selectedClass.iconColor} />
                </div>
              </div>

              <div className="p-8 pt-11 space-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    <Sparkles size={11} /> Confirmed Session
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-text-main">{selectedClass.topic}</h3>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                    {selectedClass.subject} · {selectedClass.teacher}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-p-purple/40 rounded-2xl space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Time</p>
                    <p className="text-xs font-black text-text-main">{selectedClass.time}</p>
                  </div>
                  <div className="p-4 bg-p-pink/40 rounded-2xl space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Date</p>
                    <p className="text-xs font-black text-text-main">{selectedClass.date}</p>
                  </div>
                </div>

                <a
                  href={selectedClass.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 rounded-2xl flex items-center justify-between group hover:opacity-90 transition-all text-white"
                  style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 8px 24px rgba(147,51,234,0.25)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/20 rounded-xl"><Video size={17} /></div>
                    <span className="font-black text-xs uppercase tracking-widest">Join Classroom</span>
                  </div>
                  <ExternalLink size={16} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>

              <div className="px-8 py-4 bg-p-purple/30 border-t border-p-purple text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">Brighton Academic Framework v2.0</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
