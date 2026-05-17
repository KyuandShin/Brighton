'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  Search, Check, Lightbulb, Star, ArrowRight, Sparkles,
  GraduationCap, BookOpen, Heart, Rocket, Shield, Users,
  TrendingUp, ChevronRight, Sun, Moon,
  Quote, UserPlus, CalendarCheck, X, Loader2
} from 'lucide-react';
import HoshiMascot from '@/app/_components/HoshiMascot';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

const features = [
  { icon: Lightbulb, title: 'AI-Powered Matching', desc: 'Smart algorithm matches you with the perfect tutor based on your learning needs and academic level.' },
  { icon: Rocket, title: 'Personalized Learning', desc: 'Custom study plans tailored to Elementary or High School curriculum with real-time progress tracking.' },
  { icon: Sparkles, title: 'Verified Experts', desc: 'All tutors undergo rigorous background checks and credential verification for your peace of mind.' },
  { icon: TrendingUp, title: 'Track Progress', desc: 'Monitor improvement with detailed analytics, AI assessments, and weekly performance reports.' },
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
  { q: 'What subjects are available?', a: 'We offer tutoring in a wide range of subjects, including English, Math, Science, and Filipino' },
  { q: 'Can parents track their child\'s progress?', a: 'Absolutely. Parents get a dedicated dashboard showing session history, performance analytics, AI assessment results, and tutor feedback.' },
  { q: 'How are tutors verified?', a: 'Every tutor goes through a rigorous verification process including credential checks and background screening before being approved' },
  { q: 'What if I need to cancel a booking?', a: 'You can cancel or reschedule bookings up to 24 hours before the session at no cost. Late cancellations may be subject to a fee.' },
];

function SkillTag({ label, color, icon }: { label: string; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-border/60 bg-white/50 dark:bg-white/5 hover:shadow-sm transition-all cursor-default">
      <span className="text-xs">{icon}</span>
      <span className={color}>{label}</span>
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
      <p className="text-3xl md:text-4xl font-black text-primary">
        {count}{suffix}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
    </div>
  );
}

function TestimonialCard({ review }: { review: FeaturedReview }) {
  const name = review.student.user.name ?? 'Anonymous Student';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const tutorName = review.tutor.user.name ?? 'Tutor';
  const comment = review.comment ?? 'Great experience!';

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 hover:shadow-md transition-all">
      <div className="flex items-center gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} className={i >= review.rating ? 'text-gray-300 dark:text-gray-600' : ''} />
        ))}
      </div>
      <div className="relative">
        <Quote size={16} className="text-muted-foreground/20 absolute -top-1 -left-1" />
        <p className="text-sm text-muted-foreground leading-relaxed pl-4 line-clamp-3">
          "{comment}"
        </p>
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-border/50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-300 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">Student · {tutorName}</p>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{question}</span>
        <ChevronRight
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 pb-4' : 'max-h-0'}`}
      >
        <p className="px-5 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ── Main Landing Page ────────────────────────────────────────────────────
export default function LandingPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const logoHref = user ? '/dashboard' : '/';
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState('');
  const [heroLevel, setHeroLevel] = useState('ALL');
  const [mounted, setMounted] = useState(false);
  const [tutorCount, setTutorCount] = useState<number | null>(null);
  const [bestTutors, setBestTutors] = useState<any[]>([]);
  const [loadingBest, setLoadingBest] = useState(false);
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [searchSheetQuery, setSearchSheetQuery] = useState('');
  const [searchSheetLevel, setSearchSheetLevel] = useState<'ALL' | 'ELEMENTARY' | 'HIGH_SCHOOL'>('ALL');
  const [dark, setDark] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [featuredReviews, setFeaturedReviews] = useState<FeaturedReview[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Sheet search state
  const [sheetTutors, setSheetTutors] = useState<any[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetFiltered, setSheetFiltered] = useState<any[]>([]);

  // Mount + dark mode init
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('brighton-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('brighton-theme', dark ? 'dark' : 'light');
  }, [dark, mounted]);

  // Fetch tutors
  useEffect(() => {
    const controller = new AbortController();
    setLoadingBest(true);
    fetch('/api/tutors?sort=best&limit=100', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTutorCount(data.length);
          const sorted = [...data].sort((a: any, b: any) => {
            const ratingA = a.rating ?? 0;
            const ratingB = b.rating ?? 0;
            if (ratingA === 0 && ratingB === 0) {
              const subjA = (a.subjects ?? []).join(', ').toLowerCase();
              const subjB = (b.subjects ?? []).join(', ').toLowerCase();
              return subjA.localeCompare(subjB);
            }
            return ratingB - ratingA;
          }).slice(0, 3);
          setBestTutors(sorted);
        } else {
          // Fall back to mock data so the homepage always shows tutors
          setTutorCount(3);
          setBestTutors([
            { id: 't1', name: 'Dr. Aris Smith', headline: 'Mathematics & Science Specialist', subjects: ['Mathematics', 'Science'], rating: 4.9, pricingPerHour: 25, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aris', bio: 'Over 10 years of experience in teaching mathematics and science.' },
            { id: 't2', name: 'Prof. Maria Clara', headline: 'Science & English Expert', subjects: ['Science', 'English'], rating: 4.8, pricingPerHour: 20, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', bio: 'Making science and language learning fun for all students.' },
            { id: 't3', name: 'Ms. Lea Salonga', headline: 'English & Filipino Coach', subjects: ['English', 'Filipino'], rating: 5.0, pricingPerHour: 22, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lea', bio: 'Helping students find their voice through the power of language.' },
          ]);
        }
      })
      .catch(() => {
        // Fall back to mock data on error
        setTutorCount(3);
        setBestTutors([
          { id: 't1', name: 'Dr. Aris Smith', headline: 'Mathematics & Science Specialist', subjects: ['Mathematics', 'Science'], rating: 4.9, pricingPerHour: 25, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aris', bio: 'Over 10 years of experience in teaching mathematics and science.' },
          { id: 't2', name: 'Prof. Maria Clara', headline: 'Science & English Expert', subjects: ['Science', 'English'], rating: 4.8, pricingPerHour: 20, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', bio: 'Making science and language learning fun for all students.' },
          { id: 't3', name: 'Ms. Lea Salonga', headline: 'English & Filipino Coach', subjects: ['English', 'Filipino'], rating: 5.0, pricingPerHour: 22, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lea', bio: 'Helping students find their voice through the power of language.' },
        ]);
      })
      .finally(() => setLoadingBest(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/reviews/featured')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setFeaturedReviews(data);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSearch.trim()) {
      toast.error('Please enter a subject to search');
      return;
    }
    if (user) {
      const params = new URLSearchParams();
      if (heroSearch.trim()) params.set('q', heroSearch.trim());
      if (heroLevel !== 'ALL') params.set('level', heroLevel);
      const qs = params.toString();
      router.push(`/dashboard/tutors${qs ? `?${qs}` : ''}`);
    } else {
      setSearchSheetQuery(heroSearch);
      setSearchSheetLevel(heroLevel as 'ALL' | 'ELEMENTARY' | 'HIGH_SCHOOL');
      setShowSearchSheet(true);
      // Fetch tutors for sheet
      setSheetLoading(true);
      fetch('/api/tutors')
        .then(r => r.json())
        .then((data: any[]) => {
          if (Array.isArray(data)) setSheetTutors(data);
          else setSheetTutors([]);
        })
        .catch(() => setSheetTutors([]))
        .finally(() => setSheetLoading(false));
    }
  };

  // Filter tutors in sheet
  useEffect(() => {
    if (!showSearchSheet) return;
    let results = sheetTutors;
    if (searchSheetQuery.trim()) {
      const q = searchSheetQuery.toLowerCase();
      results = results.filter((t: any) =>
        t.name?.toLowerCase().includes(q) ||
        t.subjects?.some((s: string) => s.toLowerCase().includes(q)) ||
        (t.headline ?? '').toLowerCase().includes(q)
      );
    }
    // Note: level filter only applies to mock data; API tutors don't have a level field
    // so we skip the level filter for now
    setSheetFiltered(results);
  }, [sheetTutors, searchSheetQuery, searchSheetLevel, showSearchSheet]);

  const theme = dark ? 'dark' : 'light';

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Toaster theme={theme} position="bottom-center" />

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="bg-background/80 backdrop-blur-lg sticky top-0 z-50 border-b border-border/40 h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center gap-6 px-6">
          <Link href={logoHref} className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 logo-halo flex items-center justify-center border border-border/60 group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="Logo" width={22} height={22} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
            </div>
            <span className="text-sm font-bold tracking-wider text-foreground">Brighton</span>
          </Link>

          <div className="hidden md:flex gap-1 items-center flex-1 justify-center">
            {['Features', 'Tutors', 'How It Works'].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDark(!dark)}
              className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <Link href="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-sm"
            >
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-28">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-20 w-72 h-72 rounded-full bg-p-purple/30 dark:bg-p-purple/10 blur-[100px]" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-p-sakura/30 dark:bg-p-sakura/10 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-p-blue/20 dark:bg-p-blue/10 blur-[150px]" />
        </div>
        {mounted && (
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Mascot */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="hidden md:block shrink-0"
            >
              <HoshiMascot mood="hi" size={320} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="md:hidden flex justify-center"
            >
              <HoshiMascot mood="hi" size={100} />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex-1 text-center md:text-left space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full border border-border/60"
              >
                <Star size={12} className="text-amber-500" fill="currentColor" />
                <span className="text-xs font-medium text-muted-foreground">
                  Find Your Perfect Tutor Match
                </span>
              </motion.div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  What subject do you want{' '}
                  <span className="text-primary">to master?</span>
                </h1>
                <p className="text-base text-muted-foreground max-w-lg">
                  AI-powered tutoring matching for Philippine K-12 students. Find expert tutors in Math, Science, English, and more.
                </p>
              </div>

              {/* Search Box */}
              <motion.form
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onSubmit={handleSearch}
                className="w-full md:max-w-xl bg-card border border-border/60 rounded-2xl p-2 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      placeholder="Search subjects (e.g. Mathematics, Science...)"
                      aria-label="Search for subjects"
                      className="w-full pl-12 pr-4 py-3.5 bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={heroLevel}
                      onChange={(e) => setHeroLevel(e.target.value)}
                      aria-label="Filter by academic level"
                      className="px-4 py-3.5 bg-muted border border-border/60 rounded-lg text-sm text-muted-foreground cursor-pointer focus:border-primary transition-all"
                    >
                      <option value="ALL">All Levels</option>
                      <option value="ELEMENTARY">Elementary</option>
                      <option value="HIGH_SCHOOL">High School</option>
                    </select>
                    <button
                      type="submit"
                      disabled={userLoading}
                      className="px-6 py-3.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
                    >
                      {userLoading ? <Loader2 size={14} className="animate-spin" /> : <>Find <ArrowRight size={14} /></>}
                    </button>
                  </div>
                </div>
              </motion.form>

              {/* Skill tags */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-wrap justify-center md:justify-start gap-2 pt-2"
              >
                <SkillTag label="Mathematics"    color="text-blue-600 dark:text-blue-400"   icon="+" />
                <SkillTag label="Science"        color="text-teal-600 dark:text-teal-400"   icon="●" />
                <SkillTag label="English"        color="text-pink-600 dark:text-pink-400"   icon="·" />
                <SkillTag label="History"        color="text-amber-600 dark:text-amber-400"  icon="▲" />
                <SkillTag label="Filipino"       color="text-purple-600 dark:text-purple-400" icon="◆" />
                <SkillTag label="MAPEH"          color="text-orange-600 dark:text-orange-400" icon="◆" />
              </motion.div>
            </motion.div>
          </div>
        )}
      </header>

      {/* ── Stats Counter Section ────────────────────────────────────── */}
      {stats && (
        <section className="relative z-10 pb-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-card border border-border/60 rounded-3xl p-8 md:p-12 shadow-sm">
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
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-p-sakura/30 dark:bg-p-sakura/30 blur-[100px]" />
          <div className="absolute bottom-40 left-0 w-80 h-80 rounded-full bg-p-mint/30 dark:bg-p-mint/30 blur-[120px]" />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-p-blue/20 dark:bg-p-blue/40 blur-[150px]" />
        </div>
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full">
            <Sparkles size={12} className="text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Why Brighton</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything You Need to <span className="text-primary">Excel</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            AI-powered tools designed for the Philippine K-12 curriculum
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="group relative p-6 bg-card border border-border/60 rounded-2xl transition-all hover:shadow-md hover:border-border"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Testimonials Section ─────────────────────────────────────── */}
      {featuredReviews.length > 0 && (
        <section className="relative z-10 pb-28 bg-muted/30 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full">
                <Star size={12} className="text-amber-500" />
                <span className="text-xs font-semibold text-muted-foreground">What Students Say</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Real Reviews from <span className="text-primary">Real Students</span>
              </h2>
            </div>

            <Carousel className="max-w-3xl mx-auto">
              <CarouselContent>
                {featuredReviews.slice(0, 6).map((review) => (
                  <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                    <TestimonialCard review={review} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-6">
                <CarouselPrevious className="static" />
                <CarouselNext className="static" />
              </div>
            </Carousel>
          </div>
        </section>
      )}

      {/* ── Tutors Showcase ───────────────────────────────────────────── */}
      <section id="tutors" className="relative z-10 max-w-7xl mx-auto px-6 pb-28 pt-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full">
              <Users size={12} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Expert Directory</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
              Meet Our <span className="text-primary">Tutors</span>
            </h3>
            {tutorCount !== null && (
              <p className="text-sm text-muted-foreground">
                {tutorCount > 0
                  ? `${tutorCount} tutor${tutorCount > 1 ? 's' : ''} available`
                  : 'No tutors registered yet — be the first to join!'}
              </p>
            )}
          </div>
          <Link
            href={tutorCount && tutorCount > 0 ? '/dashboard/tutors' : '/signup'}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {tutorCount && tutorCount > 0 ? `View All ${tutorCount} Tutors` : 'Become a Tutor'} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(!tutorCount || tutorCount === 0) ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-5">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                <GraduationCap size={28} className="text-muted-foreground/60" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">No Tutors Yet</h3>
                <p className="text-muted-foreground max-w-md leading-relaxed">
                  We're currently onboarding expert tutors. Sign up to be notified when our tutor directory goes live!
                </p>
              </div>
              <Link
                href="/signup"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-sm"
              >
                Get Notified
              </Link>
            </div>
          ) : loadingBest ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border/60 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-20 bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="flex gap-2 pt-1">
                      {[1,2,3].map(j => <div key={j} className="h-5 w-14 bg-muted rounded-full" />)}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : bestTutors.length > 0 ? (
            bestTutors.map((tutor: any, idx: number) => {
              const themes = [
                { bannerFrom: '#ede9fe', bannerTo: '#c4b5fd' },
                { bannerFrom: '#fce7f3', bannerTo: '#f9a8d4' },
                { bannerFrom: '#d1fae5', bannerTo: '#6ee7b7' },
              ];
              const theme = themes[idx];
              const image = tutor.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(tutor.name)}`;
              const subjects = tutor.subjects ?? [];

              return (
                <motion.div
                  key={tutor.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.12, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                >
                  <Link href={user ? `/dashboard/tutors/${tutor.id}` : '/signup'} className="block">
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden group hover:shadow-md transition-all">
                      {/* Banner */}
                      <div
                        className="relative h-20"
                        style={{ background: `linear-gradient(135deg, ${theme.bannerFrom}, ${theme.bannerTo})` }}
                      >
                        <div className="absolute -bottom-6 left-5">
                          <div className="relative w-12 h-12 rounded-lg border-2 border-background shadow-sm overflow-hidden bg-background">
                            <Image src={image || '/logo.png'} alt={tutor.name} width={48} height={48} className="object-cover" />
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pt-8 pb-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {tutor.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {tutor.headline ?? 'Tutor'}
                            </p>
                          </div>
                          {tutor.rating !== null && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Star size={12} fill="currentColor" className="text-amber-400" />
                              <span className="text-sm font-semibold text-foreground">
                                {tutor.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {subjects.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {subjects.slice(0, 3).map((s: string) => (
                              <span key={s} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground border border-border/40">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">From</p>
                            <p className="font-semibold text-foreground">
                              ${tutor.pricingPerHour ?? 0}
                              <span className="text-sm text-muted-foreground font-normal">/hr</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-8">
              Our expert tutors are ready to help you excel.
            </p>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 bg-muted/30 py-20 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full">
              <Lightbulb size={12} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">How It Works</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
              Smarter Learning, <span className="text-primary">Better Results</span>
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We don't just assign tutors. Our AI-driven platform ensures every student is matched with an educator who specializes in their specific needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {howItWorks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  className="relative bg-card border border-border/60 rounded-2xl p-6 text-center space-y-4 hover:shadow-md transition-all group"
                >
                  <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full">
              <Lightbulb size={12} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Got Questions?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
          </div>

          <div className="space-y-2">
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
      <section className="relative z-10 pb-20">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-p-purple/15 dark:bg-p-purple/10 blur-[120px]" />
        </div>
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto">
              <Rocket size={24} className="text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to Start Your <span className="text-primary">Learning Journey?</span>
            </h2>
            <p className="text-muted-foreground">
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
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Get Started Free <Rocket size={14} />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-card border border-border/60 text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-2"
            >
              <BookOpen size={14} /> Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-12 text-center border-t border-border/40">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <Link href={logoHref} className="inline-block group">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="mx-auto mb-3 opacity-40 group-hover:opacity-80 transition-all" style={{ width: 'auto', height: 'auto' }} />
          </Link>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#tutors" className="hover:text-foreground transition-colors">Tutors</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">Methodology</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
          </div>
          <p className="text-xs text-muted-foreground/60">© 2026 Brighton · College of Computer Studies · LSPU</p>
        </div>
      </footer>

      {/* Search Sheet (for non-logged-in users) */}
      <Sheet open={showSearchSheet} onOpenChange={setShowSearchSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="px-6 py-5 border-b border-border/60">
              <SheetTitle>Search Results</SheetTitle>
              {searchSheetQuery && (
                <SheetDescription>
                  Showing tutors for "<span className="font-medium text-foreground">{searchSheetQuery}</span>"
                </SheetDescription>
              )}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {sheetLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 size={24} className="text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Finding tutors...</p>
                </div>
              ) : sheetFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
                    <GraduationCap size={24} className="text-muted-foreground/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">No tutors found</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Try a different subject or sign up to browse all our available tutors.
                    </p>
                  </div>
                  <Link
                    href="/signup"
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all"
                    onClick={() => setShowSearchSheet(false)}
                  >
                    Sign Up to Browse All
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {sheetFiltered.length} tutor{sheetFiltered.length !== 1 ? 's' : ''} found
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    {sheetFiltered.slice(0, 10).map((tutor: any) => {
                      const image = tutor.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(tutor.name)}`;
                      return (
                        <div
                          key={tutor.id}
                          className="bg-card border border-border/60 rounded-xl overflow-hidden hover:shadow-md transition-all relative"
                        >
                          <div className="flex items-center gap-4 p-4">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                              <Image src={image} alt={tutor.name} fill sizes="48px" className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground truncate">
                                {tutor.name}
                              </h4>
                              {tutor.headline && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {tutor.headline}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(tutor.subjects ?? []).slice(0, 3).map((s: string) => (
                                  <span key={s} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-foreground">${tutor.pricingPerHour}/hr</p>
                              {tutor.rating !== null && (
                                <div className="flex items-center gap-1 justify-end mt-1">
                                  <Star size={10} fill="currentColor" className="text-amber-400" />
                                  <span className="text-sm text-muted-foreground">{tutor.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Overlay CTA */}
                          <div className="absolute inset-0 bg-background/95 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Link
                              href="/signup"
                              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all"
                              onClick={() => setShowSearchSheet(false)}
                            >
                              Sign Up to Book
                            </Link>
                            <Link
                              href="/login"
                              className="px-5 py-2.5 border border-border/60 text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-all"
                              onClick={() => setShowSearchSheet(false)}
                            >
                              Log In
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center pt-4">
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-sm"
                      onClick={() => setShowSearchSheet(false)}
                    >
                      Sign Up to Book a Tutor <ArrowRight size={14} />
                    </Link>
                    <p className="text-xs text-muted-foreground mt-3">
                      Already have an account?{' '}
                      <Link href="/login" className="text-primary hover:underline" onClick={() => setShowSearchSheet(false)}>Log in</Link>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}