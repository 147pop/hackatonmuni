import { storageGet, storageSet, storageClear } from './storage';
import type {
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
  Tarifa,
  Zona,
  Feriado,
  ConfiguracionNormativa,
  UserRole,
  AdminRole,
  VehiculoObservado,
} from '@/domain/types';
import {
  SEED_PERMISIONARIOS,
  SEED_CONDUCTORES,
  SEED_VEHICULOS,
  SEED_TARIFA,
  SEED_ZONAS,
  SEED_FERIADOS,
  SEED_CONFIG,
  SEED_DEUDAS,
  SEED_ESTACIONAMIENTOS,
  SEED_TICKETS,
  SEED_PAGOS,
} from '@/domain/seed';

const K = {
  permisionarios: 'sem_permisionarios',
  conductores: 'sem_conductores',
  vehiculos: 'sem_vehiculos',
  estacionamientos: 'sem_estacionamientos',
  pagos: 'sem_pagos',
  tickets: 'sem_tickets',
  deudas: 'sem_deudas',
  emergencias: 'sem_emergencias',
  liquidaciones: 'sem_liquidaciones',
  auditEvents: 'sem_audit',
  tarifa: 'sem_tarifa',
  zonas: 'sem_zonas',
  feriados: 'sem_feriados',
  config: 'sem_config',
  activeRole: 'sem_active_role',
  activeConductorId: 'sem_conductor_id',
  activePermisionarioId: 'sem_permisionario_id',
  adminRole: 'sem_admin_role',
  initialized: 'sem_initialized',
  observados: 'sem_observados',
} as const;

let ticketCounter = 1000;

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function nextTicketNumber(): string {
  ticketCounter += 1;
  return `T-${ticketCounter}`;
}

// ─── Initialization ────────────────────────────────────────────────────────

export function initializeIfNeeded(): void {
  if (storageGet<boolean>(K.initialized, false)) return;
  resetToDemo();
}

export function resetToDemo(): void {
  storageClear();
  storageSet(K.permisionarios, SEED_PERMISIONARIOS);
  storageSet(K.conductores, SEED_CONDUCTORES);
  storageSet(K.vehiculos, SEED_VEHICULOS);
  storageSet(K.tarifa, SEED_TARIFA);
  storageSet(K.zonas, SEED_ZONAS);
  storageSet(K.feriados, SEED_FERIADOS);
  storageSet(K.config, SEED_CONFIG);
  storageSet(K.deudas, SEED_DEUDAS);
  storageSet(K.estacionamientos, SEED_ESTACIONAMIENTOS);
  storageSet(K.pagos, SEED_PAGOS);
  storageSet(K.tickets, SEED_TICKETS);
  storageSet(K.emergencias, []);
  storageSet(K.liquidaciones, []);
  storageSet(K.observados, []);
  storageSet(K.auditEvents, []);
  storageSet(K.activeRole, 'conductor');
  storageSet(K.adminRole, 'administrador');
  storageSet(K.initialized, true);
  addAudit('sistema_init', 'sistema', 'sem', {});
}

// ─── Audit ─────────────────────────────────────────────────────────────────

function addAudit(tipo: string, entidad: string, entidadId: string, datos: Record<string, unknown>): void {
  const events = storageGet<AuditEvent[]>(K.auditEvents, []);
  events.push({
    id: generateId(),
    tipo,
    entidad,
    entidadId,
    usuarioRol: storageGet<string>(K.activeRole, 'sistema'),
    usuarioId:
      storageGet<string>(K.activeConductorId, '') ||
      storageGet<string>(K.activePermisionarioId, '') ||
      'sistema',
    datos,
    timestamp: new Date().toISOString(),
  });
  // Keep last 1000
  if (events.length > 1000) events.splice(0, events.length - 1000);
  storageSet(K.auditEvents, events);
}

// ─── Role session ──────────────────────────────────────────────────────────

export const roleStore = {
  getRole: (): UserRole => storageGet<UserRole>(K.activeRole, 'conductor'),
  setRole: (r: UserRole) => { storageSet(K.activeRole, r); addAudit('role_switch', 'session', r, {}); },
  getAdminRole: (): AdminRole => storageGet<AdminRole>(K.adminRole, 'administrador'),
  setAdminRole: (r: AdminRole) => { storageSet(K.adminRole, r); },
  getActiveConductorId: (): string | null => storageGet<string | null>(K.activeConductorId, null),
  setActiveConductorId: (id: string | null) => { storageSet(K.activeConductorId, id); },
  getActivePermisionarioId: (): string | null => storageGet<string | null>(K.activePermisionarioId, null),
  setActivePermisionarioId: (id: string | null) => { storageSet(K.activePermisionarioId, id); },
};

// ─── Config ────────────────────────────────────────────────────────────────

export const configStore = {
  getTarifa: (): Tarifa => storageGet<Tarifa>(K.tarifa, SEED_TARIFA),
  setTarifa: (t: Tarifa) => { storageSet(K.tarifa, t); addAudit('tarifa_update', 'tarifa', t.id, t as unknown as Record<string, unknown>); },
  getConfig: (): ConfiguracionNormativa => storageGet<ConfiguracionNormativa>(K.config, SEED_CONFIG),
  setConfig: (c: ConfiguracionNormativa) => { storageSet(K.config, c); addAudit('config_update', 'config', 'sem', c as unknown as Record<string, unknown>); },
  getZonas: (): Zona[] => storageGet<Zona[]>(K.zonas, SEED_ZONAS),
  setZonas: (z: Zona[]) => { storageSet(K.zonas, z); addAudit('zonas_update', 'zonas', 'sem', {}); },
  getFeriados: (): Feriado[] => storageGet<Feriado[]>(K.feriados, SEED_FERIADOS),
  setFeriados: (f: Feriado[]) => { storageSet(K.feriados, f); addAudit('feriados_update', 'feriados', 'sem', {}); },
  addFeriado: (f: Omit<Feriado, 'id'>) => {
    const list = configStore.getFeriados();
    const newF: Feriado = { ...f, id: generateId() };
    list.push(newF);
    storageSet(K.feriados, list);
    addAudit('feriado_add', 'feriado', newF.id, newF as unknown as Record<string, unknown>);
    return newF;
  },
  removeFeriado: (id: string) => {
    const list = configStore.getFeriados().filter((f) => f.id !== id);
    storageSet(K.feriados, list);
    addAudit('feriado_remove', 'feriado', id, {});
  },
};

// ─── Permisionarios ────────────────────────────────────────────────────────

export const permisionarioStore = {
  getAll: (): Permisionario[] => storageGet<Permisionario[]>(K.permisionarios, SEED_PERMISIONARIOS),
  getById: (id: string): Permisionario | undefined => permisionarioStore.getAll().find((p) => p.id === id),
  create: (data: Omit<Permisionario, 'id' | 'createdAt'>): Permisionario => {
    const list = permisionarioStore.getAll();
    const p: Permisionario = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(p);
    storageSet(K.permisionarios, list);
    addAudit('permisionario_create', 'permisionario', p.id, p as unknown as Record<string, unknown>);
    return p;
  },
  update: (id: string, data: Partial<Permisionario>): Permisionario | undefined => {
    const list = permisionarioStore.getAll();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...data };
    storageSet(K.permisionarios, list);
    addAudit('permisionario_update', 'permisionario', id, data as Record<string, unknown>);
    return list[idx];
  },
  delete: (id: string) => {
    const list = permisionarioStore.getAll().filter((p) => p.id !== id);
    storageSet(K.permisionarios, list);
    addAudit('permisionario_delete', 'permisionario', id, {});
  },
};

// ─── Vehiculos ─────────────────────────────────────────────────────────────

export const vehiculoStore = {
  getAll: (): Vehiculo[] => storageGet<Vehiculo[]>(K.vehiculos, SEED_VEHICULOS),
  getByDominio: (dominio: string): Vehiculo | undefined =>
    vehiculoStore.getAll().find((v) => v.dominio.toUpperCase() === dominio.toUpperCase()),
  create: (data: Omit<Vehiculo, 'id'>): Vehiculo => {
    const list = vehiculoStore.getAll();
    const v: Vehiculo = { ...data, id: generateId() };
    list.push(v);
    storageSet(K.vehiculos, list);
    addAudit('vehiculo_create', 'vehiculo', v.id, { dominio: v.dominio });
    return v;
  },
};

// ─── Conductores ───────────────────────────────────────────────────────────

export const conductorStore = {
  getAll: (): Conductor[] => storageGet<Conductor[]>(K.conductores, SEED_CONDUCTORES),
  getById: (id: string): Conductor | undefined => conductorStore.getAll().find((c) => c.id === id),
  create: (data: Omit<Conductor, 'id' | 'createdAt'>): Conductor => {
    const list = conductorStore.getAll();
    const c: Conductor = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(c);
    storageSet(K.conductores, list);
    addAudit('conductor_create', 'conductor', c.id, {});
    return c;
  },
  update: (id: string, data: Partial<Conductor>): Conductor | undefined => {
    const list = conductorStore.getAll();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...data };
    storageSet(K.conductores, list);
    addAudit('conductor_update', 'conductor', id, {});
    return list[idx];
  },
};

// ─── Tickets ───────────────────────────────────────────────────────────────

export const ticketStore = {
  getAll: (): Ticket[] => storageGet<Ticket[]>(K.tickets, []),
  getById: (id: string): Ticket | undefined => ticketStore.getAll().find((t) => t.id === id),
  getByDominio: (dominio: string): Ticket[] =>
    ticketStore.getAll().filter((t) => t.dominio.toUpperCase() === dominio.toUpperCase()),
  getActivos: (): Ticket[] => ticketStore.getAll().filter((t) => t.activo),
  getActivosByDominio: (dominio: string): Ticket | undefined =>
    ticketStore.getAll()
      .filter((t) => t.activo && t.dominio.toUpperCase() === dominio.toUpperCase())
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())[0],
  getByPermisionarioCuadra: (permisionarioId: string, cuadra: string): Ticket[] =>
    ticketStore.getAll().filter((t) => t.activo && t.permisionarioId === permisionarioId && t.cuadra === cuadra),
  create: (data: Omit<Ticket, 'id' | 'numero'>): Ticket => {
    const list = ticketStore.getAll();
    const t: Ticket = { ...data, id: generateId(), numero: nextTicketNumber() };
    list.push(t);
    storageSet(K.tickets, list);
    addAudit('ticket_create', 'ticket', t.id, { dominio: t.dominio, monto: t.monto });
    return t;
  },
  update: (id: string, data: Partial<Ticket>): Ticket | undefined => {
    const list = ticketStore.getAll();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...data };
    storageSet(K.tickets, list);
    addAudit('ticket_update', 'ticket', id, data as Record<string, unknown>);
    return list[idx];
  },
};

// ─── Pagos ─────────────────────────────────────────────────────────────────

export const pagoStore = {
  getAll: (): Pago[] => storageGet<Pago[]>(K.pagos, []),
  getById: (id: string): Pago | undefined => pagoStore.getAll().find((p) => p.id === id),
  getByPermisionario: (permisionarioId: string): Pago[] =>
    pagoStore.getAll().filter((p) => p.permisionarioId === permisionarioId),
  create: (data: Omit<Pago, 'id' | 'createdAt'>): Pago => {
    const list = pagoStore.getAll();
    const p: Pago = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(p);
    storageSet(K.pagos, list);
    addAudit('pago_create', 'pago', p.id, { monto: p.monto, metodo: p.metodoPago });
    return p;
  },
  update: (id: string, data: Partial<Pago>): Pago | undefined => {
    const list = pagoStore.getAll();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...data };
    storageSet(K.pagos, list);
    addAudit('pago_update', 'pago', id, data as Record<string, unknown>);
    return list[idx];
  },
};

// ─── Deudas ────────────────────────────────────────────────────────────────

export const deudaStore = {
  getAll: (): Deuda[] => storageGet<Deuda[]>(K.deudas, SEED_DEUDAS),
  getByDominio: (dominio: string): Deuda[] =>
    deudaStore.getAll().filter((d) => d.dominio === dominio),
  getPendientes: (): Deuda[] =>
    deudaStore.getAll().filter((d) => d.estado === 'pendiente'),
  create: (data: Omit<Deuda, 'id'>): Deuda => {
    const list = deudaStore.getAll();
    const d: Deuda = { ...data, id: generateId() };
    list.push(d);
    storageSet(K.deudas, list);
    addAudit('deuda_create', 'deuda', d.id, { dominio: d.dominio, monto: d.monto });
    return d;
  },
  update: (id: string, data: Partial<Deuda>): Deuda | undefined => {
    const list = deudaStore.getAll();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...data };
    storageSet(K.deudas, list);
    addAudit('deuda_update', 'deuda', id, data as Record<string, unknown>);
    return list[idx];
  },
};

// ─── Emergencias ───────────────────────────────────────────────────────────

export const emergenciaStore = {
  getAll: (): Emergencia[] => storageGet<Emergencia[]>(K.emergencias, []),
  getActivas: (): Emergencia[] => emergenciaStore.getAll().filter((e) => !e.resuelta),
  create: (data: Omit<Emergencia, 'id' | 'timestamp' | 'resuelta'>): Emergencia => {
    const list = emergenciaStore.getAll();
    const e: Emergencia = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString(),
      resuelta: false,
    };
    list.push(e);
    storageSet(K.emergencias, list);
    // RF-EME-06: no feedback on panic — audit only
    addAudit('emergencia_create', 'emergencia', e.id, { tipo: e.tipo });
    return e;
  },
  resolver: (id: string, notas?: string): Emergencia | undefined => {
    const list = emergenciaStore.getAll();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], resuelta: true, resueltoAt: new Date().toISOString(), notas };
    storageSet(K.emergencias, list);
    addAudit('emergencia_resolver', 'emergencia', id, {});
    return list[idx];
  },
};

// ─── Liquidaciones ─────────────────────────────────────────────────────────

export const liquidacionStore = {
  getAll: (): Liquidacion[] => storageGet<Liquidacion[]>(K.liquidaciones, []),
  getByPermisionario: (permisionarioId: string): Liquidacion[] =>
    liquidacionStore.getAll().filter((l) => l.permisionarioId === permisionarioId),
  create: (data: Omit<Liquidacion, 'id' | 'createdAt'>): Liquidacion => {
    const list = liquidacionStore.getAll();
    const l: Liquidacion = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(l);
    storageSet(K.liquidaciones, list);
    addAudit('liquidacion_create', 'liquidacion', l.id, { permisionarioId: l.permisionarioId, total: l.totalRecaudado });
    return l;
  },
  transferir: (id: string): Liquidacion | undefined => {
    const list = liquidacionStore.getAll();
    const idx = list.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], estado: 'transferida', transferidoAt: new Date().toISOString() };
    storageSet(K.liquidaciones, list);
    addAudit('liquidacion_transferir', 'liquidacion', id, {});
    return list[idx];
  },
};

// ─── Audit log ─────────────────────────────────────────────────────────────

export const auditStore = {
  getAll: (): AuditEvent[] => storageGet<AuditEvent[]>(K.auditEvents, []),
};

// ─── Estacionamientos ──────────────────────────────────────────────────────

export const estacionamientoStore = {
  getAll: (): Estacionamiento[] => storageGet<Estacionamiento[]>(K.estacionamientos, []),
  getActivos: (): Estacionamiento[] => estacionamientoStore.getAll().filter((e) => e.activo),
  getByPermisionarioCuadra: (permisionarioId: string, cuadra: string): Estacionamiento[] =>
    estacionamientoStore.getAll()
      .filter((e) => e.permisionarioId === permisionarioId && e.cuadra === cuadra)
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
      .slice(0, 20),
  getByDominio: (dominio: string): Estacionamiento[] =>
    estacionamientoStore.getAll()
      .filter((e) => e.dominio.toUpperCase() === dominio.toUpperCase())
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()),
  create: (data: Omit<Estacionamiento, 'id'>): Estacionamiento => {
    const list = estacionamientoStore.getAll();
    const e: Estacionamiento = { ...data, id: generateId() };
    list.push(e);
    storageSet(K.estacionamientos, list);
    addAudit('estacionamiento_create', 'estacionamiento', e.id, { dominio: e.dominio });
    return e;
  },
  update: (id: string, data: Partial<Estacionamiento>): Estacionamiento | undefined => {
    const list = estacionamientoStore.getAll();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...data };
    storageSet(K.estacionamientos, list);
    addAudit('estacionamiento_update', 'estacionamiento', id, {});
    return list[idx];
  },
};

// ─── Vehiculos Observados ──────────────────────────────────────────────────

export const observadoStore = {
  getAll: (): VehiculoObservado[] => storageGet<VehiculoObservado[]>(K.observados, []),
  getByPermisionarioCuadra: (permisionarioId: string, cuadra: string): VehiculoObservado[] =>
    observadoStore.getAll().filter((o) => o.permisionarioId === permisionarioId && o.cuadra === cuadra),
  getByDominio: (dominio: string): VehiculoObservado | undefined =>
    observadoStore.getAll().find((o) => o.dominio.toUpperCase() === dominio.toUpperCase()),
  create: (data: Omit<VehiculoObservado, 'id' | 'timestamp'>): VehiculoObservado => {
    const list = observadoStore.getAll();
    // remove previous observation for same domain if exists
    const filtered = list.filter((o) => o.dominio.toUpperCase() !== data.dominio.toUpperCase());
    const o: VehiculoObservado = { ...data, id: generateId(), timestamp: new Date().toISOString() };
    filtered.push(o);
    storageSet(K.observados, filtered);
    return o;
  },
  remove: (dominio: string) => {
    const list = observadoStore.getAll().filter((o) => o.dominio.toUpperCase() !== dominio.toUpperCase());
    storageSet(K.observados, list);
  },
};

