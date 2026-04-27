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
import AnimeOnboarding from './_components/AnimeOnboarding';

const navItems = [
  { name: 'Home',     href: '/dashboard',          icon: Home },
  { name: 'Tutors',   href: '/dashboard/tutors',   icon: Users },
  { name: 'Classes',  href: '/dashboard/classes',  icon: BookOpen },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
];

const adminNavItems = [
  { name: 'Tutor Approvals', href: '/dashboard/admin/tutors',   icon: UserCheck },
  { name: 'Students',         href: '/dashboard/admin/students', icon: Users },
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
  const router   = useRouter();
  const { user, loading, error } = useCurrentUser();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotifications(data); })
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
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

  useEffect(() => {
    if (!loading && !user && error !== 'TUTOR_PENDING') {
      window.location.href = '/login';
    }
  }, [user, loading, error]);

  // ── Tutor pending screen ──────────────────────────────────────────────
  if (error === 'TUTOR_PENDING') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-[40px] border border-p-purple shadow-[0_20px_60px_rgba(147,51,234,0.08)] p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-p-yellow rounded-3xl flex items-center justify-center mx-auto">
            <Sparkles size={36} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-text-main tracking-tight">Pending Verification</h2>
          <p className="text-sm font-bold text-text-muted uppercase tracking-wider leading-relaxed">
            Your tutor application is under review. You&apos;ll be notified once approved.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-p-purple border-2 border-border text-text-muted rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const displayName = user?.name ?? user?.email ?? 'Account';
  const initials    = loading ? '…' : getInitials(user?.name ?? user?.email);
  const isAdmin     = user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl" style={{ animation: 'sparkle 1.2s ease-in-out infinite' }}>✦</span>
          <div className="animate-pulse text-primary text-sm font-bold uppercase tracking-widest">Loading...</div>
          <span className="text-2xl" style={{ animation: 'sparkle 1.2s ease-in-out infinite 0.4s', color: '#f472b6' }}>✦</span>
        </div>
      </div>
    );
  }

  if (!user && error !== 'TUTOR_PENDING') return null;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-p-purple px-6 py-0 sticky top-0 z-50 h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center gap-6">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 logo-halo flex items-center justify-center border border-p-purple bg-white transition-transform group-hover:scale-105">
              <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
            </div>
            <span className="text-sm font-black tracking-[0.2em] text-text-main uppercase">Brighton</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex gap-1 items-center flex-1 justify-center">
            {navItems.map((item) => {
              const Icon     = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    isActive
                      ? 'text-white shadow-md shadow-primary/20'
                      : 'text-text-muted hover:bg-p-purple hover:text-primary'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
                    boxShadow: '0 4px 14px rgba(147,51,234,0.25)',
                  } : undefined}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  {item.name}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="mx-2 h-6 w-px bg-border" />
                {adminNavItems.map((item) => {
                  const Icon     = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        isActive
                          ? 'text-white shadow-md shadow-primary/20'
                          : 'text-text-muted hover:bg-p-purple hover:text-primary'
                      }`}
                      style={isActive ? {
                        background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
                        boxShadow: '0 4px 14px rgba(147,51,234,0.25)',
                      } : undefined}
                    >
                      <Icon size={14} strokeWidth={2.5} />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                  if (!notifOpen && unreadCount > 0) markAllRead();
                }}
                className="relative p-2.5 bg-p-purple border border-border rounded-xl text-text-muted hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                <Bell size={17} strokeWidth={2.5} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white text-[8px] font-black text-white flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #ec4899, #9333ea)' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-[24px] shadow-[0_20px_60px_rgba(147,51,234,0.12)] border border-p-purple overflow-hidden z-50">
                  <div className="px-5 py-4 border-b border-p-purple flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-text-main">Notifications</span>
                    <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-p-purple rounded-lg transition-all">
                      <X size={14} className="text-text-muted" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-p-purple">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <span className="text-3xl block mb-2 opacity-30">🔔</span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { setNotifOpen(false); if (n.link) router.push(n.link); }}
                          className={`w-full text-left px-5 py-4 hover:bg-p-purple transition-all flex items-start gap-3 ${!n.isRead ? 'bg-p-purple/50' : ''}`}
                        >
                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-text-main leading-tight">{n.title}</p>
                            <p className="text-[10px] text-text-muted mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                            <p className="text-[9px] text-text-muted/60 mt-1 font-bold uppercase tracking-wider">
                              {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {n.link && <ChevronRight size={14} className="text-text-muted shrink-0 mt-1" />}
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
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 bg-p-purple border border-border rounded-xl hover:border-primary transition-all"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[11px] shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #f472b6 0%, #9333ea 100%)' }}
                >
                  {initials}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-text-main hidden sm:block max-w-[100px] truncate">
                  {loading ? '...' : (user?.name?.split(' ')[0] ?? 'Account')}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-52 bg-white rounded-[20px] shadow-[0_20px_60px_rgba(147,51,234,0.12)] border border-p-purple overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-p-purple">
                    <p className="text-xs font-black text-text-main truncate">{displayName}</p>
                    <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-text-muted hover:bg-p-purple hover:text-primary transition-all"
                    >
                      <User size={14} /> My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 transition-all"
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

      {/* ── Page Content ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>

      {/* ── Anime Onboarding tutorial ─────────────────────────────────── */}
      {user?.id && <AnimeOnboarding userId={user.id} />}
    </div>
  );
}
