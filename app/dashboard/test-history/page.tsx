'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Brain, TrendingUp, Target, CheckCircle2, Calendar, ChevronRight, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Attempt {
  id: string;
  score: number;
  total: number;
  mastery: string | null;
  strengths: any[];
  weaknesses: any[];
  studyPlan: string | null;
  timestamp: string;
  test: {
    level: string;
    subject: { name: string };
  };
}

export default function TestHistoryPage() {
  const { user } = useCurrentUser();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentProfile?.id) { setLoading(false); return; }
    fetch(`/api/test-history?studentId=${user.studentProfile.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAttempts(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.studentProfile?.id]);

  const latestAttempt = attempts[0];
  const prevAttempt = attempts[1];
  const improved = latestAttempt && prevAttempt
    ? latestAttempt.score > prevAttempt.score
    : null;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-p-purple rounded-full w-fit">
          <Brain size={12} className="text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Test History</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          Your <span className="gradient-text">Progress</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          Track your improvement across AI assessments.
        </p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface border-2 border-border rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-6">
          <div className="w-16 h-16 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
            <Brain size={28} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-text-main">No test history yet</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
              Take your first AI placement test to see your results here and track your progress!
            </p>
          </div>
          <Link
            href="/dashboard/test"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
          >
            <Sparkles size={14} /> Take Assessment
          </Link>
        </div>
      ) : (
        <>
          {/* Latest Score Hero */}
          {latestAttempt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border-2 border-border rounded-[40px] p-8 overflow-hidden relative"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-p-purple/20 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-p-purple to-pink-200 rounded-3xl flex items-center justify-center shadow-md">
                    <Brain size={36} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Latest Score</p>
                    <p className="text-4xl font-black text-text-main">
                      {latestAttempt.score}<span className="text-lg text-text-muted">/{latestAttempt.total}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="px-2.5 py-0.5 bg-p-mint rounded-full text-[9px] font-black text-teal-700">
                        {Math.round((latestAttempt.score / latestAttempt.total) * 100)}%
                      </div>
                      {improved !== null && (
                        <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${improved ? 'text-teal-600' : 'text-rose-600'}`}>
                          {improved ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          {improved ? 'Improved' : 'Declined'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-auto">
                  {latestAttempt.mastery && (
                    <div className="px-4 py-2 bg-p-yellow rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-700">
                      🏆 {latestAttempt.mastery}
                    </div>
                  )}
                  <p className="text-[10px] font-bold text-text-muted flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(latestAttempt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}
                    {latestAttempt.test.subject.name} · {latestAttempt.test.level}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* History List */}
          <div className="space-y-3">
            {attempts.map((attempt, idx) => {
              const pct = Math.round((attempt.score / attempt.total) * 100);
              return (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-surface border-2 border-border rounded-[24px] p-5 flex items-center justify-between hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      pct >= 80 ? 'bg-p-mint' : pct >= 60 ? 'bg-p-yellow' : 'bg-p-rose'
                    }`}>
                      <Target size={18} className={pct >= 80 ? 'text-teal-600' : pct >= 60 ? 'text-amber-600' : 'text-rose-600'} />
                    </div>
                    <div>
                      <p className="font-black text-sm text-text-main">{attempt.test.subject.name} · {attempt.test.level}</p>
                      <p className="text-[10px] font-bold text-text-muted flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(attempt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-black text-sm text-text-main">{attempt.score}/{attempt.total}</p>
                      <p className="text-[9px] font-black uppercase tracking-wider text-text-muted">{pct}%</p>
                    </div>
                    {attempt.mastery && (
                      <span className="hidden sm:inline px-2.5 py-1 bg-p-purple rounded-full text-[8px] font-black uppercase tracking-widest text-primary">
                        {attempt.mastery}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action */}
          <div className="flex justify-center">
            <Link
              href="/dashboard/test"
              className="inline-flex items-center gap-2 px-8 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:scale-105 transition-all"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
            >
              <Sparkles size={14} /> Take New Assessment
            </Link>
          </div>
        </>
      )}
    </div>
  );
}