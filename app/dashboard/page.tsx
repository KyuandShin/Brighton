'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, Video, User,
  ChevronRight, Sparkles, X, BookOpen, ExternalLink, Users
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
}

const COLORS = [
  { color: 'bg-p-purple', iconColor: 'text-purple-600', iconBg: 'bg-purple-100' },
  { color: 'bg-p-pink',   iconColor: 'text-pink-600',   iconBg: 'bg-pink-100'   },
  { color: 'bg-p-mint',   iconColor: 'text-teal-600',   iconBg: 'bg-teal-100'   },
  { color: 'bg-p-yellow', iconColor: 'text-amber-600',  iconBg: 'bg-amber-100'  },
  { color: 'bg-p-peach',  iconColor: 'text-orange-600', iconBg: 'bg-orange-100' },
];

export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [schedule, setSchedule]           = useState<ScheduleItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { setLoading(false); return; }

    const fetchBookings = async () => {
      try {
        const res  = await fetch('/api/bookings', { 
          cache: 'no-store',
          credentials: 'include'
        });
        if (!res.ok) { 
          console.error('Failed to fetch bookings:', res.status);
          // Clear schedule on error instead of leaving stale data
          setSchedule([]);
          return; 
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          setSchedule([]);
          return;
        }

        const formattedSchedule = data.map((booking: any, index: number) => {
          const sessionDate    = new Date(booking.date);
          const isValidDate    = !isNaN(sessionDate.getTime());
          const formattedDate  = isValidDate
            ? sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : 'Scheduled';
          const formattedTime  = isValidDate
            ? sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'TBD';
          const tutorName      = booking.tutor?.user?.name || 'Tutor';
          const tutorHeadline  = booking.tutor?.headline   || 'Tutoring Session';

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
  }, [user, userLoading]);

  const isToday = (isoString: string) => {
    const today    = new Date();
    const itemDate = new Date(isoString);
    return itemDate.toDateString() === today.toDateString();
  };

  const todaysClasses = schedule.filter((item) => isToday(item.rawDate));

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-text-main">
            Welcome back,{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0] || 'Friend'}!</span>
            {' '}
          </h2>
          <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
            {loading ? 'Loading schedule...' :
             todaysClasses.length === 0 ? 'No sessions scheduled for today.' :
             `You have ${todaysClasses.length} session${todaysClasses.length > 1 ? 's' : ''} today.`}
          </p>
        </div>
        <Link
          href="/dashboard/test"
          className="px-6 py-3 bg-p-yellow text-amber-700 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-amber-200/60 hover:scale-105 transition-all flex items-center gap-2"
        > Retake AI Assessment
        </Link>
      </header>

      {/* Schedule Section */}
      <section className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
            <div className="w-8 h-8 bg-p-purple rounded-lg flex items-center justify-center">
              <CalendarIcon size={16} className="text-primary" />
            </div>
            Your Academic Schedule
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-p-purple/40 p-8 rounded-[40px] animate-pulse h-[300px]" />
            ))
          ) : schedule.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-6">
              <div className="w-20 h-20 bg-p-purple rounded-3xl flex items-center justify-center">
                <span className="text-4xl" style={{ animation: 'float-slow 4s ease-in-out infinite' }}>📚</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-text-main">No scheduled classes yet</h3>
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
                whileHover={{ y: -6 }}
                onClick={() => setSelectedClass(item)}
                className={`${item.color} p-8 rounded-[40px] shadow-sm border-2 border-white cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-8 group-hover:opacity-15 transition-opacity">
                  <BookOpen size={80} />
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest text-text-main">
                      {item.subject}
                    </div>
                    <div className={`p-2 ${item.iconBg} rounded-xl ${item.iconColor}`}>
                      <Video size={18} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-2xl font-black tracking-tight text-text-main">{item.topic}</h4>
                    <div className="flex items-center gap-2 text-text-main/60 font-bold text-xs uppercase tracking-tight">
                      <User size={14} /> {item.teacher}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-black/5 flex justify-between items-center">
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-text-main/40">
                      <Clock size={14} /> {item.time.split(' - ')[0]}
                    </div>
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-white transition-all"
                      style={{ '--tw-group-hover-bg': undefined } as any}
                      onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg,#ec4899,#9333ea)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                      <ChevronRight size={16} />
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
              className="w-full max-w-lg bg-white rounded-[48px] shadow-[0_40px_100px_rgba(147,51,234,0.15)] border border-p-purple overflow-hidden relative z-10"
            >
              <div className={`h-32 ${selectedClass.color} relative`}>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="absolute top-6 right-6 p-2 bg-white/60 hover:bg-white rounded-full transition-all text-text-main"
                >
                  <X size={20} />
                </button>
                <div className="absolute -bottom-8 left-10 w-16 h-16 bg-white rounded-3xl shadow-lg border-4 border-white flex items-center justify-center">
                  <BookOpen size={32} className={selectedClass.iconColor} />
                </div>
              </div>

              <div className="p-10 pt-12 space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    <Sparkles size={12} /> Confirmed Session
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-text-main">{selectedClass.topic}</h3>
                  <p className="text-sm font-bold text-text-muted uppercase tracking-widest">
                    {selectedClass.subject} • {selectedClass.teacher}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-p-purple/40 rounded-3xl space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Time Slot</p>
                    <p className="text-xs font-black text-text-main">{selectedClass.time}</p>
                  </div>
                  <div className="p-5 bg-p-pink/40 rounded-3xl space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Date</p>
                    <p className="text-xs font-black text-text-main">{selectedClass.date}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Learning Link</label>
                  <a
                    href={selectedClass.meetLink}
                    target="_blank"
                    className="w-full p-5 rounded-3xl flex items-center justify-between group hover:opacity-90 transition-all text-white"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 8px 24px rgba(147,51,234,0.25)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Video size={20} />
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest">Join Google Meet</span>
                    </div>
                    <ExternalLink size={18} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>

              <div className="px-10 py-6 bg-p-purple/30 border-t border-p-purple text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">Brighton Academic Framework v2.0</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
