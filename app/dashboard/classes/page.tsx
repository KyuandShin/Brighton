'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

const STATUS_CONFIG: Record<string, { label: string; pill: string; pillText: string; border: string; icon: any }> = {
  CONFIRMED: { label: 'Confirmed', pill: 'bg-p-mint',   pillText: 'text-teal-700',   border: 'border-l-teal-400',   icon: CheckCircle },
  PENDING:   { label: 'Pending',   pill: 'bg-p-yellow', pillText: 'text-amber-700',  border: 'border-l-amber-400',  icon: AlertCircle },
  COMPLETED: { label: 'Completed', pill: 'bg-p-purple', pillText: 'text-purple-700', border: 'border-l-purple-400', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', pill: 'bg-p-rose',   pillText: 'text-rose-700',   border: 'border-l-rose-400',   icon: XCircle    },
};

export default function ClassesPage() {
  const { user }   = useCurrentUser();
  const router     = useRouter();
  const pathname   = usePathname();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'ALL' | 'UPCOMING' | 'PAST'>('UPCOMING');

  useEffect(() => {
    fetch('/api/bookings', { 
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBookings(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pathname]);

  const now      = new Date();
  const filtered = bookings.filter((b) => {
    const d = new Date(b.date);
    if (filter === 'UPCOMING') return d >= now && b.status !== 'CANCELLED';
    if (filter === 'PAST')     return d < now || b.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          My <span className="text-primary">Classes</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          All your booked sessions in one place.
        </p>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-1.5 p-1.5 bg-p-purple/50 rounded-2xl w-fit border border-border">
        {(['ALL', 'UPCOMING', 'PAST'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white border-2 border-border rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
            <BookOpen size={28} className="text-primary" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-text-muted">
            No {filter.toLowerCase()} sessions
          </p>
          {filter !== 'PAST' && (
            <Link
              href="/dashboard/tutors"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm shadow-primary/20 hover:bg-accent-strong transition-all"
            >
              <User size={13} /> Find a Tutor
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, i) => {
            const statusCfg  = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG['PENDING'];
            const StatusIcon = statusCfg.icon;
            const date       = new Date(booking.date);
            const isPast     = date < now;
            const otherPerson = user?.role === 'TUTOR'
              ? booking.student?.user?.name ?? 'Student'
              : booking.tutor?.user?.name ?? 'Tutor';

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white border-2 border-border border-l-4 ${statusCfg.border} rounded-[24px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/8 transition-all ${isPast ? 'opacity-55' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-p-purple rounded-2xl flex items-center justify-center shrink-0">
                    <Video size={20} className="text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-sm text-text-main">
                      {booking.tutor?.headline ?? 'Tutoring Session'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-tight">
                      <span className="flex items-center gap-1"><User size={10} /> {otherPerson}</span>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 ml-auto shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusCfg.pill} ${statusCfg.pillText}`}>
                    <StatusIcon size={10} /> {statusCfg.label}
                  </div>
                  {booking.meetLink && !isPast && (
                    <button
                      onClick={() => router.push(booking.meetLink!)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-accent-strong transition-all shadow-sm shadow-primary/20"
                    >
                      <Video size={11} /> Enter Classroom
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
