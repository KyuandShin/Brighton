'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { 
  Search, Check, Zap, Lightbulb, Star
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useCurrentUser();
  const logoHref = user ? '/dashboard' : '/';

  return (
    <div className="min-h-screen bg-background text-text-main selection:bg-primary/20">
      {/* Navbar */}
      <nav className="z-50 max-w-7xl mx-auto px-8 py-5 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 border-b border-[#f1f3f5]">
        <Link href={logoHref} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 logo-halo flex items-center justify-center border border-primary/10 bg-white">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
          </div>
          <span className="text-sm font-black tracking-[0.2em] text-text-main uppercase">Brighton</span>
        </Link>
        
        <div className="hidden md:flex gap-10 text-[10px] font-black uppercase tracking-widest text-text-muted">
            <Link href="#tutors" className="hover:text-primary transition-colors">Expert Pool</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">Process</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 font-black text-[10px] text-text-muted uppercase tracking-widest">Login</Link>
          <Link href="/signup" className="px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all uppercase tracking-widest">Join Now</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-32 flex flex-col items-center text-center">
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 w-full"
        >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#f8f9fa] border border-border rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
                <Zap size={10} className="text-[#fcc419]" fill="currentColor" />
                Intelligent Academic Matching
            </div>

            <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-text-main">
                    What subject do you want to master?
                </h2>
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
                    AI-Driven Tutoring for Elementary & High School
                </p>
            </div>

            <div className="max-w-2xl mx-auto w-full bg-white p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#f1f3f5] flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        name="search"
                        placeholder="Search subjects (e.g. Algebra, Physics...)" 
                        className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:outline-none font-bold text-sm"
                    />
                </div>
                <div className="h-10 w-px bg-[#f1f3f5] hidden md:block self-center" />
                <select name="level" className="px-6 py-4 bg-transparent border-none focus:outline-none font-bold text-xs uppercase tracking-widest text-text-muted cursor-pointer">
                    <option value="elementary">Elementary</option>
                    <option value="highschool">High School</option>
                </select>
                <Link href="/signup" className="px-10 py-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#5c7cfa] transition-all flex items-center justify-center">
                    Find Tutor
                </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
                <SkillTag label="Mathematics" color="bg-[#d0ebff] text-[#1971c2]" />
                <SkillTag label="General Science" color="bg-[#d3f9d8] text-[#2b8a3e]" />
                <SkillTag label="English Grammar" color="bg-[#ffd6e8] text-[#d6336c]" />
                <SkillTag label="History" color="bg-[#fff3bf] text-[#f08c00]" />
            </div>
        </motion.div>
      </header>

      {/* Verified Tutors Showcase */}
      <section id="tutors" className="max-w-7xl mx-auto px-8 pb-32">
        <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Expert Directory</p>
                <h3 className="text-3xl font-black tracking-tight uppercase">Verified Academic Tutors</h3>
            </div>
            <Link href="/signup" className="text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-primary pb-1 hover:opacity-70 transition-opacity">View All 42+ Experts</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-8 bg-[#f8f9fa] border-2 border-dashed border-border rounded-[40px] flex flex-col items-center justify-center min-h-75 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center mb-4 opacity-50">
                        <Star size={32} className="text-[#adb5bd]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#adb5bd]">Tutor signups opening soon</p>
                </div>
            ))}
        </div>
      </section>

      {/* Information Row */}
      <section id="how-it-works" className="bg-[#f8f9fa] py-32 border-y border-[#f1f3f5]">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Lightbulb className="text-[#fcc419]" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">The Brighton Methodology</h3>
                <p className="text-text-muted font-medium leading-relaxed">
                    We don't just assign tutors. We use a data-driven approach to ensure every student is matched with an educator who specializes in their specific weaknesses.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-text-main">
                    <CheckItem text="Elementary & High School Logic" />
                    <CheckItem text="Manual Degree Verification" />
                    <CheckItem text="In-App Messaging & Notes" />
                    <CheckItem text="Parental Account Control" />
                </div>
            </div>
            <div className="p-8 bg-white border-2 border-[#f1f3f5] rounded-[40px] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">LSPU Project</div>
                <div className="space-y-6 p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-p-blue" />
                        <div className="space-y-2">
                             <div className="h-3 w-32 bg-[#f1f3f5] rounded" />
                             <div className="h-2 w-16 bg-[#f1f3f5] rounded" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-2 w-full bg-[#f1f3f5] rounded" />
                        <div className="h-2 w-2/3 bg-[#f1f3f5] rounded" />
                    </div>
                    <div className="pt-4 border-t border-[#f1f3f5] flex justify-between items-center">
                        <div className="h-8 w-24 bg-p-yellow rounded-lg" />
                        <div className="h-8 w-8 bg-p-green rounded-full" />
                    </div>
                </div>
                <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-6">Tutor Application Engine v2</p>
            </div>
        </div>
      </section>

      <footer className="py-20 text-center bg-white border-t border-[#f1f3f5]">
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
        <div className={`px-4 py-2 ${color} rounded-full text-[10px] font-black uppercase tracking-widest border border-white/50 shadow-sm cursor-default hover:scale-105 transition-transform`}>
            {label}
        </div>
    )
}

function CheckItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-p-green flex items-center justify-center">
                <Check size={10} className="text-[#2b8a3e]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{text}</span>
        </div>
    )
}
