'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';

// ── Hoshi Mascot SVG ─────────────────────────────────────────────────────────
function HoshiMascot({ mood }: { mood: 'happy' | 'excited' | 'thinking' | 'waving' }) {
  return (
    <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      {/* Shadow */}
      <ellipse cx="50" cy="107" rx="22" ry="4" fill="black" opacity="0.06" />

      {/* Body / outfit */}
      <path d="M26 80 Q50 74 74 80 L72 110 L28 110 Z" fill="#B8D8F8" />
      {/* Collar V */}
      <path d="M44 82 L50 91 L56 82" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bow */}
      <path d="M44 85 L50 90 L56 85 L50 81 Z" fill="#FFADD0" />
      <circle cx="50" cy="84" r="2.5" fill="#FF6AA8" />

      {/* Hair back */}
      <ellipse cx="50" cy="38" rx="33" ry="30" fill="#5EC8EA" />
      {/* Twin tails */}
      <path d="M17 52 C7 67 9 82 18 86 C24 89 29 77 25 63 Z" fill="#5EC8EA" />
      <path d="M83 52 C93 67 91 82 82 86 C76 89 71 77 75 63 Z" fill="#5EC8EA" />

      {/* Face */}
      <ellipse cx="50" cy="56" rx="28" ry="26" fill="#FDDCB5" />

      {/* Hair bangs */}
      <path d="M22 47 C20 30 34 19 50 19 C66 19 80 30 78 47 Q70 41 50 38 Q30 41 22 47 Z" fill="#5EC8EA" />

      {/* Ears */}
      <ellipse cx="22" cy="58" rx="5" ry="7" fill="#FDDCB5" />
      <ellipse cx="78" cy="58" rx="5" ry="7" fill="#FDDCB5" />

      {/* Hair ribbon bow */}
      <path d="M25 32 L16 27 L21 34 L16 41 L25 36 L30 41 L35 34 L30 27 Z" fill="#FF92B4" />
      <circle cx="25" cy="34" r="3.5" fill="#FF6AA8" />

      {/* Star sparkle in hair */}
      <text x="62" y="21" fontSize="11" fill="#FFD700" fontFamily="serif">✦</text>

      {/* Eyes — white */}
      <ellipse cx="40" cy="56" rx="9" ry="10" fill="white" />
      <ellipse cx="60" cy="56" rx="9" ry="10" fill="white" />
      {/* Iris */}
      <ellipse cx="40" cy="57" rx="7" ry="8" fill="#5EC8EA" />
      <ellipse cx="60" cy="57" rx="7" ry="8" fill="#5EC8EA" />
      {/* Pupil */}
      <ellipse cx="41" cy="58" rx="5" ry="6" fill="#1A2040" />
      <ellipse cx="61" cy="58" rx="5" ry="6" fill="#1A2040" />
      {/* Shine */}
      <circle cx="43" cy="55" r="2" fill="white" />
      <circle cx="63" cy="55" r="2" fill="white" />
      <circle cx="42" cy="62" r="1" fill="white" opacity="0.5" />

      {/* Eyelashes */}
      <path d="M31 49 C36 45 44 46 49 50" stroke="#3AAFCE" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M51 50 C56 46 64 45 69 49" stroke="#3AAFCE" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Blush */}
      <ellipse cx="30" cy="67" rx="7.5" ry="4.5" fill="#FFB3CC" opacity="0.5" />
      <ellipse cx="70" cy="67" rx="7.5" ry="4.5" fill="#FFB3CC" opacity="0.5" />

      {/* Nose */}
      <ellipse cx="50" cy="67" rx="2" ry="1.5" fill="#E8A880" opacity="0.5" />

      {/* Mouth */}
      {mood === 'thinking' ? (
        <path d="M44 75 L56 75" stroke="#E07070" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : mood === 'excited' ? (
        <path d="M42 74 Q50 83 58 74" stroke="#E07070" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M43 74 Q50 81 57 74" stroke="#E07070" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* Waving arm */}
      {mood === 'waving' && (
        <path d="M72 86 C80 72 84 63 80 57 C77 52 72 55 73 63 C74 70 73 80 72 86" fill="#FDDCB5" />
      )}

      {/* Excited sparkles */}
      {mood === 'excited' && (
        <>
          <text x="80" y="40" fontSize="9" fill="#FFD700">★</text>
          <text x="6" y="46" fontSize="8" fill="#FF92B4">✦</text>
        </>
      )}
    </svg>
  );
}

// ── Step data ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    badge: '✦ こんにちは！',
    title: 'Welcome to Brighton!',
    subtitle: "I'm Hoshi, your guide~",
    desc: "Exciting times ahead, senpai! 🌸 Brighton is your gateway to finding amazing tutors and leveling up your academic journey. Let me show you around!",
    mood: 'waving' as const,
    cta: null,
    gradient: 'linear-gradient(135deg, #fce7f3 0%, #ede9fe 100%)',
    accentColor: '#9333ea',
  },
  {
    id: 'tutors',
    badge: '✦ STEP 1',
    title: 'Find Your Sensei!',
    subtitle: 'Browse verified academic experts~',
    desc: "The Tutors page is your quest board! 📚 Browse verified tutors, check their star ratings, subjects, and find the perfect sensei for your learning style!",
    mood: 'excited' as const,
    cta: { label: 'Go to Tutors', href: '/dashboard/tutors' },
    gradient: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
    accentColor: '#3b82f6',
  },
  {
    id: 'classes',
    badge: '✦ STEP 2',
    title: 'Manage Your Classes!',
    subtitle: 'All your sessions in one place~',
    desc: "Once you book a session, it appears in My Classes! 🎯 Track status, join your virtual classroom, and manage all bookings from one magical spot.",
    mood: 'happy' as const,
    cta: { label: 'View My Classes', href: '/dashboard/classes' },
    gradient: 'linear-gradient(135deg, #ccfbf1 0%, #dbeafe 100%)',
    accentColor: '#0d9488',
  },
  {
    id: 'calendar',
    badge: '✦ STEP 3',
    title: 'Your Study Calendar!',
    subtitle: 'Never miss a session again~',
    desc: "Your Calendar shows all upcoming sessions at a glance! 🗓️ Click any day to see what's scheduled. Stay organized and never miss a learning opportunity!",
    mood: 'thinking' as const,
    cta: { label: 'Open Calendar', href: '/dashboard/calendar' },
    gradient: 'linear-gradient(135deg, #fef9c3 0%, #ffedd5 100%)',
    accentColor: '#d97706',
  },
  {
    id: 'done',
    badge: '✦ YOU\'RE READY!',
    title: "All Set, Senpai!",
    subtitle: 'Your journey begins now~ ✨',
    desc: "Take the AI Assessment to get personalized tutor recommendations! 🌟 It'll match you with the perfect teacher for your learning goals. がんばって！",
    mood: 'excited' as const,
    cta: { label: '✦ Start AI Assessment', href: '/dashboard/test' },
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)',
    accentColor: '#9333ea',
  },
];

// ── Floating sparkle decoration ───────────────────────────────────────────────
const SPARKLES = [
  { char: '✦', x: '8%',  y: '12%', size: 18, delay: 0,    color: '#f472b6' },
  { char: '★', x: '88%', y: '8%',  size: 14, delay: 0.5,  color: '#fbbf24' },
  { char: '✿', x: '5%',  y: '75%', size: 16, delay: 1,    color: '#a78bfa' },
  { char: '◆', x: '92%', y: '70%', size: 12, delay: 1.5,  color: '#34d399' },
  { char: '✦', x: '50%', y: '5%',  size: 10, delay: 0.8,  color: '#60a5fa' },
  { char: '♡', x: '80%', y: '40%', size: 16, delay: 0.3,  color: '#f472b6' },
];

// ── Main component ───────────────────────────────────────────────────────────
export default function AnimeOnboarding({ userId }: { userId: string }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const storageKey = `brighton_onboarded_${userId}`;

  useEffect(() => {
    // Show after a short delay to not interrupt page load
    const timer = setTimeout(() => {
      if (!localStorage.getItem(storageKey)) {
        setVisible(true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setExiting(true);
    setTimeout(() => setVisible(false), 400);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const current = STEPS[step];

  if (!visible) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="absolute inset-0 backdrop-blur-md"
            style={{ background: 'rgba(30, 10, 60, 0.35)' }}
          />

          {/* Floating sparkles in backdrop */}
          {SPARKLES.map((s, i) => (
            <motion.span
              key={i}
              className="absolute pointer-events-none select-none font-black z-10"
              style={{ left: s.x, top: s.y, fontSize: s.size, color: s.color, opacity: 0.7 }}
              animate={{
                y: [0, -10, 5, -10, 0],
                rotate: [0, 15, -10, 15, 0],
                opacity: [0.5, 0.9, 0.5, 0.9, 0.5],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
            >
              {s.char}
            </motion.span>
          ))}

          {/* Modal card */}
          <motion.div
            key={step}
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-20 w-full max-w-md overflow-hidden rounded-[40px] shadow-[0_40px_100px_rgba(147,51,234,0.22)]"
            style={{ background: current.gradient }}
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-5 right-5 p-2 bg-white/60 hover:bg-white rounded-full transition-all z-30 shadow-sm"
            >
              <X size={16} className="text-text-main" />
            </button>

            {/* Step dots */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`rounded-full transition-all ${
                    i === step
                      ? 'w-5 h-2 bg-primary'
                      : 'w-2 h-2 bg-primary/30'
                  }`}
                />
              ))}
            </div>

            {/* Mascot area */}
            <div className="relative flex justify-center pt-14 pb-2">
              {/* Glow behind mascot */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 rounded-full blur-2xl opacity-40"
                style={{ background: current.gradient }}
              />
              <motion.div
                className="relative w-32 h-36 z-10"
                animate={
                  current.mood === 'waving'
                    ? { rotate: [0, 3, -3, 3, 0] }
                    : current.mood === 'excited'
                    ? { y: [0, -6, 0, -4, 0] }
                    : { y: [0, -3, 0] }
                }
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <HoshiMascot mood={current.mood} />
              </motion.div>
            </div>

            {/* Text content */}
            <div className="px-8 pb-8 space-y-4">
              {/* Badge */}
              <div className="flex justify-center">
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] text-white shadow-md"
                  style={{ background: current.accentColor }}
                >
                  {current.badge}
                </span>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-text-main leading-tight">
                  {current.title}
                </h2>
                <p className="text-[11px] font-black uppercase tracking-widest text-text-muted">
                  {current.subtitle}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm font-bold text-text-main/70 text-center leading-relaxed">
                {current.desc}
              </p>

              {/* CTA / Next */}
              <div className="flex gap-3 pt-2">
                {current.cta ? (
                  <>
                    <Link
                      href={current.cta.href}
                      onClick={dismiss}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, #ec4899, #9333ea)`, boxShadow: '0 6px 20px rgba(147,51,234,0.3)' }}
                    >
                      {current.cta.label}
                    </Link>
                    <button
                      onClick={next}
                      className="px-5 py-3.5 bg-white/70 hover:bg-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-text-muted transition-all flex items-center gap-1"
                    >
                      {step === STEPS.length - 1 ? 'Done' : 'Skip'} <ChevronRight size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={next}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #ec4899, #9333ea)', boxShadow: '0 6px 20px rgba(147,51,234,0.3)' }}
                  >
                    <Star size={14} /> Let&apos;s Go!
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {/* Skip all */}
              <div className="text-center">
                <button
                  onClick={dismiss}
                  className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted/60 hover:text-text-muted transition-colors"
                >
                  Skip tutorial
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
