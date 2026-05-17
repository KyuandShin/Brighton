'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Star, Heart, Clock, BookOpen, GraduationCap, ChevronLeft, Calendar, CheckCircle, X, XCircle, Send, Sparkles, Video, Award, BadgeCheck, Shield, Users, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { MOCK_TUTORS } from '@/lib/mock-data';

// ── Types ────────────────────────────────────────────────────────────────
interface TutorData {
  dbId: string | null;
  userId: string | null;
  name: string;
  headline: string;
  bio: string;
  introVideoUrl: string | null;
  price: number;
  subjects: string[];
  rating: number | null;
  image: string;
  level: string;
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface TutorFromDB {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  introVideoUrl: string | null;
  pricingPerHour: number;
  subjects: string[];
  rating: number | null;
  image: string;
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
  userId: string;
}

// ── Day labels ──────────────────────────────────────────────────────────
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TutorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const router = useRouter();
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

    const [tutor, setTutor] = useState<TutorData | null>(null);
    const [imageError, setImageError] = useState(false);
  const [loadingTutor, setLoadingTutor] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Booking flow
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDayName, setSelectedDayName] = useState('');
  const [booking, setBooking] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoadingTutor(true);
    fetch('/api/tutors')
      .then((r) => r.json())
      .then((data: TutorFromDB[]) => {
        if (cancelled) return;
        const found = Array.isArray(data) ? data.find((t) => t.id === id) : null;
        if (found) {
          setTutor({
            dbId: found.id,
            userId: found.userId,
            name: found.name,
            headline: found.headline ?? 'Tutor',
            bio: found.bio ?? '',
            introVideoUrl: found.introVideoUrl ?? null,
            price: found.pricingPerHour,
            subjects: found.subjects,
            rating: found.rating,
            image: found.image || '',
            level: 'BOTH',
            availability: found.availability ?? [],
          });
          // Check if this tutor is favorited
          if (user?.id) {
            fetch('/api/favorites')
              .then((r) => r.json())
              .then((favs) => {
                if (!cancelled && Array.isArray(favs)) {
                  setIsFavorite(favs.some((f: any) => f.tutor.id === found.id));
                }
              })
              .catch(() => {});
          }
        } else if (!cancelled) {
          const mock = MOCK_TUTORS.find((t) => t.id === id);
          if (mock) setTutor({ dbId: null, userId: null, name: mock.name, headline: mock.headline, bio: mock.bio, introVideoUrl: null, price: mock.price, subjects: mock.subjects, rating: mock.rating, image: mock.image, level: mock.level, availability: [] });
        }
      })
      .catch(() => {
        if (!cancelled) {
          const mock = MOCK_TUTORS.find((t) => t.id === id);
          if (mock) setTutor({ dbId: null, userId: null, name: mock.name, headline: mock.headline, bio: mock.bio, introVideoUrl: null, price: mock.price, subjects: mock.subjects, rating: mock.rating, image: mock.image, level: mock.level, availability: [] });
        }
      })
      .finally(() => { if (!cancelled) setLoadingTutor(false); });

    return () => { cancelled = true; };
  }, [id, user?.id]);

  const toggleFavorite = async () => {
    if (!user?.id || !tutor?.dbId) return;
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, tutorId: tutor.dbId }),
    });
    const data = await res.json();
    setIsFavorite(data.saved);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Availability-aware date calculations
  const availableDays = tutor?.availability.map(a => a.dayOfWeek) ?? [];
  const next7Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const day = d.getDay();
    return {
      dateObj: d,
      dateStr: d.toISOString().split('T')[0],
      day,
      label: DAY_LABELS[day],
      dayName: DAY_FULL[day],
      num: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      available: availableDays.includes(day),
    };
  });

  const selectedSlots = selectedDate
    ? tutor?.availability
        .filter(a => a.dayOfWeek === next7Days.find(d => d.dateStr === selectedDate)?.day)
        .map(a => ({ start: a.startTime, end: a.endTime })) ?? []
    : [];

  const handleBook = async () => {
    if (!tutor?.dbId || !selectedDate || !selectedTime) return;
    setBooking(true);
    try {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorDbId: tutor.dbId, date: dateTime.toISOString() }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfirmedBookingId(data.id);
        setBookingConfirmed(true);
        setShowBooking(false);
      } else {
        const data = await res.json();
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setShowToast(true);
        toastTimer.current = setTimeout(() => setShowToast(false), 3000);
      }
    } catch {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setShowToast(true);
      toastTimer.current = setTimeout(() => setShowToast(false), 3000);
    } finally {
      setBooking(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/dashboard/classroom/' + confirmedBookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate hourly time slots from availability range + bookings
  const generateTimeSlots = (selectedDateStr: string) => {
    if (!tutor || !selectedDateStr) return [];
    const selectedDay = next7Days.find(d => d.dateStr === selectedDateStr)?.day;
    if (selectedDay === undefined) return [];

    // Get all availability slots for this day
    const daySlots = tutor.availability.filter(a => a.dayOfWeek === selectedDay);
    if (daySlots.length === 0) return [];

    // Get existing bookings for this date to exclude taken slots
    const existingBookings = bookingsForSlots.filter((b: any) => {
      const bDate = new Date(b.date);
      const bDateStr = bDate.toISOString().split('T')[0];
      return bDateStr === selectedDateStr && (b.status === 'CONFIRMED' || b.status === 'PENDING');
    });
    const takenHours = new Set(existingBookings.map(b => {
      const d = new Date(b.date);
      return `${d.getHours().toString().padStart(2, '0')}:00`;
    }));

    // Generate hourly slots 08:00 through endTime for each availability range
    const slots: { time: string; available: boolean }[] = [];
    for (const slot of daySlots) {
      const startHour = Math.max(8, parseInt(slot.startTime.split(':')[0]));
      const endHour = parseInt(slot.endTime.split(':')[0]);
      for (let h = startHour; h < endHour; h++) {
        const time = `${h.toString().padStart(2, '0')}:00`;
        if (!takenHours.has(time)) {
          slots.push({ time, available: true });
        }
      }
    }
    return slots;
  };

  // Track bookings for taken-slot calculation
  const [bookingsForSlots, setBookingsForSlots] = useState<any[]>([]);

  // Fetch existing bookings for this tutor to mark taken slots
  useEffect(() => {
    if (!tutor?.dbId) return;
    fetch('/api/bookings', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { 
        if (Array.isArray(data)) {
          // Filter to only this tutor's bookings
          setBookingsForSlots(data.filter((b: any) => b.tutor?.id === tutor.dbId));
        }
      })
      .catch(() => {});
  }, [tutor?.dbId]);

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const isStudent = user?.role === 'STUDENT';
  const isTutorRole = user?.role === 'TUTOR';
  const showBookingBtn = (isStudent || user?.role === 'ADMIN') && tutor?.dbId;
  const showMessageBtn = user && !isTutorRole && tutor?.userId && user.id !== tutor.userId;

  if (loadingTutor) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-[3px] border-border" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-text-muted text-xs font-semibold uppercase tracking-widest">Loading tutor profile...</p>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
          <GraduationCap size={28} className="text-primary" />
        </div>
        <h3 className="text-lg font-black text-text-main">Tutor Not Found</h3>
        <Link href="/dashboard/tutors" className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:underline">
          ← Browse Tutors
        </Link>
      </div>
    );
  }

  // ── Continue with existing render... ─────────────────────────────────

  const days: { dayOfWeek: number; startTime: string; endTime: string }[] = [];

  // Generate availability ranges from tutor availability or defaults
  for (let day = 0; day < 7; day++) {
    const availItem = tutor.availability.find(a => a.dayOfWeek === day);
    if (availItem) {
      days.push(availItem);
    }
  }

  const totalReviews = 0; // placeholder
  const image = tutor.image || '';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-p-rose border-2 border-rose-300 text-rose-800 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <XCircle size={15} />
            <span className="text-xs font-black uppercase tracking-widest">This time slot is no longer available</span>
            <button onClick={() => setShowToast(false)} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest">
        <ChevronLeft size={14} /> Back
      </button>

      {/* ── Profile Card ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border-2 border-border rounded-[40px] overflow-hidden"
      >
        {/* Banner */}
        <div className="h-28 md:h-36 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 relative">
          {/* Quick actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            {user && (
      <Link
        href={`/dashboard/messages?user=${tutor.userId || tutor.dbId || id}`}
                className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white transition-all shadow-sm"
                title="Send message"
              >
                <MessageSquare size={16} className="text-primary" />
              </Link>
            )}
            <button
              onClick={toggleFavorite}
              disabled={!user}
              className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white transition-all shadow-sm disabled:opacity-50"
            >
              <Heart size={16} className={isFavorite ? 'text-pink-500 fill-pink-500' : 'text-text-muted'} />
            </button>
          </div>
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-2xl border-[5px] border-surface shadow-lg overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-black">
              {image && !imageError ? (
                <Image src={image} alt={tutor.name} fill sizes="96px" className="object-cover" onError={() => setImageError(true)} />
              ) : (
                <span>{tutor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="pt-16 pb-8 px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-text-main">{tutor.name}</h2>
                <BadgeCheck size={20} className="text-blue-500 shrink-0" />
              </div>
              <p className="text-sm font-bold text-primary uppercase tracking-widest">{tutor.headline}</p>
            </div>
            <div className="flex items-center gap-4">
              {tutor.rating !== null && (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-p-yellow rounded-xl">
                  <Star size={14} fill="#fcc419" className="text-amber-500" />
                  <span className="text-sm font-black text-text-main">{tutor.rating.toFixed(1)}</span>
                  {totalReviews > 0 && (
                    <span className="text-[9px] font-bold text-text-muted">({totalReviews})</span>
                  )}
                </div>
              )}
              <div className="text-right">
                <p className="text-2xl font-black text-text-main">
                  ${tutor.price}<span className="text-xs font-bold text-text-muted">/hr</span>
                </p>
              </div>
            </div>
          </div>

          {/* Subjects */}
          {tutor.subjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tutor.subjects.map((s) => (
                <span key={s} className="px-3 py-1.5 bg-p-purple text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-border">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Message + Book action buttons */}
          <div className="flex gap-3 pt-2">
            {user && tutor.userId && user.id !== tutor.userId && (
              <Link
                href={`/dashboard/messages?user=${tutor.userId}`}
                className="flex items-center gap-2 px-6 py-3 border-2 border-border rounded-xl font-black text-[10px] uppercase tracking-widest text-text-muted hover:border-primary hover:text-primary transition-all"
              >
                <MessageSquare size={13} /> Message
              </Link>
            )}
            {showBookingBtn && !bookingConfirmed && (
              <button
                onClick={() => setShowBooking(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-strong transition-all shadow-lg shadow-primary/20"
              >
                <Calendar size={13} /> Book Session
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Bio Section ────────────────────────────────────────────────── */}
      {tutor.bio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border-2 border-border rounded-[32px] p-8 space-y-4"
        >
          <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
            <BookOpen size={15} className="text-primary" /> About Me
          </h3>
          <p className="text-sm font-medium text-text-muted leading-relaxed whitespace-pre-wrap">{tutor.bio}</p>
        </motion.div>
      )}

      {/* ── Video Intro Section ────────────────────────────────────────── */}
      {tutor.introVideoUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border-2 border-border rounded-[32px] p-8 space-y-4"
        >
          <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
            <Video size={15} className="text-primary" /> Introduction Video
          </h3>
          <div className="aspect-video rounded-2xl overflow-hidden bg-black">
            <video
              src={tutor.introVideoUrl}
              controls
              className="w-full h-full object-contain"
              poster={image}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </motion.div>
      )}

      {/* ── Availability Section ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border-2 border-border rounded-[32px] p-8 space-y-5"
      >
        <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
          <Clock size={15} className="text-primary" /> Availability
        </h3>
        {days.length === 0 ? (
          <p className="text-sm text-text-muted">Availability not set yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {days.map((d) => (
              <div key={d.dayOfWeek} className="p-4 bg-p-purple rounded-2xl border border-border space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">{DAY_FULL[d.dayOfWeek]}</p>
                <p className="text-xs font-bold text-text-muted">{d.startTime} - {d.endTime}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Booking Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBooking(false)}
              className="absolute inset-0 bg-text-main/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-[40px] shadow-2xl border border-p-purple overflow-hidden relative z-10"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black tracking-tight text-text-main">Book a Session</h3>
                  <button onClick={() => setShowBooking(false)} className="p-2 hover:bg-p-purple rounded-xl">
                    <X size={16} className="text-text-muted" />
                  </button>
                </div>
                <p className="text-sm text-text-muted">
                  Pick a date and time with <strong className="text-text-main">{tutor.name}</strong>
                </p>

                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Select Date</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {next7Days.map((d) => (
                      <button
                        key={d.dateStr}
                        onClick={() => { setSelectedDate(d.dateStr); setSelectedTime(''); setSelectedDayName(d.dayName); }}
                        disabled={!d.available}
                        className={`flex flex-col items-center px-4 py-3 rounded-2xl border-2 min-w-[72px] transition-all ${
                          selectedDate === d.dateStr
                            ? 'border-primary bg-primary/10 text-primary'
                            : d.available
                            ? 'border-border hover:border-primary/50 text-text-main'
                            : 'border-border/50 text-text-muted/40 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase">{d.label}</span>
                        <span className="text-lg font-black">{d.num}</span>
                        <span className="text-[8px] font-bold uppercase">{d.month}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slots — hourly from 08:00 */}
                {selectedDate && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                      Available Times for {selectedDayName}
                    </label>
                    {(() => {
                      const slots = generateTimeSlots(selectedDate);
                      if (slots.length === 0) {
                        return (
                          <p className="text-xs font-bold text-amber-600 bg-p-yellow p-3 rounded-xl">
                            No available time slots for this date (slots may be booked or outside available hours).
                          </p>
                        );
                      }
                      return (
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`px-5 py-2.5 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                                selectedTime === slot.time
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-border hover:border-primary/50 text-text-main'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <button
                  onClick={handleBook}
                  disabled={booking || !selectedDate || !selectedTime}
                  className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
                >
                  {booking ? 'Booking...' : <><Send size={14} /> Confirm Booking</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Booking Success Panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {bookingConfirmed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setBookingConfirmed(false); router.push('/dashboard/classes'); }}
              className="absolute inset-0 bg-text-main/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-surface rounded-[40px] shadow-2xl border border-p-mint overflow-hidden relative z-10 p-8 text-center space-y-5"
            >
              <div className="w-16 h-16 bg-p-mint rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-teal-600" />
              </div>
              <h3 className="text-xl font-black text-text-main">Session Booked! 🎉</h3>
              <p className="text-sm text-text-muted">Your session request has been sent to {tutor.name}. They'll confirm shortly.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push('/dashboard/classes')}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-strong transition-all"
                >
                  View My Classes
                </button>
                <button
                  onClick={() => setBookingConfirmed(false)}
                  className="w-full py-3.5 border-2 border-border rounded-xl font-black text-[10px] uppercase tracking-widest text-text-muted hover:border-primary hover:text-primary transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}