'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PhoneOff, Video, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function ClassroomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [error, setError] = useState('');

  // Clean room name - Jitsi requires valid URL-safe names without spaces or special characters
  const roomName = `brighton-${id}`.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

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

  // ── Step 2: mount Jitsi once script + user are ready ────────────────
  useEffect(() => {
    if (!scriptReady || userLoading || !containerRef.current || apiRef.current) return;

    // The container MUST have an explicit pixel height for Jitsi to render.
    // We set it via inline style instead of relying on Tailwind flex.
    const containerEl = containerRef.current;
    const headerHeight = 56; // px — matches the h-14 header
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
          displayName: user?.name ?? user?.email ?? 'Participant',
          email: user?.email ?? '',
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
      
      // Handle Jitsi connection errors and failures
      apiRef.current.addEventListener('videoConferenceFailed', (error: any) => {
        console.error('Jitsi conference failed:', error);
        setError(`Connection failed: ${error?.error?.message || 'Could not connect to the meeting. Please try again.'}`);
      });
      
      apiRef.current.addEventListener('connectionFailed', (error: any) => {
        console.error('Jitsi connection failed:', error);
        setError('Could not establish connection to classroom. Check your internet and try again.');
      });
      
      apiRef.current.addEventListener('error', (error: any) => {
        console.error('Jitsi error:', error);
        setError(error?.message || 'An error occurred while joining the meeting.');
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
  }, [scriptReady, userLoading, roomName]);

  const handleLeave = () => {
    try { apiRef.current?.executeCommand('hangup'); } catch {}
    apiRef.current?.dispose();
    apiRef.current = null;
    router.push('/dashboard');
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

  return (
    // Fixed fullscreen — sits on top of the dashboard layout
    <div className="fixed inset-0 bg-[#0b111c] z-200 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-white/5 px-6 flex justify-between items-center bg-[#02040a]">
        <div className="flex items-center gap-3">
           <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md">
             <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
           </div>
          <span className="text-xs font-black uppercase tracking-widest text-white">Brighton Classroom</span>
          <span className="text-[10px] font-bold text-text-muted uppercase ml-2">Room: {roomName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
          </div>
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20"
          >
            <PhoneOff size={14} /> Leave
          </button>
        </div>
      </header>

      {/* Jitsi mounts here — height is set imperatively in the effect */}
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
        {/* This div gets explicit pixel height via JS in the effect */}
        <div ref={containerRef} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
