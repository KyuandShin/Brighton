'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, Video, User,
  ChevronRight, Sparkles, X, BookOpen, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser, getFirstName } from '@/lib/hooks/useCurrentUser';

const CARD_COLORS = [
  { bg: 'bg-[#d0ebff]', icon: 'text-[#1971c2]' },
  { bg: 'bg-[#d3f9d8]', icon: 'text-[#2b8a3e]' },
  { bg: 'bg-[#ffd6e8]', icon: 'text-[#d6336c]' },
  { bg: 'bg-[#fff3bf]', icon: 'text-[#f08c00]' },
  { bg: 'bg-[#e5dbff]', icon: 'text-[#7048e8]' },
];

interface Booking {
  id: string;
  date: string;
  meetLink: string | null;
  status: string;
  tutor?: { headline: string | null; user: { name: string | null; image: string | null } };
  student?: { user: { name: string | null } };
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bookings')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBookings(data); })
      .catch(console.error)
      .finally(() => setBookingsLoading(false));
  }, []);

  const firstName = userLoading ? '...' : getFirstName(user?.name);
  const todayStr = new Date().toDateString();
  const todayBookings = bookings.filter((b) => new Date(b.date).toDateString() === todayStr);
  const upcomingBookings = bookings.filter((b) => new Date(b.date) >= new Date());

  const handleJoin = (booking: Booking) => {
    if (booking.meetLink) {
      router.push(booking.meetLink);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-[#2c3e50]">
            Welcome Back, <span className="text-[#748ffc]">{firstName}!</span> 👋
          </h2>
          <p className="text-[#7f8c8d] font-bold text-xs uppercase tracking-widest">
            {bookingsLoading
              ? 'Loading your schedule...'
              : todayBookings.length === 0
              ? 'No sessions scheduled for today.'
              : `You have ${todayBookings.length} session${todayBookings.length > 1 ? 's' : ''} today.`}
          </p>
        </div>
        <Link
          href="/dashboard/test"
          className="px-6 py-3 bg-[#fff3bf] text-[#f08c00] rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-[#fff3bf]/40 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Sparkles size={14} /> Retake AI Assessment
        </Link>
      </header>

      <section className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
            <div className="w-8 h-8 bg-[#d0ebff] rounded-lg flex items-center justify-center">
              <CalendarIcon size={16} className="text-[#1971c2]" />
            </div>
            Upcoming Sessions
          </h3>
          <Link href="/dashboard/calendar" className="text-[10px] font-black uppercase tracking-widest text-[#748ffc] hover:underline">
            View Calendar →
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="bg-[#f8f9fa] rounded-[40px] h-64 animate-pulse" />)}
          </div>
        ) : upcomingBookings.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#e9ecef] rounded-[40px] p-16 text-center space-y-4">
            <CalendarIcon size={40} className="mx-auto text-[#adb5bd]" />
            <p className="text-sm font-black uppercase tracking-widest text-[#adb5bd]">No upcoming sessions</p>
            <Link href="/dashboard/tutors" className="inline-flex items-center gap-2 px-6 py-3 bg-[#748ffc] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#748ffc]/20 hover:bg-[#5c7cfa] transition-all">
              <User size={14} /> Find a Tutor
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingBookings.map((booking, i) => {
              const colors = CARD_COLORS[i % CARD_COLORS.length];
              const sessionDate = new Date(booking.date);
              const tutorName = user?.role === 'TUTOR'
                ? booking.student?.user?.name ?? 'Student'
                : booking.tutor?.user?.name ?? 'Tutor';

              return (
                <motion.div
                  key={booking.id}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedBooking(booking)}
                  className={`${colors.bg} p-8 rounded-[40px] shadow-sm border-2 border-white cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BookOpen size={80} />
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="px-4 py-1.5 bg-white/50 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest">
                        {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className={`p-2 bg-white rounded-xl ${colors.icon}`}>
                        <Video size={18} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black tracking-tight text-[#2c3e50] line-clamp-2">
                        {booking.tutor?.headline ?? 'Tutoring Session'}
                      </h4>
                      <div className="flex items-center gap-2 text-[#2c3e50]/60 font-bold text-xs uppercase tracking-tight">
                        <User size={14} /> {tutorName}
                      </div>
                    </div>
                    <div className="pt-6 border-t border-black/5 flex justify-between items-center">
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-[#2c3e50]/40">
                        <Clock size={14} />
                        {sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-[#748ffc] group-hover:text-white transition-all">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-[#2c3e50]/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-[#f1f3f5] overflow-hidden relative z-10"
            >
              <div className="h-32 bg-[#d0ebff] relative">
                <button onClick={() => setSelectedBooking(null)} className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all text-[#2c3e50]">
                  <X size={20} />
                </button>
                <div className="absolute -bottom-8 left-10 w-16 h-16 bg-white rounded-3xl shadow-lg border-4 border-white flex items-center justify-center">
                  <BookOpen size={32} className="text-[#1971c2]" />
                </div>
              </div>

              <div className="p-10 pt-12 space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#748ffc]">
                    <Sparkles size={12} /> Confirmed Session
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-[#2c3e50]">
                    {selectedBooking.tutor?.headline ?? 'Tutoring Session'}
                  </h3>
                  <p className="text-sm font-bold text-[#7f8c8d] uppercase tracking-widest">
                    {user?.role === 'TUTOR'
                      ? selectedBooking.student?.user?.name
                      : selectedBooking.tutor?.user?.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-[#f8f9fa] rounded-3xl space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd]">Date</p>
                    <p className="text-xs font-black text-[#2c3e50]">
                      {new Date(selectedBooking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="p-5 bg-[#f8f9fa] rounded-3xl space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd]">Time</p>
                    <p className="text-xs font-black text-[#2c3e50]">
                      {new Date(selectedBooking.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {selectedBooking.meetLink ? (
                  <button
                    onClick={() => handleJoin(selectedBooking)}
                    className="w-full bg-[#748ffc] text-white p-5 rounded-3xl flex items-center justify-between group hover:bg-[#5c7cfa] transition-all shadow-xl shadow-[#748ffc]/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white/20 rounded-xl"><Video size={20} /></div>
                      <span className="font-black text-xs uppercase tracking-widest">Enter Classroom</span>
                    </div>
                    <ExternalLink size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <div className="p-5 bg-[#f8f9fa] rounded-3xl text-center text-[10px] font-black uppercase tracking-widest text-[#adb5bd]">
                    Classroom link not yet available
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
