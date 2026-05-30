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
    if (typeof document === 'undefined') {
      reject(new Error('preprocessImage requires a browser environment'));
      return;
    }

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