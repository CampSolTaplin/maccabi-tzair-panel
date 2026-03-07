'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

interface PhotoCaptureModalProps {
  memberName: string;
  existingPhoto?: string | null;
  onSave: (dataUrl: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function PhotoCaptureModal({
  memberName, existingPhoto, onSave, onDelete, onClose,
}: PhotoCaptureModalProps) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      setCapturing(true); // Render the <video> element first
    } catch {
      alert('Could not access camera. Please use file upload instead.');
    }
  }, []);

  // Attach stream to video element once it's rendered in the DOM
  useEffect(() => {
    if (capturing && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [capturing]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const v = videoRef.current;
    const size = Math.min(v.videoWidth, v.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const compressed = await compressImage(dataUrl, 200, 0.6);
    setPreview(compressed);
    stopCamera();
  }, [stopCamera]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 200, 0.6);
      setPreview(compressed);
    } catch {
      alert('Failed to process image.');
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!preview) return;
    setSaving(true);
    onSave(preview);
  }, [preview, onSave]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h3 className="font-serif font-bold text-[#1B2A6B]">{memberName}</h3>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-[#f0eeea] transition-colors">
            <X className="w-4 h-4 text-[#5A6472]" />
          </button>
        </div>

        {/* Camera / Preview area */}
        <div className="px-6 pb-4">
          {capturing ? (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <button onClick={capturePhoto}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-full border-4 border-[#1B2A6B]" />
              </button>
            </div>
          ) : preview ? (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#f0eeea]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={() => setPreview(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="aspect-square rounded-xl bg-[#F2F0EC] border-2 border-dashed border-[#D8E1EA] flex flex-col items-center justify-center gap-4">
              <button onClick={startCamera}
                className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl hover:bg-white transition-colors">
                <Camera className="w-8 h-8 text-[#1B2A6B]" />
                <span className="text-sm font-medium text-[#1B2A6B]">Take Photo</span>
              </button>
              <span className="text-xs text-[#999]">or</span>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D8E1EA] text-sm text-[#5A6472] hover:bg-white transition-colors">
                <Upload className="w-4 h-4" /> Upload File
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          {existingPhoto && onDelete && (
            <button onClick={() => { onDelete(); onClose(); }}
              className="px-3 py-2 rounded-lg border border-[#C0392B]/30 text-xs text-[#C0392B] hover:bg-red-50 transition-all">
              Remove
            </button>
          )}
          <div className="flex-1" />
          <button onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-[#D8E1EA] text-sm font-medium hover:bg-[#f8f7f5] transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!preview || saving}
            className="px-4 py-2 rounded-lg bg-[#2D8B4E] text-white text-sm font-medium hover:bg-[#24734A] transition-all disabled:opacity-40">
            {saving ? 'Saving...' : 'Save Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
