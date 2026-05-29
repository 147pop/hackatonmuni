# OCR Real Permisionario Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar el OCR simulado por lectura real de patentes desde camara del navegador en los flujos del permisionario, con fallback manual.

**Architecture:** El OCR corre 100% en cliente con Tesseract.js y se carga de forma diferida cuando el usuario abre el lector. `PlateInput` sigue siendo el punto unico de entrada de dominio; los flujos de permisionario activan `ocrMode="real"` y el resto puede seguir en mock/off sin duplicar logica.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tesseract.js, canvas browser API, `navigator.mediaDevices.getUserMedia`, Vitest, Testing Library, Playwright.

---

## Task 1: Dependency And Pure OCR Extraction

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/ocr.ts`
- Test: `src/lib/__tests__/ocr.test.ts`

**Step 1: Install OCR dependency**

Run:

```bash
npm install tesseract.js
```

Expected: `package.json` and `package-lock.json` include `tesseract.js`.

**Step 2: Write failing tests for text extraction**

Create `src/lib/__tests__/ocr.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extractPlateFromOcrText, normalizeOcrTextForPlate } from '../ocr';

describe('normalizeOcrTextForPlate', () => {
  it('uppercases text and removes separators', () => {
    expect(normalizeOcrTextForPlate(' ab-123 cd ')).toBe('AB123CD');
  });

  it('keeps likely OCR characters for plate matching', () => {
    expect(normalizeOcrTextForPlate('Patente: xy z 789')).toContain('XYZ789');
  });
});

describe('extractPlateFromOcrText', () => {
  it('extracts new Argentine plate format from noisy OCR text', () => {
    expect(extractPlateFromOcrText('SALTA AB 123 CD MERCOSUR')).toBe('AB123CD');
  });

  it('extracts old Argentine plate format from noisy OCR text', () => {
    expect(extractPlateFromOcrText('AUTO - ABC 123 - ZONA')).toBe('ABC123');
  });

  it('returns null when no valid plate exists', () => {
    expect(extractPlateFromOcrText('SIN DOMINIO LEGIBLE')).toBeNull();
  });
});
```

**Step 3: Run test to verify it fails**

Run:

```bash
npm run test -- src/lib/__tests__/ocr.test.ts
```

Expected: FAIL because `src/lib/ocr.ts` does not exist.

**Step 4: Implement minimal extraction module**

Create `src/lib/ocr.ts`:

```ts
import { normalizarDominio, validarDominio } from '@/domain/validators';

export interface PlateOcrResult {
  dominio: string | null;
  rawText: string;
  confidence?: number;
}

export function normalizeOcrTextForPlate(text: string): string {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

export function extractPlateFromOcrText(text: string): string | null {
  const compact = normalizeOcrTextForPlate(text);
  const candidates = [
    ...compact.matchAll(/[A-Z]{2}\d{3}[A-Z]{2}/g),
    ...compact.matchAll(/[A-Z]{3}\d{3}/g),
  ].map((match) => normalizarDominio(match[0]));

  return candidates.find((candidate) => validarDominio(candidate).valido) ?? null;
}

export async function recognizePlateFromCanvas(canvas: HTMLCanvasElement): Promise<PlateOcrResult> {
  const { recognize } = await import('tesseract.js');
  const result = await recognize(canvas, 'eng');
  const rawText = result.data.text ?? '';

  return {
    dominio: extractPlateFromOcrText(rawText),
    rawText,
    confidence: result.data.confidence,
  };
}
```

**Step 5: Run test to verify it passes**

Run:

```bash
npm run test -- src/lib/__tests__/ocr.test.ts
```

Expected: PASS, 6 tests.

**Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/ocr.ts src/lib/__tests__/ocr.test.ts
git commit -m "feat: add browser plate ocr extraction"
```

---

## Task 2: Camera Scanner Component

**Files:**
- Create: `src/components/plate-ocr-scanner.tsx`
- Test: `src/components/__tests__/plate-ocr-scanner.test.tsx`

**Step 1: Write component tests with browser API mocks**

Create `src/components/__tests__/plate-ocr-scanner.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlateOcrScanner } from '../plate-ocr-scanner';

const stop = vi.fn();

vi.mock('@/lib/ocr', () => ({
  recognizePlateFromCanvas: vi.fn(async () => ({
    dominio: 'AB123CD',
    rawText: 'AB 123 CD',
    confidence: 91,
  })),
}));

describe('PlateOcrScanner', () => {
  beforeEach(() => {
    stop.mockClear();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop }],
        })),
      },
    });
  });

  it('opens camera and returns detected plate', async () => {
    const onDetected = vi.fn();
    render(<PlateOcrScanner open onDetected={onDetected} onCancel={() => {}} />);

    expect(await screen.findByText(/encuadra la patente/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /capturar/i }));

    await waitFor(() => expect(onDetected).toHaveBeenCalledWith('AB123CD'));
  });

  it('shows manual fallback message when camera is unavailable', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(new Error('denied'));

    render(<PlateOcrScanner open onDetected={() => {}} onCancel={() => {}} />);

    expect(await screen.findByText(/no se pudo acceder a la camara/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/components/__tests__/plate-ocr-scanner.test.tsx
```

Expected: FAIL because component does not exist.

**Step 3: Implement scanner component**

Create `src/components/plate-ocr-scanner.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, RotateCcw, X } from 'lucide-react';
import { recognizePlateFromCanvas } from '@/lib/ocr';

interface PlateOcrScannerProps {
  open: boolean;
  onDetected: (dominio: string) => void;
  onCancel: () => void;
}

type ScannerStatus = 'idle' | 'camera' | 'processing' | 'error';

export function PlateOcrScanner({ open, onDetected, onCancel }: PlateOcrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function startCamera() {
      setStatus('idle');
      setError('');

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('camera-unavailable');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('camera');
      } catch {
        setStatus('error');
        setError('No se pudo acceder a la camara. Podes ingresar la patente manualmente.');
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open]);

  async function capture() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const width = Math.min(video.videoWidth || 1280, 1280);
    const height = Math.round(width * ((video.videoHeight || 720) / (video.videoWidth || 1280)));
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    setStatus('processing');
    setError('');

    try {
      const result = await recognizePlateFromCanvas(canvas);
      if (!result.dominio) {
        setStatus('error');
        setError('No se detecto una patente valida. Reintentá con mejor luz o cargala manualmente.');
        return;
      }
      onDetected(result.dominio);
    } catch {
      setStatus('error');
      setError('No se pudo leer la patente. Reintentá o cargala manualmente.');
    }
  }

  if (!open) return null;

  const isProcessing = status === 'processing';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm text-slate-300">OCR de patente</p>
            <h2 className="text-lg font-semibold">Encuadra la patente</h2>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full bg-white/10 p-2" aria-label="Cerrar OCR">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative flex-1 overflow-hidden bg-black">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div className="absolute inset-x-6 top-1/2 h-28 -translate-y-1/2 rounded-xl border-2 border-amber-300 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
        </div>

        {error && <p className="mx-4 mt-3 rounded-lg border border-red-400 bg-red-950/70 px-3 py-2 text-sm">{error}</p>}

        <footer className="grid grid-cols-[1fr_auto] gap-3 p-4">
          <button type="button" onClick={onCancel} className="rounded-xl bg-white/10 px-4 py-3 font-semibold">
            Manual
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={isProcessing || status === 'idle'}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            {isProcessing ? 'Leyendo' : 'Capturar'}
          </button>
          {status === 'error' && (
            <button type="button" onClick={() => setStatus('camera')} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 font-semibold">
              <RotateCcw className="h-4 w-4" />
              Reintentar
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
```

**Step 4: Run tests**

Run:

```bash
npm run test -- src/components/__tests__/plate-ocr-scanner.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/plate-ocr-scanner.tsx src/components/__tests__/plate-ocr-scanner.test.tsx
git commit -m "feat: add camera plate scanner"
```

---

## Task 3: Integrate Scanner Into PlateInput

**Files:**
- Modify: `src/components/plate-input.tsx`
- Test: `src/components/__tests__/plate-input.test.tsx`

**Step 1: Write tests for OCR modes**

Create or update `src/components/__tests__/plate-input.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlateInput } from '../plate-input';

vi.mock('../plate-ocr-scanner', () => ({
  PlateOcrScanner: ({ open, onDetected }: { open: boolean; onDetected: (dominio: string) => void }) =>
    open ? <button type="button" onClick={() => onDetected('AB123CD')}>mock scanner detected</button> : null,
}));

describe('PlateInput OCR modes', () => {
  it('opens real scanner and fills detected plate', async () => {
    const onChange = vi.fn();
    const onValidChange = vi.fn();

    render(<PlateInput value="" onChange={onChange} onValidChange={onValidChange} ocrMode="real" />);

    await userEvent.click(screen.getByRole('button', { name: /abrir ocr/i }));
    await userEvent.click(screen.getByRole('button', { name: /mock scanner detected/i }));

    expect(onChange).toHaveBeenCalledWith('AB123CD');
    expect(onValidChange).toHaveBeenCalledWith(true);
  });

  it('hides OCR button when mode is off', () => {
    render(<PlateInput value="" onChange={() => {}} ocrMode="off" />);

    expect(screen.queryByRole('button', { name: /abrir ocr/i })).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/components/__tests__/plate-input.test.tsx
```

Expected: FAIL because `ocrMode` is not implemented.

**Step 3: Update PlateInput props and behavior**

Modify `src/components/plate-input.tsx`:

```tsx
import { PlateOcrScanner } from './plate-ocr-scanner';

type OcrMode = 'real' | 'mock' | 'off';

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (valid: boolean) => void;
  disabled?: boolean;
  label?: string;
  showOCR?: boolean;
  ocrMode?: OcrMode;
}
```

Use this behavior:

```tsx
const effectiveOcrMode: OcrMode = showOCR === false ? 'off' : ocrMode ?? 'mock';
const [scannerOpen, setScannerOpen] = useState(false);

function applyDetectedPlate(plate: string) {
  const n = normalizarDominio(plate);
  onChange(n);
  onValidChange?.(validarDominio(n).valido);
}

async function handleOCR() {
  if (effectiveOcrMode === 'real') {
    setScannerOpen(true);
    return;
  }

  setScanning(true);
  try {
    const plate = await mockOCRScanPatente();
    applyDetectedPlate(plate);
  } finally {
    setScanning(false);
  }
}
```

Render the real scanner:

```tsx
<PlateOcrScanner
  open={scannerOpen}
  onCancel={() => setScannerOpen(false)}
  onDetected={(plate) => {
    applyDetectedPlate(plate);
    setScannerOpen(false);
  }}
/>
```

Update the OCR button accessible name:

```tsx
aria-label={effectiveOcrMode === 'real' ? 'Abrir OCR de patente' : 'Simular OCR de patente'}
title={effectiveOcrMode === 'real' ? 'Leer patente con cámara' : 'Reconocimiento automático de patente [SIMULACIÓN]'}
```

Keep the `[SIMULACIÓN]` status only for mock mode.

**Step 4: Run tests**

Run:

```bash
npm run test -- src/components/__tests__/plate-input.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/plate-input.tsx src/components/__tests__/plate-input.test.tsx
git commit -m "feat: support real ocr mode in plate input"
```

---

## Task 4: Enable Real OCR In Permisionario Flows

**Files:**
- Modify: `src/components/cash-payment-form.tsx`
- Modify: `src/components/non-payment-form.tsx`
- Modify: `src/app/permisionario/actividad/page.tsx`
- Modify: `src/app/permisionario/hora-extra/page.tsx`

**Step 1: Update each permisionario PlateInput**

In each listed file, pass:

```tsx
<PlateInput
  value={dominio}
  onChange={setDominio}
  onValidChange={setDominioValido}
  ocrMode="real"
/>
```

Preserve any existing props such as `disabled`, `label`, or other page-specific values.

**Step 2: Verify conductor and portal remain unchanged**

Check these files and do not change them in this task:

- `src/app/conductor/registro/page.tsx`
- `src/components/payment-wizard.tsx`
- `src/app/portal/deudas/page.tsx`

They should keep the default mode until OCR real is explicitly requested there.

**Step 3: Run relevant tests**

Run:

```bash
npm run test -- src/components/__tests__/plate-input.test.tsx src/components/__tests__/plate-ocr-scanner.test.tsx
```

Expected: PASS.

**Step 4: Commit**

```bash
git add src/components/cash-payment-form.tsx src/components/non-payment-form.tsx src/app/permisionario/actividad/page.tsx src/app/permisionario/hora-extra/page.tsx
git commit -m "feat: enable real ocr for permisionario"
```

---

## Task 5: End-To-End And Build Verification

**Files:**
- Modify: `tests/e2e/permisionario.spec.ts`
- Optional modify: `docs/demo-script.md`

**Step 1: Add E2E assertion that OCR entry exists**

In `tests/e2e/permisionario.spec.ts`, add assertions in the existing permisionario register flow:

```ts
await expect(page.getByRole('button', { name: /abrir ocr de patente/i })).toBeVisible();
```

Do not attempt real camera access in Playwright for this MVP test. The E2E should prove the UI exposes OCR and the manual fallback still completes the flow.

**Step 2: Run E2E**

Run:

```bash
npm run test:e2e -- tests/e2e/permisionario.spec.ts
```

Expected: PASS.

**Step 3: Run full verification**

Run:

```bash
npm run test
npm run build
```

Expected:

- Vitest passes.
- Next production build succeeds.

If `npm run lint` still uses `next lint` and fails due framework deprecation, do not hide it. Record the exact output and decide whether to migrate lint in a separate task.

**Step 4: Commit**

```bash
git add tests/e2e/permisionario.spec.ts docs/demo-script.md
git commit -m "test: cover permisionario ocr entry"
```

---

## Task 6: Manual Mobile Acceptance Check

**Files:**
- No code changes unless a defect is found.

**Step 1: Run the app**

Run:

```bash
npm run dev
```

Expected: Next starts on `http://localhost:3000`.

**Step 2: Test on phone or mobile viewport**

Open the permisionario flow on a phone or browser mobile emulation:

- `/permisionario/registrar`
- `/permisionario/incumplimiento`
- `/permisionario/hora-extra`
- `/permisionario/actividad`

Verify:

- OCR opens a full-screen camera scanner.
- The scanner asks for camera permission only when opened.
- The scanner uses rear camera when available.
- Capture shows a processing state.
- A valid detected plate fills the field.
- If OCR fails, manual input remains usable.
- Closing the scanner stops the camera indicator.

**Step 3: Final status**

Run:

```bash
git status --short
```

Expected: clean worktree, except unrelated pre-existing user changes if implementation ran in a mixed checkout.
