'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, User, Clock, CheckCircle, XCircle, AlertCircle, BookOpen, Star as StarIcon, MessageSquare, X, Send } from 'lucide-react';
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

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

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
    if (filter === 'UPCOMING') return d >= now && b.status !== 'CANCELLED' && b.status !== 'COMPLETED';
    if (filter === 'PAST')     return d < now || b.status === 'COMPLETED' || b.status === 'CANCELLED';
    return true;
  });

  const handleSubmitReview = async () => {
    if (!reviewBooking || !user?.studentProfile?.id || !reviewBooking.tutor) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.studentProfile.id,
          tutorId: reviewBooking.tutor.id,
          bookingId: reviewBooking.id,
          rating: reviewRating,
          comment: reviewComment || null,
        }),
      });
      if (res.ok) {
        setReviewSuccess(true);
        setTimeout(() => {
          setReviewBooking(null);
          setReviewRating(5);
          setReviewComment('');
          setReviewSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

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
              filter === f ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface border-2 border-border rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-4">
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
            const isStudent  = user?.role === 'STUDENT';
            const otherPerson = user?.role === 'TUTOR'
              ? booking.student?.user?.name ?? 'Student'
              : booking.tutor?.user?.name ?? 'Tutor';
            const showReviewBtn = isStudent && booking.status === 'COMPLETED';

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-surface border-2 border-border border-l-4 ${statusCfg.border} rounded-[24px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/8 transition-all ${isPast ? 'opacity-55' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-p-purple rounded-2xl flex items-center justify-center shrink-0">
                    <Video size={20} className="text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-sm text-text-main">
                      {booking.tutor?.headline ?? (user?.role === 'TUTOR' ? (booking.student?.user?.name ?? 'Student') : 'Tutoring Session')}
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

                <div className="flex items-center gap-2.5 ml-auto shrink-0 flex-wrap">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusCfg.pill} ${statusCfg.pillText}`}>
                    <StatusIcon size={10} /> {statusCfg.label}
                  </div>
                  
                  {showReviewBtn && (
                    <button
                      onClick={() => { setReviewBooking(booking); setReviewRating(5); setReviewComment(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-p-yellow text-amber-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-200 transition-all"
                    >
                      <StarIcon size={10} /> Rate
                    </button>
                  )}

                  {booking.meetLink && !isPast && booking.status === 'CONFIRMED' && (
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

      {/* Review Modal */}
      <AnimatePresence>
        {reviewBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!submittingReview) setReviewBooking(null); }}
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
                  <h3 className="text-lg font-black tracking-tight text-text-main">
                    {reviewSuccess ? 'Thank You! 💜' : 'Rate Your Session'}
                  </h3>
                  {!submittingReview && (
                    <button
                      onClick={() => setReviewBooking(null)}
                      className="p-2 hover:bg-p-purple rounded-xl transition-all"
                    >
                      <X size={16} className="text-text-muted" />
                    </button>
                  )}
                </div>

                {reviewSuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-p-mint rounded-3xl flex items-center justify-center mx-auto">
                      <CheckCircle size={32} className="text-teal-600" />
                    </div>
                    <p className="text-sm font-bold text-text-muted">Your feedback helps other students find great tutors!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-text-muted">
                      How was your session with <strong className="text-text-main">{reviewBooking.tutor?.user?.name ?? 'your tutor'}</strong>?
                    </p>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-2 py-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="transition-all hover:scale-110"
                        >
                          <StarIcon
                            size={36}
                            fill={star <= reviewRating ? '#fcc419' : 'none'}
                            className={star <= reviewRating ? 'text-amber-400' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Comment */}
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience (optional)..."
                      rows={3}
                      className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-medium text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                    />

                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
                    >
                      {submittingReview ? (
                        <>Submitting...</>
                      ) : (
                        <><Send size={14} /> Submit Feedback</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}