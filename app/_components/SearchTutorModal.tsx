'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, X, GraduationCap, ArrowRight, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface TutorResult {
  id: string;
  name: string;
  image: string | null;
  headline: string | null;
  subjects: string[];
  rating: number | null;
  pricingPerHour: number;
  bio: string | null;
}

interface SearchTutorModalProps {
  open: boolean;
  onClose: () => void;
  query: string;
  level: 'ALL' | 'ELEMENTARY' | 'HIGH_SCHOOL';
}

const CARD_THEMES = [
  { bannerFrom: '#ede9fe', bannerTo: '#c4b5fd', tagBg: 'bg-p-purple', tagText: 'text-purple-700' },
  { bannerFrom: '#fce7f3', bannerTo: '#f9a8d4', tagBg: 'bg-p-pink',   tagText: 'text-pink-700'   },
  { bannerFrom: '#dbeafe', bannerTo: '#93c5fd', tagBg: 'bg-p-blue',   tagText: 'text-blue-700'   },
  { bannerFrom: '#d1fae5', bannerTo: '#6ee7b7', tagBg: 'bg-p-mint',   tagText: 'text-teal-700'   },
];

export default function SearchTutorModal({ open, onClose, query, level }: SearchTutorModalProps) {
  const [tutors, setTutors] = useState<TutorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredTutors, setFilteredTutors] = useState<TutorResult[]>([]);

  // Fetch all approved tutors when modal opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/tutors')
      .then(r => r.json())
      .then((data: TutorResult[]) => {
        if (Array.isArray(data)) setTutors(data);
        else setTutors([]);
      })
      .catch(() => setTutors([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Filter tutors based on query + level
  useEffect(() => {
    let results = tutors;

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.subjects.some(s => s.toLowerCase().includes(q)) ||
        (t.headline ?? '').toLowerCase().includes(q) ||
        (t.bio ?? '').toLowerCase().includes(q)
      );
    }

    setFilteredTutors(results);
  }, [tutors, query]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-x-auto md:inset-y-8 md:left-1/2 md:-translate-x-1/2 md:w-[640px] lg:w-[800px] z-[101] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-p-purple/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-p-purple/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-p-purple to-pink-300 flex items-center justify-center">
                  <Search size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-text-main">
                    Search Results
                  </h3>
                  {query && (
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      Showing tutors for "<span className="text-primary">{query}</span>"
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-p-sakura/60 flex items-center justify-center hover:bg-p-sakura transition-colors"
              >
                <X size={16} className="text-text-muted" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 size={28} className="text-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Finding tutors...
                  </p>
                </div>
              ) : filteredTutors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-p-purple/30 rounded-3xl flex items-center justify-center">
                    <GraduationCap size={28} className="text-primary/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-text-main">No tutors found</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest max-w-xs mx-auto">
                      Try a different subject or browse all our available tutors.
                    </p>
                  </div>
                  <Link
                    href="/signup"
                    className="px-6 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 inline-flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 6px 20px rgba(147,51,234,0.25)' }}
                    onClick={onClose}
                  >
                    Sign Up to Browse All <ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results count */}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                      <Users size={12} /> {filteredTutors.length} tutor{filteredTutors.length !== 1 ? 's' : ''} found
                    </p>
                  </div>

                  {/* Tutor cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTutors.slice(0, 6).map((tutor, idx) => {
                      const theme = CARD_THEMES[idx % CARD_THEMES.length];
                      const image = tutor.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(tutor.name)}`;
                      return (
                        <div
                          key={tutor.id}
                          className="bg-white border-2 border-p-purple/20 rounded-2xl overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all relative"
                        >
                          {/* Mini banner */}
                          <div
                            className="relative h-16"
                            style={{ background: `linear-gradient(135deg, ${theme.bannerFrom}, ${theme.bannerTo})` }}
                          >
                            <div className="absolute -bottom-6 left-4">
                              <div className="relative w-12 h-12 rounded-xl border-3 border-white shadow-md overflow-hidden bg-white">
                                <Image src={image} alt={tutor.name} fill sizes="48px" className="object-cover" />
                              </div>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="px-4 pt-8 pb-4 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-black text-sm text-text-main leading-tight truncate">
                                  {tutor.name}
                                </h4>
                                {tutor.headline && (
                                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-tight truncate">
                                    {tutor.headline}
                                  </p>
                                )}
                              </div>
                              {tutor.rating !== null && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <Star size={10} fill="currentColor" className="text-[#fcc419]" />
                                  <span className="text-[10px] font-black text-text-main">{tutor.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>

                            {/* Subject tags */}
                            {tutor.subjects.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {tutor.subjects.slice(0, 2).map(s => (
                                  <span key={s} className={`px-2 py-0.5 ${theme.tagBg} rounded-full text-[8px] font-black uppercase tracking-widest ${theme.tagText} border border-white`}>
                                    {s}
                                  </span>
                                ))}
                                {tutor.subjects.length > 2 && (
                                  <span className="px-2 py-0.5 bg-surface-elevated rounded-full text-[8px] font-black uppercase tracking-widest text-text-muted">
                                    +{tutor.subjects.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Price */}
                            <div className="flex items-center justify-between pt-2 border-t border-p-purple/20">
                              <p className="text-xs font-black text-text-main">
                                ${tutor.pricingPerHour}
                                <span className="text-[8px] font-bold text-text-muted">/hr</span>
                              </p>
                            </div>
                          </div>

                          {/* Overlay CTA on hover — must sign up */}
                          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted text-center">
                              Sign up to view full profile & book
                            </p>
                            <Link
                              href="/signup"
                              className="px-5 py-2.5 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all hover:scale-105 inline-flex items-center gap-1.5"
                              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 4px 12px rgba(147,51,234,0.3)' }}
                              onClick={onClose}
                            >
                              Join Now <ArrowRight size={10} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer CTA */}
                  <div className="text-center pt-4 pb-2">
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-2 px-8 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 8px 28px rgba(147,51,234,0.3)' }}
                      onClick={onClose}
                    >
                      Sign Up to Book a Tutor <ArrowRight size={12} />
                    </Link>
                    <p className="text-[8px] font-bold text-text-muted/60 mt-2 uppercase tracking-widest">
                      Already have an account?{' '}
                      <Link href="/login" className="text-primary hover:underline" onClick={onClose}>Log in</Link>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}