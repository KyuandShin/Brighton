'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Sparkles, ChevronRight, ChevronLeft, Users, Calendar, BookOpen, ClipboardList, BarChart2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import HoshiMascot, { type HoshiMood } from '@/app/_components/HoshiMascot';

// ── Step data ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    badge: '✦ Star',
    title: 'WELCOME STUDENT!',
    subtitle: "I'm Star, your academic guide~",
    desc: "Welcome to Brighton — your AI-powered tutoring booking system! I'll walk you through everything so you can start your journey to academic success",
    mood: 'waving' as const,
    icon: Sparkles,
    color: '#ec4899',
    bg: 'from-[#fce7f3] to-[#ede9fe]',
    highlight: '#ec4899',
    cta: null,
  },
  {
    id: 'tutors',
    badge: '✦ STEP 01',
    title: 'FIND YOUR TUTOR',
    subtitle: 'Discover your perfect tutor',
    desc: "Browse our directory of verified tutors! Use the AI matching tool to find experts in your subject and academic level — Elementary or High School.",
    mood: 'excited' as const,
    icon: Users,
    color: '#3b82f6',
    bg: 'from-[#dbeafe] to-[#ede9fe]',
    highlight: '#3b82f6',
    cta: { label: 'Browse Tutors', href: '/dashboard/tutors' },
  },
  {
    id: 'bookings',
    badge: '✦ STEP 02',
    title: 'BOOK A SESSION',
    subtitle: 'Schedule your learning time',
    desc: "Once you've found your tutor, book a session directly! Your Bookings page tracks all pending, confirmed, and completed sessions in one place.",
    mood: 'happy' as const,
    icon: ClipboardList,
    color: '#14b8a6',
    bg: 'from-[#ccfbf1] to-[#dbeafe]',
    highlight: '#14b8a6',
    cta: { label: 'My Bookings', href: '/dashboard/bookings' },
  },
  {
    id: 'classes',
    badge: '✦ STEP 03',
    title: 'JOIN YOUR CLASSES',
    subtitle: 'Live video sessions via Jitsi',
    desc: "When a session starts, head to Classes to join the live video room. You can chat, share screens, and interact with your tutor in real time!",
    mood: 'happy' as const,
    icon: BookOpen,
    color: '#8b5cf6',
    bg: 'from-[#ede9fe] to-[#fce7f3]',
    highlight: '#8b5cf6',
    cta: { label: 'My Classes', href: '/dashboard/classes' },
  },
  {
    id: 'calendar',
    badge: '✦ STEP 04',
    title: 'YOUR SCHEDULE',
    subtitle: 'Never miss a session~',
    desc: "The Calendar gives you a full month view of all your upcoming sessions. Stay on top of your learning schedule and plan ahead!",
    mood: 'thinking' as const,
    icon: Calendar,
    color: '#f59e0b',
    bg: 'from-[#fef9c3] to-[#ffedd5]',
    highlight: '#f59e0b',
    cta: { label: 'Open Calendar', href: '/dashboard/calendar' },
  },
  {
    id: 'assessment',
    badge: '✦ STEP 05',
    title: 'TAKE THE TEST',
    subtitle: 'Get AI-matched to the right tutor',
    desc: "The AI Placement Test detects your strengths and weak areas across Math, English, Science, and Filipino — then recommends tutors perfectly matched to your needs!",
    mood: 'thinking' as const,
    icon: BarChart2,
    color: '#ec4899',
    bg: 'from-[#fce7f3] to-[#fef9c3]',
    highlight: '#ec4899',
    cta: { label: 'Start Assessment', href: '/dashboard/test' },
  },
  {
    id: 'done',
    badge: '✦ ALL SET!',
    title: "YOU'RE READY!",
    subtitle: 'Your journey begins now~',
    desc: "That's everything! Remember — you can replay this guide anytime from the Help button in your profile menu. Now go find your perfect tutor! がんばって!",
    mood: 'excited' as const,
    icon: Star,
    color: '#9333ea',
    bg: 'from-[#ede9fe] to-[#fce7f3]',
    highlight: '#9333ea',
    cta: null,
  },
];

// ── Exported trigger fn so layout can call it ────────────────────────────────
export function openOnboarding() {
  window.dispatchEvent(new CustomEvent('brighton:open-onboarding'));
}

export default function AnimeOnboarding({ userId }: { userId: string }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward, -1 = back

  const storageKey = `brighton_onboarded_${userId}`;

  // Auto-show once for new users
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!localStorage.getItem(storageKey)) setVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [storageKey]);

  // Listen for manual trigger from profile menu
  useEffect(() => {
    const handler = () => { setStep(0); setVisible(true); };
    window.addEventListener('brighton:open-onboarding', handler);
    return () => window.removeEventListener('brighton:open-onboarding', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) { setDir(1); setStep((s) => s + 1); }
    else dismiss();
  };

  const prev = () => {
    if (step > 0) { setDir(-1); setStep((s) => s - 1); }
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="relative z-20 w-full sm:max-w-[600px] bg-white rounded-t-[36px] sm:rounded-[36px] shadow-[0_32px_80px_rgba(147,51,234,0.22)] overflow-hidden border border-p-purple"
          >
            {/* Gradient header strip */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${current.bg}`}
            />

            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-5 right-5 z-50 w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all"
            >
              <X size={15} />
            </button>

            {/* Main content area */}
            <div className="flex flex-col sm:flex-row min-h-[420px]">

              {/* ── Left: Mascot panel ── */}
              <div
                className={`hidden sm:flex w-[200px] shrink-0 bg-gradient-to-b ${current.bg} items-end justify-center pt-8 overflow-hidden relative`}
              >
                {/* Decorative circles */}
                <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/30" />
                <div className="absolute bottom-32 right-2 w-8 h-8 rounded-full bg-white/20" />

                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-[160px] h-[200px]"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-full h-full"
                  >
                    <HoshiMascot mood={current.mood} />
                  </motion.div>
                </motion.div>
              </div>

              {/* ── Right: Content ── */}
              <div className="flex-1 flex flex-col p-7 pt-8 gap-5 min-w-0">

                {/* Step badge + title */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: dir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir * -30 }}
                    transition={{ duration: 0.28 }}
                    className="space-y-3"
                  >
                    {/* Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white"
                        style={{ background: current.highlight }}
                      >
                        {current.badge}
                      </span>
                    </div>

                    {/* Title + subtitle */}
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-text-main leading-tight">
                        {current.title}
                      </h2>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] mt-0.5" style={{ color: current.highlight }}>
                        {current.subtitle}
                      </p>
                    </div>

                    {/* Mobile mascot (inline, smaller) */}
                    <div className="sm:hidden flex justify-center py-1">
                      <div className="w-24 h-28">
                        <HoshiMascot mood={current.mood} />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-text-muted leading-relaxed font-medium">
                      {current.desc}
                    </p>

                    {/* CTA link */}
                    {current.cta && (
                      <Link
                        href={current.cta.href}
                        onClick={dismiss}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors hover:underline"
                        style={{ color: current.highlight }}
                      >
                        {current.cta.label} <ArrowRight size={12} />
                      </Link>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* ── Bottom controls ── */}
                <div className="mt-auto pt-4 border-t border-border flex items-center gap-3">

                  {/* Prev */}
                  <button
                    onClick={prev}
                    disabled={step === 0}
                    className="w-9 h-9 rounded-xl border-2 border-border flex items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Dots */}
                  <div className="flex-1 flex items-center justify-center gap-1.5">
                    {STEPS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setDir(i > step ? 1 : -1); setStep(i); }}
                        className="transition-all rounded-full"
                        style={{
                          width: i === step ? 20 : 6,
                          height: 6,
                          background: i === step ? current.highlight : '#e5e7eb',
                        }}
                      />
                    ))}
                  </div>

                  {/* Next / Finish */}
                  <button
                    onClick={next}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all hover:opacity-90 hover:scale-105 active:scale-95 shrink-0"
                    style={{ background: current.highlight }}
                  >
                    {isLast ? (
                      <><Star size={13} /> Done!</>
                    ) : (
                      <>Next <ChevronRight size={13} /></>
                    )}
                  </button>
                </div>

                {/* Skip */}
                {!isLast && (
                  <button
                    onClick={dismiss}
                    className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/50 hover:text-text-muted transition-colors -mt-2"
                  >
                    Skip Tutorial
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
