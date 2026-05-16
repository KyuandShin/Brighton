'use client';

import { useState, useEffect } from 'react';
import { Users, Eye, Search, Ban, Undo2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface StudentAdmin {
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
  schoolLevel: string;
  gradeLevel: number | null;
  schoolName: string | null;
  parentEmail: string | null;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/students')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setStudents(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleBan = async (studentId: string, currentlyBanned: boolean) => {
    setUpdatingId(studentId);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !currentlyBanned }),
      });
      if (!res.ok) throw new Error('Update failed');
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, user: { ...s.user, isBanned: !currentlyBanned } } : s
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update ban status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = students.filter((s) =>
    search === '' ||
    s.user.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeStudents = filtered.filter((s) => !s.user.isBanned);
  const bannedStudents = filtered.filter((s) => s.user.isBanned);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-text-main">Student Management</h2>
            <p className="text-text-muted font-medium text-xs uppercase tracking-widest">
              View and manage all registered students
            </p>
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or email..."
          className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/50"
        />
      </div>

      {loading ? (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 border-b border-border h-24 bg-surface-elevated" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-16 text-center space-y-4">
          <Users size={40} className="mx-auto text-text-muted" />
          <p className="text-sm font-medium uppercase tracking-widest text-text-muted">No students found</p>
        </div>
      ) : (
        <>
          {/* Active Students */}
          {activeStudents.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-3 bg-surface-elevated border-b border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Active Students ({activeStudents.length})
                </p>
              </div>
              {activeStudents.map((student) => (
                <div key={student.id} className="p-6 border-b border-border last:border-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative w-14 h-14 shrink-0">
                        <Image
                          src={student.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.user.email}`}
                          alt={student.user.name ?? 'Student'}
                          fill
                          className="rounded-2xl bg-surface-elevated object-cover"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-lg text-text-main truncate">
                          {student.user.name ?? 'Unnamed Student'}
                        </h3>
                        <p className="text-[10px] font-medium text-text-muted uppercase tracking-tight">
                          {student.user.email}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-blue-100 rounded-full text-[9px] font-bold uppercase text-blue-600">
                            {student.schoolLevel === 'ELEMENTARY' ? 'Elem' : 'High School'}
                          </span>
                          {student.gradeLevel && (
                            <span className="px-2 py-0.5 bg-sky-100 rounded-full text-[9px] font-bold uppercase text-sky-600">
                              Grade {student.gradeLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/profile?userId=${student.userId}`}
                        className="p-2.5 bg-surface-elevated rounded-xl hover:bg-primary hover:text-white transition-all text-text-muted"
                        title="View profile"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => toggleBan(student.id, false)}
                        disabled={updatingId === student.id}
                        className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        title="Ban student"
                      >
                        <Ban size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Banned Students */}
          {bannedStudents.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-3 bg-red-50 border-b border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">
                  Banned Students ({bannedStudents.length})
                </p>
              </div>
              {bannedStudents.map((student) => (
                <div key={student.id} className="p-6 border-b border-border last:border-0 bg-red-50/30">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative w-14 h-14 shrink-0">
                        <Image
                          src={student.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.user.email}`}
                          alt={student.user.name ?? 'Student'}
                          fill
                          className="rounded-2xl bg-surface-elevated object-cover opacity-60"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-lg text-text-main truncate">
                          {student.user.name ?? 'Unnamed Student'}
                          <span className="ml-2 text-xs text-red-500 font-medium">(Banned)</span>
                        </h3>
                        <p className="text-[10px] font-medium text-text-muted uppercase tracking-tight">
                          {student.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => toggleBan(student.id, true)}
                        disabled={updatingId === student.id}
                        className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                        title="Unban student"
                      >
                        <Undo2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}