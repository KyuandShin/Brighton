'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export type HoshiMood = 'hello' | 'hi' | 'happy' | 'waving' | 'excited' | 'thinking' | 'present';

interface HoshiMascotProps {
  mood: HoshiMood;
  size?: number;
  className?: string;
  floating?: boolean;
  showSpeechBubble?: boolean;
  speechText?: string;
}

const MOOD_MAP: Record<HoshiMood, string> = {
  hello: '/mascot-hello.png',
  hi: '/mascot-hi.png',
  happy: '/mascot-happy.png',
  waving: '/mascot-waving.png',
  excited: '/mascot-excited.png',
  thinking: '/mascot-thinking.png',
  present: '/mascot-present.png',
};

export default function HoshiMascot({
  mood,
  size = 160,
  className = '',
  floating = true,
  showSpeechBubble = false,
  speechText,
}: HoshiMascotProps) {
  const img = (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glow behind mascot */}
      <div
        className="absolute inset-0 rounded-full opacity-30 blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, transparent 70%)',
          transform: 'scale(1.2)',
        }}
      />

      {/* Decorative sparkle rings */}
      <div className="absolute inset-0 rounded-full border-2 border-p-purple/20 animate-pulse" style={{ width: size * 1.15, height: size * 1.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

      {/* Main image */}
      <Image
        src={MOOD_MAP[mood]}
        alt={`Hoshi the mascot - ${mood}`}
        fill
        className="object-contain drop-shadow-[0_8px_24px_rgba(147,51,234,0.25)]"
        priority
        sizes={`${size}px`}
      />

      {/* Speech bubble */}
      {showSpeechBubble && speechText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="absolute -top-2 right-0 translate-x-1/4 -translate-y-full"
        >
          <div className="relative bg-white dark:bg-surface border-2 border-p-purple/40 rounded-2xl px-4 py-2 shadow-lg min-w-[140px] max-w-[200px]">
            {/* Bubble arrow */}
            <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white dark:bg-surface border-r-2 border-b-2 border-p-purple/40 rotate-45" />
            <p className="text-[10px] font-black text-text-main text-center leading-tight">
              {speechText}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );

  if (floating) {
    return (
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {img}
      </motion.div>
    );
  }

  return img;
}