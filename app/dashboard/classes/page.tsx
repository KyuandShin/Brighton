'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, User, Clock, CheckCircle, XCircle, AlertCircle, BookOpen, Star as StarIcon, MessageSquare, X, Send, FileText, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

interface Booking {
  id: string;
  date: string;
  meetLink: string | null;
  status: string;
  tutor?: { id: string; headline: string | null; user: { name: string | null; image: string | null } };
  student?: { user: { name: string | null; image: string | null } };
  notes?: { id: string; content: string; createdAt: string } | null;
  review?: { id: string; rating: number; comment: string | null } | null;
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

  // Post-session panel state (notes + review)
  const [panelBooking, setPanelBooking] = useState<Booking | null>(null);

  // Session notes state (tutor writes)
  const [notesContent, setNotesContent] = useState('');
  const [submittingNotes, setSubmittingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  // Review state (student writes)
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Panel tab: 'notes' | 'review' | 'overview'
  const [panelTab, setPanelTab] = useState<'overview' | 'notes' | 'review'>('overview');

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

  // ── Open the post-session panel ──────────────────────────────────────
  const openPanel = (booking: Booking) => {
    setPanelBooking(booking);
    setPanelTab('overview');
    setNotesContent(booking.notes?.content ?? '');
    setReviewRating(5);
    setReviewComment(booking.review?.comment ?? '');
    setNotesSuccess(false);
    setReviewSuccess(false);
  };

  const closePanel = () => {
    setPanelBooking(null);
    setSubmittingNotes(false);
    setSubmittingReview(false);
  };

  // ── Submit session notes (tutor only) ────────────────────────────────
  const handleSubmitNotes = async () => {
    if (!panelBooking || !notesContent.trim()) return;
    setSubmittingNotes(true);
    try {
      const res = await fetch('/api/session-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: panelBooking.id, content: notesContent.trim() }),
      });
      if (res.ok) {
        const updatedNote = await res.json();
        setNotesSuccess(true);
        // Optimistically update local state
        setBookings((prev) =>
          prev.map((b) =>
            b.id === panelBooking.id
              ? { ...b, notes: { id: updatedNote.id, content: updatedNote.content, createdAt: updatedNote.createdAt } }
              : b
          )
        );
        setPanelBooking((prev) =>
          prev ? { ...prev, notes: { id: updatedNote.id, content: updatedNote.content, createdAt: updatedNote.createdAt } } : prev
        );
        setTimeout(() => setNotesSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingNotes(false);
    }
  };

  // ── Submit review (student only) ─────────────────────────────────────
  const handleSubmitReview = async () => {
    if (!panelBooking || !user?.studentProfile?.id || !panelBooking.tutor) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.studentProfile.id,
          tutorId: panelBooking.tutor.id,
          bookingId: panelBooking.id,
          rating: reviewRating,
          comment: reviewComment || null,
        }),
      });
      if (res.ok) {
        const createdReview = await res.json();
        setReviewSuccess(true);
        // Optimistically update local state
        setBookings((prev) =>
          prev.map((b) =>
            b.id === panelBooking.id
              ? { ...b, review: { id: createdReview.id, rating: reviewRating, comment: reviewComment || null } }
              : b
          )
        );
        setPanelBooking((prev) =>
          prev ? { ...prev, review: { id: createdReview.id, rating: reviewRating, comment: reviewComment || null } } : prev
        );
        setTimeout(() => setReviewSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const isStudent = user?.role === 'STUDENT';
  const isTutor   = user?.role === 'TUTOR';

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
            const otherPerson = isTutor
              ? booking.student?.user?.name ?? 'Student'
              : booking.tutor?.user?.name ?? 'Tutor';

            const hasNotes = !!booking.notes;
            const hasReview = !!booking.review;
            const isCompleted = booking.status === 'COMPLETED';
            const showPostActions = isCompleted;

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-surface border-2 border-border border-l-4 ${statusCfg.border} rounded-[24px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/8 transition-all ${isPast && !isCompleted ? 'opacity-55' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-p-purple rounded-2xl flex items-center justify-center shrink-0">
                    <Video size={20} className="text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-sm text-text-main">
                      {booking.tutor?.headline ?? (isTutor ? (booking.student?.user?.name ?? 'Student') : 'Tutoring Session')}
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
                    {/* Badges for notes & review */}
                    {isCompleted && (
                      <div className="flex gap-2 mt-1.5">
                        {hasNotes && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-teal-600 bg-p-mint px-2 py-0.5 rounded-full">
                            <FileText size={9} /> Notes ✓
                          </span>
                        )}
                        {hasReview && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-amber-700 bg-p-yellow px-2 py-0.5 rounded-full">
                            <StarIcon size={9} /> Reviewed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 ml-auto shrink-0 flex-wrap">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusCfg.pill} ${statusCfg.pillText}`}>
                    <StatusIcon size={10} /> {statusCfg.label}
                  </div>
                  
                  {/* Post-session button: opens the unified panel */}
                  {showPostActions && (
                    <button
                      onClick={() => openPanel(booking)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-p-purple/60 text-primary rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-p-purple transition-all"
                    >
                      <MessageSquare size={10} /> Session Details
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

      {/* ── Post-Session Unified Panel (slide-out) ────────────────────────── */}
      <AnimatePresence>
        {panelBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!submittingNotes && !submittingReview) closePanel(); }}
              className="absolute inset-0 bg-text-main/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-surface rounded-[40px] shadow-[0_40px_100px_rgba(147,51,234,0.15)] border border-p-purple overflow-hidden relative z-10"
            >
              {/* ── Panel Header ────────────────────────────────────────── */}
              <div className="flex items-center justify-between p-6 pb-2">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-text-main">
                    Session Details
                  </h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                    {new Date(panelBooking.date).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                    {' · '}
                    {new Date(panelBooking.date).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={closePanel}
                  className="p-2 hover:bg-p-purple rounded-xl transition-all"
                >
                  <X size={16} className="text-text-muted" />
                </button>
              </div>

              {/* ── Tab Navigation ──────────────────────────────────────── */}
              <div className="flex gap-1 p-1 mx-6 mb-2 bg-p-purple/50 rounded-xl border border-border">
                {[
                  { key: 'overview', label: 'Overview', icon: BookOpen },
                  { key: 'notes', label: isTutor ? 'My Notes' : 'Tutor Notes', icon: FileText },
                  { key: 'review', label: isStudent ? 'My Review' : 'Student Review', icon: StarIcon },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  // Only show review tab if student or if a review exists
                  if (tab.key === 'review' && !isStudent && !panelBooking.review) return null;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setPanelTab(tab.key as typeof panelTab)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        panelTab === tab.key
                          ? 'bg-surface text-primary shadow-sm'
                          : 'text-text-muted hover:text-text-main'
                      }`}
                    >
                      <TabIcon size={11} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ── Panel Content ───────────────────────────────────────── */}
              <div className="p-6 pt-2 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* ── Overview Tab ────────────────────────────────────── */}
                {panelTab === 'overview' && (
                  <div className="space-y-5">
                    <div className="bg-surface-elevated rounded-2xl p-5 space-y-3">
                      <h4 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                        <User size={12} /> {isTutor ? 'Student' : 'Tutor'}
                      </h4>
                      <p className="text-sm font-bold text-text-muted">
                        {isTutor
                          ? panelBooking.student?.user?.name ?? 'Student'
                          : panelBooking.tutor?.user?.name ?? 'Tutor'}
                      </p>
                    </div>

                    {/* Quick status of notes + review */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`rounded-2xl p-4 border-2 ${panelBooking.notes ? 'border-teal-300 bg-p-mint/30' : 'border-dashed border-border bg-surface-elevated/50'} space-y-2`}>
                        <FileText size={18} className={panelBooking.notes ? 'text-teal-600' : 'text-text-muted'} />
                        <p className="font-black text-[10px] uppercase tracking-widest text-text-main">Session Notes</p>
                        <p className="text-[9px] font-bold text-text-muted">
                          {panelBooking.notes
                            ? `Available — ${panelBooking.notes.content.slice(0, 60)}${panelBooking.notes.content.length > 60 ? '...' : ''}`
                            : isTutor ? 'Add notes for this session' : 'Not yet available'}
                        </p>
                        {isTutor && (
                          <button
                            onClick={() => setPanelTab('notes')}
                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                          >
                            {panelBooking.notes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                        )}
                      </div>
                      <div className={`rounded-2xl p-4 border-2 ${panelBooking.review ? 'border-amber-300 bg-p-yellow/30' : 'border-dashed border-border bg-surface-elevated/50'} space-y-2`}>
                        <StarIcon size={18} className={panelBooking.review ? 'text-amber-500' : 'text-text-muted'} />
                        <p className="font-black text-[10px] uppercase tracking-widest text-text-main">Review</p>
                        <p className="text-[9px] font-bold text-text-muted">
                          {panelBooking.review
                            ? `${panelBooking.review.rating}/5 stars`
                            : isStudent ? 'Share your feedback' : 'Not yet reviewed'}
                        </p>
                        {isStudent && !panelBooking.review && (
                          <button
                            onClick={() => setPanelTab('review')}
                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                          >
                            Write Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Notes Tab ─────────────────────────────────────────── */}
                {panelTab === 'notes' && (
                  <div className="space-y-4">
                    {isTutor ? (
                      <>
                        {/* Tutor: write/edit notes */}
                        <div className="space-y-2">
                          <h4 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                            <Edit3 size={12} /> {panelBooking.notes ? 'Edit Your Notes' : 'Write Session Notes'}
                          </h4>
                          <p className="text-[10px] font-bold text-text-muted">
                            Share key takeaways, topics covered, and follow-up tips for the student.
                          </p>
                        </div>
                        <textarea
                          value={notesContent}
                          onChange={(e) => setNotesContent(e.target.value)}
                          placeholder="e.g. Today we covered algebra fundamentals — solving linear equations using inverse operations. The student did well with one-step equations but needs more practice with two-step problems. Recommended exercises: Khan Academy Algebra Unit 1."
                          rows={6}
                          className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-medium text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                        />
                        {notesSuccess && (
                          <div className="flex items-center gap-2 text-teal-600 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle size={14} /> Notes saved!
                          </div>
                        )}
                        <button
                          onClick={handleSubmitNotes}
                          disabled={submittingNotes || !notesContent.trim()}
                          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          style={{ background: 'linear-gradient(135deg, #20c997 0%, #0ca678 100%)' }}
                        >
                          {submittingNotes ? (
                            <>Saving...</>
                          ) : (
                            <><Send size={14} /> {panelBooking.notes ? 'Update Notes' : 'Save Notes'}</>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Student: read tutor's notes */}
                        {panelBooking.notes ? (
                          <div className="space-y-3">
                            <h4 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                              <FileText size={12} /> Tutor's Session Notes
                            </h4>
                            <div className="bg-surface-elevated rounded-2xl p-5 border border-border">
                              <p className="text-sm font-medium text-text-main whitespace-pre-wrap leading-relaxed">
                                {panelBooking.notes.content}
                              </p>
                            </div>
                            <p className="text-[9px] font-bold text-text-muted">
                              Shared on {new Date(panelBooking.notes.createdAt).toLocaleDateString('en-US', {
                                month: 'long', day: 'numeric', year: 'numeric'
                              })}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-8 space-y-3">
                            <div className="w-14 h-14 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
                              <FileText size={24} className="text-primary" />
                            </div>
                            <p className="text-sm font-black text-text-muted">No notes yet</p>
                            <p className="text-[10px] font-bold text-text-muted">
                              Your tutor hasn't shared session notes for this class yet.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ── Review Tab ─────────────────────────────────────────── */}
                {panelTab === 'review' && (
                  <div className="space-y-4">
                    {isStudent ? (
                      <>
                        {/* Student: write review */}
                        {panelBooking.review ? (
                          <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 bg-p-mint rounded-3xl flex items-center justify-center mx-auto">
                              <CheckCircle size={32} className="text-teal-600" />
                            </div>
                            <h4 className="font-black text-sm text-text-main">Review Submitted ✓</h4>
                            <div className="flex justify-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                  key={star}
                                  size={24}
                                  fill={star <= (panelBooking.review?.rating ?? 0) ? '#fcc419' : 'none'}
                                  className={star <= (panelBooking.review?.rating ?? 0) ? 'text-amber-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                            {panelBooking.review?.comment && (
                              <p className="text-sm font-medium text-text-muted bg-surface-elevated rounded-2xl p-4 border border-border">
                                &ldquo;{panelBooking.review.comment}&rdquo;
                              </p>
                            )}
                          </div>
                        ) : reviewSuccess ? (
                          <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-p-mint rounded-3xl flex items-center justify-center mx-auto">
                              <CheckCircle size={32} className="text-teal-600" />
                            </div>
                            <p className="text-sm font-bold text-text-muted">Thank you! Your feedback helps other students find great tutors! 💜</p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <h4 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                                <StarIcon size={12} /> Rate Your Session
                              </h4>
                              <p className="text-sm text-text-muted">
                                How was your session with <strong className="text-text-main">{panelBooking.tutor?.user?.name ?? 'your tutor'}</strong>?
                              </p>
                            </div>

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
                      </>
                    ) : (
                      <>
                        {/* Tutor: read student's review */}
                        {panelBooking.review ? (
                          <div className="space-y-4">
                            <h4 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                              <StarIcon size={12} /> Student's Review
                            </h4>
                            <div className="bg-surface-elevated rounded-2xl p-5 border border-border space-y-3">
                              <div className="flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIcon
                                    key={star}
                                    size={22}
                                    fill={star <= (panelBooking.review?.rating ?? 0) ? '#fcc419' : 'none'}
                                    className={star <= (panelBooking.review?.rating ?? 0) ? 'text-amber-400' : 'text-gray-300'}
                                  />
                                ))}
                              </div>
                              {panelBooking.review?.comment && (
                                <p className="text-sm font-medium text-text-main text-center leading-relaxed">
                                  &ldquo;{panelBooking.review.comment}&rdquo;
                                </p>
                              )}
                              <p className="text-center text-[9px] font-bold text-text-muted uppercase tracking-widest">
                                {panelBooking.review?.rating}/5 stars
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 space-y-3">
                            <div className="w-14 h-14 bg-p-yellow/50 rounded-3xl flex items-center justify-center mx-auto">
                              <StarIcon size={24} className="text-amber-400" />
                            </div>
                            <p className="text-sm font-black text-text-muted">Not yet reviewed</p>
                            <p className="text-[10px] font-bold text-text-muted">
                              The student hasn't left a review for this session yet.
                            </p>
                          </div>
                        )}
                      </>
                    )}
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