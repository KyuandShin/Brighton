'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, Video, User, 
  ChevronRight, Sparkles, X, MapPin, BookOpen, ExternalLink, Users
} from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

interface ScheduleItem {
    id: string;
    subject: string;
    teacher: string;
    time: string;
    date: string;
    rawDate: string; // ISO string for date comparisons
    meetLink: string;
    topic: string;
    color: string;
    iconColor: string;
}

const COLORS = [
  { color: 'bg-[#d0ebff]', iconColor: 'text-[#1971c2]' },
  { color: 'bg-[#d3f9d8]', iconColor: 'text-[#2b8a3e]' },
  { color: 'bg-[#ffd6e8]', iconColor: 'text-[#d6336c]' },
  { color: 'bg-[#fff3bf]', iconColor: 'text-[#f08c00]' },
  { color: 'bg-[#e5dbff]', iconColor: 'text-[#7048e8]' },
];

export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedSelectedClass] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    // Wait until useCurrentUser has resolved (user will be non-null when authenticated)
    if (userLoading) return;
    // If user failed to load or is not logged in, stop the skeleton
    if (!user) { setLoading(false); return; }

    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings');
        if (!res.ok) {
          console.error('Failed to fetch bookings:', res.status);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const formattedSchedule = data.map((booking: any, index: number) => {
          const sessionDate = new Date(booking.date);
          const formattedDate = sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
          const formattedTime = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          // Use tutor headline as the session topic, tutor name as teacher
          const tutorName = booking.tutor?.user?.name || 'Tutor';
          const tutorHeadline = booking.tutor?.headline || 'Tutoring Session';

          return {
            id: booking.id,
            subject: tutorHeadline,       // shows in the pill badge
            teacher: tutorName,
            time: formattedTime || 'TBD',
            date: formattedDate || 'Scheduled',
            rawDate: booking.date,         // ISO string for accurate date checks
            meetLink: booking.meetLink || '',
            topic: `Session with ${tutorName}`,
            ...COLORS[index % COLORS.length]
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
  }, [user, userLoading]); // re-run once user resolves

  // Check if a booking's raw ISO date falls on today
  const isToday = (isoString: string) => {
    const today = new Date();
    const itemDate = new Date(isoString);
    return itemDate.toDateString() === today.toDateString();
  };
  
  const todaysClasses = schedule.filter((item) => isToday(item.rawDate));

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-[#2c3e50]">Welcome Home, <span className="text-[#748ffc]">{user?.name?.split(' ')[0] || 'User'}!</span> 👋</h2>
          <p className="text-[#7f8c8d] font-bold text-xs uppercase tracking-widest">
            {loading ? 'Loading schedule...' : 
             todaysClasses.length === 0 ? 'No sessions scheduled for today.' :
             `You have ${todaysClasses.length} session${todaysClasses.length > 1 ? 's' : ''} scheduled for today.`}
          </p>
        </div>
        <Link href="/dashboard/test" className="px-6 py-3 bg-[#fff3bf] text-[#f08c00] rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-[#fff3bf]/40 hover:scale-105 transition-all flex items-center gap-2">
          <Sparkles size={14} /> Retake AI Assessment
        </Link>
      </header>

      {/* Schedule Part */}
      <section className="space-y-8">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
                <div className="w-8 h-8 bg-[#d0ebff] rounded-lg flex items-center justify-center">
                    <CalendarIcon size={16} className="text-[#1971c2]" />
                </div>
                Your Academic Schedule
            </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // Loading skeletons
              [1,2,3].map((i) => (
                <div key={i} className="bg-gray-100 p-8 rounded-[40px] animate-pulse h-[300px]" />
              ))
            ) : schedule.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-6">
                <div className="w-20 h-20 bg-[#f8f9fa] rounded-3xl flex items-center justify-center">
                  <CalendarIcon size={32} className="text-[#adb5bd]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-[#2c3e50]">No scheduled classes yet</h3>
                  <p className="text-sm text-[#7f8c8d] max-w-md">
                    Browse available tutors and book your first session to get started with your learning journey.
                  </p>
                </div>
                <Link 
                  href="/dashboard/tutors" 
                  className="px-6 py-3 bg-[#748ffc] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#5c7cfa] transition-all flex items-center gap-2"
                >
                  <Users size={14} /> Find Tutors
                </Link>
              </div>
            ) : (
              schedule.map((item) => (
                <motion.div 
                    key={item.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedSelectedClass(item)}
                    className={`${item.color} p-8 rounded-[40px] shadow-sm border-2 border-white cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden`}
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BookOpen size={80} />
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="px-4 py-1.5 bg-white/50 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest">
                                {item.subject}
                            </div>
                            <div className={`p-2 bg-white rounded-xl ${item.iconColor}`}>
                                <Video size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-2xl font-black tracking-tight text-[#2c3e50]">{item.topic}</h4>
                            <div className="flex items-center gap-2 text-[#2c3e50]/60 font-bold text-xs uppercase tracking-tight">
                                <User size={14} /> {item.teacher}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-black/5 flex justify-between items-center">
                            <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-[#2c3e50]/40">
                                <Clock size={14} /> {item.time.split(' - ')[0]}
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-[#748ffc] group-hover:text-white transition-all">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                </motion.div>
              ))
            )}
        </div>
      </section>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedSelectedClass(null)}
                className="absolute inset-0 bg-[#2c3e50]/20 backdrop-blur-md" 
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-white rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-[#f1f3f5] overflow-hidden relative z-10"
            >
                <div className={`h-32 ${selectedClass.color} relative`}>
                    <button 
                        onClick={() => setSelectedSelectedClass(null)}
                        className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all text-[#2c3e50]"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute -bottom-8 left-10 w-16 h-16 bg-white rounded-3xl shadow-lg border-4 border-white flex items-center justify-center">
                         <BookOpen size={32} className={selectedClass.iconColor} />
                    </div>
                </div>

                <div className="p-10 pt-12 space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#748ffc]">
                            <Sparkles size={12} /> Confirmed Session
                        </div>
                        <h3 className="text-3xl font-black tracking-tight text-[#2c3e50]">{selectedClass.topic}</h3>
                        <p className="text-sm font-bold text-[#7f8c8d] uppercase tracking-widest">{selectedClass.subject} • {selectedClass.teacher}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-[#f8f9fa] rounded-3xl space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd]">Time Slot</p>
                            <p className="text-xs font-black text-[#2c3e50]">{selectedClass.time}</p>
                        </div>
                        <div className="p-5 bg-[#f8f9fa] rounded-3xl space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd]">Current Date</p>
                            <p className="text-xs font-black text-[#2c3e50]">{selectedClass.date}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#7f8c8d] ml-1">Learning Link</label>
                        <a 
                            href={selectedClass.meetLink} 
                            target="_blank" 
                            className="w-full bg-[#748ffc] text-white p-5 rounded-3xl flex items-center justify-between group hover:bg-[#5c7cfa] transition-all shadow-xl shadow-[#748ffc]/20"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Video size={20} />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest">Join Google Meet</span>
                            </div>
                            <ExternalLink size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                    </div>
                </div>

                <div className="px-10 py-6 bg-[#f8f9fa] border-t border-[#f1f3f5] text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Brighton Academic Framework v2.0</p>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
