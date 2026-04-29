'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Search, Check, Zap, Lightbulb, Star } from 'lucide-react';

const HERO_DECOS = [
  { char: '✦', top: '15%',  left: '4%',   size: '2rem',   color: '#f472b6', delay: '0s',   dur: '5s'  },
  { char: '★', top: '10%',  right: '5%',  size: '1.6rem', color: '#9333ea', delay: '1.3s', dur: '7s'  },
  { char: '✿', top: '55%',  left: '3%',   size: '1.8rem', color: '#ec4899', delay: '2.2s', dur: '6s'  },
  { char: '✧', bottom: '20%', right: '4%', size: '2.2rem', color: '#a855f7', delay: '0.6s', dur: '8s' },
  { char: '◆', top: '70%',  left: '7%',   size: '1rem',   color: '#f472b6', delay: '1.8s', dur: '4s'  },
  { char: '✦', top: '40%',  right: '3%',  size: '1.1rem', color: '#d946ef', delay: '3s',   dur: '5.5s'},
];

export default function LandingPage() {
  const { user } = useCurrentUser();
  const logoHref = user ? '/dashboard' : '/';

  return (
    <div className="min-h-screen bg-background text-text-main selection:bg-primary/20 relative overflow-x-hidden">

      {/* Global background blobs */}
      <div className="fixed pointer-events-none rounded-full z-0"
        style={{ top: '-10%', left: '-5%', width: '35%', height: '35%', background: 'var(--color-p-purple)', filter: 'blur(140px)', opacity: 0.55, animation: 'blob-drift 12s ease-in-out infinite' }} />
      <div className="fixed pointer-events-none rounded-full z-0"
        style={{ bottom: '-10%', right: '-5%', width: '30%', height: '30%', background: 'var(--color-p-pink)', filter: 'blur(120px)', opacity: 0.50, animation: 'blob-drift 10s ease-in-out infinite reverse' }} />

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="z-50 max-w-7xl mx-auto px-8 py-5 flex justify-between items-center bg-white/60 backdrop-blur-md sticky top-0 border-b border-p-purple">
        <Link href={logoHref} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 logo-halo flex items-center justify-center border border-p-purple bg-white">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
          </div>
          <span className="text-sm font-black tracking-[0.2em] text-text-main uppercase">Brighton</span>
        </Link>

        <div className="hidden md:flex gap-10 text-[10px] font-black uppercase tracking-widest text-text-muted">
          <Link href="#tutors"       className="hover:text-primary transition-colors">Expert Pool</Link>
          <Link href="#how-it-works" className="hover:text-primary transition-colors">Process</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 font-black text-[10px] text-text-muted uppercase tracking-widest hover:text-primary transition-colors">Login</Link>
          <Link
            href="/signup"
            className="px-6 py-3 text-white rounded-xl font-black text-[10px] hover:scale-105 transition-all uppercase tracking-widest"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)', boxShadow: '0 6px 20px rgba(147,51,234,0.25)' }}
          >
            Join Now
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-32 flex flex-col items-center text-center">

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

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-12 w-full"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-p-purple border border-border rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-primary">
            <Zap size={10} className="text-amber-400" fill="currentColor" />
            Find the right tutor for you
          </div>

          <div className="space-y-5">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              What subject do you want{' '}
              <span className="gradient-text">to master?</span>
            </h2>
            <p className="text-sm font-bold text-text-muted uppercase tracking-widest">
              Tutoring Booking System
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto w-full bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-[0_20px_60px_rgba(147,51,234,0.08)] border border-p-purple flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                name="search"
                placeholder="Search subjects (e.g. Algebra, Physics...)"
                className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:outline-none font-bold text-sm text-text-main placeholder:text-text-muted/50"
              />
            </div>
            <div className="h-10 w-px bg-border hidden md:block self-center" />
            <select name="level" className="px-6 py-4 bg-transparent border-none focus:outline-none font-bold text-xs uppercase tracking-widest text-text-muted cursor-pointer">
              <option value="elementary">Elementary</option>
              <option value="highschool">High School</option>
            </select>
            <Link
              href="/signup"
              className="px-10 py-4 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}
            >
              Find Tutor
            </Link>
          </div>

          {/* Skill tags */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <SkillTag label="Mathematics"    color="bg-p-blue   text-blue-700"   />
            <SkillTag label="General Science" color="bg-p-mint   text-teal-700"  />
            <SkillTag label="English Grammar" color="bg-p-pink   text-pink-700"  />
            <SkillTag label="History"         color="bg-p-yellow text-amber-700" />
            <SkillTag label="Art & Music"     color="bg-p-purple text-purple-700"/>
          </div>
        </motion.div>
      </header>

      {/* ── Tutors Showcase ───────────────────────────────────────────── */}
      <section id="tutors" className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Expert Directory</p>
            <h3 className="text-3xl font-black tracking-tight uppercase">
              Verified Academic <span className="gradient-text">Tutors</span>
            </h3>
          </div>
          <Link href="/signup" className="text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-primary pb-1 hover:opacity-70 transition-opacity text-primary">
            View All 42+ Experts
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { bg: 'bg-p-purple', icon: '🌸' },
            { bg: 'bg-p-pink',   icon: '⭐' },
            { bg: 'bg-p-mint',   icon: '✨' },
          ].map(({ bg, icon }, i) => (
            <div key={i} className={`p-8 ${bg} border-2 border-white rounded-[40px] flex flex-col items-center justify-center min-h-[300px] text-center shadow-sm hover:shadow-xl transition-all hover:-translate-y-1`}>
              <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center mb-4 shadow-sm text-3xl">
                {icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Tutor signups opening soon</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 bg-white/70 backdrop-blur-sm py-32 border-y border-p-purple">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="w-12 h-12 bg-p-yellow rounded-2xl flex items-center justify-center shadow-sm">
              <Lightbulb className="text-amber-500" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">
              The Brighton <span className="gradient-text">Methodology</span>
            </h3>
            <p className="text-text-muted font-medium leading-relaxed">
              We don&apos;t just assign tutors. We use a data-driven approach to ensure every student is matched with an educator who specializes in their specific weaknesses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CheckItem text="Elementary & High School Logic" />
              <CheckItem text="Manual Degree Verification" />
              <CheckItem text="In-App Messaging & Notes" />
              <CheckItem text="Parental Account Control" />
            </div>
          </div>

          <div className="p-8 bg-white border-2 border-p-purple rounded-[40px] shadow-[0_10px_40px_rgba(147,51,234,0.08)] relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-2 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' }}>
              LSPU Project
            </div>
            <div className="space-y-6 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-p-purple shadow-sm" />
                <div className="space-y-2">
                  <div className="h-3 w-32 bg-p-purple rounded" />
                  <div className="h-2 w-16 bg-p-pink rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 w-full bg-p-purple/60 rounded" />
                <div className="h-2 w-2/3 bg-p-pink/50 rounded" />
              </div>
              <div className="pt-4 border-t border-p-purple flex justify-between items-center">
                <div className="h-8 w-24 bg-p-yellow rounded-lg" />
                <div className="h-8 w-8 bg-p-mint rounded-full" />
              </div>
            </div>
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-25 mt-6">Tutor Application Engine v2</p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-20 text-center bg-white/50 border-t border-p-purple">
        <Link href={logoHref}>
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="mx-auto mb-6 opacity-30 hover:opacity-100 transition-opacity" style={{ width: 'auto', height: 'auto' }} />
        </Link>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">© 2026 Brighton • College of Computer Studies</p>
      </footer>
    </div>
  );
}

function SkillTag({ label, color }: { label: string; color: string }) {
  return (
    <div className={`px-4 py-2 ${color} rounded-full text-[10px] font-black uppercase tracking-widest border border-white/60 shadow-sm cursor-default hover:scale-105 transition-transform`}>
      {label}
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-p-mint flex items-center justify-center shrink-0">
        <Check size={10} className="text-teal-600" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{text}</span>
    </div>
  );
}
