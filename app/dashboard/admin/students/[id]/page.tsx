'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users, ArrowLeft, Check, X, Clock, Ban, Undo2,
  GraduationCap, BookOpen, Mail, Calendar, Shield,
  AlertCircle, MessageSquare, Star
} from 'lucide-react';
import Image from 'next/image';

interface StudentDetail {
  id: string;
  userId: string;
  schoolLevel: string;
  gradeLevel: number | null;
  schoolName: string | null;
  age: number | null;
  parentEmail: string | null;
  subjects: string[];
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string;
    isBanned: boolean;
    isVerified: boolean;
  };
  bookings: Array<{
    id: string;
    date: string;
    status: string;
    tutor: {
      user: { name: string | null };
    };
  }>;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/students/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load student');
        return r.json();
      })
      .then(setStudent)
      .catch((err) => { console.error(err); setError(err.message); })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleBan = async () => {
    if (!student) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !student.user.isBanned }),
      });
      if (!res.ok) throw new Error('Update failed');
      setStudent((prev) => prev ? {
        ...prev,
        user: { ...prev.user, isBanned: !prev.user.isBanned }
      } : prev);
    } catch (err) {
      console.error(err);
      alert('Failed to update ban status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface rounded-lg animate-pulse" />
        <div className="bg-surface rounded-2xl border border-border p-8 space-y-6 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-surface-elevated" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-64 bg-surface-elevated rounded-lg" />
              <div className="h-4 w-48 bg-surface-elevated rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-surface-elevated rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-2xl p-16 text-center space-y-4">
        <Users size={40} className="mx-auto text-text-muted" />
        <p className="text-sm font-medium uppercase tracking-widest text-text-muted">
          {error || 'Student not found'}
        </p>
        <button
          onClick={() => router.push('/dashboard/admin/students')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/admin/students')}
          className="p-2.5 bg-surface border border-border rounded-xl hover:bg-surface-elevated transition-all text-text-muted hover:text-text-main"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-text-main">Student Profile</h2>
            {student.user.isBanned && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Ban size={12} /> Banned
              </span>
            )}
          </div>
          <p className="text-text-muted font-medium text-xs uppercase tracking-widest mt-1">
            View student details and account information
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Info & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative w-24 h-24">
                <Image
                  src={student.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.user.email}`}
                  alt={student.user.name ?? 'Student'}
                  fill
                  className={`rounded-2xl bg-surface-elevated object-cover ${student.user.isBanned ? 'opacity-60' : ''}`}
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-text-main">{student.user.name ?? 'Unnamed Student'}</h3>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted">
                  <Mail size={10} /> {student.user.email}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted">
                  <Calendar size={10} />
                  Joined {new Date(student.user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Verification status */}
            {student.user.isVerified ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl">
                <Check size={14} className="text-emerald-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Email Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl">
                <AlertCircle size={14} className="text-amber-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Email Not Verified</span>
              </div>
            )}
          </div>

          {/* Actions Card */}
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Actions</h4>

            <a
              href={`/dashboard/messages?user=${student.user.id}`}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-strong transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={14} /> Message Student
            </a>

            <div className="border-t border-border pt-4">
              <button
                onClick={toggleBan}
                disabled={updating}
                className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  student.user.isBanned
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {student.user.isBanned ? <Undo2 size={14} /> : <Ban size={14} />}
                {student.user.isBanned ? 'Unban Student' : 'Ban Student'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Student Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* School Info */}
          <Section icon={GraduationCap} title="School Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface-elevated rounded-xl border border-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">School Level</p>
                <p className="text-sm font-bold text-text-main">
                  {student.schoolLevel === 'ELEMENTARY' ? 'Elementary School' : student.schoolLevel === 'HIGH_SCHOOL' ? 'High School' : '—'}
                </p>
              </div>
              <div className="p-4 bg-surface-elevated rounded-xl border border-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Grade Level</p>
                <p className="text-sm font-bold text-text-main">{student.gradeLevel ?? '—'}</p>
              </div>
              <div className="p-4 bg-surface-elevated rounded-xl border border-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">School Name</p>
                <p className="text-sm font-bold text-text-main">{student.schoolName || '—'}</p>
              </div>
              <div className="p-4 bg-surface-elevated rounded-xl border border-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Age</p>
                <p className="text-sm font-bold text-text-main">{student.age ?? '—'}</p>
              </div>
            </div>
          </Section>

          {/* Subjects of Interest */}
          <Section icon={BookOpen} title="Subjects of Interest">
            {student.subjects && student.subjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.subjects.map((sub) => (
                  <span
                    key={sub}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest border border-primary/20"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No subjects selected</p>
            )}
          </Section>

          {/* Parent Info */}
          <Section icon={Shield} title="Parent / Guardian">
            {student.parentEmail ? (
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-text-muted" />
                <span className="text-sm font-bold text-text-main">{student.parentEmail}</span>
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No parent email on file</p>
            )}
          </Section>

          {/* Recent Bookings */}
          <Section icon={Calendar} title={`Recent Bookings (${student.bookings?.length ?? 0})`}>
            {student.bookings && student.bookings.length > 0 ? (
              <div className="space-y-3">
                {student.bookings.slice(0, 10).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-border">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-text-main">
                        Tutor: {booking.tutor?.user?.name ?? 'Unknown'}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      booking.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No bookings yet</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon size={18} className="text-primary" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-text-main">{title}</h3>
      </div>
      {children}
    </div>
  );
}