'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, CheckCircle, XCircle, AlertCircle,
  BookOpen, ChevronRight, Video, RefreshCw, Send, X, CalendarDays, Star
} from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

interface Booking {
  id: string;
  date: string;
  meetLink: string | null;
  status: string;
  tutor?: { id: string; headline: string | null; user: { name: string | null; image: string | null } };
  student?: { user: { name: string | null; image: string | null } };
}

export default function BookingsPage() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('PENDING');

  // Reschedule modal
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchBookings = () => {
    setLoading(true);
    fetch('/api/bookings', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBookings(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [pathname]);

  const handleAction = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update booking');
        return;
      }
      fetchBookings();
    } catch (err: any) {
      alert(err.message ?? 'Unexpected error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking || !newDate) return;
    setRescheduling(true);
    try {
      const res = await fetch(`/api/bookings/${rescheduleBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date(newDate).toISOString() }),
      });
      if (res.ok) {
        setRescheduleBooking(null);
        setNewDate('');
        fetchBookings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reschedule');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRescheduling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking || !reviewBooking.tutor) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: reviewBooking.tutor.id,
          bookingId: reviewBooking.id,
          rating: reviewRating,
          comment: reviewComment || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to submit review');
        return;
      }
      setReviewBooking(null);
      setReviewRating(5);
      setReviewComment('');
      fetchBookings();
    } catch (err: any) {
      alert(err.message ?? 'Unexpected error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  const now = new Date();
  const isTutor = user?.role === 'TUTOR';
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const FILTER_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          {isTutor ? 'Booking ' : 'My '}<span className="text-primary">Requests</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          {isTutor ? 'Review and manage student booking requests.' : 'Track your booking requests and confirmations.'}
        </p>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-1.5 p-1.5 bg-p-purple/50 rounded-2xl w-fit border border-border">
        {FILTER_TABS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main'
            }`}
          >
            {f === 'PENDING' ? `Pending (${bookings.filter(b => b.status === 'PENDING').length})` : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface border-2 border-border rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
            <BookOpen size={28} className="text-primary" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-text-muted">
            No {filter.toLowerCase()} requests
          </p>
          {filter === 'PENDING' && (
            <p className="text-xs text-text-muted">When students book sessions with you, they'll appear here.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, i) => {
            const date = new Date(booking.date);
            const isPast = date < now;
            const studentName = booking.student?.user?.name ?? 'Student';
            const tutorName = booking.tutor?.user?.name ?? 'Tutor';

            let statusPill: string;
            let statusText: string;
            if (booking.status === 'CONFIRMED') {
              statusPill = 'bg-p-mint text-teal-700';
              statusText = 'Confirmed';
            } else if (booking.status === 'PENDING') {
              statusPill = 'bg-p-yellow text-amber-700';
              statusText = 'Pending';
            } else if (booking.status === 'COMPLETED') {
              statusPill = 'bg-p-blue text-blue-700';
              statusText = 'Completed';
            } else if (booking.status === 'CANCELLED') {
              statusPill = 'bg-p-rose text-rose-700';
              statusText = 'Cancelled';
            } else {
              statusPill = 'bg-p-purple text-purple-700';
              statusText = booking.status;
            }

            const showCancelBtn = isStudent && (booking.status === 'PENDING' || booking.status === 'CONFIRMED');
            const showRescheduleBtn = isStudent && booking.status === 'CONFIRMED' && !isPast;

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-surface border-2 border-border rounded-[24px] p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/8 transition-all ${isPast ? 'opacity-55' : ''}`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-p-purple rounded-2xl flex items-center justify-center shrink-0">
                      <Video size={20} className="text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-black text-sm text-text-main">
                        {isTutor ? studentName : (booking.tutor?.headline ?? 'Tutoring Session')}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-tight">
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {isTutor ? studentName : tutorName}
                        </span>
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

                  <div className="flex items-center gap-2.5 ml-auto shrink-0 flex-wrap">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusPill}`}>
                      {booking.status === 'CONFIRMED' ? <CheckCircle size={10} /> :
                       booking.status === 'COMPLETED' ? <CheckCircle size={10} /> :
                       booking.status === 'PENDING' ? <AlertCircle size={10} /> :
                       <XCircle size={10} />}
                      {statusText}
                    </div>

                    {showRescheduleBtn && (
                      <button
                        onClick={() => { setRescheduleBooking(booking); setNewDate(''); }}
                        className="px-3 py-1.5 bg-p-purple text-purple-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-200 transition-all flex items-center gap-1"
                      >
                        <CalendarDays size={10} /> Reschedule
                      </button>
                    )}

                    {showCancelBtn && (
                      <button
                        onClick={() => { if (confirm('Cancel this session?')) handleAction(booking.id, 'CANCELLED'); }}
                        disabled={actionLoading === booking.id}
                        className="px-3 py-1.5 bg-p-rose text-rose-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-200 transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        <XCircle size={10} />
                        Cancel
                      </button>
                    )}

                    {/* Student can rate completed bookings */}
                    {booking.status === 'COMPLETED' && isStudent && (
                      <button
                        onClick={() => { setReviewBooking(booking); setReviewRating(5); setReviewComment(''); }}
                        className="px-3 py-1.5 bg-p-yellow text-amber-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-200 transition-all flex items-center gap-1"
                      >
                        <Star size={10} /> Rate
                      </button>
                    )}

                    {booking.status === 'PENDING' && (isTutor || isAdmin) && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAction(booking.id, 'CONFIRMED')}
                          disabled={actionLoading === booking.id}
                          className="px-4 py-2 bg-p-mint text-teal-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-teal-200 transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          {actionLoading === booking.id ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction(booking.id, 'CANCELLED')}
                          disabled={actionLoading === booking.id}
                          className="px-4 py-2 bg-p-rose text-rose-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-200 transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <XCircle size={10} />
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Admin can mark confirmed bookings as completed */}
                    {booking.status === 'CONFIRMED' && isAdmin && isPast && (
                      <button
                        onClick={() => handleAction(booking.id, 'COMPLETED')}
                        disabled={actionLoading === booking.id}
                        className="px-3 py-1.5 bg-p-blue text-blue-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-200 transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle size={10} /> Complete
                      </button>
                    )}

                    {/* Tutor can mark as completed */}
                    {booking.status === 'CONFIRMED' && isTutor && isPast && (
                      <button
                        onClick={() => handleAction(booking.id, 'COMPLETED')}
                        disabled={actionLoading === booking.id}
                        className="px-3 py-1.5 bg-p-blue text-blue-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-200 transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle size={10} /> Complete
                      </button>
                    )}

                    {booking.status === 'CONFIRMED' && booking.meetLink && !isPast && (
                      <a
                        href={booking.meetLink}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-accent-strong transition-all shadow-sm shadow-primary/20"
                      >
                        <Video size={11} /> Join
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewBooking(null)}
              className="absolute inset-0 bg-text-main/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-surface rounded-[40px] shadow-[0_40px_100px_rgba(147,51,234,0.15)] border border-p-yellow overflow-hidden relative z-10"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black tracking-tight text-text-main">Rate Your Session</h3>
                  <button onClick={() => setReviewBooking(null)} className="p-2 hover:bg-p-purple rounded-xl">
                    <X size={16} className="text-text-muted" />
                  </button>
                </div>
                <p className="text-sm text-text-muted">
                  How was your session with <strong>{reviewBooking.tutor?.user?.name ?? 'your tutor'}</strong>?
                </p>

                {/* Star rating */}
                <div className="flex justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-all hover:scale-110"
                    >
                      <Star
                        size={36}
                        fill={star <= reviewRating ? '#fcc419' : 'none'}
                        className={star <= reviewRating ? 'text-[#fcc419]' : 'text-border'}
                      />
                    </button>
                  ))}
                </div>

                {/* Comment */}
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Write a review (optional)..."
                  rows={3}
                  className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewBooking(null)}
                    className="flex-1 py-3 border-2 border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:border-primary hover:text-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting}
                    className="flex-1 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                  >
                    {reviewSubmitting ? 'Submitting...' : <><Star size={14} /> Submit Rating</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRescheduleBooking(null)}
              className="absolute inset-0 bg-text-main/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-surface rounded-[40px] shadow-[0_40px_100px_rgba(147,51,234,0.15)] border border-p-purple overflow-hidden relative z-10"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black tracking-tight text-text-main">Reschedule Session</h3>
                  <button onClick={() => setRescheduleBooking(null)} className="p-2 hover:bg-p-purple rounded-xl">
                    <X size={16} className="text-text-muted" />
                  </button>
                </div>
                <p className="text-sm text-text-muted">
                  Pick a new date and time for your session.
                </p>
                <input
                  type="datetime-local"
                  value={newDate}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setRescheduleBooking(null)}
                    className="flex-1 py-3 border-2 border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:border-primary hover:text-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReschedule}
                    disabled={rescheduling || !newDate}
                    className="flex-1 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
                  >
                    {rescheduling ? 'Updating...' : <><Send size={14} /> Confirm</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}