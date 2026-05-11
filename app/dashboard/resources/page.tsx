'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { BookOpen, Link2, Plus, Trash2, ExternalLink, FileText, Sparkles, GraduationCap, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  subject: string | null;
  level: string | null;
  createdAt: string;
}

export default function ResourcesPage() {
  const { user } = useCurrentUser();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', fileUrl: '', fileType: 'link', subject: '', level: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = () => {
    if (!user?.tutorProfile?.id) { setLoading(false); return; }
    fetch(`/api/resources?tutorId=${user.tutorProfile.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setResources(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchResources(); }, [user?.tutorProfile?.id]);

  const handleAdd = async () => {
    if (!form.title || !form.fileUrl || !user?.tutorProfile?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: user.tutorProfile.id,
          title: form.title,
          description: form.description || null,
          fileUrl: form.fileUrl,
          fileType: form.fileType || 'link',
          subject: form.subject || null,
          level: form.level || null,
        }),
      });
      if (res.ok) {
        setForm({ title: '', description: '', fileUrl: '', fileType: 'link', subject: '', level: '' });
        setShowAddForm(false);
        fetchResources();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/resources?id=${id}`, { method: 'DELETE' });
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  if (!user || user.role !== 'TUTOR') {
    return (
      <div className="py-20 text-center">
        <p className="text-text-muted font-black uppercase tracking-widest text-sm">This page is for tutors only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-p-mint rounded-full w-fit">
            <BookOpen size={12} className="text-teal-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-600">Learning Resources</span>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-text-main">
              Share <span className="gradient-text">Materials</span>
            </h2>
            <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
              Upload study guides, links, and resources for your students.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
          style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
        >
          <Plus size={14} /> Add Resource
        </button>
      </header>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-surface border-2 border-border rounded-[32px] p-8 space-y-5"
          >
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">New Resource</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Algebra Cheat Sheet"
                  className="w-full bg-[#f8f9fa] border-2 border-[#f1f3f5] rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">URL *</label>
                <input
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#f8f9fa] border-2 border-[#f1f3f5] rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Mathematics"
                  className="w-full bg-[#f8f9fa] border-2 border-[#f1f3f5] rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full bg-[#f8f9fa] border-2 border-[#f1f3f5] rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                >
                  <option value="">All Levels</option>
                  <option value="ELEMENTARY">Elementary</option>
                  <option value="HIGH_SCHOOL">High School</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this resource..."
                  rows={2}
                  className="w-full bg-[#f8f9fa] border-2 border-[#f1f3f5] rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border-2 border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:border-primary hover:text-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting || !form.title || !form.fileUrl}
                className="px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
              >
                {submitting ? 'Adding...' : 'Add Resource'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resource List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-surface border-2 border-border rounded-[32px] animate-pulse" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-6">
          <div className="w-16 h-16 bg-p-mint rounded-3xl flex items-center justify-center mx-auto">
            <BookOpen size={28} className="text-teal-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-text-main">No resources yet</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
              Share study guides, practice materials, and helpful links for your students.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
          >
            <Plus size={14} /> Add Your First Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, idx) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface border-2 border-border rounded-[32px] p-6 space-y-4 hover:border-primary/30 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-p-mint rounded-2xl flex items-center justify-center shrink-0">
                    {resource.fileType === 'link' ? <Link2 size={18} className="text-teal-600" /> : <FileText size={18} className="text-teal-600" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-text-main truncate">{resource.title}</h3>
                    {resource.subject && (
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{resource.subject}</span>
                    )}
                    {resource.level && (
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider ml-2">· {resource.level}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-p-rose rounded-lg text-text-muted hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {resource.description && (
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{resource.description}</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[9px] font-bold text-text-muted">
                  {new Date(resource.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                >
                  Open <ExternalLink size={11} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}