import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, RefreshCw } from 'lucide-react';

export function CameraCapture({ onCapture }: { onCapture: (base64: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError('');
    } catch (err) {
      console.error('Error accessing camera:', err);
      // Fallback to any camera if environment camera fails
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
        setError('');
      } catch (fallbackErr) {
        console.error('Error accessing fallback camera:', fallbackErr);
        setError('Could not access camera. Please allow camera permissions.');
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Calculate a square crop for the ID photo from the center
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;

      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip the context horizontally so the captured image matches the mirrored video preview
        ctx.translate(600, 0);
        ctx.scale(-1, 1);
        
        // Draw the image, cropping the center square
        ctx.drawImage(video, startX, startY, size, size, 0, 0, 600, 600);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(base64);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onCapture(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full items-center justify-center">
      {error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-center border border-red-100 max-w-sm w-full">
          <Camera className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="font-semibold text-[15px]">{error}</p>
          <Button onClick={startCamera} variant="outline" className="mt-4 bg-white hover:bg-slate-50 border-red-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Camera
          </Button>
          
          <div className="mt-6 flex items-center gap-4">
             <div className="h-px bg-red-200 flex-1"></div>
             <span className="text-red-400 text-[10px] uppercase font-bold tracking-widest">OR</span>
             <div className="h-px bg-red-200 flex-1"></div>
          </div>
          
          <div className="mt-5">
             <input type="file" id="fallback-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
             <label htmlFor="fallback-upload" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-6 bg-slate-900 text-slate-50 hover:bg-slate-900/90 cursor-pointer shadow-sm w-full">
               <Upload className="w-4 h-4" />
               Upload Photo Instead
             </label>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl bg-black shadow-inner border-4 border-slate-100 mb-6">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] border-2 border-white/40 border-dashed rounded-[30%] flex flex-col items-center justify-center">
                <div className="w-20 h-20 border border-white/20 rounded-full mt-2"></div>
                <div className="w-32 h-16 border border-white/20 rounded-t-full mt-4"></div>
              </div>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex justify-center gap-3 w-full max-w-[320px]">
            <Button onClick={takePhoto} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md gap-2 flex-1 h-12 text-[15px]">
              <Camera className="w-5 h-5" />
              Capture Photo
            </Button>
            
            <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
            <label htmlFor="photo-upload" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-12 px-6 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer shadow-sm">
              <Upload className="w-5 h-5" />
            </label>
          </div>
          <p className="text-slate-400 text-xs mt-4 font-medium text-center">Center the face within the dotted guidelines.</p>
        </div>
      )}
    </div>
  );
}
