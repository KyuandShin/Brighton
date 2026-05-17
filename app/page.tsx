'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import SearchTutorModal from '@/app/_components/SearchTutorModal';
import {
  Search, Check, Zap, Lightbulb, Star, ArrowRight, Sparkles,
  GraduationCap, BookOpen, Heart, Rocket, Shield, Users,
  TrendingUp, ChevronRight, ChevronDown, Sun, Moon,
  BarChart3, MessageSquare, Quote, Loader2,
  CalendarCheck, UserPlus
} from 'lucide-react';
import HoshiMascot from '@/app/_components/HoshiMascot';

const HERO_DECOS = [
  { char: '✦', top: '15%',  left: '4%',   size: '2rem',   color: '#f472b6', delay: '0s',   dur: '5s'  },
  { char: '★', top: '10%',  right: '5%',  size: '1.6rem', color: '#9333ea', delay: '1.3s', dur: '7s'  },
  { char: '✿', top: '55%',  left: '3%',   size: '1.8rem', color: '#ec4899', delay: '2.2s', dur: '6s'  },
  { char: '✧', bottom: '20%', right: '4%', size: '2.2rem', color: '#a855f7', delay: '0.6s', dur: '8s' },
  { char: '◆', top: '70%',  left: '7%',   size: '1rem',   color: '#f472b6', delay: '1.8s', dur: '4s'  },
  { char: '✦', top: '40%',  right: '3%',  size: '1.1rem', color: '#d946ef', delay: '3s',   dur: '5.5s'},
];

const features = [
  { icon: Lightbulb, title: 'AI-Powered Matching', desc: 'Smart algorithm matches you with the perfect tutor based on your learning needs and academic level.', gradient: 'from-purple-500 to-pink-500' },
  { icon: Rocket, title: 'Personalized Learning', desc: 'Custom study plans tailored to Elementary or High School curriculum with real-time progress tracking.', gradient: 'from-blue-500 to-purple-500' },
  { icon: Sparkles, title: 'Verified Experts', desc: 'All tutors undergo rigorous background checks and credential verification for your peace of mind.', gradient: 'from-pink-500 to-amber-500' },
  { icon: TrendingUp, title: 'Track Progress', desc: 'Monitor improvement with detailed analytics, AI assessments, and weekly performance reports.', gradient: 'from-teal-500 to-blue-500' },
];

const howItWorks = [
  { step: 1, title: 'Sign Up Free', desc: 'Create your account as a student or parent — no cost, no commitment.', icon: UserPlus },
  { step: 2, title: 'Find Your Tutor', desc: 'Search by subject, level, and availability. View profiles, ratings, and reviews.', icon: Search },
  { step: 3, title: 'Book a Session', desc: 'Pick a time that works for you and book instantly with your chosen tutor.', icon: CalendarCheck },
  { step: 4, title: 'Learn & Excel', desc: 'Attend live sessions, track progress with AI analytics, and ace your exams.', icon: TrendingUp },
];

interface Stats {
  tutors: number;
  totalTutors: number;
  students: number;
  completedSessions: number;
  reviews: number;
}

interface FeaturedReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  student: {
    user: { name: string | null; image: string | null };
  };
  tutor: {
    user: { name: string | null };
  };
}

const FAQ_ITEMS = [
  { q: 'How does Brighton match me with a tutor?', a: 'Our AI-powered system considers your subject needs, academic level, learning style, and schedule preferences to recommend the best tutor match for you.' },
  { q: 'Is Brighton free to use for students?', a: 'Yes! Signing up as a student is completely free. You only pay the tutor for the sessions you book, at rates you can see upfront.' },
  { q: 'What subjects are available?', a: 'We cover the full Philippine K-12 curriculum including Mathematics, Science, English, Filipino, Araling Panlipunan, MAPEH, and more.' },
  { q: 'Can parents track their child\'s progress?', a: 'Absolutely. Parents get a dedicated dashboard showing session history, performance analytics, AI assessment results, and tutor feedback.' },
  { q: 'How are tutors verified?', a: 'Every tutor goes through a rigorous verification process including credential checks, background screening, and a teaching demo before they can start.' },
  { q: 'What if I need to cancel a booking?', a: 'You can cancel or reschedule bookings up to 24 hours before the session at no cost. Late cancellations may be subject to a fee.' },
];

// ── Helper components ────────────────────────────────────────────────────

function SkillTag({ label, color, icon }: { label: string; color: string; icon: string }) {
  return (
    <div className={`group relative overflow-hidden px-4 py-2.5 ${color} rounded-full text-[10px] font-black uppercase tracking-widest border border-border shadow-sm cursor-default hover:scale-105 hover:shadow-md transition-all flex items-center gap-2`}>
      <span className="text-xs">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function AnimatedCounter({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const duration = 1500;
          const steps = 30;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center space-y-1">
      <p className="text-3xl md:text-4xl font-black gradient-text">
        {count}{suffix}
      </p>
      <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
    </div>
  );
}

function TestimonialCard({ review }: { review: FeaturedReview }) {
  const name = review.student.user.name ?? 'Anonymous Student';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const tutorName = review.tutor.user.name ?? 'Tutor';
  const comment = review.comment ?? 'Great experience!';

  return (
    <div className="bg-surface/80 backdrop-blur-sm border-2 border-p-purple/30 rounded-3xl p-6 space-y-4 hover:shadow-lg transition-all min-w-[300px] md:min-w-[340px]">
      <div className="flex items-center gap-1 text-[#fcc419]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} className={i >= review.rating ? 'text-gray-300' : ''} />
        ))}
      </div>
      <div className="relative">
        <Quote size={18} className="text-p-purple/30 absolute -top-1 -left-1" />
        <p className="text-xs font-medium text-text-muted leading-relaxed pl-4 line-clamp-3">
          "{comment}"
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-p-purple/20">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-p-purple to-pink-300 flex items-center justify-center text-white text-[10px] font-black">
          {initials}
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black text-text-main">{name}</p>
          <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Student · {tutorName}</p>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={`bg-surface/70 backdrop-blur-sm border-2 rounded-2xl transition-all ${open ? 'border-primary/30 shadow-md' : 'border-p-purple/30 hover:border-p-purple/60'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
        aria-expanded={open}
      >
        <span className="text-[11px] font-black text-text-main leading-tight">{question}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5' : 'max-h-0'}`}
      >
        <p className="px-6 text-[10px] font-medium text-text-muted leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ── Main Landing Page ────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useCurrentUser();
  const logoHref = user ? '/dashboard' : '/';
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState('');
  const [heroLevel, setHeroLevel] = useState('ALL');
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [tutorCount, setTutorCount] = useState<number | null>(null);
  const [bestTutors, setBestTutors] = useState<any[]>([]);
  const [loadingBest, setLoadingBest] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalQuery, setSearchModalQuery] = useState('');
  const [searchModalLevel, setSearchModalLevel] = useState<'ALL' | 'ELEMENTARY' | 'HIGH_SCHOOL'>('ALL');
  const [dark, setDark] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [featuredReviews, setFeaturedReviews] = useState<FeaturedReview[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  // Mount + dark mode init
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('brighton-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
    }
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (!mounted) return;
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('brighton-theme', dark ? 'dark' : 'light');
  }, [dark, mounted]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch tutors — sorted by best rating, with subject fallback for no-review tutors
  useEffect(() => {
    const controller = new AbortController();
    setLoadingBest(true);
    fetch('/api/tutors?sort=best&limit=100', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTutorCount(data.length);
          // Sort: best rated first, then by subject for tutors with no reviews
          const sorted = [...data].sort((a: any, b: any) => {
            const ratingA = a.rating ?? 0;
            const ratingB = b.rating ?? 0;
            // Both have no reviews → sort by subject alphabetically
            if (ratingA === 0 && ratingB === 0) {
              const subjA = (a.subjects ?? []).join(', ').toLowerCase();
              const subjB = (b.subjects ?? []).join(', ').toLowerCase();
              return subjA.localeCompare(subjB);
            }
            // Otherwise sort by rating descending
            return ratingB - ratingA;
          }).slice(0, 3);
          setBestTutors(sorted);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBest(false));
    return () => controller.abort();
  }, []);

  // Fetch stats
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  // Fetch featured reviews
  useEffect(() => {
    fetch('/api/reviews/featured')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setFeaturedReviews(data);
      })
      .catch(() => {});
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    if (featuredReviews.length === 0) return;
    const interval = setInterval(() => {
      setTestimonialIdx(prev => (prev + 1) % featuredReviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredReviews.length]);

  return (
    <div className="min-h-screen bg-background text-text-main selection:bg-primary/20 relative overflow-x-hidden">

      {/* Global background blobs */}
      <div className="fixed pointer-events-none rounded-full z-0"
        style={{ top: '-10%', left: '-5%', width: '35%', height: '35%', background: 'var(--color-p-purple)', filter: 'blur(140px)', opacity: 0.30, animation: 'blob-drift 12s ease-in-out infinite' }} />
      <div className="fixed pointer-events-none rounded-full z-0"
        style={{ bottom: '-10%', right: '-5%', width: '30%', height: '30%', background: 'var(--color-p-pink)', filter: 'blur(120px)', opacity: 0.25, animation: 'blob-drift 10s ease-in-out infinite reverse' }} />

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="bg-surface/70 backdrop-blur-xl sticky top-0 z-50 border-b border-p-purple/40 h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center gap-6 px-6">
          {/* Logo */}
          <Link href={logoHref} className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 logo-halo flex items-center justify-center border border-p-purple bg-surface group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
            </div>
            <span className="text-sm font-black tracking-[0.2em] text-text-main uppercase">Brighton</span>
          </Link>

          {/* Nav Links - centered */}
          <div className="hidden md:flex gap-1 items-center flex-1 justify-center">
            {[
              { name: 'Features', href: '#features' },
              { name: 'Tutors', href: '#tutors' },
              { name: 'How It Works', href: '#how-it-works' },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all text-text-muted hover:bg-p-purple hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="p-2.5 bg-p-purple border border-border rounded-xl text-text-muted hover:bg-primary hover:text-white hover:border-primary transition-all"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={17} strokeWidth={2.5} /> : <Moon size={17} strokeWidth={2.5} />}
            </button>

            <Link href="/login" className="px-4 py-2 font-black text-[10px] text-text-muted uppercase tracking-widest hover:text-primary transition-colors">Login</Link>
            <Link
              href="/signup"
              className="group relative overflow-hidden px-6 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 6px 20px rgba(147,51,234,0.25)' }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-2">
                Join Now <ArrowRight size={12} />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-28">
        {/* Floating anime decorations */}
        {HERO_DECOS.map((d, i) => (
          <span key={i} className="absolute pointer-events-none select-none hidden md:block"
            style={{
              top: d.top, bottom: d.bottom, left: d.left, right: d.right,
              fontSize: d.size, color: d.color, opacity: 0.35,
              animation: `float-slow ${d.dur} ease-in-out infinite`,
              animationDelay: d.delay,
            }}>
            {d.char}
          </span>
        ))}

        {mounted && (
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Left side: mascot (static, no floating animation) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="hidden md:block shrink-0"
            >
              <HoshiMascot
                mood="hi"
                size={350}
              />
            </motion.div>

            {/* Mobile mascot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="md:hidden flex justify-center"
            >
              <HoshiMascot
                mood="hi"
                size={100}
              />
            </motion.div>

            {/* Right side: content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex-1 text-center md:text-left space-y-8 "
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-p-purple/60 to-p-sakura/40 border border-border rounded-full shadow-sm mx-auto md:mx-0"
              >
                <Star size={12} className="text-amber-500" fill="currentColor" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
              Hi! Find Your Perfect Tutor Match
            </span>
              </motion.div>

              {/* Title */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
                  What subject do you want{' '}
                  <span className="gradient-text">to master?</span>
                </h1>
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest max-w-lg">
                  Tutoring Booking System
                </p>
              </div>

              {/* Search Box */}
              <motion.form
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (user) {
                    const params = new URLSearchParams();
                    if (heroSearch.trim()) params.set('q', heroSearch.trim());
                    if (heroLevel !== 'ALL') params.set('level', heroLevel);
                    const qs = params.toString();
                    router.push(`/dashboard/tutors${qs ? `?${qs}` : ''}`);
                  } else {
                    setSearchModalQuery(heroSearch);
                    setSearchModalLevel(heroLevel as 'ALL' | 'ELEMENTARY' | 'HIGH_SCHOOL');
                    setShowSearchModal(true);
                  }
                }}
                className="w-full md:max-w-xl bg-surface/80 backdrop-blur-md p-2 rounded-2xl shadow-[0_20px_60px_rgba(147,51,234,0.1)] border-2 border-border hover:border-primary/20 transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="text"
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      placeholder="Search subjects (e.g. Mathematics, Science...)"
                      aria-label="Search for subjects"
                      className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:outline-none font-bold text-sm text-text-main placeholder:text-text-muted/40"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={heroLevel}
                      onChange={(e) => setHeroLevel(e.target.value)}
                      aria-label="Filter by academic level"
                      className="px-5 py-4 bg-p-purple/30 border-2 border-border/60 rounded-xl font-bold text-xs uppercase tracking-widest text-text-muted cursor-pointer focus:border-primary transition-all"
                    >
                      <option value="ALL">All Levels</option>
                      <option value="ELEMENTARY">Elementary</option>
                      <option value="HIGH_SCHOOL">High School</option>
                    </select>
                    <button
                      type="submit"
                      className="group/btn px-8 py-4 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 6px 20px rgba(147,51,234,0.25)' }}
                    >
                      Find <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.form>

              {/* Skill tags */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-wrap justify-center md:justify-start gap-2.5 pt-2"
              >
                <SkillTag label="Mathematics"    color="bg-p-blue   text-blue-700"   icon="+" />
                <SkillTag label="Science"        color="bg-p-mint   text-teal-700"   icon="●" />
                <SkillTag label="English"        color="bg-p-pink   text-pink-700"   icon="·" />
                <SkillTag label="History"        color="bg-p-yellow text-amber-700"  icon="▲" />
                <SkillTag label="Filipino"       color="bg-p-purple text-purple-700" icon="◆" />
                <SkillTag label="MAPEH"          color="bg-p-peach  text-orange-700" icon="◆" />
              </motion.div>
            </motion.div>
          </div>
        )}
      </header>

      {/* ── Stats Counter Section ────────────────────────────────────── */}
      {stats && (
        <section className="relative z-10 pb-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-surface/70 backdrop-blur-md border-2 border-p-purple/30 rounded-[40px] p-8 md:p-12 shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                <AnimatedCounter value={stats.tutors} suffix="+" label="Verified Tutors" />
                <AnimatedCounter value={stats.students} suffix="+" label="Active Students" />
                <AnimatedCounter value={stats.completedSessions} suffix="+" label="Sessions Completed" />
                <AnimatedCounter value={stats.reviews} suffix="+" label="Reviews" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Features Section ─────────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 pb-28">
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-p-sakura rounded-full">
            <Sparkles size={12} className="text-pink-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-pink-600">Why Choose Brighton</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Everything You Need to{' '}
            <span className="gradient-text">Excel</span>
          </h2>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest max-w-lg mx-auto">
            AI-powered tools designed for the Philippine K-12 curriculum
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className={`group relative overflow-hidden p-7 bg-surface border-2 border-border rounded-[32px] transition-all hover:shadow-xl ${activeFeature === idx ? 'shadow-lg' : 'shadow-sm'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <div className="absolute -top-8 -right-8 w-20 h-20 bg-p-purple/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 space-y-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${feature.gradient} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-black text-sm text-text-main tracking-tight">{feature.title}</h3>
                  <p className="text-xs font-medium text-text-muted leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Testimonials Section ─────────────────────────────────────── */}
      {featuredReviews.length > 0 && (
        <section className="relative z-10 pb-28">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-p-yellow rounded-full">
                <MessageSquare size={12} className="text-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700">What Students Say</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Real Reviews from{' '}
                <span className="gradient-text">Real Students</span>
              </h2>
            </div>

            {/* Desktop grid */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredReviews.slice(0, 3).map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <TestimonialCard review={review} />
                </motion.div>
              ))}
            </div>

            {/* Mobile carousel */}
            <div className="md:hidden overflow-hidden">
              <motion.div
                key={testimonialIdx}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="mx-auto max-w-sm"
              >
                <TestimonialCard review={featuredReviews[testimonialIdx]} />
              </motion.div>
              {/* Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {featuredReviews.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === testimonialIdx % featuredReviews.length
                        ? 'bg-primary w-5'
                        : 'bg-p-purple/50'
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Tutors Showcase ───────────────────────────────────────────── */}
      <section id="tutors" className="relative z-10 max-w-7xl mx-auto px-6 pb-28">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-p-purple rounded-full">
              <Users size={12} className="text-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Expert Directory</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight">
              Verified Academic <span className="gradient-text">Tutors</span>
            </h3>
            {tutorCount !== null && (
              <p className="text-xs font-bold text-text-muted mt-2">
                {tutorCount > 0 
                  ? `${tutorCount} tutor${tutorCount > 1 ? 's' : ''} available` 
                  : 'No tutors registered yet — be the first to join!'}
              </p>
            )}
          </div>
          <Link href={tutorCount && tutorCount > 0 ? '/dashboard/tutors' : '/signup'} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-accent-strong transition-colors">
            {tutorCount && tutorCount > 0 ? `View All ${tutorCount} Tutors` : 'Become a Tutor'} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* No tutors state */}
          {(!tutorCount || tutorCount === 0) ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-5">
              <div className="w-20 h-20 bg-gradient-to-br from-p-purple/40 to-p-sakura/20 rounded-3xl flex items-center justify-center">
                <GraduationCap size={36} className="text-primary/60" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-text-main">No Tutors Yet</h3>
                <p className="text-sm text-text-muted max-w-md leading-relaxed">
                  We're currently onboarding expert tutors. Sign up to be notified when our tutor directory goes live!
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/signup"
                  className="group px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 6px 20px rgba(147,51,234,0.2)' }}
                >
                  Get Notified <Rocket size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ) : loadingBest ? (
            /* Loading skeleton */
            <>
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
            </>
          ) : bestTutors.length > 0 ? (
            /* Best tutors showcase */
            bestTutors.map((tutor: any, idx: number) => {
              const themes = [
                { bannerFrom: '#ede9fe', bannerTo: '#c4b5fd', tagBg: 'bg-p-purple', tagText: 'text-purple-700' },
                { bannerFrom: '#fce7f3', bannerTo: '#f9a8d4', tagBg: 'bg-p-pink',   tagText: 'text-pink-700'   },
                { bannerFrom: '#d1fae5', bannerTo: '#6ee7b7', tagBg: 'bg-p-mint',   tagText: 'text-teal-700'   },
              ];
              const theme = themes[idx];
              const image = tutor.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(tutor.name)}`;
              const subjects = tutor.subjects ?? [];
              return (
                <motion.div
                  key={tutor.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                  whileHover={{ y: -6 }}
                >
                  <Link href={user ? `/dashboard/tutors/${tutor.id}` : '/signup'} className="block">
                    <div className="bg-surface border-2 border-border rounded-[32px] overflow-hidden cursor-pointer group relative">
                      {/* Banner */}
                      <div
                        className="relative h-24"
                        style={{ background: `linear-gradient(135deg, ${theme.bannerFrom}, ${theme.bannerTo})` }}
                      >
                        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full border-[16px] border-white/20" />
                        <div className="absolute -right-2 top-10 w-12 h-12 rounded-full border-[8px] border-white/15" />
                        <div className="absolute -bottom-8 left-6">
                          <div className="relative w-16 h-16 rounded-2xl border-4 border-surface shadow-md overflow-hidden bg-surface">
                            <Image src={image} alt={tutor.name} fill sizes="64px" className="object-cover" />
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="px-6 pt-11 pb-6 space-y-4">
                        <div className="space-y-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-black text-base text-text-main group-hover:text-primary transition-colors leading-tight line-clamp-1">
                              {tutor.name}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                              {tutor.rating !== null ? (
                                <>
                                  <Star size={12} fill="currentColor" className="text-[#fcc419]" />
                                  <span className="text-[11px] font-black text-text-main">
                                    {tutor.rating.toFixed(1)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight line-clamp-1">
                            {tutor.headline ?? 'Tutor'}
                          </p>
                        </div>

                        {/* Subject tags */}
                        {subjects.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {subjects.slice(0, 3).map((s: string) => (
                              <span key={s} className={`px-2.5 py-1 ${theme.tagBg} rounded-full text-[9px] font-black uppercase tracking-widest ${theme.tagText} border border-border`}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price */}
                        <div className="pt-3 border-t border-border">
                          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">From</p>
                          <p className="text-base font-black text-text-main leading-tight">
                            ${tutor.pricingPerHour ?? 0}
                            <span className="text-[10px] font-bold text-text-muted">/hr</span>
                          </p>
                        </div>
                      </div>

                      {/* Top rated badge */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-amber-400 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                        <Star size={9} fill="currentColor" /> Top Rated
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          ) : (
            <p className="col-span-full text-center text-sm font-bold text-text-muted py-8">
              Our expert tutors are ready to help you excel. Browse the directory to find your perfect match!
            </p>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 bg-surface/60 backdrop-blur-md py-24 border-y border-p-purple/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-p-yellow rounded-full">
              <Lightbulb size={12} className="text-amber-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700">The Brighton Methodology</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight">
              Smarter Learning,{' '}
              <span className="gradient-text">Better Results</span>
            </h3>
            <p className="text-text-muted font-medium leading-relaxed max-w-md mx-auto">
              We don't just assign tutors. Our AI-driven platform ensures every student is matched with an educator who specializes in their specific needs and academic level.
            </p>
          </div>

          {/* Numbered step cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {howItWorks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.12, duration: 0.4 }}
                  className="relative bg-surface/80 backdrop-blur-sm border-2 border-p-purple/30 rounded-[28px] p-6 text-center space-y-4 hover:shadow-lg transition-all group"
                >
                  {/* Step number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-p-purple to-pink-300 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-text-main">{item.title}</h4>
                    <p className="text-[10px] font-medium text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Visual dashboard mockup + features list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { text: 'AI Level Assessment', icon: Sparkles },
                  { text: 'Smart Tutor Matching', icon: Search },
                  { text: 'In-App Messaging', icon: Heart },
                  { text: 'Parental Dashboard', icon: Users },
                  { text: 'Progress Analytics', icon: TrendingUp },
                  { text: 'Flexible Scheduling', icon: Star },
                ].map(({ text, icon: Icon }) => (
                  <div key={text} className="flex items-center gap-3 p-3 bg-surface/70 rounded-2xl border border-border hover:shadow-sm transition-all">
                    <div className="w-7 h-7 rounded-lg bg-p-mint flex items-center justify-center shrink-0">
                      <Check size={12} className="text-teal-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 bg-surface/80 backdrop-blur-sm border-2 border-p-purple/40 rounded-[40px] shadow-[0_20px_60px_rgba(147,51,234,0.08)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-5 py-2.5 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}>
                LSPU Innovation Project
              </div>
              <div className="space-y-6 p-4 pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-p-purple to-pink-300 shadow-md flex items-center justify-center">
                    <GraduationCap size={22} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-36 bg-gradient-to-r from-p-purple to-pink-200 rounded-full" />
                    <div className="h-2 w-20 bg-p-sakura rounded-full" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2.5 w-full bg-gradient-to-r from-p-purple/60 via-pink-200/40 to-p-purple/20 rounded-full" />
                  <div className="h-2.5 w-3/4 bg-gradient-to-r from-pink-200/50 to-p-purple/30 rounded-full" />
                  <div className="h-2.5 w-5/6 bg-gradient-to-r from-p-purple/40 to-p-sakura/30 rounded-full" />
                </div>
                <div className="pt-4 border-t border-p-purple/20 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-p-green" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">AI Assessment Ready</span>
                  </div>
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-p-purple to-pink-300 border-2 border-border shadow-sm" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] opacity-20 mt-6">AI-Driven Tutor Matching Engine v2.0</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-p-sky rounded-full">
              <Lightbulb size={12} className="text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">Got Questions?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Frequently Asked{' '}
              <span className="gradient-text">Questions</span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <FaqItem
                key={idx}
                question={item.q}
                answer={item.a}
                open={openFaq === idx}
                onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────── */}
      <section className="relative z-10 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-p-sakura to-p-purple/30 rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <Rocket size={28} className="text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Ready to Start Your{' '}
              <span className="gradient-text">Learning Journey?</span>
            </h2>
            <p className="text-sm font-bold text-text-muted uppercase tracking-widest">
              Join our growing community of students and tutors today
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/signup"
              className="group relative overflow-hidden px-10 py-5 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all mx-auto sm:mx-0"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 8px 28px rgba(147,51,234,0.3)' }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-3">
                Get Started Free <Rocket size={14} />
              </span>
            </Link>
            <Link
              href="/login"
              className="px-10 py-5 bg-surface border-2 border-p-purple/40 text-text-main rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <BookOpen size={14} /> Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-16 text-center bg-surface/40 border-t border-p-purple/30">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <Link href={logoHref} className="inline-block group">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="mx-auto mb-4 opacity-40 group-hover:opacity-80 transition-all group-hover:scale-110" style={{ width: 'auto', height: 'auto' }} />
          </Link>
          <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black uppercase tracking-widest text-text-muted">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#tutors" className="hover:text-primary transition-colors">Tutors</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">Methodology</Link>
            <Link href="/signup" className="hover:text-primary transition-colors">Sign Up</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">© 2026 Brighton · College of Computer Studies · LSPU</p>
        </div>
      </footer>

      {/* Search Results Modal (for non-logged-in users) */}
      <SearchTutorModal
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        query={searchModalQuery}
        level={searchModalLevel}
      />
    </div>
  );
}