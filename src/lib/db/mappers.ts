import type {
  Zona,
  Tarifa,
  Feriado,
  ConfiguracionNormativa,
  Permisionario,
  Conductor,
  Vehiculo,
  Estacionamiento,
  Pago,
  Ticket,
  Deuda,
  Emergencia,
  Liquidacion,
  AuditEvent,
  VehiculoObservado,
  UserRole,
  AdminRole,
  VehicleType,
  PaymentMethod,
  PaymentStatus,
  DebtStatus,
  DebtType,
  EmergencyType,
} from '@/domain/types';
import type { Database } from '@/lib/database.types';

type Tables = Database['public']['Tables'];
type TableRow<T extends keyof Tables> = Tables[T]['Row'];
type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];

type ZonaRow = TableRow<'zonas'>;
type CuadraRow = TableRow<'cuadras'>;
type TarifaRow = TableRow<'tarifas'>;
type FeriadoRow = TableRow<'feriados'>;
type ConfigRow = TableRow<'configuracion_normativa'>;
type PermisionarioRow = TableRow<'permisionarios'>;
type HorarioRow = TableRow<'horarios_permisionario'>;
type UserRow = TableRow<'users'>;
type ConductorRow = TableRow<'conductores'>;
type VehiculoRow = TableRow<'vehiculos'>;
type EstacionamientoRow = TableRow<'estacionamientos'>;
type PagoRow = TableRow<'pagos'>;
type TicketRow = TableRow<'tickets'>;
type DeudaRow = TableRow<'deudas'>;
type EmergenciaRow = TableRow<'emergencias'>;
type LiquidacionRow = TableRow<'liquidaciones'>;
type AuditRow = TableRow<'audit_events'>;
type ObservadoRow = TableRow<'vehiculos_observados'>;

function cuadraRowToNombre(cuadra: CuadraRow): string {
  return cuadra.nombre;
}

export function mapZona(row: ZonaRow & { cuadras?: CuadraRow[] }): Zona {
  return {
    id: row.id,
    nombre: row.nombre,
    cuadras: row.cuadras?.map(cuadraRowToNombre) ?? [],
    nocturnoHabilitado: row.nocturno_habilitado,
  };
}

export function mapTarifa(row: TarifaRow): Tarifa {
  return {
    id: row.id,
    autoHora: row.auto_hora,
    motoHora: row.moto_hora,
    descuentoDigital: row.descuento_digital,
    toleranciaMinutos: row.tolerancia_minutos,
    fraccionamientoMinutos: row.fraccionamiento_minutos,
    fraccionamientoDesdeHora: row.fraccionamiento_desde_hora,
  };
}

export function mapFeriado(row: FeriadoRow): Feriado {
  return {
    id: row.id,
    fecha: row.fecha,
    descripcion: row.descripcion,
  };
}

export function mapConfig(row: ConfigRow): ConfiguracionNormativa {
  return {
    horarioDiurnoInicio: row.horario_diurno_inicio,
    horarioDiurnoFinSemana: row.horario_diurno_fin_semana,
    horarioDiurnoFinSabado: row.horario_diurno_fin_sabado,
    horarioNocturnoInicio: row.horario_nocturno_inicio,
    horarioNocturnoFin: row.horario_nocturno_fin,
  };
}

export async function mapPermisionario(
  row: PermisionarioRow,
  supabase: import('@supabase/supabase-js').SupabaseClient<import('./database.types').Database>,
  cuadrasCache?: Map<string, string>,
): Promise<Permisionario> {
  let cuadraNombre: string;
  if (cuadrasCache?.has(row.cuadra_id)) {
    cuadraNombre = cuadrasCache.get(row.cuadra_id)!;
  } else {
    const { data: cuadra } = await supabase.from('cuadras').select('nombre').eq('id', row.cuadra_id).single();
    cuadraNombre = cuadra?.nombre ?? row.cuadra_id;
  }

  const { data: horarios } = await supabase
    .from('horarios_permisionario')
    .select('*')
    .eq('permisionario_id', row.id);

  const diurno = horarios?.some((h: HorarioRow) => h.turno === 'diurno') ?? row.activo;
  const nocturno = horarios?.some((h: HorarioRow) => h.turno === 'nocturno') ?? false;

  const { data: user } = await supabase.from('users').select('*').eq('id', row.user_id).single();

  return {
    id: row.id,
    nombre: user?.nombre ?? '',
    apellido: user?.apellido ?? '',
    legajo: row.legajo,
    foto: row.foto ?? '',
    cuadraAsignada: cuadraNombre,
    zonaId: row.zona_id,
    activo: row.activo,
    horariosAutorizados: { diurno, nocturno },
    aliasMercadoPago: row.alias_mercado_pago ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapConductor(row: ConductorRow, user?: UserRow): Conductor {
  return {
    id: row.id,
    nombre: user?.nombre ?? '',
    email: user?.email ?? '',
    telefono: user?.telefono ?? '',
    dominioDefault: row.dominio_default ?? '',
    createdAt: row.created_at,
  };
}

export function mapVehiculo(row: VehiculoRow): Vehiculo {
  return {
    id: row.id,
    dominio: row.dominio,
    tipo: row.tipo as VehicleType,
    conductorId: row.conductor_id ?? undefined,
  };
}

export function mapEstacionamiento(row: EstacionamientoRow, cuadrasCache?: Map<string, string>): Estacionamiento {
  const cuadra = cuadrasCache?.get(row.cuadra_id) ?? row.cuadra_id;
  return {
    id: row.id,
    dominio: row.dominio,
    tipo: row.tipo as VehicleType,
    zonaId: row.zona_id,
    cuadra,
    permisionarioId: row.permisionario_id,
    inicio: row.inicio,
    fin: row.fin ?? undefined,
    duracionMinutos: row.duracion_minutos,
    metodoPago: row.metodo_pago as PaymentMethod,
    pagoId: undefined,
    activo: row.estado === 'activo',
    transferido: row.transferido,
  };
}

export function mapPago(row: PagoRow, cuadrasCache?: Map<string, string>): Pago {
  const cuadra = cuadrasCache?.get(row.cuadra_id) ?? row.cuadra_id;
  return {
    id: row.id,
    estacionamientoId: row.estacionamiento_id ?? undefined,
    ticketId: row.ticket_id ?? undefined,
    dominio: row.dominio,
    monto: row.monto,
    metodoPago: row.metodo_pago as PaymentMethod,
    estado: row.estado as PaymentStatus,
    permisionarioId: row.permisionario_id,
    cuadra,
    createdAt: row.created_at,
    mpTransactionId: row.mp_transaction_id ?? undefined,
  };
}

export function mapTicket(row: TicketRow, cuadrasCache?: Map<string, string>): Ticket {
  const cuadra = cuadrasCache?.get(row.cuadra_id) ?? row.cuadra_id;
  return {
    id: row.id,
    numero: row.numero,
    dominio: row.dominio,
    tipo: row.tipo as VehicleType,
    cuadra,
    permisionarioId: row.permisionario_id,
    inicio: row.inicio,
    duracionMinutos: row.duracion_minutos,
    vencimiento: row.vencimiento,
    monto: row.monto,
    metodoPago: row.metodo_pago as PaymentMethod,
    descuentoAplicado: row.descuento_aplicado,
    activo: row.activo,
    conductorId: row.conductor_id ?? undefined,
  };
}

export function mapDeuda(row: DeudaRow, cuadrasCache?: Map<string, string>): Deuda {
  const cuadra = cuadrasCache?.get(row.cuadra_id) ?? row.cuadra_id;
  return {
    id: row.id,
    dominio: row.dominio,
    cuadra,
    permisionarioId: row.permisionario_id,
    monto: row.monto,
    fecha: row.fecha,
    estado: row.estado as DebtStatus,
    pagadoAt: row.pagado_at ?? undefined,
    pagoId: row.pago_id ?? undefined,
    tipo: row.tipo as DebtType | undefined,
    ticketOriginalId: row.ticket_original_id ?? undefined,
    vencimientoOriginal: row.vencimiento_original ?? undefined,
    minutosExcedidos: row.minutos_excedidos ?? undefined,
  };
}

export function mapEmergencia(row: EmergenciaRow): Emergencia {
  return {
    id: row.id,
    tipo: row.tipo as EmergencyType,
    origenRol: row.origen_rol as 'conductor' | 'permisionario',
    origenId: row.origen_id,
    permisionarioId: row.permisionario_id,
    cuadra: row.cuadra_id,
    coordenadas: { lat: row.lat, lng: row.lng },
    timestamp: row.timestamp,
    resuelta: row.resuelta,
    resueltoAt: row.resuelto_at ?? undefined,
    notas: row.notas ?? undefined,
  };
}

export function mapLiquidacion(row: LiquidacionRow): Liquidacion {
  return {
    id: row.id,
    permisionarioId: row.permisionario_id,
    periodo: row.periodo,
    totalRecaudado: row.total_recaudado,
    cuotaMunicipal: row.cuota_municipal,
    montoLiquidado: row.monto_liquidado,
    estado: row.estado as 'pendiente' | 'transferida',
    createdAt: row.created_at,
    transferidoAt: row.transferido_at ?? undefined,
  };
}

export function mapAuditEvent(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    tipo: row.tipo,
    entidad: row.entidad,
    entidadId: row.entidad_id,
    usuarioRol: row.usuario_rol,
    usuarioId: row.usuario_id,
    datos: (row.dato ?? row.datos ?? {}) as Record<string, unknown>,
    timestamp: row.timestamp,
  };
}

export function mapObservado(row: ObservadoRow): VehiculoObservado {
  return {
    id: row.id,
    dominio: row.dominio,
    permisionarioId: row.permisionario_id,
    cuadra: row.cuadra_id,
    timestamp: row.timestamp,
  };
}

type PermisionarioInsert = TableInsert<'permisionarios'>;
type EstacionamientoInsert = TableInsert<'estacionamientos'>;
type TicketInsert = TableInsert<'tickets'>;
type PagoInsert = TableInsert<'pagos'>;
type DeudaInsert = TableInsert<'deudas'>;
type EmergenciaInsert = TableInsert<'emergencias'>;
type LiquidacionInsert = TableInsert<'liquidaciones'>;

export function toDbPermisionario(data: Omit<Permisionario, 'id' | 'createdAt'>, cuadraId: string, userId: string): PermisionarioInsert {
  return {
    user_id: userId,
    legajo: data.legajo,
    foto: data.foto || null,
    cuadra_id: cuadraId,
    zona_id: data.zonaId,
    activo: data.activo,
    alias_mercado_pago: data.aliasMercadoPago ?? null,
    qr_code: null,
  };
}

export function toDbEstacionamiento(data: Omit<Estacionamiento, 'id'>): EstacionamientoInsert {
  return {
    dominio: data.dominio,
    tipo: data.tipo,
    zona_id: data.zonaId,
    cuadra_id: data.cuadra,
    permisionario_id: data.permisionarioId,
    hora_registro: new Date().toISOString(),
    inicio: data.inicio,
    fin: data.fin ?? null,
    duracion_minutos: data.duracionMinutos,
    estado: data.activo ? 'activo' as const : 'finalizado' as const,
    origen: data.metodoPago === 'digital' ? 'digital' as const : 'efectivo' as const,
    metodo_pago: data.metodoPago,
    transferido: data.transferido,
    registrado_por: null,
  };
}

export function toDbTicket(data: Omit<Ticket, 'id' | 'numero'>): TicketInsert {
  return {
    dominio: data.dominio,
    tipo: data.tipo,
    cuadra_id: data.cuadra,
    permisionario_id: data.permisionarioId,
    inicio: data.inicio,
    duracion_minutos: data.duracionMinutos,
    vencimiento: data.vencimiento,
    monto: data.monto,
    metodo_pago: data.metodoPago,
    descuento_aplicado: data.descuentoAplicado,
    activo: data.activo,
    conductor_id: data.conductorId ?? null,
  };
}

export function toDbPago(data: Omit<Pago, 'id' | 'createdAt'>): PagoInsert {
  return {
    estacionamiento_id: data.estacionamientoId ?? null,
    ticket_id: data.ticketId ?? null,
    dominio: data.dominio,
    monto: data.monto,
    metodo_pago: data.metodoPago,
    estado: data.estado,
    permisionario_id: data.permisionarioId,
    cuadra_id: data.cuadra,
    conductor_id: null,
    mp_transaction_id: null,
  };
}

export function toDbDeuda(data: Omit<Deuda, 'id'>): DeudaInsert {
  return {
    dominio: data.dominio,
    cuadra_id: data.cuadra,
    permisionario_id: data.permisionarioId,
    monto: data.monto,
    fecha: data.fecha,
    estado: data.estado,
    pagado_at: data.pagadoAt ?? null,
    pago_id: data.pagoId ?? null,
    tipo: data.tipo ?? 'incumplimiento',
    ticket_original_id: data.ticketOriginalId ?? null,
    vencimiento_original: data.vencimientoOriginal ?? null,
    minutos_excedidos: data.minutosExcedidos ?? null,
  };
}

export function toDbEmergencia(data: Omit<Emergencia, 'id' | 'timestamp' | 'resuelta'>): EmergenciaInsert {
  return {
    tipo: data.tipo,
    origen_rol: data.origenRol,
    origen_id: data.origenId,
    permisionario_id: data.permisionarioId,
    cuadra_id: data.cuadra,
    lat: data.coordenadas.lat,
    lng: data.coordenadas.lng,
  };
}

export function toDbLiquidacion(data: Omit<Liquidacion, 'id' | 'createdAt'>): LiquidacionInsert {
  return {
    permisionario_id: data.permisionarioId,
    periodo: data.periodo,
    total_recaudado: data.totalRecaudado,
    cuota_municipal: data.cuotaMunicipal,
    monto_liquidado: data.montoLiquidado,
    estado: data.estado,
    transferido_at: data.transferidoAt ?? null,
  };
}

// Helper to load cuadra names in batch
export async function loadCuadrasCache(
  supabase: import('@supabase/supabase-js').SupabaseClient<import('./database.types').Database>,
): Promise<Map<string, string>> {
  const { data } = await supabase.from('cuadras').select('id, nombre');
  const map = new Map<string, string>();
  if (data) for (const c of data) map.set(c.id, c.nombre);
  return map;
}

// Fix AuditRow datos field
type AuditRowFixed = {
  id: string;
  tipo: string;
  entidad: string;
  entidad_id: string;
  usuario_id: string;
  usuario_rol: string;
  datos: Record<string, unknown>;
  timestamp: string;
};