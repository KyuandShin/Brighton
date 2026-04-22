import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Soft Background Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[30%] h-[30%] bg-p-blue blur-[100px] rounded-full opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-p-pink blur-[100px] rounded-full opacity-50 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-4xl shadow-[0_20px_60px_rgba(0,0,0,0.04)] p-10 border border-[#f1f3f5] relative z-10">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex flex-col items-center group transition-transform hover:scale-105">
            <div className="w-14 h-14 logo-halo flex items-center justify-center border-2 border-[#f8f9fa] mb-6">
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
