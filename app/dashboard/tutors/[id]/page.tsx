'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  Star, Heart, Clock, BookOpen, GraduationCap, ChevronLeft, Calendar,
  CheckCircle, XCircle, Send, Sparkles, Video, Award, BadgeCheck, Shield,
  Users, MessageSquare, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MOCK_TUTORS } from '@/lib/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TutorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const router = useRouter();

  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loadingTutor, setLoadingTutor] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDayName, setSelectedDayName] = useState('');
  const [booking, setBooking] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [bookingsForSlots, setBookingsForSlots] = useState<any[]>([]);
  const [bookingError, setBookingError] = useState('');

  // Fetch tutor on mount (only depends on id, not user to prevent double reload)
  useEffect(() => {
    let cancelled = false;
    setLoadingTutor(true);
    fetch(`/api/tutors/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Tutor not found');
        return r.json();
      })
      .then((found: TutorFromDB & { userId: string }) => {
        if (cancelled) return;
        setTutor({
          dbId: found.id, userId: found.userId,
          name: found.name, headline: found.headline ?? 'Tutor',
          bio: found.bio ?? '', introVideoUrl: found.introVideoUrl ?? null,
          price: found.pricingPerHour, subjects: found.subjects,
          rating: found.rating, image: found.image || '',
          level: 'BOTH', availability: found.availability ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) {
          const mock = MOCK_TUTORS.find((t) => t.id === id);
          if (mock) setTutor({ dbId: null, userId: null, name: mock.name, headline: mock.headline, bio: mock.bio, introVideoUrl: null, price: mock.price, subjects: mock.subjects, rating: mock.rating, image: mock.image, level: mock.level, availability: [] });
        }
      })
      .finally(() => { if (!cancelled) setLoadingTutor(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Fetch favorites separately (only when user is ready, avoids re-fetching tutor)
  useEffect(() => {
    if (!user?.id || !tutor?.dbId) return;
    let cancelled = false;
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((favs) => { if (!cancelled && Array.isArray(favs)) setIsFavorite(favs.some((f: any) => f.tutor.id === tutor.dbId)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, tutor?.dbId]);

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
  const availableDays = tutor?.availability.map(a => a.dayOfWeek) ?? [];

  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const day = d.getDay();
    return {
      dateObj: d, dateStr: d.toISOString().split('T')[0], day,
      label: DAY_LABELS[day], dayName: DAY_FULL[day],
      num: d.getDate(), month: d.toLocaleDateString('en-US', { month: 'short' }),
      available: availableDays.includes(day),
    };
  });

  const generateTimeSlots = (selectedDateStr: string) => {
    if (!tutor || !selectedDateStr) return [];
    const selectedDay = next14Days.find(d => d.dateStr === selectedDateStr)?.day;
    if (selectedDay === undefined) return [];
    const daySlots = tutor.availability.filter(a => a.dayOfWeek === selectedDay);
    if (daySlots.length === 0) return [];
    const existingBookings = bookingsForSlots.filter((b: any) => {
      const bDate = new Date(b.date);
      return bDate.toISOString().split('T')[0] === selectedDateStr && (b.status === 'CONFIRMED' || b.status === 'PENDING');
    });
    const takenHours = new Set(existingBookings.map(b => {
      const d = new Date(b.date);
      return `${d.getHours().toString().padStart(2, '0')}:00`;
    }));
    const slots: { time: string; available: boolean }[] = [];
    for (const slot of daySlots) {
      const startHour = Math.max(8, parseInt(slot.startTime.split(':')[0]));
      const endHour = parseInt(slot.endTime.split(':')[0]);
      for (let h = startHour; h < endHour; h++) {
        const time = `${h.toString().padStart(2, '0')}:00`;
        if (!takenHours.has(time)) slots.push({ time, available: true });
      }
    }
    return slots;
  };

  useEffect(() => {
    if (!tutor?.dbId) return;
    fetch('/api/bookings', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBookingsForSlots(data.filter((b: any) => b.tutor?.id === tutor.dbId)); })
      .catch(() => {});
  }, [tutor?.dbId]);

  const handleBook = async () => {
    if (!tutor?.dbId || !selectedDate || !selectedTime) return;
    setBooking(true);
    setBookingError('');
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
        setBookingError(data.error || 'This slot is no longer available.');
      }
    } catch {
      setBookingError('Something went wrong. Please try again.');
    } finally { setBooking(false); }
  };

  const isStudent = user?.role === 'STUDENT';
  const showBookingBtn = (isStudent || user?.role === 'ADMIN') && !!tutor?.dbId;

  if (loadingTutor) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-64 rounded-[32px]" />
        <Skeleton className="h-32 rounded-[32px]" />
        <Skeleton className="h-32 rounded-[32px]" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-p-blue rounded-3xl flex items-center justify-center mx-auto">
          <GraduationCap size={28} className="text-primary" />
        </div>
        <h3 className="text-lg font-black text-text-main">Tutor Not Found</h3>
        <Link href="/dashboard/tutors">
          <Button variant="outline" className="text-[10px] uppercase tracking-widest font-black">← Browse Tutors</Button>
        </Link>
      </div>
    );
  }

  const image = tutor.image || '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-[10px] font-black uppercase tracking-widest gap-1">
        <ChevronLeft size={14} /> Back
      </Button>

      {/* ── Profile Hero Card ────────────────────────────────── */}
      <Card className="border-border/60 overflow-hidden">
        <div className="h-28 md:h-36 bg-gradient-to-r from-blue-400 via-primary to-indigo-400 relative">
          <div className="absolute top-4 right-4 flex gap-2">
            {user && tutor.userId && user.id !== tutor.userId && (
              <Link href={`/dashboard/messages?user=${tutor.userId}`}
                className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white transition-all shadow-sm">
                <MessageSquare size={16} className="text-primary" />
              </Link>
            )}
            <button onClick={toggleFavorite} disabled={!user}
              className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white transition-all shadow-sm disabled:opacity-50">
              <Heart size={16} className={isFavorite ? 'text-pink-500 fill-pink-500' : 'text-text-muted'} />
            </button>
          </div>
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl border-[4px] border-surface shadow-lg overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-black">
              {image && !imageError ? (
                <Image src={image} alt={tutor.name} fill sizes="80px" className="object-cover" onError={() => setImageError(true)} />
              ) : (
                <span>{tutor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
              )}
            </div>
          </div>
        </div>

        <CardContent className="pt-12 pb-6 px-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-text-main">{tutor.name}</h2>
                <BadgeCheck size={18} className="text-blue-500 shrink-0" />
              </div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">{tutor.headline}</p>
            </div>
            <div className="flex items-center gap-3">
              {tutor.rating !== null && (
                <Badge variant="secondary" className="gap-1 px-3 py-1.5">
                  <Star size={12} fill="#f59e0b" className="text-amber-500" />
                  <span className="text-xs font-black">{tutor.rating.toFixed(1)}</span>
                </Badge>
              )}
              <div className="text-right">
                <p className="text-xl font-black text-text-main">${tutor.price}<span className="text-xs font-bold text-text-muted">/hr</span></p>
              </div>
            </div>
          </div>

          {/* Subjects */}
          {tutor.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tutor.subjects.map((s) => (
                <Badge key={s} variant="outline" className="text-[9px] font-black uppercase tracking-widest">{s}</Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {showBookingBtn && !bookingConfirmed && (
              <Button onClick={() => setShowBooking(true)} className="text-[10px] uppercase tracking-widest font-black gap-1.5">
                <Calendar size={14} /> Book Session
              </Button>
            )}
            {user && tutor.userId && user.id !== tutor.userId && (
              <Link href={`/dashboard/messages?user=${tutor.userId}`}>
                <Button variant="outline" size="sm" className="text-[10px] uppercase tracking-widest font-black gap-1.5">
                  <MessageSquare size={14} /> Message
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Bio Section ──────────────────────────────────────── */}
      {tutor.bio && (
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-text-main">
              <BookOpen size={15} className="text-primary" /> About Me
            </h3>
            <p className="text-sm font-medium text-text-muted leading-relaxed whitespace-pre-wrap">{tutor.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Video Section ────────────────────────────────────── */}
      {tutor.introVideoUrl && (
        <Card className="border-border/60 overflow-hidden">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-text-main">
              <Video size={15} className="text-primary" /> Introduction Video
            </h3>
            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
              <video src={tutor.introVideoUrl} controls className="w-full h-full object-contain" poster={image || undefined}>
                Your browser does not support the video tag.
              </video>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Availability Section ─────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-text-main">
            <Clock size={15} className="text-primary" /> Availability
          </h3>
          {tutor.availability.length === 0 ? (
            <p className="text-sm text-text-muted">Availability not set yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {tutor.availability.map((d) => (
                <div key={d.dayOfWeek} className="p-3 bg-p-blue/30 rounded-xl border border-border space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">{DAY_FULL[d.dayOfWeek]}</p>
                  <p className="text-[11px] font-bold text-text-muted">{d.startTime} - {d.endTime}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Booking Dialog ───────────────────────────────────── */}
      <Dialog open={showBooking} onOpenChange={(open) => { if (!open) { setShowBooking(false); setBookingError(''); } }}>
        <DialogContent className="sm:max-w-lg rounded-[32px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Book a Session</DialogTitle>
            <DialogDescription className="text-xs font-bold text-text-muted">
              Pick a date and time with <span className="font-black text-text-main">{tutor.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Date Picker */}
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Select Date</p>
              <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                {next14Days.map((d) => (
                  <button key={d.dateStr} onClick={() => { setSelectedDate(d.dateStr); setSelectedTime(''); setSelectedDayName(d.dayName); }}
                    disabled={!d.available}
                    className={cn(
                      "flex flex-col items-center px-2.5 py-2 rounded-xl border-2 min-w-[58px] transition-all shrink-0",
                      selectedDate === d.dateStr ? 'border-primary bg-primary/10 text-primary' :
                      d.available ? 'border-border hover:border-primary/50 text-text-main' :
                      'border-border/40 text-text-muted/30 cursor-not-allowed'
                    )}>
                    <span className="text-[8px] font-black uppercase">{d.label}</span>
                    <span className="text-sm font-black">{d.num}</span>
                    <span className="text-[7px] font-bold uppercase">{d.month}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Available Times for {selectedDayName}
                </p>
                {(() => {
                  const slots = generateTimeSlots(selectedDate);
                  if (slots.length === 0) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-amber-700">No available slots — all booked or outside available hours.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => (
                        <button key={slot.time} onClick={() => setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={cn(
                            "px-4 py-2.5 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                            selectedTime === slot.time ? 'border-primary bg-primary text-white' :
                            'border-border hover:border-primary/50 text-text-main'
                          )}>
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-red-700">{bookingError}</p>
              </div>
            )}

            <Button onClick={handleBook} disabled={booking || !selectedDate || !selectedTime}
              className="w-full text-[10px] uppercase tracking-widest font-black gap-2">
              {booking ? 'Booking...' : <><Send size={14} /> Confirm Booking</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Booking Success Dialog ───────────────────────────── */}
      <Dialog open={bookingConfirmed} onOpenChange={(open) => { if (!open) { setBookingConfirmed(false); router.push('/dashboard/classes'); } }}>
        <DialogContent className="sm:max-w-sm rounded-[32px]">
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-p-green rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-teal-600" />
            </div>
            <DialogTitle className="text-xl font-black">Session Booked! 🎉</DialogTitle>
            <p className="text-sm text-text-muted">Your request has been sent to {tutor.name}. They'll confirm shortly.</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => router.push('/dashboard/classes')} className="text-[10px] uppercase tracking-widest font-black">
                View My Classes
              </Button>
              <Button variant="outline" onClick={() => setBookingConfirmed(false)} className="text-[10px] uppercase tracking-widest font-black">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}