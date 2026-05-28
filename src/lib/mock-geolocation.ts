import { SEED_GEOLOCALIZACION } from '@/domain/seed';

/** [SIMULACION] Returns fixed GPS coordinates per block (cuadra). */
export function getCoordsForCuadra(cuadra: string): { lat: number; lng: number } {
  return SEED_GEOLOCALIZACION[cuadra] ?? { lat: -24.7859, lng: -65.4117 };
}

export function getAllCuadras(): string[] {
  return Object.keys(SEED_GEOLOCALIZACION);
}
