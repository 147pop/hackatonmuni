import Tesseract from 'tesseract.js';

export type OCRProgressCallback = (progress: number, status: string) => void;

/**
 * Extracts a license plate from an image file using Tesseract.js.
 * @param imageFile The image captured from the camera
 * @param onProgress Callback to update UI with progress
 * @returns The best guess for the license plate, or the raw recognized text
 */
export async function scanPlateFromImage(
  imageFile: File,
  onProgress?: OCRProgressCallback
): Promise<string> {
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100), 'Analizando imagen...');
      } else if (onProgress) {
        onProgress(0, 'Cargando motor OCR...');
      }
    }
  });

  try {
    // We restrict characters to letters and numbers only to avoid reading noise
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });

    const { data: { text } } = await worker.recognize(imageFile);
    
    // Process the text
    const cleanText = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Regex matchers for Argentine plates
    const plateRegexes = [
      /([A-Z]{3}\d{3})/,          // Auto Antiguo: AAA123
      /([A-Z]{2}\d{3}[A-Z]{2})/,   // Auto Mercosur: AA123AA
      /([A-Z]{1}\d{3}[A-Z]{3})/,   // Moto Mercosur: A123AAA
      /(\d{3}[A-Z]{3})/,          // Moto Antigua: 123AAA
    ];

    for (const regex of plateRegexes) {
      const match = cleanText.match(regex);
      if (match) {
        return match[1]; // Found a perfect match
      }
    }

    // If no perfect match is found, just return whatever we could extract
    // up to 8 characters max.
    return cleanText.slice(0, 8);

  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Error al procesar la imagen');
  } finally {
    await worker.terminate();
  }
}
