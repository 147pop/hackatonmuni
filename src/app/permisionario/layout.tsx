'use client';

import { useEffect } from 'react';
import { getWorker } from '@/lib/ocr';
import { initializeIfNeeded } from '@/lib/sem-store';

export default function PermisionarioLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeIfNeeded();
    getWorker().then(() => {
      console.log('[OCR] Tesseract worker pre-loaded');
    }).catch((err) => {
      console.warn('[OCR] Failed to pre-load Tesseract worker:', err);
    });
  }, []);

  return <>{children}</>;
}