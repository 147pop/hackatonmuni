# Lector de Patentes Mejorado — Plan de Implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar el lector de patentes actual (Tesseract.js genérico + input file crudo) con un sistema de dos capas: API Plate Recognizer como motor primario + cámara en vivo con overlay guía como UX, manteniendo Tesseract.js como fallback offline.

**Architecture:** Estrategia de fallback en cascada: (1) El usuario toca el botón cámara → se abre preview en vivo con overlay que guía el encuadre de la patente. (2) Al capturar, se envía la imagen al API route `/api/ocr/patente` que proxifica a Plate Recognizer API con `regions=ar`. (3) Si Plate Recognizer falla (sin red, sin créditos, error), se usa Tesseract.js localmente como fallback con pre-procesamiento mejorado. (4) Se muestra el resultado con indicador de confianza y se completa el campo de patente. El worker de Tesseract se pre-carga en el layout.

**Tech Stack:** Next.js 15 API Routes, Plate Recognizer Snapshot Cloud API (free tier: 2,500 lookups/mes), Tesseract.js (fallback), `navigator.mediaDevices.getUserMedia()` para cámara en vivo, React hooks para gestión de estado del stream.

---

## Resumen de Tareas

| # | Tarea | Archivos principales |
|---|-------|---------------------|
| 1 | Configurar env var para Plate Recognizer API token | `.env.local`, `src/lib/env.ts` |
| 2 | Crear API route proxy `/api/ocr/patente` | `src/app/api/ocr/patente/route.ts` |
| 3 | Crear servicio OCR unificado con fallback | `src/lib/plate-recognizer.ts`, modificar `src/lib/ocr.ts` |
| 4 | Crear componente `CameraCapture` con cámara en vivo y overlay | `src/components/camera-capture.tsx` |
| 5 | Refactorizar `PlateInput` para usar CameraCapture + OCR unificado | `src/components/plate-input.tsx` |
| 6 | Eliminar `PatenteInput` inline y usar `PlateInput` compartido | `src/app/permisionario/page.tsx` |
| 7 | Pre-cargar worker de Tesseract en layout | `src/app/permisionario/layout.tsx` (nuevo) |
| 8 | Agregar formatos de patente de moto al validador | `src/domain/validators.ts` |
| 9 | Agregar tests para las nuevas capas | `src/lib/__tests__/plate-recognizer.test.ts`, `src/domain/__tests__/validators.test.ts` |
| 10 | Actualizar `mejoras.md` con el estado de las mejoras OCR | `docs/mejoras.md` |

---

### Task 1: Configurar Plate Recognizer API token

**Files:**
- Modify: `.env.local`
- Create: `src/lib/env.ts`

**Step 1: Agregar variable de entorno a `.env.local`**

Agregar al final de `.env.local`:

```
# Plate Recognizer API - https://platerecognizer.com
PLATE_RECOGNIZER_API_TOKEN=YOUR_API_TOKEN_HERE
```

El token se obtiene registrándose en https://app.platerecognizer.com/accounts/signup/ (free tier: 2,500 lookups/mes).

**Step 2: Crear módulo de env vars tipadas**

Crear `src/lib/env.ts`:

```ts
export const env = {
  plateRecognizerApiToken: process.env.PLATE_RECOGNIZER_API_TOKEN ?? '',
  plateRecognizerEnabled: process.env.PLATE_RECOGNIZER_API_TOKEN
    ? process.env.PLATE_RECOGNIZER_API_TOKEN !== 'YOUR_API_TOKEN_HERE'
    : false,
} as const;
```

Esto permite verificar en runtime si el token está configurado correctamente.

**Step 3: Commit**

```bash
git add .env.local src/lib/env.ts
git commit -m "feat(ocr): add Plate Recognizer API token env var and typed env module"
```

---

### Task 2: Crear API route proxy `/api/ocr/patente`

**Files:**
- Create: `src/app/api/ocr/patente/route.ts`

Por qué un API route y no llamada directa desde el cliente: (1) el token de Plate Recognizer NO debe exponerse al frontend, (2) permite cambiar de proveedor sin tocar el cliente, (3) permite rate limiting server-side.

**Step 1: Crear el API route**

Crear `src/app/api/ocr/patente/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

const PLATE_RECOGNIZER_URL = 'https://api.platerecognizer.com/v1/plate-reader/';

export async function POST(req: NextRequest) {
  const apiToken = process.env.PLATE_RECOGNIZER_API_TOKEN;

  if (!apiToken || apiToken === 'YOUR_API_TOKEN_HERE') {
    return NextResponse.json(
      { error: 'PLATE_RECOGNIZER_API_TOKEN not configured', source: 'none' },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('upload') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided', source: 'none' },
        { status: 400 }
      );
    }

    const apiFormData = new FormData();
    apiFormData.append('upload', file);
    apiFormData.append('regions', 'ar');
    apiFormData.append('config', JSON.stringify({
      region: 'strict',
      mode: 'fast',
    }));

    const response = await fetch(PLATE_RECOGNIZER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiToken}`,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Plate Recognizer API error: ${response.status} ${errorText}`);
      return NextResponse.json(
        { error: `Plate Recognizer API error: ${response.status}`, source: 'plate-recognizer' },
        { status: 502 }
      );
    }

    const data = await response.json();

    const results: Array<{
      plate: string;
      score: number;
      region: { code: string; score: number };
      dscore: number;
      box: { xmin: number; ymin: number; xmax: number; ymax: number };
      candidates: Array<{ plate: string; score: number }>;
    }> = data.results ?? [];

    if (results.length === 0) {
      return NextResponse.json({
        plate: null,
        confidence: 0,
        source: 'plate-recognizer',
        candidates: [],
      });
    }

    const best = results[0];
    const topCandidates = best.candidates?.slice(0, 3) ?? [];

    return NextResponse.json({
      plate: best.plate?.toUpperCase().replace(/[^A-Z0-9]/g, '') ?? null,
      confidence: best.score ?? 0,
      region: best.region?.code ?? null,
      regionScore: best.region?.score ?? 0,
      dscore: best.dscore ?? 0,
      source: 'plate-recognizer',
      candidates: topCandidates.map((c: { plate: string; score: number }) => ({
        plate: c.plate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        score: c.score,
      })),
    });
  } catch (error) {
    console.error('Plate Recognizer proxy error:', error);
    return NextResponse.json(
      { error: 'Network error calling Plate Recognizer', source: 'plate-recognizer' },
      { status: 503 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/ocr/patente/route.ts
git commit -m "feat(ocr): add API route proxy for Plate Recognizer"
```

---

### Task 3: Crear servicio OCR unificado con fallback

**Files:**
- Create: `src/lib/plate-recognizer.ts`
- Modify: `src/lib/ocr.ts`

Estrategia: la función principal `scanPlate()` intenta primero Plate Recognizer (vía API route), y si falla o no hay token configurado, cae a Tesseract.js local. También se mejora Tesseract con pre-procesamiento básico.

**Step 1: Mejorar `src/lib/ocr.ts` — agregar pre-procesamiento con canvas y worker compartido**

Reescribir `src/lib/ocr.ts` completamente:

```ts
import Tesseract from 'tesseract.js';

export type OCRProgressCallback = (progress: number, status: string) => void;

let sharedWorker: Tesseract.Worker | null = null;
let workerInitPromise: Promise<Tesseract.Worker> | null = null;

export async function getWorker(onProgress?: OCRProgressCallback): Promise<Tesseract.Worker> {
  if (sharedWorker) return sharedWorker;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = (async () => {
    const w = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100), 'Analizando imagen...');
        } else if (onProgress) {
          onProgress(0, 'Cargando motor OCR...');
        }
      }
    });
    await w.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });
    sharedWorker = w;
    return w;
  })();

  return workerInitPromise;
}

const PLATE_REGEXES = [
  /([A-Z]{2}\d{3}[A-Z]{2})/,
  /([A-Z]{3}\d{3})/,
  /([A-Z]\d{3}[A-Z]{3})/,
  /(\d{3}[A-Z]{3})/,
];

export function extractPlate(text: string): string {
  const cleanText = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  for (const regex of PLATE_REGEXES) {
    const match = cleanText.match(regex);
    if (match) return match[1];
  }
  return cleanText.slice(0, 8);
}

function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const MAX_WIDTH = 1200;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      ctx!.drawImage(img, 0, 0, width, height);

      const imageData = ctx!.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
        data[i] = contrast;
        data[i + 1] = contrast;
        data[i + 2] = contrast;
      }
      ctx!.putImageData(imageData, 0, 0);

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/png'
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function scanPlateFromImage(
  imageFile: File,
  onProgress?: OCRProgressCallback
): Promise<string> {
  const worker = await getWorker(onProgress);
  let processedFile: File | Blob;
  try {
    processedFile = await preprocessImage(imageFile);
  } catch {
    processedFile = imageFile;
  }
  try {
    const { data: { text } } = await worker.recognize(processedFile);
    return extractPlate(text);
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Error al procesar la imagen');
  }
}

export function terminateSharedWorker(): void {
  if (sharedWorker) {
    sharedWorker.terminate();
    sharedWorker = null;
  }
  workerInitPromise = null;
}
```

**Step 2: Crear `src/lib/plate-recognizer.ts`**

```ts
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
  // 1. Intentar Plate Recognizer API primero
  try {
    onProgress?.(10, 'Consultando servicio de patentes...');
    const result = await scanPlateWithPlateRecognizer(imageFile);
    if (result.plate && result.confidence >= 0.4) {
      onProgress?.(100, 'Patente detectada (Plate Recognizer)');
      return result;
    }
  } catch {
    // Plate Recognizer falló, usar fallback
  }

  // 2. Fallback: Tesseract.js local
  try {
    onProgress?.(20, 'Usando reconocimiento local...');
    const plate = await scanPlateFromImage(imageFile, onProgress);
    return {
      plate: normalizarDominio(plate),
      confidence: 0.5,
      source: 'tesseract',
    };
  } catch (error) {
    throw new Error('No se pudo leer la patente. Ingresala manualmente.');
  }
}
```

**Step 3: Commit**

```bash
git add src/lib/plate-recognizer.ts src/lib/ocr.ts
git commit -m "feat(ocr): add Plate Recognizer service with Tesseract fallback and image preprocessing"
```

---

### Task 4: Crear componente `CameraCapture` con cámara en vivo y overlay

**Files:**
- Create: `src/components/camera-capture.tsx`

Este componente reemplaza el `<input type="file" capture="environment">` con:
- Preview de video en vivo desde `getUserMedia()`
- Overlay con guía rectangular para encuadrar la patente
- Botón de captura (toma foto del stream)
- Botón de cancelar
- Fallback a `<input type="file">` si `getUserMedia` no está disponible

**Step 1: Crear `src/components/camera-capture.tsx`**

```tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

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
      } catch (err) {
        console.error('Camera access denied or unavailable:', err);
        setUseFallback(true);
      }
    }

    if (!useFallback) {
      startCamera();
    }

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [useFallback]);

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

  const handleFileFallback = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onCapture(file);
    },
    [onCapture]
  );

  if (useFallback) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <Camera className="w-12 h-12 text-amber-600 mx-auto" />
          <p className="text-gray-700 font-semibold">Acceso a cámara no disponible</p>
          <p className="text-gray-500 text-sm">Seleccioná una foto de tu galería:</p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileFallback}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
          >
            Seleccionar foto
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

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
```

**Step 2: Commit**

```bash
git add src/components/camera-capture.tsx
git commit -m "feat(ocr): add CameraCapture component with live video preview and plate guide overlay"
```

---

### Task 5: Refactorizar `PlateInput` para usar CameraCapture + OCR unificado

**Files:**
- Modify: `src/components/plate-input.tsx`

Cambios principales:
- Importar `CameraCapture` y `scanPlate` unificado
- Reemplazar el botón OCR que usaba `<input type="file">` con un flujo: botón → abrir CameraCapture → al capturar → `scanPlate()` → mostrar resultado con indicador de confianza
- Mostrar badge de fuente (Plate Recognizer / Tesseract) y nivel de confianza
- Si la confianza es baja, sugerir verificación manual

**Step 1: Reescribir `src/components/plate-input.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { ScanLine, AlertCircle, CheckCircle, Camera, Zap, WifiOff } from 'lucide-react';
import { validarDominio, normalizarDominio } from '@/domain/validators';
import { scanPlate, type PlateScanResult } from '@/lib/plate-recognizer';
import { CameraCapture } from '@/components/camera-capture';

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (valid: boolean) => void;
  disabled?: boolean;
  label?: string;
  showOCR?: boolean;
}

export function PlateInput({
  value,
  onChange,
  onValidChange,
  disabled,
  label = 'Dominio del vehículo',
  showOCR = true,
}: PlateInputProps) {
  const [scanning, setScanning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [scanSource, setScanSource] = useState<'plate-recognizer' | 'tesseract' | null>(null);
  const [scanConfidence, setScanConfidence] = useState<number | null>(null);

  const validation = value.trim() ? validarDominio(value) : null;

  function handleChange(raw: string) {
    const n = normalizarDominio(raw);
    onChange(n);
    onValidChange?.(validarDominio(n).valido);
    setScanSource(null);
    setScanConfidence(null);
  }

  async function handleCapture(file: File) {
    setShowCamera(false);
    setScanning(true);
    setOcrStatus('Escaneando patente...');
    setScanSource(null);
    setScanConfidence(null);

    try {
      const result: PlateScanResult = await scanPlate(file, (progress, statusMsg) => {
        setOcrStatus(`${statusMsg}${progress > 0 && progress < 100 ? ` ${progress}%` : ''}`);
      });

      const normalized = normalizarDominio(result.plate);
      onChange(normalized);
      onValidChange?.(validarDominio(normalized).valido);
      setScanSource(result.source);
      setScanConfidence(result.confidence);
    } catch (err) {
      console.error(err);
      setOcrStatus('No se pudo leer la patente');
      setTimeout(() => setOcrStatus(''), 4000);
    } finally {
      setScanning(false);
    }
  }

  const confidenceLabel = scanConfidence !== null
    ? scanConfidence >= 0.8 ? 'Alta' : scanConfidence >= 0.5 ? 'Media' : 'Baja'
    : null;

  return (
    <div className="space-y-2">
      <label className="block text-base font-semibold text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled || scanning}
          placeholder="AB123CD"
          maxLength={8}
          className={`flex-1 text-xl font-mono px-4 py-3 rounded-xl border-2 uppercase tracking-widest focus:outline-none focus:ring-2 transition-colors ${
            validation?.valido
              ? 'border-green-400 focus:ring-green-200 bg-green-50'
              : validation && !validation.valido
              ? 'border-red-400 focus:ring-red-200 bg-red-50'
              : 'border-gray-300 focus:ring-municipal-200'
          }`}
        />
        {showOCR && (
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            disabled={disabled || scanning}
            title="Escanear patente con la cámara"
            className="flex items-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-700 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            <span className="hidden sm:inline">{scanning ? 'Escaneando' : 'Escanear'}</span>
          </button>
        )}
      </div>

      {scanning && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-2">
          <ScanLine className="w-4 h-4 animate-pulse" />
          {ocrStatus}
        </p>
      )}

      {scanSource && !scanning && (
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
            scanSource === 'plate-recognizer'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {scanSource === 'plate-recognizer' ? <Zap className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {scanSource === 'plate-recognizer' ? 'Plate Recognizer' : 'Local (Tesseract)'}
          </span>
          {confidenceLabel && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
              scanConfidence! >= 0.8 ? 'bg-green-100 text-green-700'
              : scanConfidence! >= 0.5 ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
            }`}>
              Confianza: {confidenceLabel} ({Math.round(scanConfidence! * 100)}%)
            </span>
          )}
          {scanConfidence !== null && scanConfidence < 0.5 && (
            <span className="text-amber-600">Verificá que la patente sea correcta</span>
          )}
        </div>
      )}

      {validation && !validation.valido && !scanning && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {validation.error}
        </p>
      )}
      {validation?.valido && !scanning && (
        <p className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Dominio válido
        </p>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/plate-input.tsx
git commit -m "feat(ocr): refactor PlateInput to use CameraCapture and unified scanPlate with confidence"
```

---

### Task 6: Eliminar `PatenteInput` inline y usar `PlateInput` compartido

**Files:**
- Modify: `src/app/permisionario/page.tsx`

La página principal del permisionario tiene un `PatenteInput` inline (líneas ~270-346) que duplica la lógica del componente `PlateInput`. Debemos:
1. Eliminar la función `PatenteInput` del archivo
2. Importar y usar el componente `PlateInput` unificado
3. Ajustar los handlers para que funcionen igual (registrar observado al presionar Enter o botón)

**Step 1: Identificar y eliminar PatenteInput inline**

Remover la función `PatenteInput` completa (~líneas 270-346) y reemplazar su uso con `<PlateInput>`. Mover la lógica de `observadoStore.create()` y el handler de registro al componente padre.

Requiere agregar estado para patente y isValid en el componente padre, y conectar el PlateInput:

```tsx
const [patenteValue, setPatenteValue] = useState('');
const [patenteValid, setPatenteValid] = useState(false);

// En el JSX, donde se usaba <PatenteInput>:
<PlateInput
  value={patenteValue}
  onChange={setPatenteValue}
  onValidChange={setPatenteValid}
  showOCR={true}
/>
{patenteValid && (
  <button className="lc-registrar-btn" onClick={() => {
    observadoStore.create({ dominio: patenteValue, permisionarioId, cuadra });
    setPatenteValue('');
    onRegistered();
  }}>
    Registrar vehículo
  </button>
)}
```

También eliminar el import de `scanPlateFromImage` que ya no se necesita directamente en este archivo.

**Step 2: Commit**

```bash
git add src/app/permisionario/page.tsx
git commit -m "refactor(permisionario): replace inline PatenteInput with shared PlateInput component"
```

---

### Task 7: Pre-cargar worker de Tesseract en layout

**Files:**
- Create: `src/app/permisionario/layout.tsx`

**Step 1: Crear `src/app/permisionario/layout.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { getWorker } from '@/lib/ocr';

export default function PermisionarioLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getWorker().then(() => {
      console.log('[OCR] Tesseract worker pre-loaded');
    }).catch((err) => {
      console.warn('[OCR] Failed to pre-load Tesseract worker:', err);
    });
  }, []);

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add src/app/permisionario/layout.tsx
git commit -m "perf(ocr): pre-load Tesseract worker in permisionario layout"
```

---

### Task 8: Agregar formatos de patente de moto al validador

**Files:**
- Modify: `src/domain/validators.ts`
- Modify: `src/domain/__tests__/validators.test.ts`

Actualmente el validador solo acepta `AA123AA` (Mercosur auto) y `ABC123` (auto viejo). El OCR reconoce formatos de moto (`A123AAA` Mercosur moto, `123ABC` moto vieja) que la validación rechaza.

**Step 1: Modificar `validarDominio` en `src/domain/validators.ts`**

```ts
export function validarDominio(dominio: string): { valido: boolean; error?: string; formato?: string } {
  const normalizado = normalizarDominio(dominio);

  const formatos = [
    { regex: /^[A-Z]{2}\d{3}[A-Z]{2}$/, nombre: 'Mercosur auto (AA123AA)' },
    { regex: /^[A-Z]{3}\d{3}$/, nombre: 'Nacional auto (ABC123)' },
    { regex: /^[A-Z]\d{3}[A-Z]{3}$/, nombre: 'Mercosur moto (A123AAA)' },
    { regex: /^\d{3}[A-Z]{3}$/, nombre: 'Nacional moto (123ABC)' },
  ];

  for (const formato of formatos) {
    if (formato.regex.test(normalizado)) {
      return { valido: true, formato: formato.nombre };
    }
  }

  return {
    valido: false,
    error: 'Formato inválido. Formatos válidos: AA123AA (auto), ABC123 (auto viejo), A123AAA (moto), 123ABC (moto vieja)',
  };
}
```

**Step 2: Agregar tests en `src/domain/__tests__/validators.test.ts`**

```ts
describe('validarDominio — formatos de moto', () => {
  it('A123AAA — válido (moto Mercosur)', () => expect(validarDominio('A123AAA').valido).toBe(true));
  it('123ABC — válido (moto vieja)', () => expect(validarDominio('123ABC').valido).toBe(true));
  it('a123bcd minúsculas — válido (moto Mercosur, normaliza)', () => expect(validarDominio('a123bcd').valido).toBe(true));
  it('1A2345 — inválido (formato mezclado)', () => expect(validarDominio('1A2345').valido).toBe(false));
});
```

**Step 3: Correr tests**

```bash
npm run test -- --run src/domain/__tests__/validators.test.ts
```

Verificar que todos los tests pasen, incluyendo los nuevos de moto.

**Step 4: Commit**

```bash
git add src/domain/validators.ts src/domain/__tests__/validators.test.ts
git commit -m "feat(validators): support motorcycle plate formats (Mercosur and national)"
```

---

### Task 9: Agregar tests para Plate Recognizer service

**Files:**
- Create: `src/lib/__tests__/plate-recognizer.test.ts`

**Step 1: Crear tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('scanPlateWithPlateRecognizer', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  it('returns plate result on successful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plate: 'AB123CD',
        confidence: 0.92,
        source: 'plate-recognizer',
        candidates: [{ plate: 'AB123CD', score: 0.92 }],
      }),
    });

    const { scanPlateWithPlateRecognizer } = await import('../plate-recognizer');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const result = await scanPlateWithPlateRecognizer(file);

    expect(result.plate).toBe('AB123CD');
    expect(result.source).toBe('plate-recognizer');
    expect(result.confidence).toBe(0.92);
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No plate detected', source: 'none' }),
    });

    const { scanPlateWithPlateRecognizer } = await import('../plate-recognizer');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await expect(scanPlateWithPlateRecognizer(file)).rejects.toThrow();
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { scanPlateWithPlateRecognizer } = await import('../plate-recognizer');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await expect(scanPlateWithPlateRecognizer(file)).rejects.toThrow();
  });
});
```

**Step 2: Correr tests**

```bash
npm run test -- --run src/lib/__tests__/plate-recognizer.test.ts
```

**Step 3: Commit**

```bash
git add src/lib/__tests__/plate-recognizer.test.ts
git commit -m "test(ocr): add tests for Plate Recognizer service"
```

---

### Task 10: Actualizar `mejoras.md`

**Files:**
- Modify: `docs/mejoras.md`

Actualizar la sección 2 "OCR real de patentes con Tesseract.js" para reflejar que está implementada con las nuevas mejoras.

**Step 1: Reemplazar sección 2 del archivo**

Reemplazar todo el bloque desde `## 2. OCR real de patentes con Tesseract.js` hasta `---` (antes de `## 3.`) con:

```markdown
## 2. Lector de patentes mejorado (Plate Recognizer + Cámara en vivo) - IMPLEMENTADO

**Estado:** Implementado con fallback en cascada.

**Qué se implementó:**
- **Plate Recognizer API** como motor primario (cloud, especializado en patentes argentinas, `regions=ar` con `region=strict`)
- **Cámara en vivo** con overlay guía para encuadrar la patente (`getUserMedia`)
- **Fallback a Tesseract.js** cuando Plate Recognizer no está disponible o falla
- **Pre-procesamiento de imagen** (grayscale, contraste, resize) antes de OCR local
- **Pre-carga del worker** de Tesseract en layout del permisionario
- **Indicador de confianza** (Alta/Media/Baja) y fuente del resultado (Plate Recognizer / Tesseract)
- **Validación de formatos de moto** (A123AAA Mercosur moto, 123ABC moto vieja)
- **Componente unificado PlateInput** eliminando duplicación con PatenteInput inline

**Archivos nuevos:**
| Archivo | Propósito |
|---|---|
| `src/lib/plate-recognizer.ts` | Servicio Plate Recognizer + función unificada `scanPlate()` |
| `src/components/camera-capture.tsx` | Componente de cámara en vivo con overlay guía |
| `src/app/api/ocr/patente/route.ts` | API route proxy para Plate Recognizer (oculta el token) |
| `src/lib/env.ts` | Variables de entorno tipadas |
| `src/app/permisionario/layout.tsx` | Pre-carga del worker Tesseract |

**Archivos modificados:**
| Archivo | Cambio |
|---|---|
| `src/lib/ocr.ts` | Pre-procesamiento de imagen, worker compartido, función `extractPlate()` |
| `src/components/plate-input.tsx` | Integración con CameraCapture + scanPlate unificado + badge de confianza |
| `src/app/permisionario/page.tsx` | Eliminado PatenteInput inline, usa PlateInput compartido |
| `src/domain/validators.ts` | Agregados formatos de moto |

**Variables de entorno necesarias:**
```
PLATE_RECOGNIZER_API_TOKEN=TU_TOKEN_AQUI
```

Obtener token en: https://app.platerecognizer.com/accounts/signup/ (Free tier: 2,500 lookups/mes)

**Limitaciones conocidas:**
- Free tier de Plate Recognizer: 2,500 lookups/mes, 1 request/segundo
- Si no hay token configurado, el sistema cae automáticamente a Tesseract.js local
- La cámara en vivo requiere HTTPS en producción (funciona en localhost para desarrollo)
```

**Step 2: Commit**

```bash
git add docs/mejoras.md
git commit -m "docs: update mejoras.md with implemented OCR improvements"
```

---

## Notas de implementación

### Orden de ejecución recomendado

1. **Task 8** primero (validadores de moto) — simple y auto-contenido, alinea OCR y validación.
2. **Task 1** (env var) — base para Task 2.
3. **Task 2** (API route) — base para Task 3.
4. **Task 3** (servicio OCR unificado) — base para Task 5.
5. **Task 4** (CameraCapture) — componente visual, independiente.
6. **Task 5** (PlateInput refactor) — necesita Task 3 y Task 4.
7. **Task 6** (eliminar PatenteInput inline) — necesita Task 5.
8. **Task 7** (pre-load Tesseract) — rápido, necesita Task 3.
9. **Task 9** (tests) — puede hacerse en paralelo con Tasks 4-7.
10. **Task 10** (docs) — al final.

### Dependencia de API token

Para que Plate Recognizer funcione, se necesita un API token. Sin él, el sistema funciona igual pero cae automáticamente a Tesseract.js como fallback. El token se configura en `.env.local` como `PLATE_RECOGNIZER_API_TOKEN`.

### HTTPS en producción

`navigator.mediaDevices.getUserMedia()` requiere HTTPS en producción. En localhost funciona sin HTTPS. Vercel ya provee HTTPS por defecto.

### Rate limiting del free tier

El free tier de Plate Recognizer permite 2,500 lookups/mes y 1 request/segundo. Para un hackathon esto es más que suficiente. En producción se puede considerar:
- Caching de resultados por patente (ej: no re-escanear la misma patente dentro de 5 minutos)
- Upgrade al plan Small ($50/mes para 50,000 lookups)
- Deployment on-premise del SDK de Plate Recognizer (sin límite de lookups)

### Diagrama de flujo

```
Usuario toca "Escanear"
    │
    ▼
CameraCapture (getUserMedia)
    │
    ▼
Usuario encuadra y captura
    │
    ▼
scanPlate()
    │
    ├── Intenta Plate Recognizer API (/api/ocr/patente)
    │   ├── Éxito (confidence >= 0.4) → Resultado con badge verde
    │   └── Fallo → Fallback a Tesseract.js
    │       ├── Pre-procesa imagen (grayscale + contraste)
    │       ├── OCR con Tesseract
    │       └── Resultado con badge azul
    │
    ▼
PlateInput muestra resultado con:
- Patente detectada en el campo
- Badge de fuente (Plate Recognizer / Tesseract)
- Indicador de confianza (Alta/Media/Baja)
- Sugerencia de verificación manual si confianza < 50%
```