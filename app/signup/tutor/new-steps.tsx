'use client';

import React, { useState } from 'react';
import { Camera, Loader2, GraduationCap, BookOpen, Sparkles, FileText, Check, Upload, X } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import CameraCapture from '@/app/dashboard/_components/CameraCapture';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-8">
      {showCamera && (
        <CameraCapture
          onCapture={async (imageData: string) => {
            setUploading(true);
            try {
              const base64Data = imageData.split(',')[1];
              const byteString = atob(base64Data);
              const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
              const blob = new Blob([ab], { type: mimeString });
              const url = await uploadToCloudinary(blob, 'image');
              setPhotoUrl(url);
              set((prev: any) => ({ ...prev, photoUrl: url }));
            } catch {
              alert('Photo capture failed.');
            } finally { setUploading(false); }
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      <Alert className="border-primary/10 bg-primary/5">
        <Sparkles size={14} className="text-primary" />
        <AlertDescription className="text-[10px] font-black uppercase tracking-widest text-primary">
          Tutors with a good profile photo receive 70% more booking requests.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col items-center gap-6">
        <div className="w-40 h-40 rounded-full bg-surface-elevated border-4 border-border flex items-center justify-center overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera size={48} className="text-text-muted opacity-30" />
          )}
        </div>

        <input type="file" accept="image/*" id="photo-upload" className="hidden" onChange={handlePhotoUpload} />
        <div className="flex gap-3">
          <label htmlFor="photo-upload" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all hover:bg-primary/80">
            {uploading ? <Loader2 size={16} className="animate-spin mr-1" /> : <Upload size={16} className="mr-1" />} Upload Photo
          </label>
          <Button variant="outline" onClick={() => setShowCamera(true)}
            className="text-[10px] uppercase tracking-widest font-black gap-2">
            <Camera size={16} /> Take Photo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <Card className="border-p-green/30 bg-p-green/10">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 mb-4">✅ DO</p>
            <ul className="space-y-2 text-xs text-text-main">
              <li>• Face forward and look at camera</li>
              <li>• Use good lighting</li>
              <li>• Smile naturally</li>
              <li>• Use neutral background</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-4">❌ DON'T</p>
            <ul className="space-y-2 text-xs text-text-main">
              <li>• No sunglasses or hats</li>
              <li>• No group photos</li>
              <li>• No blurry images</li>
              <li>• No filters or edits</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileDescription({ data, set }: StepProps) {
  const sections = [
    { title: 'Introduce yourself',         description: 'Share your teaching experience and passion for education', icon: GraduationCap, key: 'introduction' },
    { title: 'Teaching experience',        description: 'Tell students about your background and teaching style',   icon: BookOpen,      key: 'experience'   },
    { title: 'Motivate potential students', description: 'Explain what students will achieve by learning with you',  icon: Sparkles,      key: 'motivation'   },
  ];

  return (
    <div className="space-y-8">
      <Alert className="border-primary/10 bg-primary/5">
        <Sparkles size={14} className="text-primary" />
        <AlertDescription className="text-[10px] font-black uppercase tracking-widest text-primary">
          Great descriptions increase your response rate by 3x. These sections combine into your full profile bio.
        </AlertDescription>
      </Alert>

      {sections.map((section, idx) => {
        const Icon = section.icon;
        return (
          <Card key={idx} className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-text-main">{idx + 1}. {section.title}</h3>
                      <p className="text-[10px] text-text-muted">{section.description}</p>
                    </div>
                    {data[section.key] && <Check size={18} className="text-teal-600 shrink-0" />}
                  </div>
                </div>
              </div>
              <textarea
                placeholder="Start writing..."
                rows={3}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all resize-none placeholder:text-text-muted/40"
                value={data[section.key] || ''}
                onChange={(e) => set((prev: any) => ({ ...prev, [section.key]: e.target.value }))}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { ProfilePhoto, ProfileDescription };