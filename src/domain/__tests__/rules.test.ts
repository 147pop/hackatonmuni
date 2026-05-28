import { describe, it, expect } from 'vitest';
import { esHorarioPermitido, permisionarioEnCuadraCorrecta } from '../rules';
import { SEED_CONFIG, SEED_ZONAS, SEED_FERIADOS, SEED_PERMISIONARIOS } from '../seed';

const ZONA_CENTRO = 'zona-centro';
const ZONA_NOCTURNA = 'zona-nocturna-1';
const params = { zonas: SEED_ZONAS, feriados: SEED_FERIADOS, config: SEED_CONFIG };

// Tests use explicit UTC dates — getHours()/getDay() return UTC values in test runner
describe('esHorarioPermitido — diurno', () => {
  it('Lunes 10:00 UTC — permitido', () => {
    // 2026-06-01 = Monday, 10:00 UTC
    const d = new Date('2026-06-01T10:00:00Z');
    const r = esHorarioPermitido({ timestamp: d, zonaId: ZONA_CENTRO, ...params });
    expect(r.permitido).toBe(true);
  });

  it('Sábado 12:00 UTC — permitido', () => {
    // 2026-06-06 = Saturday, 12:00 UTC (within 07:00-14:00)
    const d = new Date('2026-06-06T12:00:00Z');
    const r = esHorarioPermitido({ timestamp: d, zonaId: ZONA_CENTRO, ...params });
    expect(r.permitido).toBe(true);
  });

  it('Sábado 15:00 UTC — bloqueado', () => {
    // Saturday 15:00 UTC is past 14:00 cutoff
    const d = new Date('2026-06-06T15:00:00Z');
    const r = esHorarioPermitido({ timestamp: d, zonaId: ZONA_CENTRO, ...params });
    expect(r.permitido).toBe(false);
  });

  it('Domingo zona_centro — bloqueado', () => {
    // 2026-06-07 = Sunday
    const d = new Date('2026-06-07T10:00:00Z');
    const r = esHorarioPermitido({ timestamp: d, zonaId: ZONA_CENTRO, ...params });
    expect(r.permitido).toBe(false);
  });
});

describe('esHorarioPermitido — feriados', () => {
  it('Día de la Independencia 2026-07-09 — bloqueado', () => {
    const d = new Date('2026-07-09T14:00:00-03:00');
    const r = esHorarioPermitido({ timestamp: d, zonaId: ZONA_CENTRO, ...params });
    expect(r.permitido).toBe(false);
    expect(r.razon).toMatch(/feriado/i);
  });
});

describe('esHorarioPermitido — nocturno', () => {
  it('Lunes 23:00 UTC zona nocturna — permitido', () => {
    // 23:00 UTC is within nocturno window (22:00-05:00)
    const d = new Date('2026-06-01T23:00:00Z');
    const r = esHorarioPermitido({ timestamp: d, zonaId: ZONA_NOCTURNA, ...params });
    expect(r.permitido).toBe(true);
  });

  it('Lunes 23:00 UTC zona centro (sin nocturno) — bloqueado', () => {
    const d = new Date('2026-06-01T23:00:00Z');
    const r = esHorarioPermitido({ timestamp: d, zonaId: ZONA_CENTRO, ...params });
    expect(r.permitido).toBe(false);
  });
});

describe('permisionarioEnCuadraCorrecta', () => {
  it('permisionario en su cuadra — true', () => {
    expect(
      permisionarioEnCuadraCorrecta({
        permisionarioId: 'perm-1',
        cuadra: 'Balcarce 400',
        permisionarios: SEED_PERMISIONARIOS,
      }),
    ).toBe(true);
  });

  it('permisionario fuera de su cuadra — false', () => {
    expect(
      permisionarioEnCuadraCorrecta({
        permisionarioId: 'perm-1',
        cuadra: 'España 400',
        permisionarios: SEED_PERMISIONARIOS,
      }),
    ).toBe(false);
  });
});
