'use client';

import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Star, Clock, Globe, ShieldCheck, Video, Calendar,
  ChevronRight, CheckCircle, Bell, AlertCircle, Copy, Check, Heart, Star as StarIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { MOCK_TUTORS } from '@/lib/mock-data';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Image from 'next/image';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

interface TutorFromDB {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  introVideoUrl: string | null;
  pricingPerHour: number;
  subjects: string[];
  rating: number | null;
  reviewCount: number;
  image: string | null;
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface NormalizedTutor {
  dbId: string | null;
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

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH] = startTime.split(':').map(Number);
  const [endH]   = endTime.split(':').map(Number);
  for (let h = startH; h < endH; h++) {
    const display = `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
    slots.push(display);
  }
  return slots;
}

// Returns the set of day-of-week indices (0=Sun…6=Sat) the tutor is available on
function getAvailableDaySet(availability: { dayOfWeek: number }[]): Set<number> {
  // DB stores: 0=Mon … 6=Sun  →  convert to JS Date.getDay() (0=Sun … 6=Sat)
  const jsDay = (dbDay: number) => (dbDay + 1) % 7;
  return new Set(availability.map((a) => jsDay(a.dayOfWeek)));
}

// Returns the minimum selectable date string (today or next available weekday)
function getMinSelectableDate(availability: { dayOfWeek: number }[]): string {
  const availableJS = getAvailableDaySet(availability);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Look ahead up to 60 days for the next available day
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (availableJS.has(d.getDay())) {
      return d.toISOString().split('T')[0];
    }
  }
  return today.toISOString().split('T')[0];
}

// Returns true if the given date string (YYYY-MM-DD) is an available day for the tutor
function isDateAvailable(dateStr: string, availability: { dayOfWeek: number }[]): boolean {
  if (!dateStr || availability.length === 0) return false;
  const date = new Date(dateStr + 'T00:00:00');
  const jsDay = date.getDay(); // 0=Sun…6=Sat
  const availableJS = getAvailableDaySet(availability);
  return availableJS.has(jsDay);
}

export default function TutorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [tutor, setTutor] = useState<NormalizedTutor | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetch('/api/tutors')
      .then((r) => r.json())
      .then((data: TutorFromDB[]) => {
        const found = Array.isArray(data) ? data.find((t) => t.id === id) : null;
        if (found) {
          setTutor({
            dbId: found.id,
            name: found.name,
            headline: found.headline ?? 'Tutor',
            bio: found.bio ?? '',
            introVideoUrl: found.introVideoUrl ?? null,
            price: found.pricingPerHour,
            subjects: found.subjects,
            rating: found.rating,
            image: found.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(found.name)}`,
            level: 'BOTH',
            availability: found.availability ?? [],
          });
          // Check if this tutor is favorited — uses session-based auth
          if (user?.id) {
            fetch('/api/favorites')
              .then((r) => r.json())
              .then((favs) => {
                if (Array.isArray(favs)) {
                  setIsFavorite(favs.some((f: any) => f.tutor.id === found.id));
                }
              })
              .catch(() => {});
          }
        } else {
          const mock = MOCK_TUTORS.find((t) => t.id === id);
          if (mock) setTutor({ dbId: null, name: mock.name, headline: mock.headline, bio: mock.bio, introVideoUrl: null, price: mock.price, subjects: mock.subjects, rating: mock.rating, image: mock.image, level: mock.level, availability: [] });
        }
      })
      .catch(() => {
        const mock = MOCK_TUTORS.find((t) => t.id === id);
        if (mock) setTutor({ dbId: null, name: mock.name, headline: mock.headline, bio: mock.bio, introVideoUrl: null, price: mock.price, subjects: mock.subjects, rating: mock.rating, image: mock.image, level: mock.level, availability: [] });
      })
      .finally(() => setLoadingTutor(false));
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
  const hasAvailability = (tutor?.availability ?? []).length > 0;
  const minDate = hasAvailability
    ? getMinSelectableDate(tutor!.availability)
    : new Date().toISOString().split('T')[0];

  // Map selected date to tutor's DB availability slot
  // DB dayOfWeek: 0=Mon…6=Sun; JS Date.getDay(): 0=Sun…6=Sat
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
  const jsDay = selectedDateObj?.getDay() ?? -1; // 0=Sun…6=Sat
  // Convert JS day to DB day: 0=Sun→6=Sun in DB = (jsDay + 6) % 7
  const dbDay = jsDay >= 0 ? (jsDay + 6) % 7 : -1;
  const availabilityForDay = tutor?.availability.find((a) => a.dayOfWeek === dbDay);

  // Only show time slots if the selected date is actually an available day
  const dateIsAvailable = selectedDate && isDateAvailable(selectedDate, tutor?.availability ?? []);
  const timeSlots = dateIsAvailable && availabilityForDay
    ? generateTimeSlots(availabilityForDay.startTime, availabilityForDay.endTime)
    : [];

  // Human-readable available days for display
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DB_TO_JS  = (d: number) => (d + 1) % 7;
  const availableDayNames = (tutor?.availability ?? [])
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((a) => DAY_NAMES[DB_TO_JS(a.dayOfWeek)]);

  // Validate booking: also block unavailable dates at submit time
  const handleBooking = async () => {
    if (!selectedDate) { setBookingError('Please select a date.'); return; }
    if (hasAvailability && !dateIsAvailable) {
      setBookingError('This tutor is not available on the selected date.');
      return;
    }
    if (!selectedTime) { setBookingError('Please select a time slot.'); return; }
    if (!user) { setBookingError('You must be logged in to book.'); return; }

    setBooking(true);
    setBookingError('');

    try {
      const [timePart, meridiem] = selectedTime.split(' ');
      let [hours] = timePart.split(':').map(Number);
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      const bookingDate = new Date(selectedDate + 'T00:00:00');
      bookingDate.setHours(hours, 0, 0, 0);

      if (tutor?.dbId) {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tutorDbId: tutor.dbId, date: bookingDate.toISOString() }),
        });
        const data = await res.json();
        if (!res.ok) { setBookingError(data.error || 'Booking failed.'); return; }
        setConfirmedBookingId(data.id);
      } else {
        setConfirmedBookingId('demo-' + Math.random().toString(36).substring(2, 10));
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: any) {
      setBookingError(err.message ?? 'Unexpected error.');
    } finally {
      setBooking(false);
    }
  };

  if (loadingTutor) return <div className="py-20 text-center font-black uppercase tracking-widest text-text-muted">Loading Profile...</div>;
  if (!tutor) return <div className="py-20 text-center font-black uppercase tracking-widest text-text-muted">Tutor not found.</div>;

  // minDate is already computed above

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Success toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-100 bg-p-green border-2 border-white shadow-2xl px-8 py-4 rounded-3xl flex items-center gap-4 pointer-events-none"
          >
            <div className="w-10 h-10 bg-surface rounded-2xl flex items-center justify-center text-[#27ae60]">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#2b8a3e]">Request Sent!</p>
              <p className="text-[10px] font-bold text-[#2b8a3e]/70">Waiting for tutor to confirm.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Profile */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-surface border-2 border-border rounded-[48px] overflow-hidden shadow-sm">
            {tutor.introVideoUrl ? (
              <div className="aspect-video bg-[#f8f9fa]">
                <ReactPlayer url={tutor.introVideoUrl} width="100%" height="100%" controls />
              </div>
            ) : (
              <div className="aspect-video bg-linear-to-br from-p-blue to-[#e5dbff] flex items-center justify-center relative">
                <Image
                  src={tutor.image}
                  alt={tutor.name}
                  width={160}
                  height={160}
                  className="rounded-[40px] shadow-2xl border-4 border-white object-cover"
                />
              </div>
            )}

            <div className="p-12 space-y-8">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    <ShieldCheck size={14} /> Verified Expert
                  </div>
                  <h1 className="text-4xl font-black text-text-main tracking-tight">{tutor.name}</h1>
                  <p className="text-lg font-bold text-text-muted uppercase tracking-tighter">{tutor.headline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFavorite}
                    className={`p-3 rounded-2xl border-2 transition-all ${
                      isFavorite
                        ? 'bg-p-pink border-pink-300 text-pink-500'
                        : 'bg-[#f8f9fa] border-[#f1f3f5] text-text-muted hover:border-pink-300 hover:text-pink-400'
                    }`}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <div className="bg-p-yellow px-4 py-2 rounded-2xl border-2 border-white shadow-sm flex items-center gap-2 text-[#f08c00]">
                    <Star size={18} fill="currentColor" />
                    {tutor.rating !== null ? (
                      <span className="font-black text-lg">{tutor.rating.toFixed(1)}</span>
                    ) : (
                      <span className="font-black text-[10px] uppercase tracking-widest">New</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-border">
                <Stat icon={Clock} label="Experience" val="Verified" />
                <Stat icon={Globe} label="Language" val="English" />
                <Stat icon={Calendar} label="Level" val={tutor.level} />
                <Stat icon={Video} label="Session" val="Jitsi Meet" />
              </div>

              {tutor.subjects.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black tracking-tight uppercase">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects.map((s) => (
                      <span key={s} className="px-4 py-2 bg-surface-elevated rounded-xl text-[10px] font-black uppercase tracking-widest text-primary border border-border">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {tutor.bio && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black tracking-tight uppercase">About</h3>
                  <p className="text-lg text-text-muted leading-relaxed font-medium italic">&ldquo;{tutor.bio}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Booking Card */}
        <div className="lg:col-span-4">
          <div className="bg-surface border-2 border-border rounded-[48px] p-8 sticky top-32 shadow-xl space-y-6 overflow-hidden">

            {/* Rate header */}
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Hourly Rate</p>
              <p className="text-3xl font-black text-text-main">${tutor.price}<span className="text-sm text-text-muted opacity-40">/hr</span></p>
            </div>

            {/* Available days chips */}
            {hasAvailability && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Available days</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableDayNames.map((day) => (
                    <span key={day} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/20">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!confirmedBookingId ? (
              <div className="space-y-4">

                {/* Date picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={minDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDate(val);
                      setSelectedTime('');
                      setBookingError('');
                      // Warn immediately if unavailable
                      if (val && hasAvailability && !isDateAvailable(val, tutor.availability)) {
                        setBookingError('Tutor is not available on this day. Please pick a highlighted day.');
                      }
                    }}
                    className="w-full bg-surface-elevated border-2 border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                  {selectedDate && !dateIsAvailable && hasAvailability && (
                    <p className="text-[9px] font-black text-rose-500 ml-1 uppercase tracking-wider">
                      ⚠ Not available — pick from: {availableDayNames.join(', ')}
                    </p>
                  )}
                </div>

                {/* Time slots — only shown when date is valid + available */}
                {selectedDate && dateIsAvailable && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Select Time</label>
                      {availabilityForDay && (
                        <span className="text-[9px] text-text-muted font-bold">
                          {availabilityForDay.startTime}–{availabilityForDay.endTime}
                        </span>
                      )}
                    </div>
                    {timeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => { setSelectedTime(slot); setBookingError(''); }}
                            className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                              selectedTime === slot
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                : 'bg-surface-elevated border-border text-text-muted hover:border-primary hover:text-primary'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[9px] font-black uppercase tracking-wider text-amber-700">
                        No time slots configured for this day.
                      </div>
                    )}
                  </div>
                )}

                {/* No availability at all fallback */}
                {!hasAvailability && selectedDate && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Select Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => { setSelectedTime(slot); setBookingError(''); }}
                          className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            selectedTime === slot
                              ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                              : 'bg-surface-elevated border-border text-text-muted hover:border-primary hover:text-primary'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {bookingError && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" /> {bookingError}
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={booking || (hasAvailability && !!selectedDate && !dateIsAvailable)}
                  className="w-full bg-primary text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40"
                >
                  {booking
                    ? <><Bell className="animate-bounce" size={18} /> Confirming...</>
                    : <>Confirm Booking <ChevronRight size={18} /></>}
                </button>

                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/15 rounded-2xl">
                  <Video size={14} className="text-primary shrink-0" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary leading-relaxed">
                    Powered by Jitsi Meet — real video, mic &amp; screen share
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                <div className="bg-p-mint/40 p-6 rounded-[28px] space-y-3 border-2 border-teal-200">
                  <div className="flex items-center gap-3 text-teal-700">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <CheckCircle size={20} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">Request Sent!</p>
                      <p className="text-[10px] font-bold text-teal-600/70 uppercase">{selectedDate} · {selectedTime}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl flex items-center gap-3 border-2 border-amber-200 bg-p-yellow">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-amber-700 uppercase tracking-tight">Waiting for Confirmation</p>
                    <p className="text-[9px] font-bold text-amber-600/70">
                      The tutor needs to accept your request. You'll be notified once confirmed.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { setConfirmedBookingId(''); setSelectedDate(''); setSelectedTime(''); setBookingError(''); }}
                  className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors"
                >
                  Book Another Session
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, val }: { icon: any; label: string; val: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-surface-elevated rounded-xl flex items-center justify-center text-primary">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
        <p className="text-xs font-black text-text-main">{val}</p>
      </div>
    </div>
  );
}