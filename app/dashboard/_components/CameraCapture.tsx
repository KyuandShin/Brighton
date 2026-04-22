'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCw, Download, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplay = () => {
          setIsReady(true);
          setLoading(false);
        };
      }
    } catch (err) {
      setError('Could not access camera. Please allow camera permissions.');
      setLoading(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');
    setCapturedImage(imageData);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-lg">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors"
        >
          <X size={28} />
        </button>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-2xl p-6 text-center">
            <p className="font-bold">{error}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold"
            >
              Try Again
            </button>
          </div>
        )}

        {!error && (
          <>
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-[4/3]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <RefreshCw size={40} className="text-white animate-spin" />
                </div>
              )}

              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="mt-6 flex items-center justify-center gap-6">
              {!capturedImage ? (
                <>
                  <button
                    onClick={switchCamera}
                    className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                  >
                    <RotateCw size={24} />
                  </button>

                  <button
                    onClick={capturePhoto}
                    disabled={!isReady}
                    className="p-6 bg-white rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    <Camera size={32} className="text-black" />
                  </button>

                  <div className="w-[56px]" />
                </>
              ) : (
                <>
                  <button
                    onClick={retakePhoto}
                    className="px-6 py-3 bg-white/10 rounded-2xl text-white font-bold hover:bg-white/20 transition-colors"
                  >
                    Retake
                  </button>

                  <button
                    onClick={confirmCapture}
                    className="px-6 py-3 bg-primary rounded-2xl text-white font-bold hover:bg-[#5c7cfa] transition-colors"
                  >
                    Use Photo
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}