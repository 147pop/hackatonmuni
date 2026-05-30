'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  onFallback?: () => void;
}

export function CameraCapture({ onCapture, onClose, onFallback }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        if (!cancelled) {
          onFallback?.();
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [onFallback]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'patente.jpg', { type: 'image/jpeg' });
        onCapture(file);
      },
      'image/jpeg',
      0.92
    );
  }, [onCapture]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[85%] max-w-md aspect-[2.5/1] border-2 border-amber-400 rounded-lg bg-transparent relative">
              <div className="absolute -top-4 left-0 right-0 text-center text-white/80 text-xs font-semibold tracking-wide">
                {cameraReady ? 'Encuadrá la patente aquí' : 'Iniciando cámara...'}
              </div>
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-amber-400 rounded-tl-md" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-amber-400 rounded-tr-md" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-amber-400 rounded-bl-md" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-amber-400 rounded-br-md" />
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-black/95 px-6 py-6 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
          <span className="text-sm">Cancelar</span>
        </button>

        <button
          onClick={handleCapture}
          disabled={!cameraReady}
          className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-40"
        >
          <div className="w-12 h-12 rounded-full bg-white" />
        </button>

        <div className="w-16" />
      </div>
    </div>
  );
}