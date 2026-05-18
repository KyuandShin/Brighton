'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  ArrowLeft, FileText, Send, CheckCircle, AlertCircle, Loader2,
  Edit3, Star, Home, Sparkles, Brain, Target, GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface BookingData {
  id: string;
  date: string;
  status: string;
  student?: { id: string; user: { name: string | null; image: string | null } };
  tutor?: { id: string; headline: string | null; user: { name: string | null } };
  notes?: { id: string; content: string; subject: string | null; topics: string[]; skills: any; homework: string | null; createdAt: string } | null;
}

const AVAILABLE_TOPICS: Record<string, string[]> = {
  'Mathematics': ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fractions', 'Decimals', 'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Probability', 'Linear Equations', 'Quadratic Equations', 'Exponents', 'Ratios', 'Percentages', 'Square Roots'],
  'Science': ['Plants', 'Animals', 'Human Body', 'Solar System', 'Weather', 'Energy', 'Forces', 'Matter', 'Chemistry', 'Physics', 'Biology', 'Ecosystems', 'Water Cycle', 'Light', 'Sound', 'Electricity'],
  'Filipino': ['Pagbaybay', 'Pangngalan', 'Pandiwa', 'Pang-uri', 'Pang-abay', 'Panghalip', 'Gramatika', 'Panitikan', 'Pagbasa', 'Pagsulat', 'Alpabeto', 'Bantas', 'Talasalitaan', 'Idyoma'],
  'English': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Parts of Speech', 'Verb Tenses', 'Sentence Structure', 'Figurative Language', 'Literary Devices', 'Phonics', 'Spelling', 'Punctuation'],
};

export default function TutorNotesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notes form fields
  const [notesContent, setNotesContent] = useState('');
  const [notesSubject, setNotesSubject] = useState('');
  const [notesTopics, setNotesTopics] = useState<string[]>([]);
  const [notesHomework, setNotesHomework] = useState('');
  const [notesConfident, setNotesConfident] = useState('');
  const [notesNeedsPractice, setNotesNeedsPractice] = useState('');
  const [notesStruggling, setNotesStruggling] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/bookings/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Could not find this session');
        const data = await res.json();
        setBooking(data);

        // Pre-populate if notes already exist
        if (data.notes) {
          setNotesContent(data.notes.content || '');
          setNotesSubject(data.notes.subject || '');
          setNotesTopics(data.notes.topics || []);
          setNotesHomework(data.notes.homework || '');
          if (data.notes.skills) {
            setNotesConfident((data.notes.skills.Confident || []).join(', '));
            setNotesNeedsPractice((data.notes.skills.NeedsPractice || []).join(', '));
            setNotesStruggling((data.notes.skills.Struggling || []).join(', '));
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleSubmitNotes = async () => {
    if (!notesContent.trim()) return;

    const skills: Record<string, string[]> = {};
    if (notesConfident.trim()) skills.Confident = notesConfident.split(',').map(s => s.trim()).filter(Boolean);
    if (notesNeedsPractice.trim()) skills.NeedsPractice = notesNeedsPractice.split(',').map(s => s.trim()).filter(Boolean);
    if (notesStruggling.trim()) skills.Struggling = notesStruggling.split(',').map(s => s.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      const res = await fetch('/api/session-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          content: notesContent.trim(),
          subject: notesSubject || null,
          topics: notesTopics,
          skills: Object.keys(skills).length > 0 ? skills : null,
          homework: notesHomework.trim() || null,
        }),
      });

      if (res.ok) {
        setSaved(true);
        toast.success('Session notes saved! Notifying your student...');
        setTimeout(() => {
          router.push('/dashboard/classes');
        }, 2000);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save notes');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect non-tutors
  useEffect(() => {
    if (user && user.role !== 'TUTOR') {
      router.replace(`/dashboard/sessions/${id}/feedback`);
    }
  }, [user, id, router]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-surface border-2 border-border rounded-xl animate-pulse" />
        <div className="h-96 bg-surface border-2 border-border rounded-[40px] animate-pulse" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-6">
        <div className="w-16 h-16 bg-p-rose rounded-3xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} className="text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-text-main">Session Not Found</h2>
        <p className="text-sm font-bold text-text-muted">{error || 'Could not load session.'}</p>
        <Link href="/dashboard/classes" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-strong transition-all">
          <ArrowLeft size={13} /> Back to Classes
        </Link>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto bg-surface border-2 border-border rounded-[40px] p-16 text-center space-y-6">
        <div className="w-20 h-20 bg-p-mint rounded-[30px] flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-teal-600" />
        </div>
        <h2 className="text-2xl font-black text-text-main">Notes Saved! 🎉</h2>
        <p className="text-sm font-bold text-text-muted">
          Your student has been notified and can now view the session notes along with AI-generated feedback.
        </p>
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => router.push('/dashboard/classes')}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent-strong transition-all"
          >
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  const sessionDate = new Date(booking.date);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <button
          onClick={() => router.push('/dashboard/classes')}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all"
        >
          <ArrowLeft size={12} /> Back to Classes
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-p-mint rounded-2xl flex items-center justify-center">
            <Edit3 size={24} className="text-primary" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black tracking-tight text-text-main">
              Session <span className="gradient-text">Notes</span>
            </h2>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {' · with '}
              {booking.student?.user?.name || 'Student'}
            </p>
          </div>
        </div>
      </header>

      {/* Notes Form */}
      <div className="bg-surface border-2 border-border rounded-[32px] p-6 space-y-6">
        {/* Subject Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Subject</label>
          <div className="flex gap-1.5 flex-wrap">
            {['Mathematics', 'Science', 'Filipino', 'English'].map(subject => (
              <button
                key={subject}
                type="button"
                onClick={() => {
                  setNotesSubject(subject);
                  setNotesTopics([]);
                }}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${
                  notesSubject === subject
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-elevated text-text-muted border-border hover:border-primary/30'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        {notesSubject && AVAILABLE_TOPICS[notesSubject] && (
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Topics Covered</label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TOPICS[notesSubject].map(topic => {
                const isSelected = notesTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setNotesTopics(prev =>
                        isSelected ? prev.filter(t => t !== topic) : [...prev, topic]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                      isSelected
                        ? 'bg-p-purple text-primary'
                        : 'bg-surface-elevated text-text-muted hover:bg-p-purple/30'
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Understanding Levels */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <Target size={12} /> Student Understanding
          </label>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
              <input
                type="text"
                value={notesConfident}
                onChange={(e) => setNotesConfident(e.target.value)}
                placeholder="Confident: e.g. Algebra, Fractions"
                className="flex-1 bg-surface-elevated border-2 border-border rounded-xl px-3 py-2.5 text-[10px] font-bold text-text-main focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <input
                type="text"
                value={notesNeedsPractice}
                onChange={(e) => setNotesNeedsPractice(e.target.value)}
                placeholder="Needs practice: e.g. Geometry, Decimals"
                className="flex-1 bg-surface-elevated border-2 border-border rounded-xl px-3 py-2.5 text-[10px] font-bold text-text-main focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <input
                type="text"
                value={notesStruggling}
                onChange={(e) => setNotesStruggling(e.target.value)}
                placeholder="Struggling: e.g. Trigonometry"
                className="flex-1 bg-surface-elevated border-2 border-border rounded-xl px-3 py-2.5 text-[10px] font-bold text-text-main focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Homework */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <GraduationCap size={12} /> Homework Assigned
          </label>
          <textarea
            value={notesHomework}
            onChange={(e) => setNotesHomework(e.target.value)}
            placeholder="e.g. Complete pages 25-30 of the workbook, watch Khan Academy video on solving equations"
            rows={2}
            className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-[10px] font-bold text-text-main focus:outline-none focus:border-primary transition-all resize-none"
          />
        </div>

        {/* Free-form Notes */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <FileText size={12} /> Detailed Notes
          </label>
          <textarea
            value={notesContent}
            onChange={(e) => setNotesContent(e.target.value)}
            placeholder="e.g. Today we covered algebra fundamentals — solving linear equations using inverse operations. The student did well with one-step equations but needs more practice with two-step problems."
            rows={8}
            className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-medium text-text-main focus:outline-none focus:border-primary transition-all resize-none"
          />
        </div>

        <button
          onClick={handleSubmitNotes}
          disabled={submitting || !notesContent.trim()}
          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #20c997 0%, #0ca678 100%)' }}
        >
          {submitting ? (
            <><Loader2 size={14} className="animate-spin" /> Saving...</>
          ) : (
            <><Send size={14} /> {booking.notes ? 'Update Notes' : 'Save Notes & Notify Student'}</>
          )}
        </button>
      </div>

      {/* Tip */}
      <div className="bg-p-purple/10 border-2 border-border rounded-[32px] p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="font-black text-xs uppercase tracking-widest text-text-main">Why fill out notes?</h3>
        </div>
        <p className="text-xs font-medium text-text-muted leading-relaxed">
          Your session notes power the AI-generated feedback for your student. Topics, understanding levels, and homework
          all appear in their personalized summary. Once saved, your student will be notified instantly.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/dashboard/classes"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-surface border-2 border-border rounded-2xl font-black text-[10px] uppercase tracking-widest text-text-muted hover:border-primary hover:text-primary transition-all"
        >
          <Home size={13} /> Skip for Now
        </Link>
      </div>
    </div>
  );
}