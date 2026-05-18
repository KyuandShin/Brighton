'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Heart, Star, GraduationCap, ChevronRight, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface FavoriteTutor {
  id: string;
  createdAt: string;
  tutor: {
    id: string;
    headline: string | null;
    user: { name: string | null; image: string | null };
    subjects: { subject: { name: string } }[];
    pricingPerHour: number;
  };
}

export default function FavoritesPage() {
  const { user } = useCurrentUser();
  const [favorites, setFavorites] = useState<FavoriteTutor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(() => {
    if (!user?.id) return;
    fetch(`/api/favorites?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setFavorites(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const removeFavorite = async (tutorId: string) => {
    if (!user?.id) return;
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, tutorId }),
    });
    setFavorites((prev) => prev.filter((f) => f.tutor.id !== tutorId));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          Your <span className="gradient-text">Favorites</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          Tutors you've bookmarked for quick access.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border-2 border-border rounded-[32px] overflow-hidden animate-pulse">
              <div className="h-20 bg-p-pink/60" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-surface-elevated rounded-xl w-2/3" />
                <div className="h-3 bg-surface-elevated rounded-xl w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-6">
          <div className="w-16 h-16 bg-p-pink rounded-3xl flex items-center justify-center mx-auto">
            <Heart size={28} className="text-pink-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-text-main">No favorites yet</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
              Browse our tutors and click the heart icon to save your favorites here!
            </p>
          </div>
          <Link
            href="/dashboard/tutors"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
          >
            <Search size={14} /> Find Tutors
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav, idx) => {
            const tutor = fav.tutor;
            const image = tutor.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(tutor.user.name ?? '')}`;
            return (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative bg-surface border-2 border-border rounded-[32px] overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="h-20 bg-gradient-to-r from-p-pink to-p-sakura" />
                <div className="absolute -bottom-8 left-6">
                  <div className="w-16 h-16 rounded-2xl border-4 border-surface shadow-md overflow-hidden">
                    <Image src={image} alt={tutor.user.name ?? ''} fill sizes="64px" className="object-cover" />
                  </div>
                </div>
                <button
                  onClick={() => removeFavorite(tutor.id)}
                  className="absolute top-4 right-4 p-2 bg-white/70 hover:bg-white rounded-xl text-pink-500 hover:text-red-500 transition-all shadow-sm z-10"
                >
                  <Trash2 size={14} />
                </button>
                <div className="px-6 pt-11 pb-6 space-y-3">
                  <h3 className="font-black text-sm text-text-main">{tutor.user.name ?? 'Tutor'}</h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">{tutor.headline ?? 'Tutor'}</p>
                  {tutor.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tutor.subjects.slice(0, 2).map((s) => (
                        <span key={s.subject.name} className="px-2 py-0.5 bg-p-pink rounded-full text-[8px] font-black uppercase tracking-widest text-pink-700">
                          {s.subject.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-2 flex items-center justify-between border-t border-border">
                    <p className="text-sm font-black text-text-main">
                      ${tutor.pricingPerHour}<span className="text-[10px] font-bold text-text-muted">/hr</span>
                    </p>
                    <Link
                      href={`/dashboard/tutors/${tutor.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-accent-strong transition-all"
                    >
                      View <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}