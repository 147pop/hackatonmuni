import { SEED_VEHICULOS } from '@/domain/seed';

const OCR_DELAY_MS = 1200;

/** [SIMULACION] Simulates OCR plate recognition with artificial delay. */
export async function mockOCRScanPatente(): Promise<string> {
  await new Promise((r) => setTimeout(r, OCR_DELAY_MS));
  // Return a random seeded plate
  const plates = SEED_VEHICULOS.map((v) => v.dominio);
  return plates[Math.floor(Math.random() * plates.length)];
}

/** OCR with a specific plate (for testing) */
export async function mockOCRScanPatenteFixed(dominio: string): Promise<string> {
  await new Promise((r) => setTimeout(r, OCR_DELAY_MS));
  return dominio;
}
