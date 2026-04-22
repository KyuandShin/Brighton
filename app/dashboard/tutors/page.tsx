'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronRight, GraduationCap, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

// Normalize DB tutor to a common shape
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


export default function TutorsPage() {
  const [tutors, setTutors] = useState<ReturnType<typeof normalizeTutor>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ELEMENTARY' | 'HIGH_SCHOOL'>('ALL');

  useEffect(() => {
    fetch('/api/tutors')
      .then((r) => r.json())
      .then((data: TutorFromDB[]) => {
        if (Array.isArray(data)) {
          setTutors(data.map(normalizeTutor));
        }
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
      levelFilter === 'ALL' ||
      t.level === levelFilter ||
      t.level === 'BOTH';

    return matchSearch && matchLevel;
  });

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          Find Your <span className="text-primary">Expert.</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          Browse our pool of verified academic professionals.
        </p>
      </header>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd]"
            size={16}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, subject..."
            className="w-full bg-white border-2 border-[#f1f3f5] rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all placeholder:text-[#adb5bd]"
          />
        </div>
        <div className="flex gap-2 p-1.5 bg-[#f8f9fa] rounded-2xl border border-[#f1f3f5]">
          {(['ALL', 'ELEMENTARY', 'HIGH_SCHOOL'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                levelFilter === lvl
                  ? 'bg-white text-primary shadow-md'
                  : 'text-[#adb5bd] hover:text-text-main'
              }`}
            >
              {lvl === 'HIGH_SCHOOL' ? 'High School' : lvl === 'ELEMENTARY' ? 'Elementary' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#f8f9fa] rounded-[40px] h-72 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-3">
          <GraduationCap size={40} className="mx-auto text-[#adb5bd]" />
          <p className="text-sm font-black uppercase tracking-widest text-[#adb5bd]">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((tutor) => (
            <Link key={tutor.id} href={`/dashboard/tutors/${tutor.id}`}>
              <div className="bg-white border-2 border-[#f1f3f5] rounded-[40px] p-8 space-y-6 hover:border-primary/30 transition-all group hover:shadow-xl cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="relative w-20 h-20 shrink-0">
                    <Image
                      src={tutor.image}
                      alt={tutor.name}
                      fill
                      className="rounded-3xl bg-[#f8f9fa] border-2 border-white shadow-sm object-cover"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-black text-xl text-text-main group-hover:text-primary transition-colors truncate">
                      {tutor.name}
                    </h3>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight line-clamp-1">
                      {tutor.headline}
                    </p>
                    <div className="flex items-center gap-1 text-[#fcc419]">
                      <Star size={13} fill="currentColor" />
                      <span className="text-xs font-black">{tutor.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs font-bold text-text-muted leading-relaxed line-clamp-2">
                  {tutor.bio}
                </p>

                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-[#f8f9fa] rounded-full text-[9px] font-black uppercase tracking-widest text-primary border border-[#f1f3f5]"
                    >
                      {s}
                    </span>
                  ))}
                  {tutor.subjects.length > 4 && (
                    <span className="px-3 py-1 bg-[#f8f9fa] rounded-full text-[9px] font-black uppercase tracking-widest text-[#adb5bd] border border-[#f1f3f5]">
                      +{tutor.subjects.length - 4}
                    </span>
                  )}
                </div>

                <div className="pt-5 border-t border-[#f1f3f5] flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd]">Rate</p>
                    <p className="text-lg font-black text-text-main">
                      ${tutor.price}
                      <span className="text-[10px] text-[#adb5bd]">/hr</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-[#f8f9fa] rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
