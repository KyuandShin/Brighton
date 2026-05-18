'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { motion } from 'framer-motion';
import {
  Sparkles, Brain, TrendingUp, Clock, User, Star, 
  BookOpen, ArrowRight, Calendar, Target, MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface BookingWithFeedback {
  id: string;
  date: string;
  status: string;
  tutor?: { id: string; headline: string | null; user: { name: string | null; image: string | null } };
  notes?: { id: string; content: string; subject: string | null; topics: string[]; createdAt: string } | null;
  review?: { id: string; rating: number; comment: string | null } | null;
}

export default function FeedbackHubPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [completedSessions, setCompletedSessions] = useState<BookingWithFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        const res = await fetch('/api/bookings', { credentials: 'include' });
        const data = await res.json();
        if (Array.isArray(data)) {
          const completed = data
            .filter((b: any) => b.status === 'COMPLETED')
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setCompletedSessions(completed);
        }
      } catch (err) {
        console.error('Failed to fetch completed sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompleted();
  }, []);

  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          Session <span className="gradient-text">Insights</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          {isStudent
            ? 'Review AI-powered feedback from your completed tutoring sessions.'
            : 'Review feedback and notes from your completed sessions.'}
        </p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface border-2 border-border rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : completedSessions.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-6">
          <div className="w-16 h-16 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
            <Brain size={28} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-text-main">No completed sessions yet</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
              {isStudent
                ? 'Once you complete a tutoring session, you\'ll find AI-powered feedback and insights here.'
                : 'Once you complete a tutoring session, feedback and insights will appear here.'}
            </p>
          </div>
          <Link
            href="/dashboard/tutors"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #20c997 0%, #0ca678 100%)' }}
          >
            <BookOpen size={14} /> {isStudent ? 'Find a Tutor' : 'View Classes'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {completedSessions.map((session, idx) => {
            const date = new Date(session.date);
            const hasFeedback = session.notes || session.review;
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => router.push(`/dashboard/sessions/${session.id}/feedback`)}
                className="bg-surface border-2 border-border rounded-[24px] p-5 flex items-center justify-between hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-p-mint to-teal-200 rounded-2xl flex items-center justify-center">
                    <Brain size={20} className="text-teal-700" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black text-sm text-text-main group-hover:text-primary transition-colors">
                      {isStudent
                        ? (session.tutor?.user?.name || 'Tutor Session')
                        : `Student Session`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-tight">
                      <span className="flex items-center gap-1">
                        <User size={9} />
                        {isStudent ? (session.tutor?.headline || 'Tutor') : (session.tutor?.user?.name || 'Student')}
                      </span>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={9} />
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {hasFeedback && (
                      <div className="flex gap-2 mt-1.5">
                        {session.notes && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-teal-600 bg-p-mint px-2 py-0.5 rounded-full flex items-center gap-1">
                            <MessageSquare size={8} /> Notes
                          </span>
                        )}
                        {session.review && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-700 bg-p-yellow px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star size={8} /> {session.review.rating}/5
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-text-muted">
                    {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-p-purple/60 flex items-center justify-center group-hover:bg-p-purple transition-all">
                    <ArrowRight size={14} className="text-primary" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stats summary */}
      {completedSessions.length > 0 && (
        <div className="bg-gradient-to-br from-p-purple/5 to-p-mint/5 border-2 border-border rounded-[32px] p-6 space-y-4">
          <h3 className="font-black text-xs uppercase tracking-widest text-text-main flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> Learning Stats
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-surface-elevated rounded-2xl">
              <p className="text-2xl font-black text-text-main">{completedSessions.length}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-text-muted mt-1">
                Sessions
              </p>
            </div>
            <div className="text-center p-4 bg-surface-elevated rounded-2xl">
              <p className="text-2xl font-black text-text-main">
                {completedSessions.filter(s => s.notes).length}
              </p>
              <p className="text-[8px] font-black uppercase tracking-widest text-text-muted mt-1">
                With Notes
              </p>
            </div>
            <div className="text-center p-4 bg-surface-elevated rounded-2xl">
              <p className="text-2xl font-black text-text-main">
                {completedSessions.filter(s => s.review).length}
              </p>
              <p className="text-[8px] font-black uppercase tracking-widest text-text-muted mt-1">
                Reviewed
              </p>
            </div>
          </div>
          {isStudent && (
            <Link
              href="/dashboard/test-history"
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-accent-strong transition-all"
            >
              <Target size={12} /> View AI Assessment History
            </Link>
          )}
        </div>
      )}
    </div>
  );
}