'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, User, Clock, CheckCircle, XCircle, AlertCircle, BookOpen, Star as StarIcon, MessageSquare, X, Send, FileText, Edit3, Brain, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { toast } from 'sonner';

interface Booking {
  id: string;
  date: string;
  meetLink: string | null;
  status: string;
  tutor?: { id: string; headline: string | null; user: { name: string | null; image: string | null } };
  student?: { id: string; user: { name: string | null; image: string | null } };
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

  // Enhanced notes state (declared before openPanel to avoid hoisting issues)
  const [notesSubject, setNotesSubject] = useState('');
  const [notesTopics, setNotesTopics] = useState<string[]>([]);
  const [notesHomework, setNotesHomework] = useState('');
  const [notesConfident, setNotesConfident] = useState('');
  const [notesNeedsPractice, setNotesNeedsPractice] = useState('');
  const [notesStruggling, setNotesStruggling] = useState('');

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

  // Panel tab
  const [panelTab, setPanelTab] = useState<'overview' | 'assessments' | 'notes' | 'review'>('overview');
  
  // Assessment data for tutor view
  const [studentAssessments, setStudentAssessments] = useState<any[] | null>(null);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const isStudent = user?.role === 'STUDENT';
  const isTutor   = user?.role === 'TUTOR';

  // Fetch assessments when tutor opens the tab
  useEffect(() => {
    if (panelTab === 'assessments' && isTutor && panelBooking?.student?.id && !studentAssessments && !loadingAssessments) {
      setLoadingAssessments(true);
      fetch(`/api/students/assessments?studentId=${panelBooking.student.id}`)
        .then(r => r.json())
        .then(data => {
          setStudentAssessments(data.attempts || []);
        })
        .catch(console.error)
        .finally(() => setLoadingAssessments(false));
    }
  }, [panelTab, isTutor, panelBooking?.student?.id]);

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

  // Separate pending from confirmed/upcoming so we can show a distinct section
  const pendingInUpcoming = filter === 'UPCOMING' ? filtered.filter(b => b.status === 'PENDING') : [];
  const activeInUpcoming  = filter === 'UPCOMING' ? filtered.filter(b => b.status !== 'PENDING') : filtered;

  // ── Open the post-session panel ──────────────────────────────────────
  const openPanel = (booking: Booking) => {
    setPanelBooking(booking);
    setPanelTab('overview');
    setNotesContent(booking.notes?.content ?? '');
    setNotesSubject('');
    setNotesTopics([]);
    setNotesHomework('');
    setNotesConfident('');
    setNotesNeedsPractice('');
    setNotesStruggling('');
    setReviewRating(5);
    setReviewComment(booking.review?.comment ?? '');
    setNotesSuccess(false);
    setReviewSuccess(false);
    setStudentAssessments(null);
    setLoadingAssessments(false);
  };

  const closePanel = () => {
    setPanelBooking(null);
    setSubmittingNotes(false);
    setSubmittingReview(false);
  };

  const AVAILABLE_TOPICS: Record<string, string[]> = {
    'Mathematics': ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fractions', 'Decimals', 'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Probability', 'Linear Equations', 'Quadratic Equations', 'Exponents', 'Ratios', 'Percentages', 'Square Roots'],
    'Science': ['Plants', 'Animals', 'Human Body', 'Solar System', 'Weather', 'Energy', 'Forces', 'Matter', 'Chemistry', 'Physics', 'Biology', 'Ecosystems', 'Water Cycle', 'Light', 'Sound', 'Electricity'],
    'Filipino': ['Pagbaybay', 'Pangngalan', 'Pandiwa', 'Pang-uri', 'Pang-abay', 'Panghalip', 'Gramatika', 'Panitikan', 'Pagbasa', 'Pagsulat', 'Alpabeto', 'Bantas', 'Talasalitaan', 'Idyoma'],
    'English': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Parts of Speech', 'Verb Tenses', 'Sentence Structure', 'Figurative Language', 'Literary Devices', 'Phonics', 'Spelling', 'Punctuation'],
  };

  // ── Submit session notes (tutor only) ────────────────────────────────
  const handleSubmitNotes = async () => {
    if (!panelBooking || !notesContent.trim()) return;
    
    // Build skills object
    const skills: Record<string, string[]> = {};
    if (notesConfident.trim()) skills.Confident = notesConfident.split(',').map(s => s.trim()).filter(Boolean);
    if (notesNeedsPractice.trim()) skills.NeedsPractice = notesNeedsPractice.split(',').map(s => s.trim()).filter(Boolean);
    if (notesStruggling.trim()) skills.Struggling = notesStruggling.split(',').map(s => s.trim()).filter(Boolean);
    setSubmittingNotes(true);
    try {
      const res = await fetch('/api/session-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: panelBooking.id,
          content: notesContent.trim(),
          subject: notesSubject || null,
          topics: notesTopics,
          skills: Object.keys(skills).length > 0 ? skills : null,
          homework: notesHomework.trim() || null,
        }),
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
          prev ? {
            ...prev,
            notes: {
              id: updatedNote.id,
              content: updatedNote.content,
              createdAt: updatedNote.createdAt,
            }
          } : prev
        );
        setTimeout(() => setNotesSuccess(false), 2000);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save notes');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong while saving notes');
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
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong while submitting your review');
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
        <div className="space-y-6">
          {/* Pending (awaiting confirmation) section shown in UPCOMING */}
          {pendingInUpcoming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Awaiting Confirmation ({pendingInUpcoming.length})</span>
              </div>
              {pendingInUpcoming.map((booking, i) => {
                const statusCfg  = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG['PENDING'];
                const StatusIcon = statusCfg.icon;
                const date       = new Date(booking.date);
                const otherPerson = isTutor
                  ? booking.student?.user?.name ?? 'Student'
                  : booking.tutor?.user?.name ?? 'Tutor';
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`bg-surface border-2 border-border border-l-4 ${statusCfg.border} rounded-[24px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-p-yellow rounded-2xl flex items-center justify-center shrink-0">
                        <AlertCircle size={20} className="text-amber-500" />
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
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-1">Waiting for tutor to confirm</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 ml-auto shrink-0">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusCfg.pill} ${statusCfg.pillText}`}>
                        <StatusIcon size={10} /> {statusCfg.label}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Confirmed / all other sessions */}
          {activeInUpcoming.length > 0 && (
            <div className="space-y-3">
              {activeInUpcoming.map((booking, i) => {
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
                      {isCompleted && (
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
                  ...(isTutor ? [{ key: 'assessments' as const, label: 'Assessments', icon: Brain }] : []),
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

                    {/* Link to full feedback page */}
                    <Link
                      href={`/dashboard/sessions/${panelBooking.id}/feedback`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-p-purple to-p-mint text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:shadow-lg transition-all"
                    >
                      <TrendingUp size={12} /> View Full AI Feedback
                    </Link>

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

                {/* ── Assessments Tab ──────────────────────────────────── */}
                {panelTab === 'assessments' && (
                  <div className="space-y-4">
                    {isTutor ? (
                      <>
                        <div className="space-y-2">
                          <h4 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                            <Brain size={12} /> Student's AI Assessments
                          </h4>
                          <p className="text-[10px] font-bold text-text-muted">
                            View the student's performance on AI placement tests.
                          </p>
                        </div>
                        {loadingAssessments ? (
                          <div className="space-y-3 py-4">
                            {[1, 2].map(i => (
                              <div key={i} className="h-16 bg-surface-elevated rounded-2xl animate-pulse" />
                            ))}
                          </div>
                        ) : studentAssessments && studentAssessments.length > 0 ? (
                          <div className="space-y-2">
                            {studentAssessments.map((a: any) => {
                              const pct = Math.round((a.score / a.total) * 100);
                              return (
                                <div key={a.id} className="bg-surface-elevated border border-border rounded-2xl p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                        pct >= 80 ? 'bg-p-mint' : pct >= 60 ? 'bg-p-yellow' : 'bg-p-rose'
                                      }`}>
                                        <Target size={14} className={
                                          pct >= 80 ? 'text-teal-600' : pct >= 60 ? 'text-amber-600' : 'text-rose-600'
                                        } />
                                      </div>
                                      <div>
                                        <p className="font-black text-xs text-text-main">{a.grade_label}</p>
                                        <p className="text-[9px] font-bold text-text-muted">
                                          {new Date(a.timestamp).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-black text-sm text-text-main">{a.score}/{a.total}</p>
                                      <p className="text-[9px] font-black text-text-muted">{pct}%</p>
                                    </div>
                                  </div>
                                  {a.mastery && (
                                    <div className="px-2.5 py-1 bg-p-yellow/50 rounded-full text-[8px] font-black text-amber-700 w-fit">
                                      {a.mastery}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 space-y-3">
                            <div className="w-14 h-14 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
                              <Brain size={24} className="text-primary" />
                            </div>
                            <p className="text-sm font-black text-text-muted">No assessments yet</p>
                            <p className="text-[10px] font-bold text-text-muted">
                              This student hasn't taken any AI assessments.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-14 h-14 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
                          <Brain size={24} className="text-primary" />
                        </div>
                        <p className="text-sm font-black text-text-muted">Your Assessments</p>
                        <p className="text-[10px] font-bold text-text-muted">
                          View your full assessment history in Test History.
                        </p>
                        <Link
                          href="/dashboard/test-history"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-accent-strong transition-all"
                        >
                          <TrendingUp size={11} /> View History
                        </Link>
                      </div>
                    )}
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
                        {/* Subject Selector */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Subject</label>
                          <div className="flex gap-1.5 flex-wrap">
                            {['Mathematics', 'Science', 'Filipino', 'English'].map(subject => (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => {
                                  setNotesSubject(subject);
                                  setNotesTopics([]);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border-2 ${
                                  notesSubject === subject
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-surface-elevated text-text-muted border-border hover:border-primary/30'
                                }`}
                              >
                                {subject}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Topics (shown when subject selected) */}
                        {notesSubject && AVAILABLE_TOPICS[notesSubject] && (
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Topics Covered</label>
                            <div className="flex flex-wrap gap-1.5">
                              {AVAILABLE_TOPICS[notesSubject].map(topic => {
                                const isSelected = notesTopics.includes(topic);
                                return (
                                  <button
                                    key={topic}
                                    type="button"
                                    onClick={() => {
                                      setNotesTopics(prev =>
                                        isSelected ? prev.filter(t => t !== topic) : [...prev, topic]
                                      );
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                      isSelected
                                        ? 'bg-p-purple text-primary'
                                        : 'bg-surface-elevated text-text-muted hover:bg-p-purple/30'
                                    }`}
                                  >
                                    {topic}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Understanding Levels */}
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Student Understanding</label>
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                              <input
                                type="text"
                                value={notesConfident}
                                onChange={(e) => setNotesConfident(e.target.value)}
                                placeholder="Confident: e.g. Algebra, Fractions"
                                className="flex-1 bg-surface-elevated border-2 border-border rounded-xl px-3 py-2 text-[10px] font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              <input
                                type="text"
                                value={notesNeedsPractice}
                                onChange={(e) => setNotesNeedsPractice(e.target.value)}
                                placeholder="Needs practice: e.g. Geometry, Decimals"
                                className="flex-1 bg-surface-elevated border-2 border-border rounded-xl px-3 py-2 text-[10px] font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              <input
                                type="text"
                                value={notesStruggling}
                                onChange={(e) => setNotesStruggling(e.target.value)}
                                placeholder="Struggling: e.g. Trigonometry"
                                className="flex-1 bg-surface-elevated border-2 border-border rounded-xl px-3 py-2 text-[10px] font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Homework */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Homework Assigned</label>
                          <textarea
                            value={notesHomework}
                            onChange={(e) => setNotesHomework(e.target.value)}
                            placeholder="e.g. Complete pages 25-30 of the workbook, watch Khan Academy video on solving equations"
                            rows={2}
                            className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-[10px] font-bold text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                          />
                        </div>

                        {/* Free-form Notes */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Detailed Notes</label>
                          <textarea
                            value={notesContent}
                            onChange={(e) => setNotesContent(e.target.value)}
                            placeholder="e.g. Today we covered algebra fundamentals — solving linear equations using inverse operations. The student did well with one-step equations but needs more practice with two-step problems."
                            rows={6}
                            className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-medium text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                          />
                        </div>
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