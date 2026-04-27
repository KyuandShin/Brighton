import Image from "next/image";
import Link from "next/link";

const DECORATIONS = [
  { char: '✦', top: '12%',  left: '7%',   size: '2rem',  color: '#f472b6', delay: '0s',    dur: '5s',   opacity: 0.28 },
  { char: '★', top: '18%',  right: '9%',  size: '1.4rem', color: '#9333ea', delay: '1.2s',  dur: '7s',   opacity: 0.22 },
  { char: '✿', top: '55%',  left: '5%',   size: '1.7rem', color: '#ec4899', delay: '2.1s',  dur: '6s',   opacity: 0.22 },
  { char: '◆', top: '43%',  right: '6%',  size: '1rem',   color: '#a855f7', delay: '0.5s',  dur: '3.5s', opacity: 0.18, spark: true },
  { char: '✧', bottom: '28%', right: '12%', size: '2.2rem', color: '#f472b6', delay: '1.8s', dur: '8s',   opacity: 0.16 },
  { char: '✦', bottom: '18%', left: '9%',  size: '1.3rem', color: '#8b5cf6', delay: '3s',    dur: '4.5s', opacity: 0.15, spark: true },
  { char: '◇', top: '72%',  left: '22%',  size: '0.9rem', color: '#ec4899', delay: '0.8s',  dur: '6.5s', opacity: 0.12 },
  { char: '✦', top: '28%',  left: '18%',  size: '0.8rem', color: '#d946ef', delay: '2.5s',  dur: '5.5s', opacity: 0.12, spark: true },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Animated background blobs */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '-15%', left: '-8%', width: '42%', height: '42%',
          background: 'var(--color-p-purple)',
          filter: 'blur(120px)', opacity: 0.75,
          animation: 'blob-drift 10s ease-in-out infinite',
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          bottom: '-10%', right: '-8%', width: '42%', height: '42%',
          background: 'var(--color-p-pink)',
          filter: 'blur(120px)', opacity: 0.75,
          animation: 'blob-drift 12s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '35%', right: '-5%', width: '28%', height: '28%',
          background: 'var(--color-p-sky)',
          filter: 'blur(80px)', opacity: 0.55,
          animation: 'blob-drift 14s ease-in-out infinite 3s',
        }}
      />

      {/* Floating anime decorations */}
      {DECORATIONS.map((d, i) => (
        <span
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            top: d.top, bottom: d.bottom, left: d.left, right: d.right,
            fontSize: d.size,
            color: d.color,
            opacity: d.opacity,
            animation: d.spark
              ? `sparkle ${d.dur} ease-in-out infinite`
              : `float-slow ${d.dur} ease-in-out infinite`,
            animationDelay: d.delay,
          }}
        >
          {d.char}
        </span>
      ))}

      {/* Auth card */}
      <div className="w-full max-w-md bg-white/92 backdrop-blur-sm rounded-4xl shadow-[0_24px_90px_rgba(147,51,234,0.11)] p-10 border border-p-purple relative z-10">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex flex-col items-center group transition-transform hover:scale-105">
            <div className="w-14 h-14 logo-halo flex items-center justify-center border-2 border-p-purple mb-6">
              <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
            </div>
            <h1 className="text-2xl font-black text-text-main tracking-[0.2em] uppercase">Brighton</h1>
          </Link>
        </div>
        {children}
      </div>

      <p className="mt-10 text-[9px] font-black uppercase tracking-[0.4em] opacity-30 relative z-10">
        Academic Matching System • 2026
      </p>
    </div>
  );
}
