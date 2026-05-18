'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Users, Calendar, Settings, LogOut, UserCheck, MessageSquare, TrendingUp } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function NavLink({ href, icon: Icon, children, exact }: { href: string; icon: React.ElementType; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link href={href}>
      <Button
        variant={isActive ? "default" : "ghost"}
        size="sm"
        className={cn(
          "w-full justify-start gap-3 px-4 py-6 rounded-xl font-bold text-sm",
          isActive
            ? 'bg-[#3dbbee] text-white hover:bg-[#3dbbee]/90 shadow-lg shadow-[#3dbbee]/20'
            : 'text-[#9fadbd] hover:bg-[#0b1622] hover:text-white'
        )}
      >
        <Icon size={18} />
        <span>{children}</span>
      </Button>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Placement Test', href: '/dashboard/test', icon: BookOpen },
    { name: 'Test History', href: '/dashboard/test-history', icon: TrendingUp },
    ...(isStudent ? [{ name: 'Find Tutors', href: '/dashboard/tutors', icon: Users }] : []),
    { name: 'My Classes', href: '/dashboard/classes', icon: Calendar },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const adminNavItems = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: Home },
    { name: 'Tutor Approvals', href: '/dashboard/admin/tutors', icon: UserCheck },
    { name: 'Students', href: '/dashboard/admin/students', icon: Users },
  ];

  return (
    <div className="w-64 bg-[#152232] border-r border-[#1e2d3d] flex flex-col h-screen sticky top-0">
      <Link href="/dashboard" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity group">
        <div className="w-10 h-10 logo-halo flex items-center justify-center border border-primary/10 bg-white transition-transform group-hover:scale-105">
          <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
        </div>
        <h1 className="text-xl font-black text-white tracking-tighter uppercase">BRIGHTON</h1>
      </Link>
      
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-3 px-4 py-6 rounded-xl font-bold text-sm",
                      isActive
                        ? 'bg-[#3dbbee] text-white hover:bg-[#3dbbee]/90 shadow-lg shadow-[#3dbbee]/20'
                        : 'text-[#9fadbd] hover:bg-[#0b1622] hover:text-white'
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              </li>
            );
          })}

          {isAdmin && (
            <>
              <li className="px-1 py-2">
                <Separator className="bg-[#1e2d3d]" />
              </li>
              <li className="px-4 pb-1 pt-1">
                <p className="text-[#627285] text-[10px] font-black uppercase tracking-widest">Admin</p>
              </li>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/dashboard/admin'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start gap-3 px-4 py-6 rounded-xl font-bold text-sm",
                          isActive
                            ? 'bg-[#3dbbee] text-white hover:bg-[#3dbbee]/90 shadow-lg shadow-[#3dbbee]/20'
                            : 'text-[#9fadbd] hover:bg-[#0b1622] hover:text-white'
                        )}
                      >
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </Button>
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#1e2d3d]">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 px-4 py-6 rounded-xl text-sm font-bold text-[#9fadbd] hover:bg-red-500/10 hover:text-red-500"
          onClick={async () => {
            await authClient.signOut();
            window.location.href = '/';
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}