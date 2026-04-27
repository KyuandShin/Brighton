'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Video, ChevronRight, ChevronLeft, GraduationCap, DollarSign,
  BookOpen, Clock, Check, Sparkles, AlertCircle, Loader2,
  Plus, Trash2, FileText, Camera, StopCircle, RefreshCw, UploadCloud
} from 'lucide-react';
import Link from 'next/link';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { ProfilePhoto, ProfileDescription } from './new-steps';

const STEPS = ['General Details', 'Profile Photo', 'Certifications', 'Education', 'Profile Description', 'Video Intro', 'Availability', 'Pricing'];
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CertificationData {
  subject: string;
  certificate: string;
  issuedBy: string;
  certificateUrl?: string;
}

interface TutorFormData {
  name: string;
  email: string;
  password: string;
  university: string;
  degree: string;
  videoUrl: string;
  bio: string;
  headline: string;
  price: number;
  availability: number[];
  certifications: CertificationData[];
}

export default function TutorSignupFlow() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <TutorSignupContent />
    </Suspense>
  );
}

function TutorSignupContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<TutorFormData>({
    name: '', 
    email: '', 
    password: '', 
    university: '', 
    degree: '',
    videoUrl: '', 
    bio: '', 
    headline: '', 
    price: 20, 
    availability: [],
    certifications: [],
  });

  useEffect(() => {
    // Read credentials from sessionStorage (set by signup page)
    const draft = sessionStorage.getItem('tutor_draft');
    if (draft) {
      try {
        const { email, password, name } = JSON.parse(draft);
        setFormData(prev => ({ ...prev, email: email || '', password: password || '', name: name || '' }));
        sessionStorage.removeItem('tutor_draft');
      } catch {
        // ignore malformed draft
      }
    }
  }, []);

  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  // ── Per-step validation ──────────────────────────────────────────────
  const validate = (): string => {
    switch (currentStep) {
      case 0:
        if (!formData.name.trim())        return 'Full name is required.';
        if (!formData.headline.trim())    return 'A professional headline is required.';
        if (formData.bio.trim().length < 20) return 'Bio must be at least 20 characters.';
        return '';
      case 1: return ''; // Profile Photo
      case 2: return ''; // Certifications are optional
      case 3: return ''; // Education is optional
      case 4: return ''; // Profile Description
      case 5: return ''; // Video intro optional
      case 6:
        if (formData.availability.length === 0) return 'Please select at least one available day.';
        return '';
      case 7: return ''; // Pricing always valid
      default: return '';
    }
  };

  const nextStep = async () => {
    const err = validate();
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    
    // Check email uniqueness at Step 0
    if (currentStep === 0) {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await res.json();
        if (data.exists) {
          setError('An account with this email already exists.');
          setLoading(false);
          return;
        }
      } catch {
        // ignore check errors
      } finally {
        setLoading(false);
      }
    }

    setError('');
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => { setError(''); setCurrentStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/signup/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed. Please try again.'); return; }
      setSubmitted(true);
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-[40px] border border-border shadow-[0_30px_80px_rgba(147,51,234,0.1)] p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-p-mint rounded-3xl flex items-center justify-center mx-auto">
            <Check size={40} className="text-teal-700" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black text-text-main tracking-tight">Application Submitted!</h2>
          <p className="text-sm font-bold text-text-muted uppercase tracking-wider leading-relaxed">
            Your tutor profile is under review. You&apos;ll receive an email once approved by our team.
          </p>
          <div className="p-4 bg-p-yellow rounded-2xl border border-[#fcc419]/20 flex items-start gap-3 text-left">
            <AlertCircle size={16} className="text-[#f08c00] mt-0.5 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#f08c00] leading-relaxed">
              You cannot log in until your account is verified by an administrator.
            </p>
          </div>
          <Link href="/login" className="block w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-accent-strong transition-all">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Main flow ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col items-center py-12 px-4 relative">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-p-blue blur-[140px] rounded-full opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-p-pink blur-[140px] rounded-full opacity-40 pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 mb-12 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-sm font-black tracking-[0.3em] uppercase text-text-main">Brighton</span>
        </Link>

        {/* Progress bar */}
        <div className="flex justify-between mb-16 relative px-4">
          <div className="absolute top-5 left-0 w-full h-1 bg-border z-0 rounded-full" />
          <div
            className="absolute top-5 left-0 h-1 bg-primary z-0 rounded-full transition-all duration-700"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((step, idx) => (
            <div key={step} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 shadow-sm ${
                idx < currentStep  ? 'bg-primary border-primary text-white' :
                idx === currentStep ? 'bg-white border-primary text-primary' :
                                      'bg-white border-border text-text-muted'
              }`}>
                {idx < currentStep ? <Check size={18} strokeWidth={4} /> : <span className="text-xs font-black">{idx + 1}</span>}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest hidden lg:block ${idx <= currentStep ? 'text-primary' : 'text-text-muted'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-[40px] shadow-[0_30px_100px_rgba(147,51,234,0.07)] p-12 md:p-16 border border-border">
          <div className="mb-12 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-p-green text-[#27ae60] rounded-full text-[8px] font-black uppercase tracking-widest">
              <Sparkles size={10} /> Step {currentStep + 1} of {STEPS.length}
            </div>
            <h2 className="text-3xl font-black text-text-main tracking-tight">{STEPS[currentStep]}</h2>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Tutor Verification Framework</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-8 p-4 bg-[#fff5f5] border border-[#ffc9c9] rounded-2xl text-[#e03131] text-[10px] font-black uppercase tracking-widest flex items-start gap-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Step content */}
          <div className="min-h-75">
            {currentStep === 0 && <GeneralDetails data={formData} set={setFormData} />}
            {currentStep === 1 && <ProfilePhoto data={formData} set={setFormData} />}
            {currentStep === 2 && <CertificationsStep data={formData} set={setFormData} />}
            {currentStep === 3 && <Education      data={formData} set={setFormData} />}
            {currentStep === 4 && <ProfileDescription data={formData} set={setFormData} />}
            {currentStep === 5 && <VideoIntro     data={formData} set={setFormData} />}
            {currentStep === 6 && <AvailabilitySelector data={formData} set={setFormData} />}
            {currentStep === 7 && <PricingStep    data={formData} set={setFormData} />}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-16 pt-10 border-t border-border">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-text-muted hover:bg-surface-elevated transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} /> Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={loading}
                className="flex items-center gap-3 px-10 py-4 bg-primary text-white font-black rounded-xl hover:bg-accent-strong transition-all shadow-xl shadow-primary/20 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Continue'} 
                {!loading && <ChevronRight size={16} />}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-3 px-10 py-4 bg-[#27ae60] text-white font-black rounded-xl hover:bg-[#2b8a3e] transition-all shadow-xl shadow-[#27ae60]/20 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
                {!loading && <Check size={16} />}
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-12 text-[9px] font-black uppercase tracking-[0.4em] opacity-20">
          Brighton Verification Engine • 2026.V1
        </p>
      </div>
    </div>
  );
}

// ── Step components ──────────────────────────────────────────────────────────

interface StepProps {
  data: TutorFormData;
  set: React.Dispatch<React.SetStateAction<TutorFormData>>;
}

function GeneralDetails({ data, set }: StepProps) {
  const [aiGenerating, setAiGenerating] = useState(false);

  const generateBio = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const firstName = data.name.split(' ')[0] || 'Tutor';
      
      const bios = [
        `Hi! I'm ${firstName}, a passionate and experienced educator dedicated to helping students reach their full potential. I specialize in creating engaging, personalized lessons that adapt to each student's unique learning style and goals. With a focus on building confidence and making learning enjoyable, I provide clear explanations, practical examples, and constructive feedback to ensure real progress. Let's work together to achieve your learning objectives!`,
        
        `Hello! My name is ${firstName} and I love helping students discover their potential. I believe that every student can succeed with the right guidance and support. My teaching approach is patient, encouraging, and focused on understanding each student's individual needs. I create a comfortable learning environment where questions are welcome, mistakes are seen as opportunities to grow, and progress is celebrated.`,
        
        `Greetings! I'm ${firstName}, an enthusiastic educator with a passion for teaching. My goal is to make learning not just effective, but also enjoyable. I use real-world examples, interactive methods, and personalized strategies to help students grasp concepts thoroughly. Whether you're a beginner or looking to advance your skills, I will support you every step of the way on your learning journey.`
      ];
      
      const randomBio = bios[Math.floor(Math.random() * bios.length)];
      set((d) => ({ ...d, bio: randomBio }));
      setAiGenerating(false);
    }, 1500);
  };

  const generateHeadline = () => {
    const patterns = [
      `${data.name.split(' ')[0]} | Experienced & Patient Tutor`,
      `Dedicated Tutor Specializing in Personalized Learning`,
      `Passionate Educator | Results-Driven Instruction`,
      `${data.name.split(' ')[0]} | Making Learning Enjoyable & Effective`,
      `Patient Tutor Committed to Your Success`
    ];
    set((d) => ({ ...d, headline: patterns[Math.floor(Math.random() * patterns.length)] }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Field label="Full Name"           value={data.name}     onChange={(v) => set((d) => ({ ...d, name: v }))}     placeholder="Your legal name"                        icon={GraduationCap} />
      
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Professional Headline</label>
          <button 
            onClick={generateHeadline}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all"
          >
            <Sparkles size={12} /> AI Generate
          </button>
        </div>
        <Field 
          label="" 
          value={data.headline} 
          onChange={(v) => set((d) => ({ ...d, headline: v }))} 
          placeholder="e.g. Expert HS Physics Tutor" 
        />
      </div>

      <div className="md:col-span-2 flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Short Bio <span className="text-[#adb5bd] font-normal normal-case">(min. 20 characters)</span></label>
          <button 
            onClick={generateBio}
            disabled={aiGenerating}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {aiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {aiGenerating ? 'Generating...' : 'AI Generate'}
          </button>
        </div>
        <textarea
          value={data.bio}
          onChange={(e) => set((d) => ({ ...d, bio: e.target.value }))}
          placeholder="Tell students about yourself, your teaching style and experience..."
          rows={4}
          className="w-full bg-[#f8f9fa] border border-[#f1f3f5] rounded-2xl px-6 py-4 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all resize-none placeholder:text-[#adb5bd]/40"
        />
        <div className="flex justify-between">
          <p className={`text-[10px] font-bold ml-1 ${data.bio.length < 20 ? 'text-[#adb5bd]' : 'text-[#27ae60]'}`}>
            {data.bio.length} / 20 min
          </p>
          <p className="text-[10px] font-bold text-[#adb5bd]">
            ✨ Tip: Click "AI Generate" to automatically create a professional bio
          </p>
        </div>
      </div>
    </div>
  );
}

function Education({ data, set }: StepProps) {
  return (
    <div className="space-y-8">
      <Field label="University / Institution" value={data.university} onChange={(v) => set((d) => ({ ...d, university: v }))} placeholder="e.g. University of the Philippines" icon={BookOpen} />
      <Field label="Degree & Specialization"  value={data.degree}     onChange={(v) => set((d) => ({ ...d, degree: v }))}     placeholder="e.g. BS Mathematics"              icon={GraduationCap} />
    </div>
  );
}

function VideoIntro({ data, set }: StepProps) {
  return (
    <div className="space-y-8">
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary leading-relaxed">
        Tutors with video introductions receive 85% more student interest. Record one now or paste a link.
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Option 1: Record Inside App</label>
          <VideoRecorder onUpload={(url) => set(d => ({ ...d, videoUrl: url }))} />
        </div>

        <div className="space-y-6">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Option 2: Paste Link</label>
          <Field
            label="Video Link (YouTube / Vimeo)"
            value={data.videoUrl}
            onChange={(v) => set((d) => ({ ...d, videoUrl: v }))}
            placeholder="https://youtube.com/watch?v=..."
            icon={Video}
          />
          {data.videoUrl && (
            <div className="aspect-video bg-[#f8f9fa] rounded-[28px] border-2 border-[#f1f3f5] flex flex-col items-center justify-center text-center p-8">
              <Video size={40} className="mb-4 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Video link saved</p>
              <p className="text-xs text-[#adb5bd] mt-1 break-all">{data.videoUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CertificationsStep({ data, set }: StepProps) {
  const addCert = () => {
    set(d => ({
      ...d,
      certifications: [...d.certifications, { subject: '', certificate: '', issuedBy: '', certificateUrl: '' }]
    }));
  };

  const removeCert = (idx: number) => {
    set(d => ({
      ...d,
      certifications: d.certifications.filter((_, i) => i !== idx)
    }));
  };

  const updateCert = (idx: number, field: keyof CertificationData, val: string) => {
    set(d => {
      const updated = [...d.certifications];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...d, certifications: updated };
    });
  };

  const handleFileUpload = async (idx: number, file: File) => {
    try {
      const url = await uploadToCloudinary(file, 'raw');
      updateCert(idx, 'certificateUrl', url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">List your professional certifications</p>
        <button
          onClick={addCert}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all"
        >
          <Plus size={14} /> Add Certification
        </button>
      </div>

      <div className="space-y-6">
        {data.certifications.map((cert, idx) => (
          <div key={idx} className="p-8 bg-[#f8f9fa] rounded-4xl border border-[#f1f3f5] space-y-6 relative group">
            <button
              onClick={() => removeCert(idx)}
              className="absolute top-6 right-6 p-2 text-[#adb5bd] hover:text-[#fa5252] transition-colors"
            >
              <Trash2 size={18} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Certification Name"
                value={cert.certificate}
                onChange={(v) => updateCert(idx, 'certificate', v)}
                placeholder="e.g. TEFL Certificate"
              />
              <Field
                label="Issued By"
                value={cert.issuedBy}
                onChange={(v) => updateCert(idx, 'issuedBy', v)}
                placeholder="e.g. University of Cambridge"
              />
              <Field
                label="Subject"
                value={cert.subject}
                onChange={(v) => updateCert(idx, 'subject', v)}
                placeholder="e.g. English Language"
              />
              
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Verification PDF</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(idx, e.target.files[0])}
                    className="hidden"
                    id={`cert-file-${idx}`}
                  />
                  <label
                    htmlFor={`cert-file-${idx}`}
                    className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                      cert.certificateUrl
                        ? 'bg-p-green/30 border-[#27ae60] text-[#27ae60]'
                        : 'bg-white border-[#f1f3f5] text-[#adb5bd] hover:border-primary hover:text-primary'
                    }`}
                  >
                    {cert.certificateUrl ? (
                      <><Check size={16} /> File Uploaded</>
                    ) : (
                      <><UploadCloud size={16} /> Upload PDF</>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}

        {data.certifications.length === 0 && (
          <div className="py-20 text-center bg-[#f8f9fa] rounded-[40px] border-2 border-dashed border-[#f1f3f5]">
            <FileText size={40} className="mx-auto text-[#adb5bd] mb-4 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#adb5bd]">No certifications added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoRecorder({ onUpload }: { onUpload: (url: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const liveVideoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let timer: any;
    if (recording && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && recording) {
      stopRecording();
    }
    return () => clearInterval(timer);
  }, [recording, timeLeft]);

  const startRecording = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      const mr = new MediaRecorder(s);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
      setTimeLeft(120);
    } catch (err) {
      alert('Camera access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    stream?.getTracks().forEach(t => t.stop());
    setRecording(false);
    setStream(null);
  };

  const handleUpload = async () => {
    if (!videoBlob) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(videoBlob, 'video');
      onUpload(url);
      alert('Video saved successfully!');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <style jsx global>{`
        .mirror { transform: scaleX(-1); }
      `}</style>
      <div className="aspect-video bg-text-main rounded-[28px] overflow-hidden relative border-4 border-white shadow-xl">
        {recording ? (
          <video
            autoPlay
            muted
            className="w-full h-full object-cover mirror"
            ref={(v) => {
              liveVideoRef.current = v;
              if (v && stream) v.srcObject = stream;
            }}
          />
        ) : previewUrl ? (
          <video src={previewUrl} controls className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
            <Camera size={48} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Camera Standby</p>
          </div>
        )}

        {recording && (
          <div className="absolute top-6 right-6 flex items-center gap-3 px-4 py-2 bg-red-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!recording && !previewUrl && (
          <button onClick={startRecording} className="flex-1 py-4 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
            <Camera size={14} /> Start Recording
          </button>
        )}
        {recording && (
          <button onClick={stopRecording} className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
            <StopCircle size={14} /> Stop
          </button>
        )}
        {previewUrl && !recording && (
          <>
            <button onClick={startRecording} className="flex-1 py-4 bg-[#f1f3f5] text-text-muted rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
              <RefreshCw size={14} /> Redo
            </button>
            <button onClick={handleUpload} disabled={uploading} className="flex-2 py-4 bg-[#27ae60] text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
              {uploading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
              {uploading ? 'Uploading...' : 'Save Recording'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AvailabilitySelector({ data, set }: StepProps) {
  const toggleDay = (idx: number) => {
    set((d) => {
      const updated = d.availability.includes(idx)
        ? d.availability.filter((x) => x !== idx)
        : [...d.availability, idx];
      return { ...d, availability: updated };
    });
  };

  return (
    <div className="space-y-8">
      <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Select your available days (required — pick at least one):</p>
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
        {DAYS.map((day, idx) => {
          const isSelected = data.availability.includes(idx);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`py-5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border-2 ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-[#f8f9fa] border-[#f1f3f5] text-[#adb5bd] hover:border-primary hover:text-primary'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      {data.availability.length > 0 && (
        <p className="text-[10px] font-black uppercase tracking-widest text-[#27ae60]">
          ✓ {data.availability.length} day{data.availability.length > 1 ? 's' : ''} selected
        </p>
      )}
      <div className="p-5 bg-[#f8f9fa] rounded-2xl border border-[#f1f3f5] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-muted">
        <Clock size={16} className="text-primary shrink-0" />
        Default hours: 09:00 – 17:00 &nbsp;(customizable after approval)
      </div>
    </div>
  );
}

function PricingStep({ data, set }: StepProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-10">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Hourly Rate (USD)</p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-4xl font-black text-[#f1f3f5]">$</span>
          <input
            type="number"
            value={data.price}
            min={5}
            max={500}
            onChange={(e) => set((d) => ({ ...d, price: parseInt(e.target.value) || 0 }))}
            className="w-40 text-7xl font-black text-primary bg-transparent border-none focus:outline-none text-center tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-widest">per hour</p>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-6 py-3 rounded-full">
        <DollarSign size={14} /> Recommended: $15 – $30 / hour for new tutors
      </div>
      <div className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#f1f3f5] text-center space-y-1 max-w-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Review your application</p>
        <p className="text-xs font-bold text-text-main">Once you submit, our team will review your profile within 1–3 business days.</p>
      </div>
    </div>
  );
}

// ── Shared input component ───────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; icon?: any;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">{label}</label>
      <div className="relative group">
        {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors pointer-events-none" size={16} />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-surface-elevated border border-border rounded-2xl ${Icon ? 'pl-14' : 'px-6'} py-5 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/40`}
        />
      </div>
    </div>
  );
}
