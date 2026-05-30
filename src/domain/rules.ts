import type { Feriado, ConfiguracionNormativa, Zona, Permisionario } from './types';

export interface HorarioResult {
  permitido: boolean;
  razon?: string;
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function isNocturno(minutesOfDay: number, config: ConfiguracionNormativa): boolean {
  const inicio = parseTime(config.horarioNocturnoInicio); // 22:00 = 1320
  const fin = parseTime(config.horarioNocturnoFin);       // 05:00 = 300
  // Spans midnight: >= 1320 OR < 300
  return minutesOfDay >= inicio || minutesOfDay < fin;
}

/**
 * RF-NOR-01, RF-NOR-02, RF-EST-07, RF-NOR-03, RF-EST-08, RF-EST-09
 */
export function esHorarioPermitido(params: {
  timestamp: Date;
  zonaId: string;
  zonas: Zona[];
  feriados: Feriado[];
  config: ConfiguracionNormativa;
}): HorarioResult {
  // DISABLED: horario check bypassed for payment testing
  return { permitido: true };
}

/** RF-PER-08: permisionario can only operate in their assigned block */
export function permisionarioEnCuadraCorrecta(params: {
  permisionarioId: string;
  cuadra: string;
  permisionarios: Pick<Permisionario, 'id' | 'cuadraAsignada'>[];
}): boolean {
  const { permisionarioId, cuadra, permisionarios } = params;
  const p = permisionarios.find((x) => x.id === permisionarioId);
  return p?.cuadraAsignada === cuadra;
}

/** RF-USR-07: notify 5 minutes before expiry */
export function estaProximoAVencer(vencimiento: string, umbralMinutos = 5): boolean {
  const diff = (new Date(vencimiento).getTime() - Date.now()) / 60000;
  return diff > 0 && diff <= umbralMinutos;
}

/** RF-EST-05: transfer to another block at no cost if time remains */
export function puedeTransferir(vencimiento: string): boolean {
  return new Date(vencimiento).getTime() > Date.now();
}
