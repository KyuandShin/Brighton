'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, BookOpen, UserCheck, TrendingUp,
  Clock, Check, X, Calendar, Ban, ArrowUpRight, ArrowDownRight,
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

// ── S p r i n g   c o l o r   p a l e t t e ─────────────────────────
const statColors = [
  { icon: 'bg-gradient-to-br from-sky-400 to-blue-500',       ring: 'ring-sky-200 dark:ring-sky-800' },
  { icon: 'bg-gradient-to-br from-emerald-400 to-teal-500',   ring: 'ring-emerald-200 dark:ring-emerald-800' },
  { icon: 'bg-gradient-to-br from-violet-400 to-purple-500',  ring: 'ring-violet-200 dark:ring-violet-800' },
  { icon: 'bg-gradient-to-br from-rose-400 to-pink-500',      ring: 'ring-rose-200 dark:ring-rose-800' },
];

function StatCard({
  label,
  value,
  icon: Icon,
  colorIdx,
  href,
  sublabel,
  trend,
  trendUp,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  colorIdx: number;
  href?: string;
  sublabel?: string;
  trend?: number;
  trendUp?: boolean;
}) {
  const colors = statColors[colorIdx % statColors.length];
  const content = (
    <div className="bg-surface rounded-xl border border-border p-5 hover:shadow-md hover:shadow-primary/5 transition-all group cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon size={18} className="text-white" />
        </div>
        {(trend !== undefined) && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            trendUp
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
          }`}>
            {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <span className="text-2xl font-bold text-text-main tabular-nums">{value}</span>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mt-0.5">{label}</p>
      {sublabel && (
        <p className="text-[9px] font-medium text-text-muted/50 mt-0.5 uppercase tracking-wider">{sublabel}</p>
      )}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
    PENDING:    { bg: 'bg-amber-50 dark:bg-amber-950/30',    text: 'text-amber-600 dark:text-amber-400',  label: 'Pending',    icon: Clock },
    APPROVED:   { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', label: 'Approved',   icon: Check },
    REJECTED:   { bg: 'bg-rose-50 dark:bg-rose-950/30',      text: 'text-rose-600 dark:text-rose-400',   label: 'Rejected',   icon: X },
    CONFIRMED:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', label: 'Confirmed',  icon: Check },
    COMPLETED:  { bg: 'bg-sky-50 dark:bg-sky-950/30',        text: 'text-sky-600 dark:text-sky-400',     label: 'Completed',  icon: Check },
    CANCELLED:  { bg: 'bg-rose-50 dark:bg-rose-950/30',      text: 'text-rose-600 dark:text-rose-400',   label: 'Cancelled',  icon: X },
  };
  const c = config[status] ?? { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-600 dark:text-sky-400', label: status, icon: Clock };
  const Icon = c.icon;
  return (
    <span className={`px-2 py-0.5 ${c.bg} ${c.text} rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit`}>
      <Icon size={9} /> {c.label}
    </span>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl" style={{ backgroundColor: color }}>
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: color.replace('bg-', 'text-') || undefined }}>
        {label}
      </span>
      <span className="text-lg font-bold" style={{ color: color.replace('bg-', 'text-') || undefined }}>
        {value}
      </span>
    </div>
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
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-xl animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-surface rounded-md animate-pulse" />
            <div className="h-2.5 w-28 bg-surface rounded-md animate-pulse" />
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5 h-56 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-xl p-12 text-center space-y-3">
        <LayoutDashboard size={32} className="mx-auto text-text-muted" />
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
          {error || 'Failed to load dashboard'}
        </p>
      </div>
    );
  }

  const { totals, tutorBreakdown, bookingBreakdown, trends, recent } = data;
  const tutorApprovalRate = totals.tutors > 0
    ? Math.round((tutorBreakdown.approved / totals.tutors) * 100)
    : 0;

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
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-sky-200/50 dark:shadow-sky-900/30">
          <LayoutDashboard size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-main">Admin Dashboard</h2>
          <p className="text-text-muted font-medium text-[10px] uppercase tracking-widest">
            Platform overview & key metrics
          </p>
        </div>
      </header>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={totals.bookings}
          icon={BookOpen}
          colorIdx={0}
          trend={bookingGrowth}
          trendUp={bookingGrowth >= 0}
        />
        <StatCard
          label="Students"
          value={totals.students}
          icon={Users}
          colorIdx={1}
          href="/dashboard/admin/students"
        />
        <StatCard
          label="Tutors"
          value={totals.tutors}
          icon={UserCheck}
          colorIdx={2}
          href="/dashboard/admin/tutors"
          sublabel={`${tutorApprovalRate}% approved`}
        />
        <StatCard
          label="Total Users"
          value={totals.users}
          icon={TrendingUp}
          colorIdx={3}
          trend={userGrowth}
          trendUp={userGrowth >= 0}
        />
      </div>

      {/* ── Breakdowns ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tutors */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center">
              <UserCheck size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-main">Tutor Status</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center space-y-1">
              <Clock size={14} className="mx-auto text-amber-500 dark:text-amber-400" />
              <span className="block text-xl font-bold text-amber-600 dark:text-amber-400">{tutorBreakdown.pending}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600/70 dark:text-amber-400/70">Pending</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center space-y-1">
              <Check size={14} className="mx-auto text-emerald-500 dark:text-emerald-400" />
              <span className="block text-xl font-bold text-emerald-600 dark:text-emerald-400">{tutorBreakdown.approved}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">Approved</span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-3 text-center space-y-1">
              <X size={14} className="mx-auto text-rose-500 dark:text-rose-400" />
              <span className="block text-xl font-bold text-rose-600 dark:text-rose-400">{tutorBreakdown.rejected}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600/70 dark:text-rose-400/70">Rejected</span>
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/40 rounded-lg flex items-center justify-center">
              <Calendar size={16} className="text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-main">Booking Status</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center space-y-1">
              <Clock size={14} className="mx-auto text-amber-500 dark:text-amber-400" />
              <span className="block text-xl font-bold text-amber-600 dark:text-amber-400">{bookingBreakdown.pending}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600/70 dark:text-amber-400/70">Pending</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center space-y-1">
              <Check size={14} className="mx-auto text-emerald-500 dark:text-emerald-400" />
              <span className="block text-xl font-bold text-emerald-600 dark:text-emerald-400">{bookingBreakdown.confirmed}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">Confirmed</span>
            </div>
            <div className="bg-sky-50 dark:bg-sky-950/20 rounded-xl p-3 text-center space-y-1">
              <Check size={14} className="mx-auto text-sky-500 dark:text-sky-400" />
              <span className="block text-xl font-bold text-sky-600 dark:text-sky-400">{bookingBreakdown.completed}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-600/70 dark:text-sky-400/70">Completed</span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-3 text-center space-y-1">
              <X size={14} className="mx-auto text-rose-500 dark:text-rose-400" />
              <span className="block text-xl font-bold text-rose-600 dark:text-rose-400">{bookingBreakdown.cancelled}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600/70 dark:text-rose-400/70">Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Monthly Trends ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bookings Trend */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-main">Monthly Bookings</h3>
          </div>
          <div className="space-y-1.5">
            {sortedMonths.slice(-6).map((month) => {
              const bm = trends.bookingsByMonth[month];
              const maxVal = Math.max(...sortedMonths.slice(-6).map((m) => trends.bookingsByMonth[m]?.total ?? 0), 1);
              const pct = ((bm?.total ?? 0) / maxVal) * 100;
              const [year, mon] = month.split('-');
              const label = new Date(parseInt(year), parseInt(mon) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              return (
                <div key={month} className="flex items-center gap-2.5">
                  <span className="text-[9px] font-bold uppercase text-text-muted w-12 shrink-0">{label}</span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg transition-all duration-500 flex items-center justify-end px-2"
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    >
                      <span className="text-[9px] font-bold text-white">{bm?.total ?? 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Users Trend */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
              <Users size={16} className="text-white" />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-main">New Users Per Month</h3>
          </div>
          <div className="space-y-1.5">
            {sortedMonths.slice(-6).map((month) => {
              const um = trends.usersByMonth[month];
              const maxVal = Math.max(...sortedMonths.slice(-6).map((m) => trends.usersByMonth[m]?.total ?? 0), 1);
              const pct = ((um?.total ?? 0) / maxVal) * 100;
              const [year, mon] = month.split('-');
              const label = new Date(parseInt(year), parseInt(mon) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              return (
                <div key={month} className="flex items-center gap-2.5">
                  <span className="text-[9px] font-bold uppercase text-text-muted w-12 shrink-0">{label}</span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-lg transition-all duration-500 flex items-center justify-end px-2"
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    >
                      <span className="text-[9px] font-bold text-white">{um?.total ?? 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Bookings */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/40 rounded-lg flex items-center justify-center">
                <Calendar size={16} className="text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-main">Recent Bookings</h3>
            </div>
            <Link href="/dashboard/bookings" className="text-[8px] font-bold uppercase tracking-widest text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-1.5">
            {recent.bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-7 h-7 shrink-0">
                    <Image
                      src={b.student.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.student.email}`}
                      alt={b.student.name ?? ''}
                      fill
                      className="rounded-lg bg-surface-elevated object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-text-main truncate">{b.student.name ?? 'Unnamed'}</p>
                    <p className="text-[7px] font-medium text-text-muted uppercase tracking-wider truncate">
                      with {b.tutor.name ?? 'Tutor'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
            {recent.bookings.length === 0 && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted text-center py-4">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Recent Tutors */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                <UserCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-main">New Tutors</h3>
            </div>
            <Link href="/dashboard/admin/tutors" className="text-[8px] font-bold uppercase tracking-widest text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-1.5">
            {recent.tutors.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-7 h-7 shrink-0">
                    <Image
                      src={t.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.user.email}`}
                      alt={t.user.name ?? ''}
                      fill
                      className="rounded-lg bg-surface-elevated object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-text-main truncate">{t.user.name ?? 'Unnamed'}</p>
                    <p className="text-[7px] font-medium text-text-muted uppercase tracking-wider truncate">{t.user.email}</p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
            {recent.tutors.length === 0 && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted text-center py-4">No recent tutors</p>
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/40 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-main">New Students</h3>
            </div>
            <Link href="/dashboard/admin/students" className="text-[8px] font-bold uppercase tracking-widest text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-1.5">
            {recent.students.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-7 h-7 shrink-0">
                    <Image
                      src={s.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.user.email}`}
                      alt={s.user.name ?? ''}
                      fill
                      className="rounded-lg bg-surface-elevated object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-text-main truncate">{s.user.name ?? 'Unnamed'}</p>
                    <p className="text-[7px] font-medium text-text-muted uppercase tracking-wider truncate">{s.user.email}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-900/40 rounded-md text-[8px] font-bold uppercase text-sky-600 dark:text-sky-400">
                  {s.schoolLevel === 'ELEMENTARY' ? 'Elem' : 'HS'}
                </span>
              </div>
            ))}
            {recent.students.length === 0 && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted text-center py-4">No recent students</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}