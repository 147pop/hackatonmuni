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
  const { timestamp, zonaId, zonas, feriados, config } = params;

  // RF-NOR-02 / RF-EST-07: block on holidays
  const fechaStr = timestamp.toISOString().split('T')[0];
  if (feriados.some((f) => f.fecha === fechaStr)) {
    return { permitido: false, razon: 'Feriado o día no laborable' };
  }

  const dia = timestamp.getDay(); // 0=Dom, 1=Lun ... 6=Sab
  const minutosDelDia = timestamp.getHours() * 60 + timestamp.getMinutes();
  const diurnoInicio = parseTime(config.horarioDiurnoInicio);
  const diurnoFinSemana = parseTime(config.horarioDiurnoFinSemana);
  const diurnoFinSabado = parseTime(config.horarioDiurnoFinSabado);

  const zona = zonas.find((z) => z.id === zonaId);
  const tieneNocturno = zona?.nocturnoHabilitado ?? false;

  // RF-NOR-01 diurno L-V 07:00-21:00
  if (dia >= 1 && dia <= 5) {
    const enDiurno = minutosDelDia >= diurnoInicio && minutosDelDia < diurnoFinSemana;
    if (enDiurno) return { permitido: true };
    // RF-NOR-03 / RF-EST-08: nocturno only in enabled zones
    if (tieneNocturno && isNocturno(minutosDelDia, config)) return { permitido: true };
    return { permitido: false, razon: 'Fuera de horario (L-V 07:00–21:00)' };
  }

  // RF-NOR-01 Sabado 07:00-14:00
  if (dia === 6) {
    const enDiurno = minutosDelDia >= diurnoInicio && minutosDelDia < diurnoFinSabado;
    if (enDiurno) return { permitido: true };
    if (tieneNocturno && isNocturno(minutosDelDia, config)) return { permitido: true };
    return { permitido: false, razon: 'Fuera de horario (Sáb 07:00–14:00)' };
  }

  // Domingo — only nocturno zones
  if (tieneNocturno && isNocturno(minutosDelDia, config)) return { permitido: true };
  return { permitido: false, razon: 'Domingo — sin servicio en esta zona' };
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
