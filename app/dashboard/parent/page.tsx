'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Brain, Calendar, TrendingUp, Star, BookOpen,
  ChevronRight, Sparkles, AlertCircle, Award, GraduationCap,
  School, Clock, Check, Loader2, Heart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ChildData {
  id: string;
  name: string;
  email: string;
  schoolLevel: string;
  gradeLevel: number | null;
  age: number | null;
  schoolName: string | null;
  subjects: string[];
  latestAssessment: {
    score: number;
    total: number;
    mastery: string | null;
    grade: string | null;
    strengths: any;
    weaknesses: any;
    timestamp: string;
  } | null;
  upcomingBookings: Array<{
    id: string;
    date: string;
    status: string;
    meetLink: string;
    tutorName: string;
  }>;
  recentBookings: Array<{
    id: string;
    date: string;
    status: string;
    tutorName: string;
  }>;
  sessionCount: number;
}

// ── Gradient palette for stat cards ──────────────────────────────────
const statGradients = [
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
];

export default function ParentDashboardPage() {
  const { user } = useCurrentUser();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/parent/dashboard');
        if (!res.ok) {
          setError('Failed to load dashboard');
          return;
        }
        const data = await res.json();
        setChildren(data.students || []);
        if (data.students?.length > 0) {
          setExpandedChild(data.students[0].id);
        }
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-[32px]" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalUpcoming = children.reduce((sum, c) => sum + c.upcomingBookings.length, 0);
  const totalSessions = children.reduce((sum, c) => sum + c.sessionCount, 0);
  const childrenWithAssessments = children.filter(c => c.latestAssessment);

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <header className="relative overflow-hidden rounded-[32px] p-5 sm:p-6"
        style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #faf5ff 100%)',
          border: '1.5px solid #e4def7',
        }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(124,58,237,0.06)' }} />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/80 rounded-full shadow-sm">
                <Sparkles size={10} className="text-primary" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-text-muted">
                  Parent Dashboard
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-main">
                Welcome, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Parent'}</span>
              </h2>
              <p className="text-text-muted font-bold text-[9px] sm:text-[11px] uppercase tracking-widest">
                {children.length > 0
                  ? `${children.length} child${children.length > 1 ? 'ren' : ''} · ${totalUpcoming} upcoming session${totalUpcoming !== 1 ? 's' : ''}`
                  : 'No linked students yet'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
            <MiniStat icon={Users} value={children.length} label="Children" gradient={statGradients[0]} />
            <MiniStat icon={Calendar} value={totalUpcoming} label="Upcoming" gradient={statGradients[1]} />
            <MiniStat
              icon={Award}
              value={childrenWithAssessments.length > 0 ? `${Math.round(childrenWithAssessments.reduce((s, c) => s + (c.latestAssessment?.score || 0) / (c.latestAssessment?.total || 1), 0) / childrenWithAssessments.length * 100)}%` : '—'}
              label="Avg Score"
              gradient={statGradients[2]}
            />
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="p-3">
          <AlertCircle size={12} />
          <AlertDescription className="text-[8px] font-black uppercase tracking-widest">{error}</AlertDescription>
        </Alert>
      )}

      {/* ── No Children ── */}
      {children.length === 0 && !loading && (
        <Alert className="border-dashed border-primary/30 bg-primary/5 p-3">
          <Sparkles size={14} className="text-primary" />
          <AlertDescription className="text-[8px] font-black uppercase tracking-widest">
            No students linked yet. When your child signs up and enters your email, you'll be notified!
          </AlertDescription>
        </Alert>
      )}

      {/* ── Children List ── */}
      {children.map((child) => {
        const isExpanded = expandedChild === child.id;
        const score = child.latestAssessment
          ? Math.round((child.latestAssessment.score / child.latestAssessment.total) * 100)
          : null;
        const strengths: string[] = child.latestAssessment?.strengths
          ? (typeof child.latestAssessment.strengths === 'string' ? JSON.parse(child.latestAssessment.strengths) : child.latestAssessment.strengths)
          : [];
        const weaknesses: string[] = child.latestAssessment?.weaknesses
          ? (typeof child.latestAssessment.weaknesses === 'string' ? JSON.parse(child.latestAssessment.weaknesses) : child.latestAssessment.weaknesses)
          : [];

        return (
          <Card key={child.id} className="border-border/60 overflow-hidden">
            <button
              onClick={() => setExpandedChild(isExpanded ? null : child.id)}
              className="w-full text-left p-3.5 flex items-center justify-between hover:bg-surface-elevated/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <Users size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-text-main">{child.name}</p>
                  <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">
                    {child.schoolLevel === 'ELEMENTARY' ? 'Elementary' : 'High School'}
                    {child.gradeLevel ? ` · G${child.gradeLevel}` : ''}
                    {child.schoolName ? ` · ${child.schoolName}` : ''}
                    {child.age ? ` · Age ${child.age}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {score !== null && (
                  <div className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-md",
                    score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                    'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  )}>
                    {score}%
                  </div>
                )}
                <ChevronRight size={14} className={cn(
                  "text-text-muted transition-transform",
                  isExpanded && "rotate-90"
                )} />
              </div>
            </button>

            {isExpanded && (
              <div className="px-3.5 pb-3.5 space-y-3 border-t border-border pt-3">
                {/* Subjects */}
                {child.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {child.subjects.map((subject) => (
                      <Badge key={subject} variant="secondary" className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5">
                        <BookOpen size={8} className="mr-1" /> {subject}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Latest Assessment */}
                {child.latestAssessment && (
                  <div className="bg-surface-elevated rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                        <Brain size={10} /> Latest Assessment
                      </p>
                      <p className="text-[7px] font-bold text-text-muted">
                        {new Date(child.latestAssessment.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-black text-text-main">
                        {child.latestAssessment.score}<span className="text-text-muted text-base">/{child.latestAssessment.total}</span>
                      </p>
                      <div className="flex-1">
                        <Progress value={score || 0} className="h-1.5" />
                      </div>
                      <p className={cn(
                        "text-base font-black",
                        (score || 0) >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                        (score || 0) >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {score}%
                      </p>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {strengths.length > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-2 border border-emerald-200 dark:border-emerald-800">
                          <p className="text-[7px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                            <Award size={9} /> Strengths
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {strengths.slice(0, 3).map((s: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[6px] border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {weaknesses.length > 0 && (
                        <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-2 border border-rose-200 dark:border-rose-800">
                          <p className="text-[7px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1">
                            <AlertCircle size={9} /> Needs Work
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {weaknesses.slice(0, 3).map((w: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[6px] border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-700">{w}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Upcoming Bookings */}
                {child.upcomingBookings.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                      <Calendar size={10} /> Upcoming Sessions
                    </p>
                    {child.upcomingBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-2 bg-surface-elevated rounded-xl border border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-sm">
                            <Clock size={12} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-text-main">{booking.tutorName}</p>
                            <p className="text-[7px] font-bold text-text-muted">
                              {new Date(booking.date).toLocaleDateString('en-US', {
                                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge className="text-[6px] bg-emerald-500">{booking.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Activity Summary */}
                <div className="flex items-center gap-3 text-[8px] font-bold text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Award size={10} className="text-violet-500" />
                    {child.sessionCount} session{child.sessionCount !== 1 ? 's' : ''} completed
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={10} className="text-sky-500" />
                    {child.upcomingBookings.length} upcoming
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Compact stat card with gradient icon ─────────────────────────────
function MiniStat({ icon: Icon, value, label, gradient }: { icon: any; value: string | number; label: string; gradient: string }) {
  return (
    <Card className="border-border/60 shadow-sm bg-transparent">
      <CardContent className="flex items-center gap-2.5 p-2.5 sm:p-3">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon size={13} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-base sm:text-lg font-black text-text-main leading-none">{value}</p>
          <p className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-text-muted mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}