export type VehicleType = 'auto' | 'moto';
export type PaymentMethod = 'efectivo' | 'digital';
export type PaymentStatus = 'pending' | 'success' | 'failed';
export type DebtStatus = 'pendiente' | 'pagada' | 'vencida';
export type DebtType = 'incumplimiento' | 'hora_extra';
export type UserRole = 'conductor' | 'portal' | 'permisionario' | 'admin';
export type AdminRole = 'administrador' | 'supervisor' | 'consulta';
export type EmergencyType = 'panico' | 'disputa';

export interface Zona {
  id: string;
  nombre: string;
  cuadras: string[];
  nocturnoHabilitado: boolean;
}

export interface Tarifa {
  id: string;
  autoHora: number;
  motoHora: number;
  descuentoDigital: number;
  toleranciaMinutos: number;
  fraccionamientoMinutos: number;
  fraccionamientoDesdeHora: number;
}

export interface Feriado {
  id: string;
  fecha: string; // YYYY-MM-DD
  descripcion: string;
}

export interface ConfiguracionNormativa {
  horarioDiurnoInicio: string;      // "07:00"
  horarioDiurnoFinSemana: string;   // "21:00"
  horarioDiurnoFinSabado: string;   // "14:00"
  horarioNocturnoInicio: string;    // "22:00"
  horarioNocturnoFin: string;       // "05:00"
}

export interface Permisionario {
  id: string;
  nombre: string;
  apellido: string;
  legajo: string;
  foto: string;
  cuadraAsignada: string;
  zonaId: string;
  activo: boolean;
  horariosAutorizados: {
    diurno: boolean;
    nocturno: boolean;
  };
  createdAt: string;
}

export interface Conductor {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  dominioDefault: string;
  createdAt: string;
}

export interface Vehiculo {
  id: string;
  dominio: string;
  tipo: VehicleType;
  conductorId?: string;
}

export interface Estacionamiento {
  id: string;
  dominio: string;
  tipo: VehicleType;
  zonaId: string;
  cuadra: string;
  permisionarioId: string;
  inicio: string;
  fin?: string;
  duracionMinutos: number;
  metodoPago: PaymentMethod;
  pagoId?: string;
  activo: boolean;
  transferido: boolean;
}

export interface Pago {
  id: string;
  estacionamientoId?: string;
  ticketId?: string;
  dominio: string;
  monto: number;
  metodoPago: PaymentMethod;
  estado: PaymentStatus;
  permisionarioId: string;
  cuadra: string;
  createdAt: string;
  mpTransactionId?: string;
}

export interface Ticket {
  id: string;
  numero: string;
  dominio: string;
  tipo: VehicleType;
  cuadra: string;
  permisionarioId: string;
  inicio: string;
  duracionMinutos: number;
  vencimiento: string;
  monto: number;
  metodoPago: PaymentMethod;
  descuentoAplicado: boolean;
  activo: boolean;
  conductorId?: string;
}

export interface Deuda {
  id: string;
  dominio: string;
  cuadra: string;
  permisionarioId: string;
  monto: number;
  fecha: string;
  estado: DebtStatus;
  pagadoAt?: string;
  pagoId?: string;
  // Overstay fields (Sprint 3, task 14) — all optional for backwards compat
  tipo?: DebtType;
  ticketOriginalId?: string;
  vencimientoOriginal?: string;
  minutosExcedidos?: number;
}

export interface Emergencia {
  id: string;
  tipo: EmergencyType;
  origenRol: 'conductor' | 'permisionario';
  origenId: string;
  cuadra: string;
  coordenadas: { lat: number; lng: number };
  timestamp: string;
  resuelta: boolean;
  resueltoAt?: string;
  notas?: string;
}

export interface VehiculoObservado {
  id: string;
  dominio: string;
  permisionarioId: string;
  cuadra: string;
  timestamp: string;
}

export interface Liquidacion {
  id: string;
  permisionarioId: string;
  periodo: string; // "2026-05"
  totalRecaudado: number;
  cuotaMunicipal: number;
  montoLiquidado: number;
  estado: 'pendiente' | 'transferida';
  createdAt: string;
  transferidoAt?: string;
}

export interface AuditEvent {
  id: string;
  tipo: string;
  entidad: string;
  entidadId: string;
  usuarioRol: string;
  usuarioId: string;
  datos: Record<string, unknown>;
  timestamp: string;
}

export interface MPSimulationResult {
  transactionId: string;
  estado: 'pending' | 'success' | 'failed';
  monto: number;
  timestamp: string;
}
