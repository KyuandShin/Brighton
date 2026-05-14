'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home, Users, Calendar, BookOpen, Bell, LogOut,
  User, X, ChevronRight, Sparkles, UserCheck, Moon, Sun, Heart, TrendingUp
} from 'lucide-react';
import { useCurrentUser, getInitials } from '@/lib/hooks/useCurrentUser';
import { authClient } from '@/lib/auth/client';
import AnimeOnboarding from './_components/Tutorial';

const navItems = [
  { name: 'Home',     href: '/dashboard',          icon: Home },
  { name: 'Tutors',   href: '/dashboard/tutors',   icon: Users },
  { name: 'Classes',  href: '/dashboard/classes',  icon: BookOpen },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Bookings', href: '/dashboard/bookings', icon: UserCheck },
];

const adminNavItems = [
  { name: 'Dashboard',       href: '/dashboard/admin',           icon: Home },
  { name: 'Tutor Approvals', href: '/dashboard/admin/tutors',    icon: UserCheck },
  { name: 'Students',        href: '/dashboard/admin/students',  icon: Users },
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
  const [darkMode, setDarkMode]       = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Theme initialization
  useEffect(() => {
    const stored = localStorage.getItem('brighton-theme');
    if (stored === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) document.documentElement.classList.add('dark');
    }
  }, []);

  // Sync user theme from DB on mount
  useEffect(() => {
    if (user?.theme) {
      const isDark = user.theme === 'dark';
      setDarkMode(isDark);
      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, [user?.theme]);

  const toggleTheme = useCallback(async () => {
    const newTheme = darkMode ? 'light' : 'dark';
    setDarkMode(!darkMode);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('brighton-theme', newTheme);
    
    // Persist to backend
    if (user?.id) {
      try {
        await fetch('/api/theme', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch {}
    }
  }, [darkMode, user?.id]);

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
    // Preserve theme preference when logging out
    const theme = localStorage.getItem('brighton-theme');
    await authClient.signOut();
    localStorage.clear();
    sessionStorage.clear();
    if (theme) localStorage.setItem('brighton-theme', theme);
    window.location.replace('/login?logout=' + Date.now());
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
        <div className="max-w-md w-full bg-surface rounded-[40px] border border-p-purple shadow-[0_20px_60px_rgba(147,51,234,0.08)] p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-p-yellow rounded-3xl flex items-center justify-center mx-auto">
            <Sparkles size={36} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-text-main tracking-tight">Pending Verification</h2>
          <p className="text-sm font-bold text-text-muted uppercase tracking-wider leading-relaxed">
            Your tutor application is under review. You'll be notified once approved.
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
  const isStudent   = user?.role === 'STUDENT';

  const extraNavItems = [];
  if (isStudent) {
    extraNavItems.push({ name: 'Favorites', href: '/dashboard/favorites', icon: Heart });
    extraNavItems.push({ name: 'Test History', href: '/dashboard/test-history', icon: TrendingUp });
  }
  if (user?.role === 'TUTOR') {
    extraNavItems.push({ name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp });
    extraNavItems.push({ name: 'Resources', href: '/dashboard/resources', icon: BookOpen });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            {/* Track ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-p-purple" />
            {/* Spinning arc — uses a single border with 3 transparent sides */}
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-primary text-xs font-black uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && error !== 'TUTOR_PENDING') return null;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="bg-surface/90 backdrop-blur-xl border-b border-border px-6 py-0 sticky top-0 z-50 h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center gap-6">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 logo-halo flex items-center justify-center border border-p-purple bg-surface transition-transform group-hover:scale-105">
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

            {/* Extra student/tutor nav items */}
            {extraNavItems.map((item) => {
              const Icon     = item.icon;
              const isActive = pathname.startsWith(item.href) || pathname === item.href;
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

          {/* Right: Dark Mode toggle + Notifications + Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-p-purple border border-border rounded-xl text-text-muted hover:bg-primary hover:text-white hover:border-primary transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={17} strokeWidth={2.5} /> : <Moon size={17} strokeWidth={2.5} />}
            </button>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  // Mark as read when closing the dropdown, not when opening
                  if (notifOpen && unreadCount > 0) markAllRead();
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
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
                <div className="absolute right-0 top-12 w-80 bg-surface rounded-[24px] shadow-[0_20px_60px_rgba(147,51,234,0.12)] border border-border overflow-hidden z-50">
                  <div className="px-5 py-4 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-text-main">Notifications</span>
                    <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-p-purple rounded-lg transition-all">
                      <X size={14} className="text-text-muted" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <div className="w-10 h-10 bg-p-purple rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Bell size={16} className="text-text-muted" />
                        </div>
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
                <div className="absolute right-0 top-12 w-52 bg-surface rounded-[20px] shadow-[0_20px_60px_rgba(147,51,234,0.12)] border border-border overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
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
                      onClick={() => { setProfileOpen(false); toggleTheme(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-text-muted hover:bg-p-purple hover:text-primary transition-all"
                    >
                      {darkMode ? <Sun size={14} /> : <Moon size={14} />} {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
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
      <main className="max-w-7xl mx-auto px-6 py-10 pb-24 md:pb-10">{children}</main>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-xl border-t border-border z-50 md:hidden flex items-center justify-around px-2">
        {[...navItems, ...extraNavItems].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full w-full transition-all ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-black uppercase tracking-wider mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Anime Onboarding tutorial ─────────────────────────────────── */}
      {user?.id && <AnimeOnboarding userId={user.id} />}
    </div>
  );
}