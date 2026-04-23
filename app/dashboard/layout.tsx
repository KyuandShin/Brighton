'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Home, Users, Calendar, BookOpen, Bell, LogOut,
  User, X, ChevronRight, Sparkles, UserCheck
} from 'lucide-react';
import { useCurrentUser, getInitials } from '@/lib/hooks/useCurrentUser';
import { authClient } from '@/lib/auth/client';

const navItems = [
  { name: 'Home',     href: '/dashboard',          icon: Home },
  { name: 'Tutors',   href: '/dashboard/tutors',   icon: Users },
  { name: 'Classes',  href: '/dashboard/classes',  icon: BookOpen },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
];

const adminNavItems = [
  { name: 'Tutor Approvals', href: '/dashboard/admin/tutors', icon: UserCheck },
  { name: 'Students', href: '/dashboard/admin/students', icon: Users },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, error } = useCurrentUser();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotifications(data); })
      .catch(console.error);
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  // Tutor pending screen
  if (error === 'TUTOR_PENDING') {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-[40px] border border-[#f1f3f5] shadow-xl p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-[#fff3bf] rounded-3xl flex items-center justify-center mx-auto">
            <Sparkles size={36} className="text-[#f08c00]" />
          </div>
          <h2 className="text-2xl font-black text-[#2c3e50] tracking-tight">Pending Verification</h2>
          <p className="text-sm font-bold text-[#7f8c8d] uppercase tracking-wider leading-relaxed">
            Your tutor application is under review. You&apos;ll be notified once approved.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-[#f8f9fa] border-2 border-[#f1f3f5] text-[#7f8c8d] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#e9ecef] transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const displayName = user?.name ?? user?.email ?? 'Account';
  const initials = loading ? '…' : getInitials(user?.name ?? user?.email);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!loading && !user && error !== 'TUTOR_PENDING') {
      window.location.href = '/login';
    }
  }, [user, loading, error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbff] flex items-center justify-center">
        <div className="animate-pulse text-[#748ffc] text-sm font-bold uppercase tracking-widest">Loading...</div>
      </div>
    );
  }

  if (!user && error !== 'TUTOR_PENDING') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafbff]">
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-[#e9ecef] px-6 py-0 sticky top-0 z-50 h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center gap-6">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 logo-halo flex items-center justify-center border border-[#748ffc]/10 bg-white transition-transform group-hover:scale-105">
              <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
            </div>
            <span className="text-sm font-black tracking-[0.2em] text-[#2c3e50] uppercase">Brighton</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex gap-1 items-center flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#748ffc] text-white shadow-md shadow-[#748ffc]/25'
                      : 'text-[#7f8c8d] hover:bg-[#f8f9fa] hover:text-[#2c3e50]'
                  }`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  {item.name}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="mx-2 h-6 w-px bg-[#e9ecef]" />
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-[#748ffc] text-white shadow-md shadow-[#748ffc]/25'
                          : 'text-[#7f8c8d] hover:bg-[#f8f9fa] hover:text-[#2c3e50]'
                      }`}
                    >
                      <Icon size={14} strokeWidth={2.5} />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Right: Notifs + Profile */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); if (!notifOpen && unreadCount > 0) markAllRead(); }}
                className="relative p-2.5 bg-[#f8f9fa] border border-[#f1f3f5] rounded-xl text-[#7f8c8d] hover:bg-[#e9ecef] hover:text-[#2c3e50] transition-all"
              >
                <Bell size={17} strokeWidth={2.5} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff6b6b] rounded-full border-2 border-white text-[8px] font-black text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-[#f1f3f5] overflow-hidden z-50">
                  <div className="px-5 py-4 border-b border-[#f1f3f5] flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-[#2c3e50]">Notifications</span>
                    <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-[#f8f9fa] rounded-lg transition-all">
                      <X size={14} className="text-[#adb5bd]" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#f8f9fa]">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell size={28} className="mx-auto text-[#e9ecef] mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#adb5bd]">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { setNotifOpen(false); if (n.link) router.push(n.link); }}
                          className={`w-full text-left px-5 py-4 hover:bg-[#f8f9fa] transition-all flex items-start gap-3 ${!n.isRead ? 'bg-[#f0f4ff]' : ''}`}
                        >
                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-[#748ffc]' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-[#2c3e50] leading-tight">{n.title}</p>
                            <p className="text-[10px] text-[#7f8c8d] mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                            <p className="text-[9px] text-[#adb5bd] mt-1 font-bold uppercase tracking-wider">
                              {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {n.link && <ChevronRight size={14} className="text-[#adb5bd] shrink-0 mt-1" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 bg-[#f8f9fa] border border-[#f1f3f5] rounded-xl hover:bg-[#e9ecef] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#748ffc] to-[#5c7cfa] flex items-center justify-center text-white font-black text-[11px] shadow-sm">
                  {initials}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#2c3e50] hidden sm:block max-w-[100px] truncate">
                  {loading ? '...' : (user?.name?.split(' ')[0] ?? 'Account')}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-52 bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-[#f1f3f5] overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[#f8f9fa]">
                    <p className="text-xs font-black text-[#2c3e50] truncate">{displayName}</p>
                    <p className="text-[10px] text-[#adb5bd] truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-[#7f8c8d] hover:bg-[#f8f9fa] hover:text-[#2c3e50] transition-all"
                    >
                      <User size={14} /> My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-[#ff6b6b] hover:bg-[#fff5f5] transition-all"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page Content ──────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
