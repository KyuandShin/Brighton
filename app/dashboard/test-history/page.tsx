'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Brain, TrendingUp, Target, CheckCircle2, Calendar, ChevronRight, Sparkles, ArrowUp, ArrowDown, BookOpen, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface AttemptData {
  id: string;
  score: number;
  total: number;
  mastery: string | null;
  grade: string | null;
  grade_label?: string;
  strengths: any;
  weaknesses: any;
  studyPlan: string | null;
  timestamp: string;
  type: 'ai_assessment' | 'subject_test';
  subject_name: string;
  level_label: string;
}

export default function TestHistoryPage() {
  const { user } = useCurrentUser();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptData | null>(null);

  useEffect(() => {
    if (!user?.studentProfile?.id) { setLoading(false); return; }
    fetch(`/api/test-history`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAttempts(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.studentProfile?.id]);

  // Only show AI assessment attempts
  const aiAttempts = attempts.filter(a => a.type === 'ai_assessment');
  const latestAttempt = aiAttempts[0];
  const prevAttempt = aiAttempts[1];
  const improved = latestAttempt && prevAttempt
    ? latestAttempt.score > prevAttempt.score
    : null;

  const getScoreColor = (pct: number) =>
    pct >= 80 ? 'text-teal-600 bg-p-mint' : pct >= 60 ? 'text-amber-600 bg-p-yellow' : 'text-rose-600 bg-p-rose';

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          Your <span className="gradient-text">Assessment Journey</span>
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
      ) : aiAttempts.length === 0 ? (
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
                    {latestAttempt.grade_label || 'AI Assessment'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* History List */}
          <div className="space-y-3">
            {aiAttempts.map((attempt, idx) => {
              const pct = Math.round((attempt.score / attempt.total) * 100);
              return (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-surface border-2 border-border rounded-[24px] p-5 flex items-center justify-between hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedAttempt(attempt)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      pct >= 80 ? 'bg-p-mint' : pct >= 60 ? 'bg-p-yellow' : 'bg-p-rose'
                    }`}>
                      <Target size={18} className={pct >= 80 ? 'text-teal-600' : pct >= 60 ? 'text-amber-600' : 'text-rose-600'} />
                    </div>
                    <div>
                      <p className="font-black text-sm text-text-main">{attempt.grade_label || 'AI Assessment'}</p>
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

          {/* Detail Modal */}
          <AnimatePresence>
            {selectedAttempt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                onClick={() => setSelectedAttempt(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-surface border-2 border-border rounded-[32px] max-w-lg w-full max-h-[85vh] overflow-y-auto p-8 space-y-6"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-p-purple to-pink-200 rounded-2xl flex items-center justify-center">
                        <Brain size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black text-text-main">{selectedAttempt.grade_label || 'AI Assessment'}</h3>
                        <p className="text-[10px] font-bold text-text-muted">
                          {new Date(selectedAttempt.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAttempt(null)}
                      className="w-8 h-8 rounded-xl bg-border flex items-center justify-center hover:bg-text-muted/20 transition-colors"
                    >
                      <X size={14} className="text-text-muted" />
                    </button>
                  </div>

                  {/* Score */}
                  <div className="text-center py-6">
                    <div className="text-5xl font-black text-text-main">
                      {selectedAttempt.score}<span className="text-xl text-text-muted">/{selectedAttempt.total}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-sm font-bold text-text-muted">{Math.round((selectedAttempt.score / selectedAttempt.total) * 100)}%</span>
                      {selectedAttempt.mastery && (
                        <span className="px-3 py-1 bg-p-yellow rounded-full text-[9px] font-black text-amber-700">
                          {selectedAttempt.mastery}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Strengths */}
                  {Array.isArray(selectedAttempt.strengths) && selectedAttempt.strengths.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-teal-500" /> Strengths
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAttempt.strengths.map((s: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-p-mint rounded-full text-[10px] font-black text-teal-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {Array.isArray(selectedAttempt.weaknesses) && selectedAttempt.weaknesses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                        <AlertCircle size={12} className="text-rose-500" /> Areas to Improve
                      </h4>
                      <div className="space-y-1.5">
                        {selectedAttempt.weaknesses.map((w: any, i: number) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 bg-p-rose/20 rounded-xl">
                            <span className="text-[10px] font-bold text-text-main">{w.topic || w}</span>
                            {w.accuracy !== undefined && (
                              <span className="text-[9px] font-black text-rose-600">{w.accuracy}%</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Study Plan */}
                  {selectedAttempt.studyPlan && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                        <BookOpen size={12} className="text-blue-500" /> Study Plan
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line">
                        {selectedAttempt.studyPlan}
                      </p>
                    </div>
                  )}

                  {/* Action */}
                  <Link
                    href="/dashboard/test"
                    className="block w-full text-center px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
                  >
                    Take New Assessment
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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