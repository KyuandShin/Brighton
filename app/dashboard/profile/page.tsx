'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser, getInitials } from '@/lib/hooks/useCurrentUser';
import {
  User, Mail, School, Calendar, BookOpen,
  Edit3, Check, X, Sparkles, GraduationCap,
  DollarSign, FileText, ShieldCheck, Camera, Video
} from 'lucide-react';
import { motion } from 'framer-motion';
import CameraCapture from '../_components/CameraCapture';

export default function ProfilePage() {
  const { user, loading, refetch } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Form state mirrors what the server has
  const [form, setForm] = useState({
    name: '',
    age: '',
    schoolName: '',
    schoolLevel: '',
    headline: '',
    bio: '',
    pricingPerHour: '',
    introVideoUrl: '',
    university: '',
    degree: '',
  });

  // Populate form when user loads
  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? '',
      age: user.studentProfile?.age?.toString() ?? '',
      schoolName: user.studentProfile?.schoolName ?? '',
      schoolLevel: user.studentProfile?.schoolLevel ?? '',
      headline: user.tutorProfile?.headline ?? '',
      bio: user.tutorProfile?.bio ?? '',
      pricingPerHour: user.tutorProfile?.pricingPerHour?.toString() ?? '',
      introVideoUrl: '',
      university: '',
      degree: '',
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg(data.error ?? 'Failed to save'); return; }
      setSaveMsg('Saved!');
      setEditing(false);
      refetch();
    } catch {
      setSaveMsg('Unexpected error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-surface-elevated rounded-[40px]" />
        <div className="h-64 bg-surface-elevated rounded-[40px]" />
      </div>
    );
  }

  if (!user) return null;

  const isStudent = user.role === 'STUDENT';
  const isTutor = user.role === 'TUTOR';
  const initials = getInitials(user.name);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {showCamera && (
        <CameraCapture
          onCapture={(imageData: string) => {
            setProfileImage(imageData);
            // Here you would typically upload to your server/cloud storage
            console.log('Captured image ready for upload');
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
      <header className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          My <span className="text-primary">Profile</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          Manage your personal information
        </p>
      </header>

      {/* Avatar + Role Card */}
      <div className="bg-white border-2 border-border rounded-[40px] p-8 flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <div className="shrink-0 relative group">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-24 h-24 rounded-[28px] object-cover shadow-xl shadow-primary/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-[28px] bg-linear-to-br from-primary to-[#5c7cfa] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-primary/20">
              {initials}
            </div>
          )}
          <button
            onClick={() => setShowCamera(true)}
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#5c7cfa] transition-colors opacity-0 group-hover:opacity-100"
            title="Take profile picture"
          >
            <Camera size={18} />
          </button>
        </div>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <h3 className="text-2xl font-black text-text-main tracking-tight">
            {user.name ?? user.email}
          </h3>
          <p className="text-text-muted font-bold text-sm">{user.email}</p>
          <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              isStudent ? 'bg-p-purple text-purple-700' : 'bg-p-mint text-teal-700'
            }`}>
              {isStudent ? <User size={11} /> : <GraduationCap size={11} />}
              {user.role}
            </span>
            {isTutor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-p-purple text-purple-700">
                <ShieldCheck size={11} /> Verified
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            editing
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-surface-elevated border-2 border-border text-text-muted hover:border-primary hover:text-primary'
          }`}
        >
          {saving ? (
            <><Sparkles size={14} className="animate-spin" /> Saving...</>
          ) : editing ? (
            <><Check size={14} /> Save Changes</>
          ) : (
            <><Edit3 size={14} /> Edit Profile</>
          )}
        </button>
      </div>

      {saveMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${
            saveMsg === 'Saved!' ? 'bg-p-green text-[#2b8a3e]' : 'bg-[#ffe3e3] text-[#e03131]'
          }`}
        >
          {saveMsg}
        </motion.div>
      )}

      {/* Info Grid */}
      <div className="bg-white border-2 border-border rounded-[40px] p-8 space-y-6">
        <h4 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
          <User size={16} className="text-primary" /> Personal Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="Full Name"
            value={form.name}
            icon={User}
            editing={editing}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Field
            label="Email Address"
            value={user.email}
            icon={Mail}
            editing={false} // email cannot be changed
          />

          {isStudent && (
            <>
              <Field
                label="Age"
                value={form.age}
                icon={Calendar}
                editing={editing}
                type="number"
                onChange={(v) => setForm({ ...form, age: v })}
              />
              <Field
                label="School Name"
                value={form.schoolName}
                icon={School}
                editing={editing}
                onChange={(v) => setForm({ ...form, schoolName: v })}
              />
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted ml-1 flex items-center gap-2">
                  <BookOpen size={12} /> Academic Level
                </label>
                {editing ? (
                  <select
                    value={form.schoolLevel}
                    onChange={(e) => setForm({ ...form, schoolLevel: e.target.value })}
                    className="bg-surface-elevated border-2 border-primary/30 rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="ELEMENTARY">Elementary School</option>
                    <option value="HIGH_SCHOOL">High School</option>
                  </select>
                ) : (
                  <div className="bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-main">
                    {form.schoolLevel === 'ELEMENTARY' ? 'Elementary School' : form.schoolLevel === 'HIGH_SCHOOL' ? 'High School' : '—'}
                  </div>
                )}
              </div>
            </>
          )}

          {isTutor && (
            <>
              <Field
                label="Headline"
                value={form.headline}
                icon={GraduationCap}
                editing={editing}
                onChange={(v) => setForm({ ...form, headline: v })}
              />
              <Field
                label="Hourly Rate (USD)"
                value={form.pricingPerHour}
                icon={DollarSign}
                editing={editing}
                type="number"
                onChange={(v) => setForm({ ...form, pricingPerHour: v })}
              />
              <Field
                label="Introduction Video URL"
                value={form.introVideoUrl}
                icon={Video}
                editing={editing}
                onChange={(v) => setForm({ ...form, introVideoUrl: v })}
              />
              <Field
                label="University"
                value={form.university}
                icon={GraduationCap}
                editing={editing}
                onChange={(v) => setForm({ ...form, university: v })}
              />
              <Field
                label="Degree"
                value={form.degree}
                icon={FileText}
                editing={editing}
                onChange={(v) => setForm({ ...form, degree: v })}
              />
              <div className="sm:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted ml-1 flex items-center gap-2">
                  <FileText size={12} /> Bio
                </label>
                {editing ? (
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={4}
                    className="bg-surface-elevated border-2 border-primary/30 rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                  />
                ) : (
                  <div className="bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-muted leading-relaxed min-h-20">
                    {form.bio || <span className="text-text-muted/50">No bio yet</span>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {editing && (
          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-strong transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <Check size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 px-6 py-3 bg-surface-elevated border-2 border-border text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-red-200 hover:text-red-400 transition-all"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white border-2 border-border rounded-[40px] p-8 space-y-4">
        <h4 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" /> Account
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-surface-elevated rounded-2xl space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Member Since</p>
            <p className="text-sm font-black text-text-main">
              {new Date(user.createdAt ?? Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="p-4 bg-surface-elevated rounded-2xl space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Account Status</p>
            <p className="text-sm font-black text-[#27ae60]">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon, editing, onChange, type = 'text' }: {
  label: string; value: string; icon: any; editing: boolean;
  onChange?: (v: string) => void; type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted ml-1 flex items-center gap-2">
        <Icon size={12} /> {label}
      </label>
      {editing && onChange ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-surface-elevated border-2 border-primary/30 rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all"
        />
      ) : (
        <div className="bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-main">
          {value || <span className="text-text-muted/50 font-normal">—</span>}
        </div>
      )}
    </div>
  );
}
