'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Video, User, X,
  BookOpen, Sparkles, Clock,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

interface Booking {
  id: string;
  date: string;
  meetLink: string | null;
  status: string;
  tutor?: { headline: string | null; user: { name: string | null } };
  student?: { user: { name: string | null } };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetch('/api/bookings')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBookings(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const getBookingsForDate = (date: Date) =>
    bookings.filter((b) => new Date(b.date).toDateString() === date.toDateString());

  const selectedDayBookings = selectedDay ? getBookingsForDate(selectedDay) : [];
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isSelected = (d: Date) => selectedDay ? d.toDateString() === selectedDay.toDateString() : false;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          Your <span className="text-primary">Calendar</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          All your scheduled sessions at a glance.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white border-2 border-border rounded-[40px] p-8 space-y-6">
          <div className="flex justify-between items-center">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-3 bg-p-purple rounded-2xl hover:bg-primary hover:text-white transition-all text-text-muted">
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-xl font-black tracking-tight text-text-main">{MONTHS[month]} {year}</h3>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-3 bg-p-purple rounded-2xl hover:bg-primary hover:text-white transition-all text-text-muted">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-text-muted py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              const dayBookings = getBookingsForDate(date);
              const hasBookings = dayBookings.length > 0;
              const todayDay = isToday(date);
              const sel = isSelected(date);

              return (
                <motion.button
                  key={date.toISOString()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(date)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all text-sm font-black
                    ${sel ? 'bg-primary text-white shadow-lg shadow-primary/30' : ''}
                    ${todayDay && !sel ? 'bg-primary/10 text-primary border-2 border-primary/30' : ''}
                    ${!todayDay && !sel ? 'hover:bg-surface-elevated text-text-main' : ''}
                  `}
                >
                  {date.getDate()}
                  {hasBookings && (
                    <div className="absolute bottom-1.5 flex gap-0.5">
                      {dayBookings.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${sel ? 'bg-white' : 'bg-primary'}`} />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-white border-2 border-border rounded-[40px] p-8 space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Selected Day</p>
            <h3 className="text-xl font-black text-text-main tracking-tight">
              {selectedDay
                ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Click a date'}
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-24 bg-surface-elevated rounded-2xl animate-pulse" />)}
            </div>
          ) : !selectedDay ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <BookOpen size={32} className="text-text-muted/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Select a day</p>
            </div>
          ) : selectedDayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <Sparkles size={32} className="text-text-muted/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No sessions this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDayBookings.map((booking) => {
                const otherPerson = user?.role === 'TUTOR'
                  ? booking.student?.user?.name
                  : booking.tutor?.user?.name;

                return (
                  <motion.div
                    key={booking.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedBooking(booking)}
                    className="p-5 bg-p-purple/30 rounded-2xl border-2 border-border hover:border-primary/40 cursor-pointer space-y-3 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        <Clock size={12} />
                        {new Date(booking.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        booking.status === 'CONFIRMED' ? 'bg-p-green text-[#2b8a3e]' : 'bg-p-yellow text-[#f08c00]'
                      }`}>
                        {booking.status}
                      </div>
                    </div>
                    <p className="text-sm font-black text-text-main line-clamp-1">
                      {booking.tutor?.headline ?? 'Tutoring Session'}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-tight">
                      <User size={12} /> {otherPerson ?? 'Unknown'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-text-main/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-white rounded-[40px] shadow-[0_40px_100px_rgba(147,51,234,0.12)] border border-border overflow-hidden relative z-10"
            >
              <div className="h-28 bg-p-blue relative">
                <button onClick={() => setSelectedBooking(null)} className="absolute top-5 right-5 p-2 bg-white/50 hover:bg-white rounded-full transition-all">
                  <X size={18} />
                </button>
                <div className="absolute -bottom-7 left-8 w-14 h-14 bg-white rounded-2xl shadow-md border-4 border-white flex items-center justify-center">
                  <Video size={24} className="text-[#1971c2]" />
                </div>
              </div>

              <div className="p-8 pt-10 space-y-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1">Confirmed Session</p>
                  <h3 className="text-xl font-black text-text-main">
                    {selectedBooking.tutor?.headline ?? 'Tutoring Session'}
                  </h3>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
                    {user?.role === 'TUTOR' ? selectedBooking.student?.user?.name : selectedBooking.tutor?.user?.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-surface-elevated rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Date</p>
                    <p className="text-xs font-black text-text-main">
                      {new Date(selectedBooking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="p-4 bg-surface-elevated rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Time</p>
                    <p className="text-xs font-black text-text-main">
                      {new Date(selectedBooking.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {selectedBooking.meetLink ? (
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      router.push(selectedBooking.meetLink!);
                    }}
                    className="w-full bg-primary text-white p-4 rounded-2xl flex items-center justify-between group hover:bg-[#5c7cfa] transition-all shadow-lg shadow-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white/20 rounded-xl"><Video size={16} /></div>
                      <span className="font-black text-[10px] uppercase tracking-widest">Enter Classroom</span>
                    </div>
                    <ChevronRight size={16} className="opacity-60 group-hover:opacity-100" />
                  </button>
                ) : (
                  <div className="p-4 bg-surface-elevated rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Classroom not yet available
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
