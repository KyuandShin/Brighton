'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, BookOpen, UserCheck, TrendingUp,
  Clock, Check, X, Calendar, Ban,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface AdminDashboardData {
  totals: {
    tutors: number;
    students: number;
    bookings: number;
    users: number;
    admins: number;
  };
  tutorBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
  };
  bookingBreakdown: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  trends: {
    bookingsByMonth: Record<string, { total: number; confirmed: number; pending: number; completed: number; cancelled: number }>;
    usersByMonth: Record<string, { total: number; tutors: number; students: number }>;
  };
  recent: {
    bookings: Array<{
      id: string;
      date: string;
      status: string;
      meetLink: string | null;
      student: { name: string | null; email: string; image: string | null };
      tutor: { name: string | null; email: string; image: string | null };
    }>;
    tutors: Array<{
      id: string;
      status: string;
      user: { name: string | null; email: string; image: string | null; createdAt: string };
    }>;
    students: Array<{
      id: string;
      schoolLevel: string;
      gradeLevel: number | null;
      user: { name: string | null; email: string; image: string | null; createdAt: string };
    }>;
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
  sublabel,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  href?: string;
  sublabel?: string;
}) {
  const content = (
    <div className="bg-surface rounded-2xl border border-border p-6 hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
        <span className="text-4xl font-bold text-text-main tabular-nums">{value}</span>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
      {sublabel && (
        <p className="text-[10px] font-medium text-text-muted/60 mt-1 uppercase tracking-wider">{sublabel}</p>
      )}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
    PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending', icon: Clock },
    APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved', icon: Check },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected', icon: X },
    CONFIRMED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmed', icon: Check },
    COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed', icon: Check },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled', icon: X },
  };
  const c = config[status] ?? { bg: 'bg-blue-100', text: 'text-blue-700', label: status, icon: Clock };
  const Icon = c.icon;
  return (
    <span className={`px-2.5 py-1 ${c.bg} ${c.text} rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit`}>
      <Icon size={10} /> {c.label}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load dashboard data');
        return r.json();
      })
      .then((d) => setData(d))
      .catch((err) => { console.error(err); setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <header className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-surface rounded-lg animate-pulse" />
            <div className="h-3 w-32 bg-surface rounded-lg animate-pulse" />
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-6 h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-6 h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-2xl p-16 text-center space-y-4">
        <LayoutDashboard size={40} className="mx-auto text-text-muted" />
        <p className="text-sm font-medium uppercase tracking-widest text-text-muted">
          {error || 'Failed to load dashboard'}
        </p>
      </div>
    );
  }

  const { totals, tutorBreakdown, bookingBreakdown, trends, recent } = data;
  const tutorApprovalRate = totals.tutors > 0
    ? Math.round((tutorBreakdown.approved / totals.tutors) * 100)
    : 0;

  // Sort months for display
  const sortedMonths = Object.keys(trends.bookingsByMonth).sort();
  const latestMonth = sortedMonths[sortedMonths.length - 1] ?? '';
  const prevMonth = sortedMonths[sortedMonths.length - 2] ?? '';
  const bookingGrowth = prevMonth && trends.bookingsByMonth[prevMonth]?.total
    ? Math.round(((trends.bookingsByMonth[latestMonth]?.total ?? 0) - trends.bookingsByMonth[prevMonth]?.total) / trends.bookingsByMonth[prevMonth]?.total * 100)
    : 0;
  const userGrowth = prevMonth && trends.usersByMonth[prevMonth]?.total
    ? Math.round(((trends.usersByMonth[latestMonth]?.total ?? 0) - trends.usersByMonth[prevMonth]?.total) / trends.usersByMonth[prevMonth]?.total * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <LayoutDashboard size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-text-main">Admin Dashboard</h2>
            <p className="text-text-muted font-medium text-xs uppercase tracking-widest">
              Platform overview & key metrics
            </p>
          </div>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Bookings"
          value={totals.bookings}
          icon={BookOpen}
          color="bg-gradient-to-br from-blue-500 to-cyan-500"
          sublabel={bookingGrowth !== 0 ? `${bookingGrowth > 0 ? '+' : ''}${bookingGrowth}% this month` : undefined}
        />
        <StatCard
          label="Students"
          value={totals.students}
          icon={Users}
          color="bg-gradient-to-br from-emerald-500 to-green-600"
          href="/dashboard/admin/students"
        />
        <StatCard
          label="Tutors"
          value={totals.tutors}
          icon={UserCheck}
          color="bg-gradient-to-br from-indigo-500 to-purple-600"
          href="/dashboard/admin/tutors"
          sublabel={`${tutorApprovalRate}% approved`}
        />
        <StatCard
          label="Total Users"
          value={totals.users}
          icon={TrendingUp}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          sublabel={userGrowth !== 0 ? `${userGrowth > 0 ? '+' : ''}${userGrowth}% this month` : undefined}
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tutor Breakdown */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserCheck size={20} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-main">Tutor Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending</span>
              </div>
              <span className="text-2xl font-bold text-amber-700">{tutorBreakdown.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved</span>
              </div>
              <span className="text-2xl font-bold text-emerald-700">{tutorBreakdown.approved}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <X size={16} className="text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">Rejected</span>
              </div>
              <span className="text-2xl font-bold text-red-700">{tutorBreakdown.rejected}</span>
            </div>
          </div>
        </div>

        {/* Booking Breakdown */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-main">Booking Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending</span>
              </div>
              <span className="text-2xl font-bold text-amber-700">{bookingBreakdown.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Confirmed</span>
              </div>
              <span className="text-2xl font-bold text-emerald-700">{bookingBreakdown.confirmed}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Completed</span>
              </div>
              <span className="text-2xl font-bold text-blue-700">{bookingBreakdown.completed}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <X size={16} className="text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">Cancelled</span>
              </div>
              <span className="text-2xl font-bold text-red-700">{bookingBreakdown.cancelled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Trend */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-main">Monthly Bookings</h3>
          </div>
          <div className="space-y-2">
            {sortedMonths.slice(-6).map((month) => {
              const bm = trends.bookingsByMonth[month];
              const maxVal = Math.max(...sortedMonths.slice(-6).map((m) => trends.bookingsByMonth[m]?.total ?? 0), 1);
              const pct = ((bm?.total ?? 0) / maxVal) * 100;
              const [year, mon] = month.split('-');
              const label = new Date(parseInt(year), parseInt(mon) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase text-text-muted w-14 shrink-0">{label}</span>
                  <div className="flex-1 h-8 bg-slate-100 rounded-xl overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl transition-all duration-500 flex items-center justify-end px-3"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{bm?.total ?? 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Users Trend */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-main">New Users Per Month</h3>
          </div>
          <div className="space-y-2">
            {sortedMonths.slice(-6).map((month) => {
              const um = trends.usersByMonth[month];
              const maxVal = Math.max(...sortedMonths.slice(-6).map((m) => trends.usersByMonth[m]?.total ?? 0), 1);
              const pct = ((um?.total ?? 0) / maxVal) * 100;
              const [year, mon] = month.split('-');
              const label = new Date(parseInt(year), parseInt(mon) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase text-text-muted w-14 shrink-0">{label}</span>
                  <div className="flex-1 h-8 bg-slate-100 rounded-xl overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl transition-all duration-500 flex items-center justify-end px-3"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{um?.total ?? 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-main">Recent Bookings</h3>
            </div>
            <Link
              href="/dashboard/bookings"
              className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {recent.bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-8 h-8 shrink-0">
                    <Image
                      src={b.student.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.student.email}`}
                      alt={b.student.name ?? ''}
                      fill
                      className="rounded-lg bg-surface-elevated object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-text-main truncate">{b.student.name ?? 'Unnamed'}</p>
                    <p className="text-[8px] font-medium text-text-muted uppercase tracking-wider truncate">
                      with {b.tutor.name ?? 'Tutor'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
            {recent.bookings.length === 0 && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted text-center py-6">
                No recent bookings
              </p>
            )}
          </div>
        </div>

        {/* Recent Tutors */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UserCheck size={20} className="text-emerald-600" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-main">New Tutors</h3>
            </div>
            <Link
              href="/dashboard/admin/tutors"
              className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {recent.tutors.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-8 h-8 shrink-0">
                    <Image
                      src={t.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.user.email}`}
                      alt={t.user.name ?? ''}
                      fill
                      className="rounded-lg bg-surface-elevated object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-text-main truncate">{t.user.name ?? 'Unnamed'}</p>
                    <p className="text-[8px] font-medium text-text-muted uppercase tracking-wider truncate">{t.user.email}</p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
            {recent.tutors.length === 0 && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted text-center py-6">
                No recent tutors
              </p>
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-amber-600" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-main">New Students</h3>
            </div>
            <Link
              href="/dashboard/admin/students"
              className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {recent.students.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-8 h-8 shrink-0">
                    <Image
                      src={s.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.user.email}`}
                      alt={s.user.name ?? ''}
                      fill
                      className="rounded-lg bg-surface-elevated object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-text-main truncate">{s.user.name ?? 'Unnamed'}</p>
                    <p className="text-[8px] font-medium text-text-muted uppercase tracking-wider truncate">{s.user.email}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 rounded-full text-[8px] font-bold uppercase text-blue-600">
                  {s.schoolLevel === 'ELEMENTARY' ? 'Elem' : 'HS'}
                </span>
              </div>
            ))}
            {recent.students.length === 0 && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted text-center py-6">
                No recent students
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}