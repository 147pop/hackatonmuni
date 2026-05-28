import type {
  Permisionario,
  Conductor,
  Vehiculo,
  Zona,
  Tarifa,
  Feriado,
  ConfiguracionNormativa,
  Deuda,
} from './types';

export const SEED_TARIFA: Tarifa = {
  id: 'tarifa-1',
  autoHora: 700,
  motoHora: 300,
  descuentoDigital: 0.2,
  toleranciaMinutos: 5,
  fraccionamientoMinutos: 15,
  fraccionamientoDesdeHora: 2,
};

export const SEED_CONFIG: ConfiguracionNormativa = {
  horarioDiurnoInicio: '07:00',
  horarioDiurnoFinSemana: '21:00',
  horarioDiurnoFinSabado: '14:00',
  horarioNocturnoInicio: '22:00',
  horarioNocturnoFin: '05:00',
};

export const SEED_ZONAS: Zona[] = [
  {
    id: 'zona-centro',
    nombre: 'Centro',
    cuadras: ['Balcarce 400', 'España 400', 'Caseros 400', 'Mitre 300'],
    nocturnoHabilitado: false,
  },
  {
    id: 'zona-nocturna-1',
    nombre: 'Nocturna Norte',
    cuadras: ['Pellegrini 200', 'San Martín 500'],
    nocturnoHabilitado: true,
  },
];

export const SEED_FERIADOS: Feriado[] = [
  { id: 'feriado-1', fecha: '2026-07-09', descripcion: 'Día de la Independencia' },
  { id: 'feriado-2', fecha: '2026-05-25', descripcion: 'Día de la Patria' },
  { id: 'feriado-3', fecha: '2026-01-01', descripcion: 'Año Nuevo' },
];

export const SEED_PERMISIONARIOS: Permisionario[] = [
  {
    id: 'perm-1',
    nombre: 'Rosa',
    apellido: 'Martínez',
    legajo: 'P-0042',
    foto: '/avatars/perm1.svg',
    cuadraAsignada: 'Balcarce 400',
    zonaId: 'zona-centro',
    activo: true,
    horariosAutorizados: { diurno: true, nocturno: false },
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'perm-2',
    nombre: 'Jorge',
    apellido: 'Pérez',
    legajo: 'P-0087',
    foto: '/avatars/perm2.svg',
    cuadraAsignada: 'España 400',
    zonaId: 'zona-centro',
    activo: true,
    horariosAutorizados: { diurno: true, nocturno: false },
    createdAt: '2025-02-20T10:00:00.000Z',
  },
  {
    id: 'perm-3',
    nombre: 'Ana',
    apellido: 'Rodríguez',
    legajo: 'P-0119',
    foto: '/avatars/perm3.svg',
    cuadraAsignada: 'Pellegrini 200',
    zonaId: 'zona-nocturna-1',
    activo: true,
    horariosAutorizados: { diurno: true, nocturno: true },
    createdAt: '2025-03-10T10:00:00.000Z',
  },
];

export const SEED_CONDUCTORES: Conductor[] = [
  {
    id: 'cond-1',
    nombre: 'Carlos',
    email: 'carlos@example.com',
    telefono: '387-4501234',
    dominioDefault: 'AB123CD',
    createdAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'cond-2',
    nombre: 'María',
    email: 'maria@example.com',
    telefono: '387-4567890',
    dominioDefault: 'XYZ789',
    createdAt: '2026-04-15T10:00:00.000Z',
  },
];

export const SEED_VEHICULOS: Vehiculo[] = [
  { id: 'veh-1', dominio: 'AB123CD', tipo: 'auto', conductorId: 'cond-1' },
  { id: 'veh-2', dominio: 'XYZ789', tipo: 'auto', conductorId: 'cond-2' },
  { id: 'veh-3', dominio: 'MN456OP', tipo: 'moto' },
  { id: 'veh-4', dominio: 'PQR123', tipo: 'auto' },
  { id: 'veh-5', dominio: 'ST789UV', tipo: 'moto' },
];

export const SEED_DEUDAS: Deuda[] = [
  {
    id: 'deuda-1',
    dominio: 'XYZ789',
    cuadra: 'Balcarce 400',
    permisionarioId: 'perm-1',
    monto: 700,
    fecha: '2026-05-20T14:30:00.000Z',
    estado: 'pendiente',
  },
  {
    id: 'deuda-2',
    dominio: 'PQR123',
    cuadra: 'España 400',
    permisionarioId: 'perm-2',
    monto: 700,
    fecha: '2026-05-22T09:15:00.000Z',
    estado: 'pendiente',
  },
];

export const SEED_GEOLOCALIZACION: Record<string, { lat: number; lng: number }> = {
  'Balcarce 400': { lat: -24.7847, lng: -65.4116 },
  'España 400': { lat: -24.7862, lng: -65.4103 },
  'Caseros 400': { lat: -24.7838, lng: -65.4095 },
  'Mitre 300': { lat: -24.7872, lng: -65.4128 },
  'Pellegrini 200': { lat: -24.7815, lng: -65.4087 },
  'San Martín 500': { lat: -24.7851, lng: -65.4072 },
};
