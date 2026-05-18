'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Star, ChevronRight, GraduationCap, Search, ShieldCheck, Filter, TrendingUp, Zap, Heart, ArrowLeft, ArrowRight, RefreshCw, Clock, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

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

type SortTab = 'all' | 'best' | 'rising';

function normalizeTutor(t: TutorFromDB) {
  return {
    id: t.id,
    name: t.name,
    headline: t.headline ?? 'Tutor',
    subjects: t.subjects,
    rating: t.rating,
    price: t.pricingPerHour,
    image: t.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.name)}`,
    bio: t.bio ?? '',
    level: 'BOTH' as 'ELEMENTARY' | 'HIGH_SCHOOL' | 'BOTH',
    isReal: true,
  };
}

const CARD_THEMES = [
  { bannerFrom: '#e2ddf0', bannerTo: '#c8bee0', tagBg: 'bg-p-purple', tagText: 'text-purple-700', bannerDarkFrom: '#252045', bannerDarkTo: '#1c1835' },
  { bannerFrom: '#e8dce4', bannerTo: '#d4bcc8', tagBg: 'bg-p-pink',   tagText: 'text-pink-700',   bannerDarkFrom: '#35242e', bannerDarkTo: '#281e24' },
  { bannerFrom: '#d6def0', bannerTo: '#b0c0da', tagBg: 'bg-p-blue',   tagText: 'text-blue-700',   bannerDarkFrom: '#1e2e45', bannerDarkTo: '#162238' },
  { bannerFrom: '#cce0d4', bannerTo: '#9ac2aa', tagBg: 'bg-p-mint',   tagText: 'text-teal-700',   bannerDarkFrom: '#1e352a', bannerDarkTo: '#142820' },
  { bannerFrom: '#e6e2cc', bannerTo: '#d0c89a', tagBg: 'bg-p-yellow', tagText: 'text-amber-700',  bannerDarkFrom: '#352e1e', bannerDarkTo: '#282418' },
  { bannerFrom: '#e0d8c8', bannerTo: '#ccbb9e', tagBg: 'bg-p-peach',  tagText: 'text-orange-700', bannerDarkFrom: '#35281e', bannerDarkTo: '#282016' },
];

// Philippine K-12 subject categories
const PH_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Filipino',
];

const TABS: { key: SortTab; label: string; icon: typeof Star; desc: string }[] = [
  { key: 'all',     label: 'All Tutors',    icon: ShieldCheck, desc: 'Browse our full directory' },
  { key: 'best',    label: 'Best Rated',    icon: Star,        desc: 'Top-rated by students' },
  { key: 'rising',  label: 'Rising Stars',  icon: TrendingUp,  desc: 'New & trending tutors' },
];

export default function TutorsPageWrapper() {
  return (
    <Suspense fallback={<div className="py-20 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <TutorsPage />
    </Suspense>
  );
}

interface PreviousTutorItem {
  tutor: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
    subjects: string[];
    rating: number | null;
    reviewCount: number;
  };
  bookingCount: number;
  lastBooked: string;
}

function TutorsPage() {
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const [tutors, setTutors]           = useState<ReturnType<typeof normalizeTutor>[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState(searchParams.get('q') ?? '');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ELEMENTARY' | 'HIGH_SCHOOL'>((searchParams.get('level') as any) ?? 'ALL');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [activeTab, setActiveTab]     = useState<SortTab>('all');
  const [isDark, setIsDark]           = useState(false);
  const [previousTutors, setPreviousTutors] = useState<PreviousTutorItem[]>([]);
  const [previousLoading, setPreviousLoading] = useState(true);
  const prevScrollRef = useRef<HTMLDivElement>(null);

  // Fetch previously-booked tutors
  useEffect(() => {
    if (user?.role !== 'STUDENT') {
      setPreviousLoading(false);
      return;
    }
    fetch('/api/tutors/previous', { credentials: 'include' })
      .then(r => r.json())
      .then((data: PreviousTutorItem[]) => {
        if (Array.isArray(data)) setPreviousTutors(data);
      })
      .catch(console.error)
      .finally(() => setPreviousLoading(false));
  }, [user]);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLoading(true);
    const sortParam = activeTab === 'all' ? '' : `sort=${activeTab}`;
    fetch(`/api/tutors${sortParam ? `?${sortParam}` : ''}`)
      .then((r) => r.json())
      .then((data: TutorFromDB[]) => {
        if (Array.isArray(data)) setTutors(data.map(normalizeTutor));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

  const filtered = tutors.filter((t) => {
    const matchSearch =
      search === '' ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      (t.headline ?? '').toLowerCase().includes(search.toLowerCase());
    const matchLevel =
      levelFilter === 'ALL' || t.level === levelFilter || t.level === 'BOTH';
    const matchSubject =
      subjectFilter === '' ||
      t.subjects.some((s) => s.toLowerCase() === subjectFilter.toLowerCase());
    return matchSearch && matchLevel && matchSubject;
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

      {/* Previously Booked Tutors — Carousel */}
      {!previousLoading && previousTutors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-rose-500" fill="currentColor" />
              <h3 className="font-black text-xs uppercase tracking-widest text-text-main">Previously Booked</h3>
              <span className="text-[9px] font-bold text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
                {previousTutors.length} tutor{previousTutors.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const el = prevScrollRef.current;
                  if (el) el.scrollBy({ left: -280, behavior: 'smooth' });
                }}
                className="p-1.5 bg-surface border border-border rounded-xl hover:bg-p-purple transition-all"
              >
                <ArrowLeft size={14} className="text-text-muted" />
              </button>
              <button
                onClick={() => {
                  const el = prevScrollRef.current;
                  if (el) el.scrollBy({ left: 280, behavior: 'smooth' });
                }}
                className="p-1.5 bg-surface border border-border rounded-xl hover:bg-p-purple transition-all"
              >
                <ArrowRight size={14} className="text-text-muted" />
              </button>
            </div>
          </div>

          <div
            ref={prevScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {previousTutors.map((item, idx) => {
              const theme = CARD_THEMES[idx % CARD_THEMES.length];
              return (
                <Link
                  key={item.tutor.id}
                  href={`/dashboard/tutors/${item.tutor.id}`}
                  className="snap-start shrink-0"
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-[220px] bg-surface border-2 border-border rounded-[24px] overflow-hidden group"
                  >
                    {/* Mini banner */}
                    <div
                      className="relative h-14"
                      style={{ background: `linear-gradient(135deg, ${isDark ? theme.bannerDarkFrom : theme.bannerFrom}, ${isDark ? theme.bannerDarkTo : theme.bannerTo})` }}
                    >
                      <div className="absolute -bottom-6 left-4">
                        <div className="relative w-11 h-11 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-surface">
                          <Image
                            src={item.tutor.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.tutor.name)}`}
                            alt={item.tutor.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="px-4 pt-8 pb-4 space-y-2">
                      <div className="space-y-0.5">
                        <h4 className="font-black text-sm text-text-main group-hover:text-primary transition-colors leading-tight line-clamp-1">
                          {item.tutor.name}
                        </h4>
                        <p className="text-[8px] font-bold text-text-muted uppercase tracking-tight line-clamp-1">
                          {item.tutor.headline ?? 'Tutor'}
                        </p>
                      </div>

                      {/* Booking count badge */}
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-p-mint/50 rounded-full w-fit">
                        <RefreshCw size={10} className="text-teal-600" />
                        <span className="text-[8px] font-black text-teal-700 uppercase tracking-widest">
                          Booked {item.bookingCount}×
                        </span>
                      </div>

                      {/* Subject tags */}
                      {item.tutor.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tutor.subjects.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className={`px-2 py-0.5 ${theme.tagBg} rounded-full text-[7px] font-black uppercase tracking-widest ${theme.tagText}`}
                            >
                              {s}
                            </span>
                          ))}
                          {item.tutor.subjects.length > 2 && (
                            <span className="text-[7px] font-black text-text-muted">+{item.tutor.subjects.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Rating */}
                      {item.tutor.rating !== null && (
                        <div className="flex items-center gap-1">
                          <Star size={10} fill="currentColor" className="text-[#fcc419]" />
                          <span className="text-[10px] font-black text-text-main">{item.tutor.rating.toFixed(1)}</span>
                          <span className="text-[7px] font-bold text-text-muted">({item.tutor.reviewCount})</span>
                        </div>
                      )}

                      {/* Book Again CTA */}
                      <div className="pt-1">
                        <div className="flex items-center justify-center gap-1.5 py-2 bg-primary/10 text-primary rounded-xl text-[8px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all">
                          Book Again <ChevronRight size={11} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs: All | Best Rated | Rising Stars */}
      <div className="flex gap-1.5 p-1.5 bg-p-purple/30 rounded-2xl border border-border overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-main hover:bg-surface/40'
              }`}
            >
              <Icon size={13} />
              {tab.label}
              <span className="hidden sm:inline text-[8px] text-text-muted/60 font-bold normal-case tracking-normal">
                · {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, subject..."
              className="w-full bg-surface border-2 border-border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50 shadow-xs"
            />
          </div>
          <div className="flex gap-1.5 p-1.5 bg-p-purple/50 rounded-2xl border border-border">
            {(['ALL', 'ELEMENTARY', 'HIGH_SCHOOL'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  levelFilter === lvl
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {lvl === 'HIGH_SCHOOL' ? 'High School' : lvl === 'ELEMENTARY' ? 'Elementary' : 'All'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Subject filter */}
        <div className="flex gap-1.5 flex-wrap">
          <Filter size={14} className="text-text-muted self-center" />
          {PH_SUBJECTS.slice(0, 8).map((sub) => (
            <button
              key={sub}
              onClick={() => setSubjectFilter(subjectFilter === sub ? '' : sub)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                subjectFilter === sub
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-elevated border-border text-text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {sub}
            </button>
          ))}
          {PH_SUBJECTS.length > 8 && (
            <button
              onClick={() => setSubjectFilter('')}
              className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-border text-text-muted hover:border-primary hover:text-primary transition-all bg-surface-elevated"
            >
              +{PH_SUBJECTS.length - 8} More
            </button>
          )}
        </div>
      </div>

      {/* Tab description */}
      {activeTab !== 'all' && (
        <div className={`px-5 py-3 rounded-2xl border flex items-center gap-3 ${
          activeTab === 'best' 
            ? 'bg-amber-50 border-amber-200' 
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          {activeTab === 'best' ? (
            <>
              <Star size={16} className="text-amber-500 shrink-0" fill="currentColor" />
              <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                <strong className="font-black">Best Rated</strong> — Tutors sorted by highest average rating and most reviews from students.
              </p>
            </>
          ) : (
            <>
              <TrendingUp size={16} className="text-emerald-500 shrink-0" />
              <p className="text-[10px] font-bold text-emerald-800 leading-relaxed">
                <strong className="font-black">Rising Stars</strong> — Tutors gaining traction with recent positive reviews and new sign-ups.
              </p>
            </>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border-2 border-border rounded-[32px] overflow-hidden animate-pulse">
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
        <div className="bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-4">
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
                  className="bg-surface border-2 border-border rounded-[32px] overflow-hidden cursor-pointer group relative"
                >
                  {/* Gradient banner */}
                  <div
                    className="relative h-24"
                    style={{ background: `linear-gradient(135deg, ${isDark ? theme.bannerDarkFrom : theme.bannerFrom}, ${isDark ? theme.bannerDarkTo : theme.bannerTo})` }}
                  >
                    {/* Subtle ring decoration */}
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full border-[16px] border-white/20" />
                    <div className="absolute -right-2 top-10 w-12 h-12 rounded-full border-[8px] border-white/15" />

                    {/* Avatar overlapping banner */}
                    <div className="absolute -bottom-8 left-6">
                        <div className="relative w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-surface">
                          <Image
                            src={tutor.image}
                            alt={tutor.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                            priority
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
                        <div className="flex items-center gap-1 shrink-0">
                          {tutor.rating !== null ? (
                            <>
                              <Star size={12} fill="currentColor" className="text-[#fcc419]" />
                              <span className="text-[11px] font-black text-text-main">{tutor.rating.toFixed(1)}</span>
                            </>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted px-2 py-0.5 bg-surface-elevated rounded-full">New</span>
                          )}
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

                  {/* Badge for Best/Rising */}
                  {activeTab === 'best' && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-amber-400 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                      <Star size={9} fill="currentColor" /> Top Rated
                    </div>
                  )}
                  {activeTab === 'rising' && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                      <Zap size={9} fill="currentColor" /> Rising
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}