'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  ArrowLeft, Brain, BookOpen, Star, CheckCircle2, AlertCircle,
  TrendingUp, Target, Clock, Sparkles, User, FileText, GraduationCap,
  Loader2, MessageSquare, Home, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface SessionFeedback {
  subject: string;
  topics_covered: string[];
  understanding: {
    confident: string[];
    needs_practice: string[];
    struggling: string[];
    confidence_score: number | null;
  };
  notes_summary: string | null;
  homework: string | null;
  connection_to_assessment: {
    strengths_reinforced: string[];
    weaknesses_addressed: string[];
  };
  recommendations: string[];
  study_tips: string[];
  tutor_feedback: string;
}

interface BookingData {
  id: string;
  date: string;
  status: string;
  tutor?: { id: string; headline: string | null; user: { name: string | null; image: string | null } };
  student?: { user: { name: string | null } };
  notes?: { id: string; content: string; subject: string | null; topics: string[]; skills: any; homework: string | null; createdAt: string } | null;
  review?: { id: string; rating: number; comment: string | null } | null;
}

export default function SessionFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        // Fetch booking details
        const bookingRes = await fetch(`/api/bookings/${id}`, { credentials: 'include' });
        if (!bookingRes.ok) throw new Error('Could not find this session');
        const bookingData = await bookingRes.json();
        setBooking(bookingData);

        // Fetch AI feedback
        const feedbackRes = await fetch('/api/ai/session-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: id }),
        });
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          setFeedback(feedbackData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load session feedback');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface border-2 border-border rounded-xl animate-pulse" />
        <div className="h-64 bg-surface border-2 border-border rounded-[40px] animate-pulse" />
        <div className="h-48 bg-surface border-2 border-border rounded-[32px] animate-pulse" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-6">
        <div className="w-16 h-16 bg-p-rose rounded-3xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} className="text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-text-main">Session Not Found</h2>
        <p className="text-sm font-bold text-text-muted">{error || 'Could not load session details.'}</p>
        <Link
          href="/dashboard/classes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-strong transition-all"
        >
          <ArrowLeft size={13} /> Back to Classes
        </Link>
      </div>
    );
  }

  const sessionDate = new Date(booking.date);
  const isStudent = user?.role === 'STUDENT';
  const isTutor = user?.role === 'TUTOR';

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <header className="space-y-4">
        <button
          onClick={() => router.push('/dashboard/classes')}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all"
        >
          <ArrowLeft size={12} /> Back to Classes
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-p-mint rounded-2xl flex items-center justify-center">
            <Sparkles size={24} className="text-primary" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black tracking-tight text-text-main">
              Session <span className="gradient-text">Feedback</span>
            </h2>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {' · '}
              {sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </header>

      {/* Tutor / Student Info */}
      <div className="bg-surface border-2 border-border rounded-[32px] p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-p-purple rounded-2xl flex items-center justify-center">
          <User size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
            {isStudent ? 'Your Tutor' : 'Student'}
          </p>
          <p className="font-black text-sm text-text-main">
            {isStudent ? (booking.tutor?.user?.name || 'Tutor') : (booking.student?.user?.name || 'Student')}
          </p>
          {booking.tutor?.headline && (
            <p className="text-[10px] font-bold text-text-muted">{booking.tutor.headline}</p>
          )}
        </div>
        <div className="ml-auto">
          <span className="px-3 py-1.5 bg-p-mint rounded-full text-[9px] font-black text-teal-700 uppercase tracking-widest">
            {booking.status}
          </span>
        </div>
      </div>

      {/* AI Feedback Section */}
      {feedback && (
        <>
          {/* Topics Covered */}
          {feedback.topics_covered.length > 0 && (
            <div className="bg-surface border-2 border-border rounded-[32px] p-6 space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                <Brain size={14} className="text-primary" /> Topics Covered
              </h3>
              <div className="flex flex-wrap gap-2">
                {feedback.topics_covered.map((topic, i) => (
                  <span key={i} className="px-3 py-1.5 bg-p-purple rounded-full text-[10px] font-black text-primary">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Understanding Levels */}
          {feedback.understanding.confidence_score !== null && (
            <div className="bg-surface border-2 border-border rounded-[32px] p-6 space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                <Target size={14} className="text-primary" /> Understanding
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-p-mint to-teal-200">
                  <span className="text-xl font-black text-teal-700">{feedback.understanding.confidence_score}%</span>
                </div>
                <p className="text-[10px] font-bold text-text-muted">Session confidence score</p>
              </div>
              <div className="space-y-2">
                {feedback.understanding.confident.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-p-mint/30 rounded-2xl border border-teal-200">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-teal-700">Confident</p>
                      <p className="text-xs font-bold text-text-main">{feedback.understanding.confident.join(', ')}</p>
                    </div>
                  </div>
                )}
                {feedback.understanding.needs_practice.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-p-yellow/30 rounded-2xl border border-amber-200">
                    <RefreshCw size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Needs Practice</p>
                      <p className="text-xs font-bold text-text-main">{feedback.understanding.needs_practice.join(', ')}</p>
                    </div>
                  </div>
                )}
                {feedback.understanding.struggling.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-p-rose/30 rounded-2xl border border-rose-200">
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-700">Struggling</p>
                      <p className="text-xs font-bold text-text-main">{feedback.understanding.struggling.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Summary */}
          {feedback.notes_summary && (
            <div className="bg-surface border-2 border-border rounded-[32px] p-6 space-y-3">
              <h3 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                <FileText size={14} className="text-primary" /> Session Notes
              </h3>
              <p className="text-sm font-medium text-text-muted leading-relaxed">{feedback.notes_summary}</p>
              {booking.notes && (
                <button
                  onClick={() => router.push(`/dashboard/classes`)}
                  className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  View full notes in Classes →
                </button>
              )}
            </div>
          )}

          {/* Homework */}
          {feedback.homework && (
            <div className="bg-surface border-2 border-border rounded-[32px] p-6 space-y-3">
              <h3 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                <GraduationCap size={14} className="text-primary" /> Homework
              </h3>
              <p className="text-sm font-bold text-text-main">{feedback.homework}</p>
            </div>
          )}

          {/* Connection to Assessment */}
          {(feedback.connection_to_assessment.strengths_reinforced.length > 0 || feedback.connection_to_assessment.weaknesses_addressed.length > 0) && (
            <div className="bg-surface border-2 border-border rounded-[32px] p-6 space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" /> Connected to Your Assessments
              </h3>
              {feedback.connection_to_assessment.strengths_reinforced.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-p-mint/30 rounded-2xl">
                  <CheckCircle2 size={14} className="text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-teal-700">Strengths Reinforced</p>
                    <p className="text-xs font-bold text-text-main">{feedback.connection_to_assessment.strengths_reinforced.join(', ')}</p>
                  </div>
                </div>
              )}
              {feedback.connection_to_assessment.weaknesses_addressed.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-p-yellow/30 rounded-2xl">
                  <Target size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Weaknesses Addressed</p>
                    <p className="text-xs font-bold text-text-main">{feedback.connection_to_assessment.weaknesses_addressed.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-p-purple/10 to-p-mint/10 border-2 border-border rounded-[32px] p-6 space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
              <Sparkles size={14} className="text-primary" /> Recommendations
            </h3>
            <ul className="space-y-2">
              {feedback.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-black text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm font-medium text-text-main leading-relaxed">{rec}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Study Tips */}
          {feedback.study_tips.length > 0 && (
            <div className="bg-surface border-2 border-border rounded-[32px] p-6 space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
                <BookOpen size={14} className="text-primary" /> Study Tips
              </h3>
              <div className="grid gap-2">
                {feedback.study_tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-elevated rounded-2xl">
                    <Sparkles size={12} className="text-primary shrink-0 mt-1" />
                    <p className="text-xs font-bold text-text-muted">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Section */}
      {isStudent && (
        <div className="bg-surface border-2 border-border rounded-[32px] p-6 space-y-4">
          <h3 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
            <Star size={14} className="text-amber-500" /> Your Review
          </h3>
          {booking.review ? (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    fill={star <= (booking.review?.rating || 0) ? '#fcc419' : 'none'}
                    className={star <= (booking.review?.rating || 0) ? 'text-amber-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              {booking.review?.comment && (
                <p className="text-sm font-medium text-text-muted">&ldquo;{booking.review.comment}&rdquo;</p>
              )}
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                {booking.review?.rating}/5 stars
              </p>
            </div>
          ) : (
            <p className="text-sm font-bold text-text-muted">
              You haven't left a review yet. 
              <Link href={`/dashboard/classes`} className="text-primary hover:underline ml-1">
                Review this session
              </Link>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/dashboard/classes"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-surface border-2 border-border rounded-2xl font-black text-[10px] uppercase tracking-widest text-text-muted hover:border-primary hover:text-primary transition-all"
        >
          <Home size={13} /> All Classes
        </Link>
        <Link
          href="/dashboard/tutors"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-strong transition-all shadow-lg shadow-primary/20"
        >
          <Sparkles size={13} /> Book Another Session
        </Link>
      </div>
    </div>
  );
}