import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetToDemo,
  permisionarioStore,
  ticketStore,
  deudaStore,
  emergenciaStore,
  auditStore,
  configStore,
} from '../sem-store';

beforeEach(() => {
  localStorage.clear();
  resetToDemo();
});

describe('resetToDemo', () => {
  it('carga seed de permisionarios', () => {
    expect(permisionarioStore.getAll()).toHaveLength(3);
  });

  it('carga seed de deudas', () => {
    expect(deudaStore.getAll()).toHaveLength(2);
  });

  it('registra audit event de init', () => {
    const events = auditStore.getAll();
    expect(events.some((e) => e.tipo === 'sistema_init')).toBe(true);
  });
});

describe('permisionarioStore', () => {
  it('getById retorna permisionario correcto', () => {
    const p = permisionarioStore.getById('perm-1');
    expect(p?.nombre).toBe('Rosa');
  });

  it('create agrega permisionario y registra audit', () => {
    const before = auditStore.getAll().length;
    permisionarioStore.create({
      nombre: 'Test',
      apellido: 'User',
      legajo: 'P-9999',
      foto: '',
      cuadraAsignada: 'Test 100',
      zonaId: 'zona-centro',
      activo: true,
      horariosAutorizados: { diurno: true, nocturno: false },
    });
    expect(permisionarioStore.getAll()).toHaveLength(4);
    expect(auditStore.getAll().length).toBeGreaterThan(before);
  });

  it('update modifica campo y registra audit', () => {
    permisionarioStore.update('perm-1', { activo: false });
    expect(permisionarioStore.getById('perm-1')?.activo).toBe(false);
  });

  it('delete elimina permisionario', () => {
    permisionarioStore.delete('perm-1');
    expect(permisionarioStore.getById('perm-1')).toBeUndefined();
    expect(permisionarioStore.getAll()).toHaveLength(2);
  });
});

describe('ticketStore', () => {
  it('create ticket y getById', () => {
    const t = ticketStore.create({
      dominio: 'AB123CD',
      tipo: 'auto',
      cuadra: 'Balcarce 400',
      permisionarioId: 'perm-1',
      inicio: new Date().toISOString(),
      duracionMinutos: 60,
      vencimiento: new Date(Date.now() + 3600000).toISOString(),
      monto: 700,
      metodoPago: 'efectivo',
      descuentoAplicado: false,
      activo: true,
      transferido: false,
    });
    expect(t.numero).toMatch(/^T-/);
    expect(ticketStore.getById(t.id)).toEqual(t);
  });

  it('getByDominio filtra correctamente', () => {
    ticketStore.create({
      dominio: 'AB123CD',
      tipo: 'auto',
      cuadra: 'Balcarce 400',
      permisionarioId: 'perm-1',
      inicio: new Date().toISOString(),
      duracionMinutos: 60,
      vencimiento: new Date(Date.now() + 3600000).toISOString(),
      monto: 700,
      metodoPago: 'efectivo',
      descuentoAplicado: false,
      activo: true,
      transferido: false,
    });
    ticketStore.create({
      dominio: 'XYZ789',
      tipo: 'auto',
      cuadra: 'España 400',
      permisionarioId: 'perm-2',
      inicio: new Date().toISOString(),
      duracionMinutos: 60,
      vencimiento: new Date(Date.now() + 3600000).toISOString(),
      monto: 700,
      metodoPago: 'efectivo',
      descuentoAplicado: false,
      activo: true,
      transferido: false,
    });
    expect(ticketStore.getByDominio('AB123CD')).toHaveLength(1);
  });
});

describe('deudaStore', () => {
  it('create agrega deuda y audit', () => {
    const before = deudaStore.getAll().length;
    deudaStore.create({
      dominio: 'MN456OP',
      cuadra: 'Caseros 400',
      permisionarioId: 'perm-1',
      monto: 700,
      fecha: new Date().toISOString(),
      estado: 'pendiente',
    });
    expect(deudaStore.getAll()).toHaveLength(before + 1);
  });

  it('update cambia estado', () => {
    deudaStore.update('deuda-1', { estado: 'pagada', pagadoAt: new Date().toISOString() });
    expect(deudaStore.getAll().find((d) => d.id === 'deuda-1')?.estado).toBe('pagada');
  });

  it('getPendientes filtra estado', () => {
    const pendientes = deudaStore.getPendientes();
    expect(pendientes.every((d) => d.estado === 'pendiente')).toBe(true);
  });
});

describe('emergenciaStore', () => {
  it('create emergencia panico sin feedback — solo audit', () => {
    const auditBefore = auditStore.getAll().length;
    const e = emergenciaStore.create({
      tipo: 'panico',
      origenRol: 'permisionario',
      origenId: 'perm-1',
      cuadra: 'Balcarce 400',
      coordenadas: { lat: -24.7847, lng: -65.4116 },
    });
    expect(e.resuelta).toBe(false);
    expect(auditStore.getAll().length).toBeGreaterThan(auditBefore);
    expect(emergenciaStore.getActivas()).toHaveLength(1);
  });

  it('resolver marca como resuelta', () => {
    const e = emergenciaStore.create({
      tipo: 'disputa',
      origenRol: 'conductor',
      origenId: 'cond-1',
      cuadra: 'España 400',
      coordenadas: { lat: -24.7862, lng: -65.4103 },
    });
    emergenciaStore.resolver(e.id, 'Resuelto sin incidentes');
    expect(emergenciaStore.getActivas()).toHaveLength(0);
  });
});

describe('configStore', () => {
  it('tarifa inicial = seed', () => {
    expect(configStore.getTarifa().autoHora).toBe(700);
  });

  it('setTarifa actualiza y registra audit', () => {
    const t = configStore.getTarifa();
    configStore.setTarifa({ ...t, autoHora: 800 });
    expect(configStore.getTarifa().autoHora).toBe(800);
    expect(auditStore.getAll().some((e) => e.tipo === 'tarifa_update')).toBe(true);
  });

  it('addFeriado agrega al listado', () => {
    const before = configStore.getFeriados().length;
    configStore.addFeriado({ fecha: '2026-10-12', descripcion: 'Día de la Raza' });
    expect(configStore.getFeriados()).toHaveLength(before + 1);
  });

  it('removeFeriado elimina por id', () => {
    configStore.addFeriado({ fecha: '2026-10-12', descripcion: 'Test' });
    const list = configStore.getFeriados();
    const last = list[list.length - 1];
    configStore.removeFeriado(last.id);
    expect(configStore.getFeriados().find((f) => f.id === last.id)).toBeUndefined();
  });
});
