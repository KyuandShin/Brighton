'use client';

import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Star, Clock, Globe, ShieldCheck, Video, Calendar,
  ChevronRight, CheckCircle, Bell, AlertCircle, Copy, Check,
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
  rating: number;
  image: string;
  level: string;
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH] = startTime.split(':').map(Number);
  const [endH] = endTime.split(':').map(Number);
  for (let h = startH; h < endH; h++) {
    slots.push(`${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`);
  }
  return slots;
}

export default function TutorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [tutor, setTutor] = useState<NormalizedTutor | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(true);

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
            rating: found.rating ?? 5.0,
            image: found.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(found.name)}`,
            level: 'BOTH',
            availability: found.availability ?? [],
          });
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
  }, [id]);

  const today = new Date();
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
  const dayOfWeek = selectedDateObj ? selectedDateObj.getDay() : -1;
  const availabilityForDay = tutor?.availability.find((a) => a.dayOfWeek === dayOfWeek);
  const timeSlots = availabilityForDay
    ? generateTimeSlots(availabilityForDay.startTime, availabilityForDay.endTime)
    : ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];

  const handleBooking = async () => {
    if (!selectedDate) { setBookingError('Please select a date.'); return; }
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
        // Mock tutor — use a fake ID for demo
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

  const classroomPath = confirmedBookingId ? `/dashboard/classroom/${confirmedBookingId}` : '';
  const fullRoomUrl = confirmedBookingId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/classroom/${confirmedBookingId}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullRoomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loadingTutor) return <div className="py-20 text-center font-black uppercase tracking-widest text-[#adb5bd]">Loading Profile...</div>;
  if (!tutor) return <div className="py-20 text-center font-black uppercase tracking-widest text-[#adb5bd]">Tutor not found.</div>;

  const minDate = today.toISOString().split('T')[0];

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
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#27ae60]">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#2b8a3e]">Session Booked!</p>
              <p className="text-[10px] font-bold text-[#2b8a3e]/70">Your Jitsi classroom room is ready.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Profile */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white border-2 border-[#f1f3f5] rounded-[48px] overflow-hidden shadow-sm">
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
                <div className="bg-p-yellow px-4 py-2 rounded-2xl border-2 border-white shadow-sm flex items-center gap-2 text-[#f08c00]">
                  <Star size={18} fill="currentColor" />
                  <span className="font-black text-lg">{tutor.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-[#f1f3f5]">
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
                      <span key={s} className="px-4 py-2 bg-[#f8f9fa] rounded-xl text-[10px] font-black uppercase tracking-widest text-primary border border-[#f1f3f5]">{s}</span>
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
          <div className="bg-white border-2 border-[#f1f3f5] rounded-[48px] p-10 sticky top-32 shadow-xl space-y-8 overflow-hidden">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Hourly Rate</p>
              <p className="text-3xl font-black text-text-main">${tutor.price}<span className="text-sm opacity-20">/hr</span></p>
            </div>

            {!confirmedBookingId ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={minDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                    className="w-full bg-[#f8f9fa] border-2 border-[#f1f3f5] rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {selectedDate && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Select Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            selectedTime === slot
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'bg-[#f8f9fa] border-[#f1f3f5] text-text-muted hover:border-primary hover:text-primary'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {bookingError && (
                  <div className="flex items-center gap-2 p-3 bg-[#fff5f5] border border-[#ffc9c9] rounded-2xl text-[#e03131] text-[10px] font-black uppercase tracking-widest">
                    <AlertCircle size={14} className="shrink-0" /> {bookingError}
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="w-full bg-primary text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {booking
                    ? <><Bell className="animate-bounce" size={18} /> Confirming...</>
                    : <>Confirm Booking <ChevronRight size={18} /></>}
                </button>

                <div className="flex items-center gap-2 p-3 bg-[#f0f4ff] border border-primary/20 rounded-2xl">
                  <Video size={14} className="text-primary shrink-0" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary leading-relaxed">
                    Powered by Jitsi Meet — real video, mic & screen share
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                <div className="bg-p-green p-6 rounded-[28px] space-y-4 border-2 border-white">
                  <div className="flex items-center gap-3 text-[#27ae60]">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight text-[#2b8a3e]">Booking Confirmed</p>
                      <p className="text-[10px] font-bold text-[#2b8a3e]/60 uppercase">{selectedDate} · {selectedTime}</p>
                    </div>
                  </div>
                </div>

                {/* Room info */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">
                    Jitsi Room ID
                  </label>
                  <div className="flex items-center gap-2 bg-[#f8f9fa] border-2 border-[#f1f3f5] rounded-2xl px-4 py-3">
                    <span className="text-[10px] font-mono text-text-main flex-1 truncate">
                      brighton-{confirmedBookingId}
                    </span>
                    <button
                      onClick={copyLink}
                      className="shrink-0 p-1.5 bg-white rounded-lg border border-border hover:bg-primary hover:text-white hover:border-primary transition-all"
                      title="Copy room link"
                    >
                      {copied ? <Check size={14} className="text-[#27ae60]" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[9px] text-[#adb5bd] font-bold uppercase tracking-widest ml-1">
                    Share this link with your tutor to join the same room
                  </p>
                </div>

                <button
                  onClick={() => router.push(classroomPath)}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5c7cfa] transition-all shadow-xl shadow-primary/20"
                >
                  <Video size={16} /> Enter Classroom Now
                </button>

                <button
                  onClick={() => { 
                    setConfirmedBookingId(''); 
                    setSelectedDate(''); 
                    setSelectedTime('');
                  }}
                  className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-[#adb5bd] hover:text-text-main transition-colors"
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
      <div className="w-10 h-10 bg-[#f8f9fa] rounded-xl flex items-center justify-center text-primary">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd]">{label}</p>
        <p className="text-xs font-black text-text-main">{val}</p>
      </div>
    </div>
  );
}
