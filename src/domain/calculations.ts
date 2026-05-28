import type { Tarifa, VehicleType } from './types';

export interface CalcParams {
  tipo: VehicleType;
  duracionMinutos: number;
  metodoPago: 'efectivo' | 'digital';
  tarifa: Tarifa;
}

/**
 * RF-EST-02, RF-PAG-07, RF-NOR-04, RF-EST-03, RF-EST-04, RF-NOR-05, RF-NOR-06
 */
export function calcularMonto(params: CalcParams): number {
  const { tipo, duracionMinutos, metodoPago, tarifa } = params;
  const precioHora = tipo === 'auto' ? tarifa.autoHora : tarifa.motoHora;

  // RF-EST-03 / RF-NOR-06: 5-min tolerance — no charge
  if (duracionMinutos <= tarifa.toleranciaMinutos) return 0;

  const umbralFraccionamiento = tarifa.fraccionamientoDesdeHora * 60;
  let monto: number;

  if (duracionMinutos <= umbralFraccionamiento) {
    // First N hours: charge full hours (ceiling)
    monto = Math.ceil(duracionMinutos / 60) * precioHora;
  } else {
    // RF-EST-04 / RF-NOR-05: 15-min fractions after 2nd hour
    monto = tarifa.fraccionamientoDesdeHora * precioHora;
    const minutosRestantes = duracionMinutos - umbralFraccionamiento;
    const fraccionPrecio = (precioHora / 60) * tarifa.fraccionamientoMinutos;
    monto += Math.ceil(minutosRestantes / tarifa.fraccionamientoMinutos) * fraccionPrecio;
  }

  // RF-PAG-07 / RF-NOR-04: 20% digital discount
  if (metodoPago === 'digital') {
    monto = monto * (1 - tarifa.descuentoDigital);
  }

  return Math.round(monto);
}

export function calcularVencimiento(inicio: string, duracionMinutos: number): string {
  const date = new Date(inicio);
  date.setMinutes(date.getMinutes() + duracionMinutos);
  return date.toISOString();
}

export function calcularTiempoRestanteMinutos(vencimiento: string): number {
  const diff = new Date(vencimiento).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 60000));
}

/** RF-PER-05: total recaudado - 20% cuota municipal */
export function calcularLiquidacion(
  totalRecaudado: number,
  cuotaFraccion = 0.2,
): { cuotaMunicipal: number; montoLiquidado: number } {
  const cuotaMunicipal = Math.round(totalRecaudado * cuotaFraccion);
  return { cuotaMunicipal, montoLiquidado: totalRecaudado - cuotaMunicipal };
}

export function calcularMontoDeuda(tipo: VehicleType, tarifa: Tarifa): number {
  // Debt = 1 hour at full rate (no digital discount, no tolerance)
  return tipo === 'auto' ? tarifa.autoHora : tarifa.motoHora;
}
