import type { DbStore } from './types';
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
  initializeIfNeeded as lsInit,
  resetToDemo as lsReset,
  permisionarioStore,
  conductorStore,
  vehiculoStore,
  ticketStore,
  pagoStore,
  deudaStore,
  emergenciaStore,
  liquidacionStore,
  estacionamientoStore,
  observadoStore,
  configStore,
  roleStore,
  auditStore,
} from '@/lib/sem-store';

export const localStorageStore: DbStore = {
  initializeIfNeeded: async () => { lsInit(); },
  resetToDemo: async () => { lsReset(); },

  role: {
    getRole: () => roleStore.getRole(),
    setRole: (r) => roleStore.setRole(r),
    getAdminRole: () => roleStore.getAdminRole(),
    setAdminRole: (r) => roleStore.setAdminRole(r),
    getActiveConductorId: () => roleStore.getActiveConductorId(),
    setActiveConductorId: (id) => roleStore.setActiveConductorId(id),
    getActivePermisionarioId: () => roleStore.getActivePermisionarioId(),
    setActivePermisionarioId: (id) => roleStore.setActivePermisionarioId(id),
  },

  config: {
    getTarifa: async () => configStore.getTarifa(),
    setTarifa: async (t) => { configStore.setTarifa(t); },
    getConfig: async () => configStore.getConfig(),
    setConfig: async (c) => { configStore.setConfig(c); },
    getZonas: async () => configStore.getZonas(),
    setZonas: async (z) => { configStore.setZonas(z); },
    getFeriados: async () => configStore.getFeriados(),
    setFeriados: async (f) => { configStore.setFeriados(f); },
    addFeriado: async (f) => configStore.addFeriado(f),
    removeFeriado: async (id) => { configStore.removeFeriado(id); },
  },

  permisionarios: {
    getAll: async () => permisionarioStore.getAll(),
    getById: async (id) => permisionarioStore.getById(id),
    create: async (data) => permisionarioStore.create(data),
    update: async (id, data) => permisionarioStore.update(id, data),
    delete: async (id) => { permisionarioStore.delete(id); },
  },

  conductores: {
    getAll: async () => conductorStore.getAll(),
    getById: async (id) => conductorStore.getById(id),
    create: async (data) => conductorStore.create(data),
    update: async (id, data) => conductorStore.update(id, data),
  },

  vehiculos: {
    getAll: async () => vehiculoStore.getAll(),
    getByDominio: async (d) => vehiculoStore.getByDominio(d),
    create: async (d) => vehiculoStore.create(d),
  },

  tickets: {
    getAll: async () => ticketStore.getAll(),
    getById: async (id) => ticketStore.getById(id),
    getByDominio: async (d) => ticketStore.getByDominio(d),
    getActivos: async () => ticketStore.getActivos(),
    getActivosByDominio: async (d) => ticketStore.getActivosByDominio(d),
    getByPermisionarioCuadra: async (pId, c) => ticketStore.getByPermisionarioCuadra(pId, c),
    create: async (data) => ticketStore.create(data),
    update: async (id, data) => ticketStore.update(id, data),
  },

  pagos: {
    getAll: async () => pagoStore.getAll(),
    getById: async (id) => pagoStore.getById(id),
    getByPermisionario: async (pId) => pagoStore.getByPermisionario(pId),
    create: async (data) => pagoStore.create(data),
    update: async (id, data) => pagoStore.update(id, data),
  },

  deudas: {
    getAll: async () => deudaStore.getAll(),
    getByDominio: async (d) => deudaStore.getByDominio(d),
    getPendientes: async () => deudaStore.getPendientes(),
    create: async (data) => deudaStore.create(data),
    update: async (id, data) => deudaStore.update(id, data),
  },

  emergencias: {
    getAll: async () => emergenciaStore.getAll(),
    getActivas: async () => emergenciaStore.getActivas(),
    create: async (data) => emergenciaStore.create(data),
    resolver: async (id, notas) => emergenciaStore.resolver(id, notas),
  },

  liquidaciones: {
    getAll: async () => liquidacionStore.getAll(),
    getByPermisionario: async (pId) => liquidacionStore.getByPermisionario(pId),
    create: async (data) => liquidacionStore.create(data),
    transferir: async (id) => liquidacionStore.transferir(id),
  },

  estacionamientos: {
    getAll: async () => estacionamientoStore.getAll(),
    getActivos: async () => estacionamientoStore.getActivos(),
    create: async (data) => estacionamientoStore.create(data),
    update: async (id, data) => estacionamientoStore.update(id, data),
  },

  observados: {
    getAll: async () => observadoStore.getAll(),
    getByPermisionarioCuadra: async (pId, c) => observadoStore.getByPermisionarioCuadra(pId, c),
    getByDominio: async (d) => observadoStore.getByDominio(d),
    create: async (data) => observadoStore.create(data),
    remove: async (d) => { observadoStore.remove(d); },
  },

  audit: {
    getAll: async () => auditStore.getAll(),
  },
};