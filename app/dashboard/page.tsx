'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, Video, User, 
  ChevronRight, Sparkles, X, MapPin, BookOpen, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';

interface ScheduleItem {
    id: string;
    subject: string;
    teacher: string;
    time: string;
    date: string;
    meetLink: string;
    topic: string;
    color: string;
    iconColor: string;
}

const MOCK_SCHEDULE: ScheduleItem[] = [
    {
        id: '1',
        subject: 'Mathematics',
        teacher: 'Dr. Aris Smith',
        time: '10:00 AM - 11:00 AM',
        date: 'Today, April 20',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        topic: 'Introduction to Quadratic Equations',
        color: 'bg-[#d0ebff]',
        iconColor: 'text-[#1971c2]'
    },
    {
        id: '2',
        subject: 'General Science',
        teacher: 'Prof. Maria Clara',
        time: '2:00 PM - 3:00 PM',
        date: 'Today, April 20',
        meetLink: 'https://meet.google.com/xyz-pqrs-uvw',
        topic: 'The Solar System and Beyond',
        color: 'bg-[#d3f9d8]',
        iconColor: 'text-[#2b8a3e]'
    },
    {
        id: '3',
        subject: 'English Grammar',
        teacher: 'Ms. Lea Salonga',
        time: '9:00 AM - 10:00 AM',
        date: 'Tomorrow, April 21',
        meetLink: 'https://meet.google.com/jkl-mno-pqr',
        topic: 'Advanced Sentence Structures',
        color: 'bg-[#ffd6e8]',
        iconColor: 'text-[#d6336c]'
    }
];

export default function DashboardPage() {
  const [selectedClass, setSelectedSelectedClass] = useState<ScheduleItem | null>(null);

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-[#2c3e50]">Welcome Home, <span className="text-[#748ffc]">Sean!</span> 👋</h2>
          <p className="text-[#7f8c8d] font-bold text-xs uppercase tracking-widest">You have 2 sessions scheduled for today.</p>
        </div>
        <Link href="/dashboard/test" className="px-6 py-3 bg-[#fff3bf] text-[#f08c00] rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-[#fff3bf]/40 hover:scale-105 transition-all flex items-center gap-2">
          <Sparkles size={14} /> Retake AI Assessment
        </Link>
      </header>

      {/* Schedule Part */}
      <section className="space-y-8">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
                <div className="w-8 h-8 bg-[#d0ebff] rounded-lg flex items-center justify-center">
                    <CalendarIcon size={16} className="text-[#1971c2]" />
                </div>
                Your Academic Schedule
            </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_SCHEDULE.map((item) => (
                <motion.div 
                    key={item.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedSelectedClass(item)}
                    className={`${item.color} p-8 rounded-[40px] shadow-sm border-2 border-white cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden`}
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BookOpen size={80} />
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="px-4 py-1.5 bg-white/50 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest">
                                {item.subject}
                            </div>
                            <div className={`p-2 bg-white rounded-xl ${item.iconColor}`}>
                                <Video size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-2xl font-black tracking-tight text-[#2c3e50]">{item.topic}</h4>
                            <div className="flex items-center gap-2 text-[#2c3e50]/60 font-bold text-xs uppercase tracking-tight">
                                <User size={14} /> {item.teacher}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-black/5 flex justify-between items-center">
                            <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-[#2c3e50]/40">
                                <Clock size={14} /> {item.time.split(' - ')[0]}
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-[#748ffc] group-hover:text-white transition-all">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </section>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedSelectedClass(null)}
                className="absolute inset-0 bg-[#2c3e50]/20 backdrop-blur-md" 
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-white rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-[#f1f3f5] overflow-hidden relative z-10"
            >
                <div className={`h-32 ${selectedClass.color} relative`}>
                    <button 
                        onClick={() => setSelectedSelectedClass(null)}
                        className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all text-[#2c3e50]"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute -bottom-8 left-10 w-16 h-16 bg-white rounded-3xl shadow-lg border-4 border-white flex items-center justify-center">
                         <BookOpen size={32} className={selectedClass.iconColor} />
                    </div>
                </div>

                <div className="p-10 pt-12 space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#748ffc]">
                            <Sparkles size={12} /> Confirmed Session
                        </div>
                        <h3 className="text-3xl font-black tracking-tight text-[#2c3e50]">{selectedClass.topic}</h3>
                        <p className="text-sm font-bold text-[#7f8c8d] uppercase tracking-widest">{selectedClass.subject} • {selectedClass.teacher}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-[#f8f9fa] rounded-3xl space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd]">Time Slot</p>
                            <p className="text-xs font-black text-[#2c3e50]">{selectedClass.time}</p>
                        </div>
                        <div className="p-5 bg-[#f8f9fa] rounded-3xl space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd]">Current Date</p>
                            <p className="text-xs font-black text-[#2c3e50]">{selectedClass.date}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#7f8c8d] ml-1">Learning Link</label>
                        <a 
                            href={selectedClass.meetLink} 
                            target="_blank" 
                            className="w-full bg-[#748ffc] text-white p-5 rounded-3xl flex items-center justify-between group hover:bg-[#5c7cfa] transition-all shadow-xl shadow-[#748ffc]/20"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Video size={20} />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest">Join Google Meet</span>
                            </div>
                            <ExternalLink size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                    </div>
                </div>

                <div className="px-10 py-6 bg-[#f8f9fa] border-t border-[#f1f3f5] text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Brighton Academic Framework v2.0</p>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
