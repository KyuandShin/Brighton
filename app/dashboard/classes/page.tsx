'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, User, Clock, CheckCircle, XCircle, AlertCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

interface Booking {
  id: string;
  date: string;
  meetLink: string | null;
  status: string;
  tutor?: { id: string; headline: string | null; user: { name: string | null; image: string | null } };
  student?: { user: { name: string | null; image: string | null } };
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  CONFIRMED: { label: 'Confirmed', bg: 'bg-[#d3f9d8]', text: 'text-[#2b8a3e]', icon: CheckCircle },
  PENDING:   { label: 'Pending',   bg: 'bg-[#fff3bf]', text: 'text-[#f08c00]', icon: AlertCircle },
  COMPLETED: { label: 'Completed', bg: 'bg-[#e5dbff]', text: 'text-[#7048e8]', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', bg: 'bg-[#ffe3e3]', text: 'text-[#e03131]', icon: XCircle },
};

export default function ClassesPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('UPCOMING');

  useEffect(() => {
    fetch('/api/bookings')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBookings(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const filtered = bookings.filter((b) => {
    const d = new Date(b.date);
    if (filter === 'UPCOMING') return d >= now && b.status !== 'CANCELLED';
    if (filter === 'PAST') return d < now || b.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          My <span className="text-primary">Classes</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          All your booked sessions in one place.
        </p>
      </header>

      <div className="flex gap-2 p-1.5 bg-[#f8f9fa] rounded-2xl w-fit border border-[#f1f3f5]">
        {(['ALL', 'UPCOMING', 'PAST'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? 'bg-white text-primary shadow-md' : 'text-[#adb5bd] hover:text-text-main'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-[#f8f9fa] rounded-[28px] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-4">
          <BookOpen size={40} className="mx-auto text-[#adb5bd]" />
          <p className="text-sm font-black uppercase tracking-widest text-[#adb5bd]">
            No {filter.toLowerCase()} sessions
          </p>
          {filter !== 'PAST' && (
            <Link
              href="/dashboard/tutors"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-[#5c7cfa] transition-all"
            >
              <User size={14} /> Find a Tutor
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking, i) => {
            const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG['PENDING'];
            const StatusIcon = statusCfg.icon;
            const date = new Date(booking.date);
            const isPast = date < now;
            const otherPerson = user?.role === 'TUTOR'
              ? booking.student?.user?.name ?? 'Student'
              : booking.tutor?.user?.name ?? 'Tutor';

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white border-2 border-[#f1f3f5] rounded-[28px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/20 transition-all ${isPast ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#f8f9fa] rounded-2xl flex items-center justify-center shrink-0">
                    <Video size={22} className="text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-text-main text-sm">
                      {booking.tutor?.headline ?? 'Tutoring Session'}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-text-muted uppercase tracking-tight">
                      <span className="flex items-center gap-1"><User size={11} /> {otherPerson}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusCfg.bg} ${statusCfg.text}`}>
                    <StatusIcon size={11} /> {statusCfg.label}
                  </div>

                  {booking.meetLink && !isPast && (
                    <button
                      onClick={() => router.push(booking.meetLink!)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#5c7cfa] transition-all shadow-md shadow-primary/20"
                    >
                      <Video size={12} /> Enter Classroom
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
