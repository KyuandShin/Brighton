'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { TrendingUp, Users, BookOpen, Calendar, Star, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TutorAnalyticsPage() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tutorProfile?.id) { setLoading(false); return; }
    
    Promise.all([
      fetch('/api/bookings', { credentials: 'include' }).then(r => r.json()),
      fetch(`/api/reviews?tutorId=${user.tutorProfile.id}`).then(r => r.json()),
    ])
      .then(([bookingsData, reviewsData]) => {
        const bookings = Array.isArray(bookingsData) ? bookingsData : [];
        const reviews = Array.isArray(reviewsData) ? reviewsData : [];

        const totalStudents = new Set(bookings.map((b: any) => b.studentId)).size;
        const completedSessions = bookings.filter((b: any) => b.status === 'COMPLETED').length;
        const pendingRequests = bookings.filter((b: any) => b.status === 'PENDING').length;
        const confirmedUpcoming = bookings.filter((b: any) => b.status === 'CONFIRMED' && new Date(b.date) >= new Date()).length;
        const totalSessions = bookings.length;
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : 0;

        setStats({
          totalStudents,
          completedSessions,
          pendingRequests,
          confirmedUpcoming,
          totalSessions,
          avgRating,
          reviewCount: reviews.length,
          bookings,
          recentReviews: reviews.slice(0, 5),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.tutorProfile?.id]);

  if (!user || user.role !== 'TUTOR') {
    return (
      <div className="py-20 text-center">
        <p className="text-text-muted font-black uppercase tracking-widest text-sm">This page is for tutors only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-surface border-2 border-border rounded-[24px] animate-pulse" />)}
        </div>
      </div>
    );
  }

  const statCards = stats ? [
    { label: 'Total Sessions', value: stats.totalSessions, icon: BookOpen, bg: 'bg-p-purple', text: 'text-primary' },
    { label: 'Students', value: stats.totalStudents, icon: Users, bg: 'bg-p-blue', text: 'text-blue-600' },
    { label: 'Completed', value: stats.completedSessions, icon: CheckCircle, bg: 'bg-p-mint', text: 'text-teal-600' },
    { label: 'Pending', value: stats.pendingRequests, icon: AlertCircle, bg: 'bg-p-yellow', text: 'text-amber-600' },
    { label: 'Upcoming', value: stats.confirmedUpcoming, icon: Calendar, bg: 'bg-p-pink', text: 'text-pink-600' },
    { label: 'Avg Rating', value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—', icon: Star, bg: 'bg-p-peach', text: 'text-orange-600', suffix: stats.reviewCount > 0 ? ` (${stats.reviewCount})` : '' },
  ] : [];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-p-purple rounded-full w-fit">
          <TrendingUp size={12} className="text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Tutor Analytics</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          Your <span className="gradient-text">Dashboard</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          Track your tutoring performance and student engagement.
        </p>
      </header>

      {!stats ? (
        <div className="bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center">
          <div className="w-16 h-16 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
            <TrendingUp size={28} className="text-primary" />
          </div>
          <p className="mt-4 text-sm font-black uppercase tracking-widest text-text-muted">
            No data yet. Start tutoring to see your analytics!
          </p>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
          >
            View Bookings
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`${s.bg} border-2 border-white/80 rounded-2xl p-5 flex flex-col gap-2 hover:shadow-md transition-all`}
                >
                  <div className="w-9 h-9 bg-white/70 rounded-xl flex items-center justify-center">
                    <Icon size={16} className={s.text} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-text-main leading-none">
                      {s.value}{s.suffix || ''}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-0.5">{s.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-surface border-2 border-border rounded-[40px] p-8 space-y-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Upcoming Sessions
            </h3>
            {stats.bookings.filter((b: any) => b.status === 'CONFIRMED' && new Date(b.date) >= new Date()).length === 0 ? (
              <p className="text-sm text-text-muted">No upcoming sessions.</p>
            ) : (
              <div className="space-y-3">
                {stats.bookings
                  .filter((b: any) => b.status === 'CONFIRMED' && new Date(b.date) >= new Date())
                  .slice(0, 5)
                  .map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-p-purple rounded-2xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/70 rounded-xl flex items-center justify-center">
                          <Clock size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-text-main">{booking.student?.user?.name || 'Student'}</p>
                          <p className="text-[9px] font-bold text-text-muted">
                            {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' · '}
                            {new Date(booking.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {booking.meetLink && (
                        <a href={booking.meetLink} className="px-3 py-1.5 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-accent-strong transition-all">
                          Join
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          {stats.recentReviews?.length > 0 && (
            <div className="bg-surface border-2 border-border rounded-[40px] p-8 space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                Recent Feedback
              </h3>
              <div className="space-y-3">
                {stats.recentReviews.map((review: any) => (
                  <div key={review.id} className="p-4 bg-p-yellow rounded-2xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={10} fill={s <= review.rating ? '#fcc419' : 'none'} className={s <= review.rating ? 'text-amber-500' : 'text-gray-300'} />
                        ))}
                      </div>
                      <span className="text-[9px] font-black text-text-muted">
                        {review.student?.user?.name || 'Anonymous'}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-xs font-medium text-text-main italic">"{review.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}