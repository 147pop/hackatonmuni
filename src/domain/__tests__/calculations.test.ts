import { describe, it, expect } from 'vitest';
import { calcularMonto, calcularLiquidacion } from '../calculations';
import { SEED_TARIFA } from '../seed';

const T = SEED_TARIFA; // autoHora:700, motoHora:300, descDigital:0.2, tolerancia:5, fracc:15min desde 2h

describe('calcularMonto', () => {
  it('dentro de tolerancia — monto cero', () => {
    expect(calcularMonto({ tipo: 'auto', duracionMinutos: 5, metodoPago: 'efectivo', tarifa: T })).toBe(0);
  });

  it('1 hora auto efectivo', () => {
    expect(calcularMonto({ tipo: 'auto', duracionMinutos: 60, metodoPago: 'efectivo', tarifa: T })).toBe(700);
  });

  it('1 hora moto efectivo', () => {
    expect(calcularMonto({ tipo: 'moto', duracionMinutos: 60, metodoPago: 'efectivo', tarifa: T })).toBe(300);
  });

  it('1 hora auto digital — descuento 20%', () => {
    expect(calcularMonto({ tipo: 'auto', duracionMinutos: 60, metodoPago: 'digital', tarifa: T })).toBe(560);
  });

  it('1 hora moto digital — descuento 20%', () => {
    expect(calcularMonto({ tipo: 'moto', duracionMinutos: 60, metodoPago: 'digital', tarifa: T })).toBe(240);
  });

  it('2 horas auto efectivo — 2 horas completas', () => {
    expect(calcularMonto({ tipo: 'auto', duracionMinutos: 120, metodoPago: 'efectivo', tarifa: T })).toBe(1400);
  });

  it('2h 15min auto efectivo — fraccionamiento 15 min', () => {
    // 2h = 1400, + 1 fraccion de (700/60)*15 = 175
    expect(calcularMonto({ tipo: 'auto', duracionMinutos: 135, metodoPago: 'efectivo', tarifa: T })).toBe(1575);
  });

  it('2h 30min auto efectivo — 2 fracciones', () => {
    // 1400 + 2*175 = 1750
    expect(calcularMonto({ tipo: 'auto', duracionMinutos: 150, metodoPago: 'efectivo', tarifa: T })).toBe(1750);
  });

  it('fraccionamiento digital aplica descuento sobre total', () => {
    const efectivo = calcularMonto({ tipo: 'auto', duracionMinutos: 135, metodoPago: 'efectivo', tarifa: T });
    const digital = calcularMonto({ tipo: 'auto', duracionMinutos: 135, metodoPago: 'digital', tarifa: T });
    expect(digital).toBe(Math.round(efectivo * 0.8));
  });

  it('61 minutos auto — techo en hora completa', () => {
    // Dentro del primer tramo (< 2h), 61 min = ceil(61/60)*700 = 2*700 = 1400? No...
    // Wait: ceil(61/60) = 2, so 2*700 = 1400
    expect(calcularMonto({ tipo: 'auto', duracionMinutos: 61, metodoPago: 'efectivo', tarifa: T })).toBe(1400);
  });
});

describe('calcularLiquidacion', () => {
  it('cuota 20% calculada correctamente', () => {
    const { cuotaMunicipal, montoLiquidado } = calcularLiquidacion(1000);
    expect(cuotaMunicipal).toBe(200);
    expect(montoLiquidado).toBe(800);
  });

  it('total = cuota + liquidado', () => {
    const total = 5750;
    const { cuotaMunicipal, montoLiquidado } = calcularLiquidacion(total);
    expect(cuotaMunicipal + montoLiquidado).toBe(total);
  });
});
