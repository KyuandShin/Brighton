'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Users, Calendar, Settings, LogOut, Shield, UserCheck } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { authClient } from '@/lib/auth/client';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Placement Test', href: '/dashboard/test', icon: BookOpen },
  { name: 'Find Tutors', href: '/dashboard/tutors', icon: Users },
  { name: 'My Classes', href: '/dashboard/classes', icon: Calendar },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="w-64 bg-[#152232] border-r border-[#1e2d3d] flex flex-col h-screen sticky top-0">
      <Link href="/dashboard" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity group">
        <div className="w-10 h-10 logo-halo flex items-center justify-center border border-primary/10 bg-white transition-transform group-hover:scale-105">
          <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
        </div>
        <h1 className="text-xl font-black text-white tracking-tighter uppercase">BRIGHTON</h1>
      </Link>
      
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    isActive 
                      ? 'bg-[#3dbbee] text-white shadow-lg shadow-[#3dbbee]/20' 
                      : 'text-[#9fadbd] hover:bg-[#0b1622] hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}

          {isAdmin && (
            <>
              <li className="mt-6 mb-2 px-4">
                <p className="text-[#627285] text-[10px] font-black uppercase tracking-widest">Admin</p>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/tutors"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    pathname.startsWith('/dashboard/admin/tutors')
                      ? 'bg-[#3dbbee] text-white shadow-lg shadow-[#3dbbee]/20' 
                      : 'text-[#9fadbd] hover:bg-[#0b1622] hover:text-white'
                  }`}
                >
                  <UserCheck size={18} />
                  <span>Tutor Approvals</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/students"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    pathname.startsWith('/dashboard/admin/students')
                      ? 'bg-[#3dbbee] text-white shadow-lg shadow-[#3dbbee]/20' 
                      : 'text-[#9fadbd] hover:bg-[#0b1622] hover:text-white'
                  }`}
                >
                  <Users size={18} />
                  <span>Students</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#1e2d3d]">
        <button 
          onClick={async () => {
            await authClient.signOut();
            window.location.href = '/';
          }}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-[#9fadbd] hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
