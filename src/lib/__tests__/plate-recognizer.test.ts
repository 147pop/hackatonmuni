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

  it('throws on API error response', async () => {
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

  it('throws when no plate is detected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plate: null,
        confidence: 0,
        source: 'plate-recognizer',
        candidates: [],
      }),
    });

    const { scanPlateWithPlateRecognizer } = await import('../plate-recognizer');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await expect(scanPlateWithPlateRecognizer(file)).rejects.toThrow('No plate detected');
  });
});

describe('extractPlate', () => {
  it('extracts Mercosur auto format AA123BB', async () => {
    const { extractPlate } = await import('../ocr');
    expect(extractPlate('SOME NOISE AA123BB MORE')).toBe('AA123BB');
  });

  it('extracts national auto format ABC123', async () => {
    const { extractPlate } = await import('../ocr');
    expect(extractPlate('ABC123')).toBe('ABC123');
  });

  it('extracts Mercosur moto format A123BBB', async () => {
    const { extractPlate } = await import('../ocr');
    expect(extractPlate('A123BBB')).toBe('A123BBB');
  });

  it('extracts national moto format 123ABC', async () => {
    const { extractPlate } = await import('../ocr');
    expect(extractPlate('123ABC')).toBe('123ABC');
  });

  it('returns up to 8 chars when no format matches', async () => {
    const { extractPlate } = await import('../ocr');
    expect(extractPlate('AB12CD34XY')).toBe('AB12CD34');
  });

  it('normalizes and extracts from messy OCR text', async () => {
    const { extractPlate } = await import('../ocr');
    expect(extractPlate('AB-123 CD')).toBe('AB123CD');
  });
});