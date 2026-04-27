'use client';

import { useState, useEffect } from 'react';
import { Shield, Check, X, Eye, UserCheck, UserX, Clock, Search, Edit, Trash2 } from 'lucide-react';
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
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const deleteTutor = async (tutorId: string) => {
    if (!confirm('Are you sure you want to delete this tutor? This action cannot be undone.')) return;
    setDeletingId(tutorId);
    try {
      const res = await fetch(`/api/admin/tutors/${tutorId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setTutors((prev) => prev.filter((t) => t.id !== tutorId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete tutor');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = tutors.filter((t) => {
    const matchFilter = filter === 'ALL' || t.verificationStatus === filter;
    const matchSearch =
      search === '' ||
      (t.user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.user.email || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = tutors.filter((t) => t.verificationStatus === 'PENDING').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 bg-p-yellow text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} /> Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-3 py-1 bg-p-mint text-teal-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Check size={12} /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 bg-p-rose text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
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
          <div className="w-12 h-12 bg-p-purple rounded-2xl flex items-center justify-center">
            <Shield size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-text-main">Tutor Management</h2>
            <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
              Review and approve tutor applications
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="px-4 py-1.5 bg-primary text-white rounded-full text-[10px] font-black uppercase animate-pulse shadow-lg shadow-primary/30">
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
            className="w-full bg-white border-2 border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
          />
        </div>
        <div className="flex gap-2 p-1.5 bg-p-purple/50 rounded-2xl border border-border">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === status
                  ? 'bg-white text-primary shadow-md'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tutor Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-border overflow-hidden animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 border-b border-border h-24 bg-surface-elevated" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-4">
          <UserCheck size={40} className="mx-auto text-text-muted" />
          <p className="text-sm font-black uppercase tracking-widest text-text-muted">
            No tutor applications found
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-border overflow-hidden">
          {filtered.map((tutor) => (
            <div
              key={tutor.id}
              className={`p-6 border-b border-border last:border-0 ${
                tutor.verificationStatus === 'PENDING' ? 'bg-p-yellow/20' : ''
              }`}
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
                    <h3 className="font-black text-lg text-text-main truncate">
                      {tutor.user.name ?? 'Unnamed Tutor'}
                    </h3>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
                      {tutor.user.email}
                    </p>
                    <p className="text-xs text-text-muted line-clamp-1">{tutor.headline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(tutor.verificationStatus)}

                  <Link
                    href={`/dashboard/tutors/${tutor.id}`}
                    className="p-2.5 bg-surface-elevated rounded-xl hover:bg-primary hover:text-white transition-all text-text-muted"
                  >
                    <Eye size={16} />
                  </Link>

                  <button className="p-2.5 bg-p-blue text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => deleteTutor(tutor.id)}
                    disabled={deletingId === tutor.id}
                    className="p-2.5 bg-p-rose text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>

                  {tutor.verificationStatus === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus(tutor.id, 'APPROVED')}
                        disabled={updatingId === tutor.id}
                        className="p-2.5 bg-p-mint text-teal-700 rounded-xl hover:bg-teal-500 hover:text-white transition-all disabled:opacity-50"
                      >
                        <UserCheck size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(tutor.id, 'REJECTED')}
                        disabled={updatingId === tutor.id}
                        className="p-2.5 bg-p-rose text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
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
