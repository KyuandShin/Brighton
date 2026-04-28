'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronRight, GraduationCap, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface TutorFromDB {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  headline: string | null;
  bio: string | null;
  introVideoUrl: string | null;
  pricingPerHour: number;
  subjects: string[];
  rating: number | null;
  reviewCount: number;
}

function normalizeTutor(t: TutorFromDB) {
  return {
    id: t.id,
    name: t.name,
    headline: t.headline ?? 'Tutor',
    subjects: t.subjects,
    rating: t.rating ?? 5.0,
    price: t.pricingPerHour,
    image: t.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.name)}`,
    bio: t.bio ?? '',
    level: 'BOTH' as 'ELEMENTARY' | 'HIGH_SCHOOL' | 'BOTH',
    isReal: true,
  };
}

const CARD_THEMES = [
  { bannerFrom: '#ede9fe', bannerTo: '#c4b5fd', tagBg: 'bg-p-purple', tagText: 'text-purple-700' },
  { bannerFrom: '#fce7f3', bannerTo: '#f9a8d4', tagBg: 'bg-p-pink',   tagText: 'text-pink-700'   },
  { bannerFrom: '#dbeafe', bannerTo: '#93c5fd', tagBg: 'bg-p-blue',   tagText: 'text-blue-700'   },
  { bannerFrom: '#d1fae5', bannerTo: '#6ee7b7', tagBg: 'bg-p-mint',   tagText: 'text-teal-700'   },
  { bannerFrom: '#fef9c3', bannerTo: '#fcd34d', tagBg: 'bg-p-yellow', tagText: 'text-amber-700'  },
];

export default function TutorsPage() {
  const [tutors, setTutors]           = useState<ReturnType<typeof normalizeTutor>[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ELEMENTARY' | 'HIGH_SCHOOL'>('ALL');

  useEffect(() => {
    fetch('/api/tutors')
      .then((r) => r.json())
      .then((data: TutorFromDB[]) => {
        if (Array.isArray(data)) setTutors(data.map(normalizeTutor));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = tutors.filter((t) => {
    const matchSearch =
      search === '' ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      (t.headline ?? '').toLowerCase().includes(search.toLowerCase());
    const matchLevel =
      levelFilter === 'ALL' || t.level === levelFilter || t.level === 'BOTH';
    return matchSearch && matchLevel;
  });

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-text-main">
              Find Your <span className="gradient-text">Expert.</span>
            </h2>
            <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
              Browse our pool of verified academic professionals.
            </p>
          </div>
          {!loading && tutors.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-p-purple rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest text-primary shrink-0">
              <ShieldCheck size={13} />
              {tutors.length} verified tutor{tutors.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </header>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, subject..."
            className="w-full bg-white border-2 border-border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50 shadow-xs"
          />
        </div>
        <div className="flex gap-1.5 p-1.5 bg-p-purple/50 rounded-2xl border border-border">
          {(['ALL', 'ELEMENTARY', 'HIGH_SCHOOL'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                levelFilter === lvl
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {lvl === 'HIGH_SCHOOL' ? 'High School' : lvl === 'ELEMENTARY' ? 'Elementary' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border-2 border-border rounded-[32px] overflow-hidden animate-pulse">
              <div className="h-24 bg-p-purple/60" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-surface-elevated rounded-xl w-2/3" />
                <div className="h-3 bg-surface-elevated rounded-xl w-1/2" />
                <div className="h-3 bg-surface-elevated rounded-xl w-full" />
                <div className="h-3 bg-surface-elevated rounded-xl w-4/5" />
                <div className="flex gap-2 pt-2">
                  {[1,2,3].map(j => <div key={j} className="h-6 w-14 bg-surface-elevated rounded-full" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
            <GraduationCap size={28} className="text-primary" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-text-muted">
            No tutors found
          </p>
          <button
            onClick={() => { setSearch(''); setLevelFilter('ALL'); }}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tutor, idx) => {
            const theme = CARD_THEMES[idx % CARD_THEMES.length];
            return (
              <Link key={tutor.id} href={`/dashboard/tutors/${tutor.id}`}>
                <motion.div
                  whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(147,51,234,0.14)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="bg-white border-2 border-border rounded-[32px] overflow-hidden cursor-pointer group"
                >
                  {/* Gradient banner */}
                  <div
                    className="relative h-24"
                    style={{ background: `linear-gradient(135deg, ${theme.bannerFrom}, ${theme.bannerTo})` }}
                  >
                    {/* Subtle ring decoration */}
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full border-[16px] border-white/20" />
                    <div className="absolute -right-2 top-10 w-12 h-12 rounded-full border-[8px] border-white/15" />

                    {/* Avatar overlapping banner */}
                    <div className="absolute -bottom-8 left-6">
                      <div className="relative w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white">
                        <Image
                          src={tutor.image}
                          alt={tutor.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-6 pt-11 pb-6 space-y-4">
                    {/* Name + rating */}
                    <div className="space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-base text-text-main group-hover:text-primary transition-colors leading-tight line-clamp-1">
                          {tutor.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[#fcc419] shrink-0">
                          <Star size={12} fill="currentColor" />
                          <span className="text-[11px] font-black text-text-main">{tutor.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight line-clamp-1">
                        {tutor.headline}
                      </p>
                    </div>

                    {/* Bio */}
                    {tutor.bio && (
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2 font-medium">
                        {tutor.bio}
                      </p>
                    )}

                    {/* Subject tags */}
                    {tutor.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tutor.subjects.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className={`px-2.5 py-1 ${theme.tagBg} rounded-full text-[9px] font-black uppercase tracking-widest ${theme.tagText} border border-white`}
                          >
                            {s}
                          </span>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <span className="px-2.5 py-1 bg-surface-elevated rounded-full text-[9px] font-black uppercase tracking-widest text-text-muted border border-border">
                            +{tutor.subjects.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer: price + CTA */}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Rate</p>
                        <p className="text-base font-black text-text-main leading-tight">
                          ${tutor.price}
                          <span className="text-[10px] font-bold text-text-muted">/hr</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-accent-strong transition-all shadow-sm shadow-primary/20">
                        Book
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
