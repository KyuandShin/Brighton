'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Shield, ArrowLeft, Check, X, Clock, UserCheck, UserX, Ban, Undo2,
  GraduationCap, BookOpen, Award, DollarSign, Calendar, Mail, FileText,
  Globe, Video, Star, AlertCircle, ExternalLink, Sparkles
} from 'lucide-react';
import Image from 'next/image';

interface TutorApplication {
  id: string;
  userId: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  headline: string | null;
  bio: string | null;
  introVideoUrl: string | null;
  pricingPerHour: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string;
    isBanned: boolean;
    isVerified: boolean;
  };
  education: Array<{
    id: string;
    university: string;
    degree: string;
    specialization: string;
    yearStart: number;
    yearEnd: number | null;
  }>;
  certifications: Array<{
    id: string;
    subject: string;
    certificate: string;
    issuedBy: string;
    certificateUrl: string | null;
  }>;
  subjects: Array<{ subject: { id: string; name: string } }>;
  availability: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminTutorApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tutor, setTutor] = useState<TutorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Fetch all tutors with full relations and find the one we need
    fetch('/api/admin/tutors')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load tutor application');
        return r.json();
      })
      .then((allTutors: any[]) => {
        const found = allTutors.find((t: any) => t.id === id);
        if (found) {
          setTutor(found);
        } else {
          setError('Tutor application not found');
        }
      })
      .catch((err) => { console.error(err); setError(err.message); })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!tutor) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/tutors/${tutor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: status }),
      });
      if (!res.ok) throw new Error('Update failed');
      setTutor((prev) => prev ? { ...prev, verificationStatus: status } : prev);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const toggleBan = async () => {
    if (!tutor) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/tutors/${tutor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !tutor.user.isBanned }),
      });
      if (!res.ok) throw new Error('Update failed');
      setTutor((prev) => prev ? {
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

  if (error || !tutor) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-2xl p-16 text-center space-y-4">
        <Shield size={40} className="mx-auto text-text-muted" />
        <p className="text-sm font-medium uppercase tracking-widest text-text-muted">
          {error || 'Tutor application not found'}
        </p>
        <button
          onClick={() => router.push('/dashboard/admin/tutors')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Back to Tutors
        </button>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (tutor.user.isBanned) {
      return (
        <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Ban size={12} /> Banned
        </span>
      );
    }
    switch (tutor.verificationStatus) {
      case 'PENDING':
        return (
          <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={12} /> Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Check size={12} /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <X size={12} /> Rejected
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/admin/tutors')}
          className="p-2.5 bg-surface border border-border rounded-xl hover:bg-surface-elevated transition-all text-text-muted hover:text-text-main"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-text-main">Tutor Application</h2>
            {getStatusBadge()}
          </div>
          <p className="text-text-muted font-medium text-xs uppercase tracking-widest mt-1">
            Review the tutor's full application details
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
                  src={tutor.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.user.email}`}
                  alt={tutor.user.name ?? 'Tutor'}
                  fill
                  className="rounded-2xl bg-surface-elevated object-cover"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-text-main">{tutor.user.name ?? 'Unnamed Tutor'}</h3>
                <p className="text-xs text-text-muted font-medium">{tutor.headline}</p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted">
                  <Mail size={10} /> {tutor.user.email}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted">
                  <Calendar size={10} />
                  Applied {new Date(tutor.user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Verification status */}
            {tutor.user.isVerified ? (
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

            {tutor.verificationStatus === 'PENDING' && !tutor.user.isBanned && (
              <div className="space-y-3">
                <button
                  onClick={() => updateStatus('APPROVED')}
                  disabled={updating}
                  className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserCheck size={14} /> Approve Application
                </button>
                <button
                  onClick={() => updateStatus('REJECTED')}
                  disabled={updating}
                  className="w-full py-3.5 bg-red-100 text-red-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserX size={14} /> Reject Application
                </button>
              </div>
            )}

            {tutor.verificationStatus === 'APPROVED' && !tutor.user.isBanned && (
              <button
                onClick={() => updateStatus('REJECTED')}
                disabled={updating}
                className="w-full py-3.5 bg-red-100 text-red-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserX size={14} /> Revoke Approval
              </button>
            )}

            {tutor.verificationStatus === 'REJECTED' && !tutor.user.isBanned && (
              <button
                onClick={() => updateStatus('APPROVED')}
                disabled={updating}
                className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserCheck size={14} /> Approve Application
              </button>
            )}

            <button
              onClick={toggleBan}
              disabled={updating}
              className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                tutor.user.isBanned
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {tutor.user.isBanned ? <Undo2 size={14} /> : <Ban size={14} />}
              {tutor.user.isBanned ? 'Unban Tutor' : 'Ban Tutor'}
            </button>
          </div>
        </div>

        {/* Right Column - Application Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bio Section */}
          <Section icon={FileText} title="Bio & Headline">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Headline</p>
                <p className="text-sm font-bold text-text-main">{tutor.headline || 'No headline provided'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Bio</p>
                <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">{tutor.bio || 'No bio provided'}</p>
              </div>
            </div>
          </Section>

          {/* Subjects */}
          <Section icon={BookOpen} title={`Subjects (${tutor.subjects?.length ?? 0})`}>
            {tutor.subjects && tutor.subjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tutor.subjects.map((ts) => (
                  <span
                    key={ts.subject.id}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest border border-primary/20"
                  >
                    {ts.subject.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No subjects selected</p>
            )}
          </Section>

          {/* Education */}
          <Section icon={GraduationCap} title={`Education (${tutor.education?.length ?? 0})`}>
            {tutor.education && tutor.education.length > 0 ? (
              <div className="space-y-3">
                {tutor.education.map((edu) => (
                  <div key={edu.id} className="p-4 bg-surface-elevated rounded-xl border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-text-main">{edu.university}</p>
                        <p className="text-xs text-text-muted">{edu.degree}{edu.specialization ? ` - ${edu.specialization}` : ''}</p>
                      </div>
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        {edu.yearStart}{edu.yearEnd ? ` - ${edu.yearEnd}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No education details provided</p>
            )}
          </Section>

          {/* Certifications */}
          <Section icon={Award} title={`Certifications (${tutor.certifications?.length ?? 0})`}>
            {tutor.certifications && tutor.certifications.length > 0 ? (
              <div className="space-y-3">
                {tutor.certifications.map((cert) => (
                  <div key={cert.id} className="p-4 bg-surface-elevated rounded-xl border border-border">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-text-main">{cert.certificate}</p>
                        <p className="text-[10px] text-text-muted font-medium">
                          {cert.subject} · Issued by {cert.issuedBy}
                        </p>
                      </div>
                      {cert.certificateUrl && (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-surface rounded-lg text-primary hover:bg-primary hover:text-white transition-all"
                          title="View certificate"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No certifications provided</p>
            )}
          </Section>

          {/* Availability */}
          <Section icon={Calendar} title={`Availability (${tutor.availability?.length ?? 0} days)`}>
            {tutor.availability && tutor.availability.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tutor.availability
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((slot) => (
                    <span
                      key={slot.id}
                      className="px-3 py-1.5 bg-p-mint/30 text-teal-700 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-teal-200"
                    >
                      {DAY_NAMES[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                    </span>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No availability configured</p>
            )}
          </Section>

          {/* Pricing */}
          <Section icon={DollarSign} title="Pricing">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-text-main">${tutor.pricingPerHour}</span>
              <span className="text-sm text-text-muted">/ hour</span>
            </div>
          </Section>

          {/* Video Intro */}
          {tutor.introVideoUrl && (
            <Section icon={Video} title="Video Introduction">
              <a
                href={tutor.introVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
              >
                <Video size={14} /> Watch Video Intro
              </a>
            </Section>
          )}
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