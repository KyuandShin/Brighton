'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PhoneOff, Video, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour
const WARNING_MINUTES = 5; // Show warning 5 minutes before end

export default function ClassroomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [error, setError] = useState('');
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showWarning, setShowWarning] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Clean room name - Jitsi requires valid URL-safe names without spaces or special characters
  const roomName = `brighton-${id}`.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

  // ── Fetch booking data to get session end time ─────────────────────
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${id}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const booking = await res.json();
          const startTime = new Date(booking.date);
          const endTime = new Date(startTime.getTime() + SESSION_DURATION_MS);
          setSessionEndTime(endTime);
        }
      } catch (e) {
        // If we can't fetch, we'll still let them in with a default 1-hour window from now
        setSessionEndTime(new Date(Date.now() + SESSION_DURATION_MS));
      }
    };
    fetchBooking();
  }, [id]);

  // ── Countdown timer ───────────────────────────────────────────────
  useEffect(() => {
    if (!sessionEndTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = sessionEndTime.getTime() - now;

      if (remaining <= 0) {
        setTimeRemaining('0:00');
        setSessionEnded(true);
        // Dispose Jitsi if it's still running
        try { apiRef.current?.executeCommand('hangup'); } catch {}
        try { apiRef.current?.dispose(); } catch {}
        apiRef.current = null;
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);

      // Show warning at WARNING_MINUTES before end
      if (remaining <= WARNING_MINUTES * 60 * 1000 && remaining > 0) {
        setShowWarning(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionEndTime]);

  // ── Step 1: load external_api.js ────────────────────────────────────
  useEffect(() => {
    if (window.JitsiMeetExternalAPI) {
      setScriptReady(true);
      return;
    }
    const existing = document.getElementById('jitsi-script');
    if (existing) {
      existing.addEventListener('load', () => setScriptReady(true));
      return;
    }
    const s = document.createElement('script');
    s.id = 'jitsi-script';
    s.src = 'https://meet.jit.si/external_api.js';
    s.async = true;
    s.onload = () => setScriptReady(true);
    s.onerror = () => setError('Could not load Jitsi. Check your internet connection.');
    document.head.appendChild(s);
  }, []);

  // ── Step 2: mount Jitsi once script is ready ────────────────────────
  useEffect(() => {
    if (!scriptReady || !containerRef.current || apiRef.current || sessionEnded) return;

    const containerEl = containerRef.current;
    const headerHeight = 56;
    containerEl.style.height = `${window.innerHeight - headerHeight}px`;

    const onResize = () => {
      containerEl.style.height = `${window.innerHeight - headerHeight}px`;
    };
    window.addEventListener('resize', onResize);

    try {
      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: containerEl,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: 'Participant',
          email: '',
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: true,
          disableDeepLinking: true,
          defaultLanguage: 'en',
          p2p: { 
            enabled: true,
            disableH264: true,
            preferH264: false
          },
          disableAudioLevels: true,
          enableNoAudioDetection: false,
          enableNoisyMicDetection: false,
          resolution: 720,
          constraints: {
            video: {
              height: {
                ideal: 720,
                max: 720,
                min: 180
              }
            }
          }
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_BACKGROUND: '#0b111c',
          MOBILE_APP_PROMO: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
        },
      });

      apiRef.current.addEventListener('videoConferenceJoined', () => setShowLoader(false));
      apiRef.current.addEventListener('readyToClose', () => router.push('/dashboard'));
      
      apiRef.current.addEventListener('videoConferenceFailed', (error: any) => {
        console.error('Jitsi conference failed:', error);
        setError(`Connection failed: ${error?.error?.message || 'Could not connect to the meeting. Please try again.'}`);
      });
      
      apiRef.current.addEventListener('connectionFailed', () => {
        setError('Could not establish connection to classroom. Check your internet and try again.');
      });

      // Fallback — hide loader after 8s regardless
      const t = setTimeout(() => setShowLoader(false), 8000);
      return () => {
        clearTimeout(t);
        window.removeEventListener('resize', onResize);
        if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
      };
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start classroom.');
    }
  }, [scriptReady, roomName, sessionEnded]);

  const completeAndRedirect = async (path: string) => {
    setIsLeaving(true);
    try { apiRef.current?.executeCommand('hangup'); } catch {}
    apiRef.current?.dispose();
    apiRef.current = null;

    // Mark booking as COMPLETED
    try {
      await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
        credentials: 'include',
      });
    } catch (e) {
      console.error('Failed to mark session complete:', e);
    }

    router.push(path);
  };

  const handleLeave = () => {
    // Role-based redirect:
    // Tutors → notes form
    // Students → summary/feedback page
    const isTutor = user?.role === 'TUTOR';
    completeAndRedirect(isTutor
      ? `/dashboard/sessions/${id}/notes`
      : `/dashboard/sessions/${id}/feedback`
    );
  };

  const handleGoToFeedback = () => {
    completeAndRedirect(`/dashboard/sessions/${id}/feedback`);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0b111c] z-200 flex items-center justify-center">
        <div className="bg-white rounded-[40px] p-12 max-w-md w-full mx-4 text-center space-y-6">
          <div className="w-16 h-16 bg-[#ffe3e3] rounded-3xl flex items-center justify-center mx-auto">
            <Video size={32} className="text-[#e03131]" />
          </div>
          <h2 className="text-xl font-black text-text-main">Could Not Load Classroom</h2>
          <p className="text-sm font-bold text-text-muted">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5c7cfa] transition-all">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div className="fixed inset-0 bg-[#0b111c] z-200 flex items-center justify-center">
        <div className="bg-white rounded-[40px] p-12 max-w-md w-full mx-4 text-center space-y-6">
          <div className="w-16 h-16 bg-p-mint rounded-3xl flex items-center justify-center mx-auto">
            <Clock size={32} className="text-teal-600" />
          </div>
          <h2 className="text-xl font-black text-text-main">Session Ended</h2>
          <p className="text-sm font-bold text-text-muted">
            Your 1-hour session has ended. You can rebook with your tutor for another session.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={handleGoToFeedback} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5c7cfa] transition-all">
              View Session Feedback
            </button>
            <button onClick={() => router.push('/dashboard')} className="w-full py-4 bg-surface border-2 border-border text-text-muted rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0b111c] z-200 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-white/5 px-6 flex justify-between items-center bg-[#02040a]">
        <div className="flex items-center gap-3">
           <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md">
             <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
           </div>
          <span className="text-xs font-black uppercase tracking-widest text-white">Brighton Classroom</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Countdown Timer */}
          {timeRemaining && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
              showWarning 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-white/5 text-white/60'
            }`}>
              <Clock size={12} />
              {timeRemaining}
              {showWarning && <AlertTriangle size={12} className="text-amber-400 animate-pulse" />}
            </div>
          )}
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
            showWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/10 text-red-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${showWarning ? 'bg-amber-400' : 'bg-red-500'} animate-pulse`} />
            {showWarning ? `${WARNING_MINUTES} min left` : 'Live'}
          </div>
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20"
          >
            <PhoneOff size={14} /> Leave
          </button>
        </div>
      </header>

      {/* Jitsi mounts here */}
      <div className="relative flex-1">
        {showLoader && (
          <div className="absolute inset-0 bg-[#0b111c] flex flex-col items-center justify-center z-10 gap-6 pointer-events-none">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
              <Loader2 size={32} className="text-primary animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-black uppercase tracking-widest text-white">Connecting to Classroom...</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Please allow camera and microphone access</p>
            </div>
          </div>
        )}

        {/* Warning overlay */}
        {showWarning && !sessionEnded && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-3 bg-amber-500/90 text-white rounded-2xl shadow-xl border border-amber-400/30 flex items-center gap-3 backdrop-blur-sm">
            <AlertTriangle size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Session ending in {WARNING_MINUTES} minutes — wrap up your discussion!
            </span>
          </div>
        )}

        <div ref={containerRef} style={{ width: '100%' }} />
      </div>
    </div>
  );
}