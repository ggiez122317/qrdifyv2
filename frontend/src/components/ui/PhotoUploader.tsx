'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface PhotoUploaderProps {
  onCapture: (base64: string) => void;
  currentPhoto?: string | null;
}

export function PhotoUploader({ onCapture, currentPhoto }: PhotoUploaderProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Aspect ratio based on ID Card overlap design: 3:4 (135x180)
  const TARGET_WIDTH = 300;
  const TARGET_HEIGHT = 400;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setStream(mediaStream);
      setCapturedImage(null);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 50);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow camera permissions or upload a file instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const videoRatio = video.videoWidth / video.videoHeight;
    const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

    let sWidth = video.videoWidth;
    let sHeight = video.videoHeight;
    let sx = 0;
    let sy = 0;

    if (videoRatio > targetRatio) {
      sWidth = video.videoHeight * targetRatio;
      sx = (video.videoWidth - sWidth) / 2;
    } else {
      sHeight = video.videoWidth / targetRatio;
      sy = (video.videoHeight - sHeight) / 2;
    }

    context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    
    const base64Image = canvas.toDataURL('image/png');
    setCapturedImage(base64Image);
    onCapture(base64Image);
    stopCamera();
  }, [stream, onCapture]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;

        const imgRatio = img.width / img.height;
        const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        context.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        
        const base64Image = canvas.toDataURL('image/png');
        setCapturedImage(base64Image);
        onCapture(base64Image);
        stopCamera();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const previewImage = capturedImage || getImageUrl(currentPhoto);
  const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23eef2ff'/%3E%3Ccircle cx='100' cy='82' r='34' fill='%23c7d2fe'/%3E%3Cellipse cx='100' cy='160' rx='54' ry='38' fill='%23c7d2fe'/%3E%3Ctext x='100' y='116' text-anchor='middle' font-family='Arial,sans-serif' font-size='13' fill='%2394a3b8'%3EPhoto%3C/text%3E%3C/svg%3E`;
  const displayImage = previewImage || placeholderImage;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 mb-2">
        <label className="text-[13px] font-semibold text-slate-700">Upload from device</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload} 
          className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-slate-200 file:text-sm file:font-medium file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start max-w-3xl">
        {/* Left Side: Webcam Video */}
        <div className="flex-1 w-full">
          <label className="text-[13px] font-semibold text-slate-700 block mb-3">Webcam</label>
          <div className="w-full aspect-[4/3] bg-white rounded-xl overflow-hidden relative border border-slate-200 shadow-sm flex items-center justify-center">
            {stream ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Responsive Crop overlay relative to 4/3 aspect ratio */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[50%] aspect-[3/4] border-2 border-dashed border-white/70 rounded-[10%] shadow-[0_0_0_999px_rgba(0,0,0,0.4)]"></div>
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 opacity-50 text-slate-300" />
                <span className="text-xs">Camera off</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Controls and Preview */}
        <div className="w-[110px] shrink-0 flex flex-col gap-2 mt-7">
          {/* Thumbnail preview */}
          <div className="w-full aspect-[3/4] rounded-xl border border-slate-200 overflow-hidden relative mb-2 shadow-sm bg-slate-50" title="Photo positioning preview">
            <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-[10px] border-[1.5px] border-dashed border-green-800/35 rounded-[10%] pointer-events-none"></div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={startCamera}
            className="w-full text-[13px] font-medium h-9 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
          >
            Start
          </Button>

          <Button 
            type="button" 
            onClick={capturePhoto}
            disabled={!stream}
            className="w-full text-[13px] font-medium h-9 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
          >
            Capture
          </Button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
