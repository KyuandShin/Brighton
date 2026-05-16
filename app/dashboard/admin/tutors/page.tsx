'use client';

import { useState, useEffect } from 'react';
import { Shield, Check, X, Eye, UserCheck, UserX, Clock, Search, Edit, Ban, Undo2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface TutorApplication {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string;
    isBanned: boolean;
  };
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  headline: string | null;
  bio: string | null;
  pricingPerHour: number;
  createdAt: string;
}

export default function AdminTutorsPage() {
  const [tutors, setTutors] = useState<TutorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED'>('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/tutors')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load tutors');
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setTutors(data);
        else setError('Invalid data received from server');
      })
      .catch((err) => { console.error(err); setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (tutorId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(tutorId);
    try {
      const res = await fetch(`/api/admin/tutors/${tutorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: status }),
      });
      if (!res.ok) throw new Error('Update failed');
      setTutors((prev) => prev.map((t) => t.id === tutorId ? { ...t, verificationStatus: status } : t));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleBan = async (tutorId: string, currentlyBanned: boolean) => {
    setUpdatingId(tutorId);
    try {
      const res = await fetch(`/api/admin/tutors/${tutorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !currentlyBanned }),
      });
      if (!res.ok) throw new Error('Update failed');
      setTutors((prev) => prev.map((t) => t.id === tutorId ? { ...t, user: { ...t.user, isBanned: !currentlyBanned } } : t));
    } catch (err) {
      console.error(err);
      alert('Failed to update ban status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = tutors.filter((t) => {
    const banned = t.user.isBanned;
    let matchFilter = true;
    if (filter === 'BANNED') {
      matchFilter = banned;
    } else if (filter !== 'ALL') {
      matchFilter = t.verificationStatus === filter && !banned;
    } else {
      matchFilter = !banned;
    }
    const matchSearch =
      search === '' ||
      (t.user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.user.email || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = tutors.filter((t) => t.verificationStatus === 'PENDING' && !t.user.isBanned).length;
  const bannedCount = tutors.filter((t) => t.user.isBanned).length;

  const getStatusBadge = (status: string, isBanned: boolean) => {
    if (isBanned) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Ban size={12} /> Banned
        </span>
      );
    }
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} /> Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Check size={12} /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <X size={12} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Shield size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-text-main">Tutor Management</h2>
            <p className="text-text-muted font-medium text-xs uppercase tracking-widest">
              Review and approve tutor applications
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-bold uppercase animate-pulse shadow-lg shadow-amber-500/30">
              {pendingCount} Pending
            </span>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tutors by name or email..."
            className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/50"
          />
        </div>
        <div className="flex gap-2 p-1.5 bg-surface border border-border rounded-xl">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'BANNED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === status
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {status === 'BANNED' ? `Banned (${bannedCount})` : status}
            </button>
          ))}
        </div>
      </div>

      {/* Tutor Table */}
      {loading ? (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 border-b border-border h-24 bg-surface-elevated" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-16 text-center space-y-4">
          <UserCheck size={40} className="mx-auto text-text-muted" />
          <p className="text-sm font-medium uppercase tracking-widest text-text-muted">
            No tutor applications found
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {filtered.map((tutor) => (
            <div
              key={tutor.id}
              className={`p-6 border-b border-border last:border-0 ${
                tutor.verificationStatus === 'PENDING' && !tutor.user.isBanned ? 'bg-amber-50/50' : ''
              } ${tutor.user.isBanned ? 'bg-red-50/30' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-14 h-14 shrink-0">
                    <Image
                      src={tutor.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.user.email}`}
                      alt={tutor.user.name ?? 'Tutor'}
                      fill
                      className="rounded-2xl bg-surface-elevated object-cover"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-lg text-text-main truncate">
                      {tutor.user.name ?? 'Unnamed Tutor'}
                      {tutor.user.isBanned && <span className="ml-2 text-xs text-red-500 font-medium">(Banned)</span>}
                    </h3>
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-tight">
                      {tutor.user.email}
                    </p>
                    <p className="text-xs text-text-muted line-clamp-1">{tutor.headline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(tutor.verificationStatus, tutor.user.isBanned)}

                  <Link
                    href={`/dashboard/admin/tutors/${tutor.id}`}
                    className="p-2.5 bg-surface-elevated rounded-xl hover:bg-primary hover:text-white transition-all text-text-muted"
                    title="View application"
                  >
                    <Eye size={16} />
                  </Link>

                  {/* Ban/Unban Button */}
                  <button
                    onClick={() => toggleBan(tutor.id, tutor.user.isBanned)}
                    disabled={updatingId === tutor.id}
                    className={`p-2.5 rounded-xl transition-all disabled:opacity-50 ${
                      tutor.user.isBanned
                        ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                        : 'bg-red-100 text-red-600 hover:bg-red-500 hover:text-white'
                    }`}
                    title={tutor.user.isBanned ? 'Unban tutor' : 'Ban tutor'}
                  >
                    {tutor.user.isBanned ? <Undo2 size={16} /> : <Ban size={16} />}
                  </button>

                  {tutor.verificationStatus === 'PENDING' && !tutor.user.isBanned && (
                    <>
                      <button
                        onClick={() => updateStatus(tutor.id, 'APPROVED')}
                        disabled={updatingId === tutor.id}
                        className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                        title="Approve"
                      >
                        <UserCheck size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(tutor.id, 'REJECTED')}
                        disabled={updatingId === tutor.id}
                        className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        title="Reject"
                      >
                        <UserX size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}