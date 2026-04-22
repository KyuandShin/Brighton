'use client';

import React, { useState } from 'react';
import { Camera, Loader2, GraduationCap, BookOpen, Sparkles, FileText, Check } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import CameraCapture from '@/app/dashboard/_components/CameraCapture';

interface StepProps {
  data: any;
  set: React.Dispatch<React.SetStateAction<any>>;
}

function ProfilePhoto({ data, set }: StepProps) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'image');
      setPhotoUrl(url);
      set((prev: any) => ({ ...prev, photoUrl: url }));
    } catch {
      alert('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {showCamera && (
        <CameraCapture
          onCapture={async (imageData: string) => {
            setUploading(true);
            try {
              // Convert base64 to blob for upload without fetch
              const base64Data = imageData.split(',')[1];
              const byteString = atob(base64Data);
              const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: mimeString });
              
              const url = await uploadToCloudinary(blob, 'image');
              setPhotoUrl(url);
              set((prev: any) => ({ ...prev, photoUrl: url }));
            } catch (err) {
              console.error('Capture error:', err);
              alert('Photo capture failed. Please try again or upload a file.');
            } finally {
              setUploading(false);
            }
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary leading-relaxed">
        Tutors with a good profile photo receive 70% more booking requests.
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="w-40 h-40 rounded-full bg-[#f8f9fa] border-4 border-[#f1f3f5] flex items-center justify-center overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera size={48} className="text-[#adb5bd] opacity-30" />
          )}
        </div>

        <input type="file" accept="image/*" id="photo-upload" className="hidden" onChange={handlePhotoUpload} />
        <div className="flex gap-3">
          <label htmlFor="photo-upload" className="px-6 py-4 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-[#5c7cfa] transition-all">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : 'Upload Photo'}
          </label>
          <button 
            onClick={() => setShowCamera(true)}
            className="px-6 py-4 bg-[#f8f9fa] border-2 border-primary/20 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-2"
          >
            <Camera size={16} /> Take Photo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="p-4 bg-p-green/10 rounded-2xl border border-p-green/20">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#27ae60] mb-4">✅ DO</h4>
          <ul className="space-y-2 text-xs text-text-main">
            <li>• Face forward and look at camera</li>
            <li>• Use good lighting</li>
            <li>• Smile naturally</li>
            <li>• Use neutral background</li>
          </ul>
        </div>
        <div className="p-4 bg-[#fff5f5] rounded-2xl border border-[#ffc9c9]">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#e03131] mb-4">❌ DON'T</h4>
          <ul className="space-y-2 text-xs text-text-main">
            <li>• No sunglasses or hats</li>
            <li>• No group photos</li>
            <li>• No blurry images</li>
            <li>• No filters or edits</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProfileDescription({ data, set }: StepProps) {
  const sections = [
    { title: 'Introduce yourself', description: 'Share your teaching experience and passion for education', icon: GraduationCap, key: 'introduction' },
    { title: 'Teaching experience', description: 'Tell students about your background and teaching style', icon: BookOpen, key: 'experience' },
    { title: 'Motivate potential students', description: 'Explain what students will achieve by learning with you', icon: Sparkles, key: 'motivation' },
    { title: 'Write a catchy headline', description: 'Create a professional headline that stands out', icon: FileText, key: 'headline' },
  ];

  return (
    <div className="space-y-8">
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary leading-relaxed mb-8">
        Great descriptions increase your response rate by 3x. Take your time with this section.
      </div>

      {sections.map((section, idx) => {
        const Icon = section.icon;
        return (
          <div key={idx} className="p-6 bg-[#f8f9fa] rounded-3xl border border-[#f1f3f5]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black text-text-main">{idx + 1}. {section.title}</h3>
                <p className="text-[10px] text-[#adb5bd]">{section.description}</p>
              </div>
              <Check size={18} className="ml-auto text-[#27ae60]" />
            </div>
            <textarea
              placeholder="Start writing..."
              rows={3}
              className="w-full bg-white border border-[#f1f3f5] rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all resize-none placeholder:text-[#adb5bd]/40"
              value={data[section.key] || ''}
              onChange={(e) => set((prev: any) => ({ ...prev, [section.key]: e.target.value }))}
            />
          </div>
        );
      })}
    </div>
  );
}

export { ProfilePhoto, ProfileDescription };