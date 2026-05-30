import { scanPlateFromImage } from './ocr';
import { normalizarDominio } from '@/domain/validators';

export interface PlateScanResult {
  plate: string;
  confidence: number;
  source: 'plate-recognizer' | 'tesseract';
  candidates?: Array<{ plate: string; score: number }>;
}

export type ScanProgressCallback = (progress: number, status: string) => void;

export async function scanPlateWithPlateRecognizer(
  imageFile: File,
): Promise<PlateScanResult> {
  const formData = new FormData();
  formData.append('upload', imageFile);

  const response = await fetch('/api/ocr/patente', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error ?? 'Plate Recognizer request failed');
  }

  if (!data.plate) {
    throw new Error('No plate detected by Plate Recognizer');
  }

  return {
    plate: data.plate,
    confidence: data.confidence ?? 0,
    source: 'plate-recognizer',
    candidates: data.candidates ?? [],
  };
}

export async function scanPlate(
  imageFile: File,
  onProgress?: ScanProgressCallback,
): Promise<PlateScanResult> {
  try {
    onProgress?.(10, 'Consultando servicio de patentes...');
    const result = await scanPlateWithPlateRecognizer(imageFile);
    if (result.plate && result.confidence >= 0.4) {
      onProgress?.(100, 'Patente detectada (Plate Recognizer)');
      return result;
    }
  } catch {
    // Plate Recognizer failed, use fallback
  }

  try {
    onProgress?.(20, 'Usando reconocimiento local...');
    const plate = await scanPlateFromImage(imageFile, onProgress);
    return {
      plate: normalizarDominio(plate),
      confidence: 0.5,
      source: 'tesseract',
    };
  } catch {
    throw new Error('No se pudo leer la patente. Ingresala manualmente.');
  }
}