import type { DbStore } from './types';
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
} from '@/domain/types';
import { supabase } from '@/lib/supabase-client';
import type { Database } from '@/lib/database.types';
import type { TablesUpdate } from '@/lib/database.types';
import {
  mapZona,
  mapTarifa,
  mapFeriado,
  mapConfig,
  mapPermisionario,
  mapConductor,
  mapVehiculo,
  mapEstacionamiento,
  mapPago,
  mapTicket,
  mapDeuda,
  mapEmergencia,
  mapLiquidacion,
  mapAuditEvent,
  mapObservado,
  loadCuadrasCache,
  toDbPermisionario,
  toDbEstacionamiento,
  toDbTicket,
  toDbPago,
  toDbDeuda,
  toDbEmergencia,
  toDbLiquidacion,
} from './mappers';

let ticketCounter = 1000;
function nextTicketNumber(): string {
  ticketCounter += 1;
  return `T-${ticketCounter}`;
}

async function addAudit(tipo: string, entidad: string, entidadId: string, datos: Record<string, unknown>): Promise<void> {
  const rol = localStorage.getItem('sem_active_role') ?? 'sistema';
  const usuarioId =
    localStorage.getItem('sem_conductor_id') ||
    localStorage.getItem('sem_permisionario_id') ||
    'sistema';
  await supabase.from('audit_events').insert({
    tipo,
    entidad,
    entidad_id: entidadId,
    usuario_rol: rol,
    usuario_id: usuarioId,
    datos: datos as Record<string, string | number | boolean | null>,
  });
}

async function resolveCuadraId(cuadraNombre: string): Promise<string> {
  const { data } = await supabase.from('cuadras').select('id').eq('nombre', cuadraNombre).single();
  if (data) return data.id;
  const { data: inserted } = await supabase.from('cuadras').insert({ nombre: cuadraNombre, zona_id: 'zona-centro' }).select('id').single();
  return inserted!.id;
}

export const supabaseStore: DbStore = {
  async initializeIfNeeded() {},
  async resetToDemo() {},

  role: {
    getRole: (): UserRole => {
      if (typeof window === 'undefined') return 'conductor';
      return (localStorage.getItem('sem_active_role') as UserRole) ?? 'conductor';
    },
    setRole: (r: UserRole) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('sem_active_role', r);
    },
    getAdminRole: (): AdminRole => {
      if (typeof window === 'undefined') return 'administrador';
      return (localStorage.getItem('sem_admin_role') as AdminRole) ?? 'administrador';
    },
    setAdminRole: (r: AdminRole) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('sem_admin_role', r);
    },
    getActiveConductorId: (): string | null => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('sem_conductor_id') || null;
    },
    setActiveConductorId: (id: string | null) => {
      if (typeof window === 'undefined') return;
      if (id) localStorage.setItem('sem_conductor_id', id);
      else localStorage.removeItem('sem_conductor_id');
    },
    getActivePermisionarioId: (): string | null => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('sem_permisionario_id') || null;
    },
    setActivePermisionarioId: (id: string | null) => {
      if (typeof window === 'undefined') return;
      if (id) localStorage.setItem('sem_permisionario_id', id);
      else localStorage.removeItem('sem_permisionario_id');
    },
  },

  config: {
    getTarifa: async (): Promise<Tarifa> => {
      const { data } = await supabase.from('tarifas').select('*').order('vigente_desde', { ascending: false }).limit(1).single();
      return data ? mapTarifa(data) : { id: 'tarifa-1', autoHora: 700, motoHora: 300, descuentoDigital: 0.2, toleranciaMinutos: 5, fraccionamientoMinutos: 15, fraccionamientoDesdeHora: 2 };
    },
    setTarifa: async (t: Tarifa) => {
      await supabase.from('tarifas').insert({
        id: t.id,
        auto_hora: t.autoHora,
        moto_hora: t.motoHora,
        descuento_digital: t.descuentoDigital,
        tolerancia_minutos: t.toleranciaMinutos,
        fraccionamiento_minutos: t.fraccionamientoMinutos,
        fraccionamiento_desde_hora: t.fraccionamientoDesdeHora,
      });
      await addAudit('tarifa_update', 'tarifa', t.id, {});
    },
    getConfig: async (): Promise<ConfiguracionNormativa> => {
      const { data } = await supabase.from('configuracion_normativa').select('*').order('vigente_desde', { ascending: false }).limit(1).single();
      return data ? mapConfig(data) : { horarioDiurnoInicio: '07:00', horarioDiurnoFinSemana: '21:00', horarioDiurnoFinSabado: '14:00', horarioNocturnoInicio: '22:00', horarioNocturnoFin: '05:00' };
    },
    setConfig: async (c: ConfiguracionNormativa) => {
      await supabase.from('configuracion_normativa').insert({
        horario_diurno_inicio: c.horarioDiurnoInicio,
        horario_diurno_fin_semana: c.horarioDiurnoFinSemana,
        horario_diurno_fin_sabado: c.horarioDiurnoFinSabado,
        horario_nocturno_inicio: c.horarioNocturnoInicio,
        horario_nocturno_fin: c.horarioNocturnoFin,
      });
      await addAudit('config_update', 'config', 'sem', {});
    },
    getZonas: async (): Promise<Zona[]> => {
      const { data: zonas } = await supabase.from('zonas').select('*, cuadras(*)').order('nombre');
      if (!zonas) return [];
      return zonas.map((z: Record<string, unknown>) => mapZona(z as Parameters<typeof mapZona>[0]));
    },
    setZonas: async (zonas: Zona[]) => {
      for (const z of zonas) {
        await supabase.from('zonas').upsert({ id: z.id, nombre: z.nombre, nocturno_habilitado: z.nocturnoHabilitado }, { onConflict: 'id' });
        for (const cn of z.cuadras) {
          await supabase.from('cuadras').upsert({ nombre: cn, zona_id: z.id }, { onConflict: 'nombre,zona_id' });
        }
      }
      await addAudit('zonas_update', 'zonas', 'sem', {});
    },
    getFeriados: async (): Promise<Feriado[]> => {
      const { data } = await supabase.from('feriados').select('*').order('fecha');
      return data ? data.map(mapFeriado) : [];
    },
    setFeriados: async (feriados: Feriado[]) => {
      await supabase.from('feriados').delete().neq('id', '');
      if (feriados.length > 0) {
        await supabase.from('feriados').insert(feriados.map((f) => ({ id: f.id, fecha: f.fecha, descripcion: f.descripcion })));
      }
      await addAudit('feriados_update', 'feriados', 'sem', {});
    },
    addFeriado: async (f: Omit<Feriado, 'id'>): Promise<Feriado> => {
      const { data } = await supabase.from('feriados').insert({ fecha: f.fecha, descripcion: f.descripcion }).select().single();
      const mapped = mapFeriado(data!);
      await addAudit('feriado_add', 'feriado', mapped.id, {});
      return mapped;
    },
    removeFeriado: async (id: string) => {
      await supabase.from('feriados').delete().eq('id', id);
      await addAudit('feriado_remove', 'feriado', id, {});
    },
  },

  permisionarios: {
    getAll: async (): Promise<Permisionario[]> => {
      const { data: rows } = await supabase.from('permisionarios').select('*').eq('activo', true);
      if (!rows) return [];
      const cache = await loadCuadrasCache(supabase);
      return Promise.all(rows.map((r) => mapPermisionario(r, supabase, cache)));
    },
    getById: async (id: string): Promise<Permisionario | undefined> => {
      const { data: row } = await supabase.from('permisionarios').select('*').eq('id', id).single();
      if (!row) return undefined;
      const cache = await loadCuadrasCache(supabase);
      return mapPermisionario(row, supabase, cache);
    },
    create: async (data: Omit<Permisionario, 'id' | 'createdAt'>): Promise<Permisionario> => {
      const cuadraId = await resolveCuadraId(data.cuadraAsignada);
      const { data: userRow } = await supabase.from('users').insert({
        email: `${data.legajo.toLowerCase()}@sem.gob.ar`,
        password: '$2a$10$placeholder',
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: null,
        rol: 'permisionario' as const,
      }).select().single();
      const userId = userRow!.id;
      const insert = toDbPermisionario(data, cuadraId, userId);
      const { data: row } = await supabase.from('permisionarios').insert(insert).select().single();
      const cache = await loadCuadrasCache(supabase);
      const p = await mapPermisionario(row!, supabase, cache);
      await addAudit('permisionario_create', 'permisionario', p.id, {});
      return p;
    },
    update: async (id: string, data: Partial<Permisionario>): Promise<Permisionario | undefined> => {
      const update: Partial<TablesUpdate<'permisionarios'>> = {};
      if (data.activo !== undefined) update.activo = data.activo;
      if (data.legajo !== undefined) update.legajo = data.legajo;
      if (data.foto !== undefined) update.foto = data.foto;
      if (data.zonaId !== undefined) update.zona_id = data.zonaId;
      if (data.aliasMercadoPago !== undefined) update.alias_mercado_pago = data.aliasMercadoPago;
      if (data.cuadraAsignada !== undefined) update.cuadra_id = await resolveCuadraId(data.cuadraAsignada);

      const { data: row } = await supabase.from('permisionarios').update(update).eq('id', id).select().single();
      if (!row) return undefined;
      const cache = await loadCuadrasCache(supabase);
      await addAudit('permisionario_update', 'permisionario', id, {});
      return mapPermisionario(row, supabase, cache);
    },
    delete: async (id: string) => {
      await supabase.from('permisionarios').update({ activo: false }).eq('id', id);
      await addAudit('permisionario_delete', 'permisionario', id, {});
    },
  },

  conductores: {
    getAll: async (): Promise<Conductor[]> => {
      const { data: rows } = await supabase.from('conductores').select('*, users(*)');
      if (!rows) return [];
      return rows.map((r: Record<string, unknown>) => mapConductor(r as Record<string, unknown>, r.users as Record<string, unknown> | null));
    },
    getById: async (id: string): Promise<Conductor | undefined> => {
      const { data: row } = await supabase.from('conductores').select('*, users(*)').eq('id', id).single();
      if (!row) return undefined;
      return mapConductor(row as Record<string, unknown>, (row as Record<string, unknown>).users as Record<string, unknown> | null);
    },
    create: async (data: Omit<Conductor, 'id' | 'createdAt'>): Promise<Conductor> => {
      const { data: userRow } = await supabase.from('users').insert({
        email: data.email,
        password: '$2a$10$placeholder',
        nombre: data.nombre,
        apellido: '',
        telefono: data.telefono ?? null,
        rol: 'conductor' as const,
      }).select().single();
      const { data: condRow } = await supabase.from('conductores').insert({
        user_id: userRow!.id,
        dominio_default: data.dominioDefault,
      }).select().single();
      await addAudit('conductor_create', 'conductor', condRow!.id, {});
      return mapConductor(condRow!, userRow!);
    },
    update: async (id: string, data: Partial<Conductor>): Promise<Conductor | undefined> => {
      const { data: row } = await supabase.from('conductores').update({
        dominio_default: data.dominioDefault,
      }).eq('id', id).select('*, users(*)').single();
      if (!row) return undefined;
      await addAudit('conductor_update', 'conductor', id, {});
      return mapConductor(row as Record<string, unknown>, (row as Record<string, unknown>).users as Record<string, unknown> | null);
    },
  },

  vehiculos: {
    getAll: async (): Promise<Vehiculo[]> => {
      const { data } = await supabase.from('vehiculos').select('*');
      return data ? data.map(mapVehiculo) : [];
    },
    getByDominio: async (dominio: string): Promise<Vehiculo | undefined> => {
      const { data } = await supabase.from('vehiculos').select('*').eq('dominio', dominio.toUpperCase()).single();
      return data ? mapVehiculo(data) : undefined;
    },
    create: async (data: Omit<Vehiculo, 'id'>): Promise<Vehiculo> => {
      const { data: row } = await supabase.from('vehiculos').insert({
        dominio: data.dominio,
        tipo: data.tipo,
        conductor_id: data.conductorId ?? null,
      }).select().single();
      await addAudit('vehiculo_create', 'vehiculo', row!.id, { dominio: data.dominio });
      return mapVehiculo(row!);
    },
  },

  tickets: {
    getAll: async (): Promise<Ticket[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('tickets').select('*');
      return data ? data.map((r) => mapTicket(r, cache)) : [];
    },
    getById: async (id: string): Promise<Ticket | undefined> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('tickets').select('*').eq('id', id).single();
      return data ? mapTicket(data, cache) : undefined;
    },
    getByDominio: async (dominio: string): Promise<Ticket[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('tickets').select('*').eq('dominio', dominio.toUpperCase());
      return data ? data.map((r) => mapTicket(r, cache)) : [];
    },
    getActivos: async (): Promise<Ticket[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('tickets').select('*').eq('activo', true);
      return data ? data.map((r) => mapTicket(r, cache)) : [];
    },
    getActivosByDominio: async (dominio: string): Promise<Ticket | undefined> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('tickets').select('*').eq('dominio', dominio.toUpperCase()).eq('activo', true).order('inicio', { ascending: false }).limit(1).single();
      return data ? mapTicket(data, cache) : undefined;
    },
    getByPermisionarioCuadra: async (permisionarioId: string, cuadra: string): Promise<Ticket[]> => {
      const cache = await loadCuadrasCache(supabase);
      const cuadraId = [...cache.entries()].find(([, v]) => v === cuadra)?.[0] ?? cuadra;
      const { data } = await supabase.from('tickets').select('*').eq('permisionario_id', permisionarioId).eq('cuadra_id', cuadraId).eq('activo', true);
      return data ? data.map((r) => mapTicket(r, cache)) : [];
    },
    create: async (data: Omit<Ticket, 'id' | 'numero'>): Promise<Ticket> => {
      const cache = await loadCuadrasCache(supabase);
      const cuadraId = await resolveCuadraId(data.cuadra);
      const num = nextTicketNumber();
      const insert = toDbTicket(data);
      insert.numero = num;
      insert.cuadra_id = cuadraId;
      const { data: row } = await supabase.from('tickets').insert(insert).select().single();
      await addAudit('ticket_create', 'ticket', row!.id, { dominio: data.dominio, monto: data.monto });
      return mapTicket(row!, cache);
    },
    update: async (id: string, data: Partial<Ticket>): Promise<Ticket | undefined> => {
      const cache = await loadCuadrasCache(supabase);
      const update: Partial<TablesUpdate<'tickets'>> = {};
      if (data.activo !== undefined) update.activo = data.activo;
      if (data.dominio !== undefined) update.dominio = data.dominio;
      if (data.monto !== undefined) update.monto = data.monto;
      if (data.cuadra !== undefined) update.cuadra_id = await resolveCuadraId(data.cuadra);
      const { data: row } = await supabase.from('tickets').update(update).eq('id', id).select().single();
      if (!row) return undefined;
      await addAudit('ticket_update', 'ticket', id, {});
      return mapTicket(row, cache);
    },
  },

  pagos: {
    getAll: async (): Promise<Pago[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('pagos').select('*');
      return data ? data.map((r) => mapPago(r, cache)) : [];
    },
    getById: async (id: string): Promise<Pago | undefined> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('pagos').select('*').eq('id', id).single();
      return data ? mapPago(data, cache) : undefined;
    },
    getByPermisionario: async (permisionarioId: string): Promise<Pago[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('pagos').select('*').eq('permisionario_id', permisionarioId);
      return data ? data.map((r) => mapPago(r, cache)) : [];
    },
    create: async (data: Omit<Pago, 'id' | 'createdAt'>): Promise<Pago> => {
      const cache = await loadCuadrasCache(supabase);
      const cuadraId = data.cuadra ? await resolveCuadraId(data.cuadra) : '';
      const insert = toDbPago(data);
      insert.cuadra_id = cuadraId || insert.cuadra_id;
      const { data: row } = await supabase.from('pagos').insert(insert).select().single();
      await addAudit('pago_create', 'pago', row!.id, { monto: data.monto, metodo: data.metodoPago });
      return mapPago(row!, cache);
    },
    update: async (id: string, data: Partial<Pago>): Promise<Pago | undefined> => {
      const cache = await loadCuadrasCache(supabase);
      const update: Partial<TablesUpdate<'pagos'>> = {};
      if (data.estado !== undefined) update.estado = data.estado;
      const { data: row } = await supabase.from('pagos').update(update).eq('id', id).select().single();
      if (!row) return undefined;
      await addAudit('pago_update', 'pago', id, {});
      return mapPago(row, cache);
    },
  },

  deudas: {
    getAll: async (): Promise<Deuda[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('deudas').select('*');
      return data ? data.map((r) => mapDeuda(r, cache)) : [];
    },
    getByDominio: async (dominio: string): Promise<Deuda[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('deudas').select('*').eq('dominio', dominio);
      return data ? data.map((r) => mapDeuda(r, cache)) : [];
    },
    getPendientes: async (): Promise<Deuda[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('deudas').select('*').eq('estado', 'pendiente');
      return data ? data.map((r) => mapDeuda(r, cache)) : [];
    },
    create: async (data: Omit<Deuda, 'id'>): Promise<Deuda> => {
      const cache = await loadCuadrasCache(supabase);
      const cuadraId = await resolveCuadraId(data.cuadra);
      const insert = toDbDeuda(data);
      insert.cuadra_id = cuadraId;
      const { data: row } = await supabase.from('deudas').insert(insert).select().single();
      await addAudit('deuda_create', 'deuda', row!.id, { dominio: data.dominio, monto: data.monto });
      return mapDeuda(row!, cache);
    },
    update: async (id: string, data: Partial<Deuda>): Promise<Deuda | undefined> => {
      const cache = await loadCuadrasCache(supabase);
      const update: Partial<TablesUpdate<'deudas'>> = {};
      if (data.estado !== undefined) update.estado = data.estado;
      if (data.pagadoAt !== undefined) update.pagado_at = data.pagadoAt;
      if (data.pagoId !== undefined) update.pago_id = data.pagoId;
      const { data: row } = await supabase.from('deudas').update(update).eq('id', id).select().single();
      if (!row) return undefined;
      await addAudit('deuda_update', 'deuda', id, {});
      return mapDeuda(row, cache);
    },
  },

  emergencias: {
    getAll: async (): Promise<Emergencia[]> => {
      const { data } = await supabase.from('emergencias').select('*');
      return data ? data.map(mapEmergencia) : [];
    },
    getActivas: async (): Promise<Emergencia[]> => {
      const { data } = await supabase.from('emergencias').select('*').eq('resuelta', false);
      return data ? data.map(mapEmergencia) : [];
    },
    create: async (data: Omit<Emergencia, 'id' | 'timestamp' | 'resuelta'>): Promise<Emergencia> => {
      const cuadraId = await resolveCuadraId(data.cuadra);
      const insert = toDbEmergencia(data);
      insert.cuadra_id = cuadraId;
      const { data: row } = await supabase.from('emergencias').insert(insert).select().single();
      await addAudit('emergencia_create', 'emergencia', row!.id, { tipo: data.tipo });
      return mapEmergencia(row!);
    },
    resolver: async (id: string, notas?: string): Promise<Emergencia | undefined> => {
      const { data: row } = await supabase.from('emergencias').update({
        resuelta: true,
        resuelto_at: new Date().toISOString(),
        notas: notas ?? null,
      }).eq('id', id).select().single();
      if (!row) return undefined;
      await addAudit('emergencia_resolver', 'emergencia', id, {});
      return mapEmergencia(row);
    },
  },

  liquidaciones: {
    getAll: async (): Promise<Liquidacion[]> => {
      const { data } = await supabase.from('liquidaciones').select('*');
      return data ? data.map(mapLiquidacion) : [];
    },
    getByPermisionario: async (permisionarioId: string): Promise<Liquidacion[]> => {
      const { data } = await supabase.from('liquidaciones').select('*').eq('permisionario_id', permisionarioId);
      return data ? data.map(mapLiquidacion) : [];
    },
    create: async (data: Omit<Liquidacion, 'id' | 'createdAt'>): Promise<Liquidacion> => {
      const insert = toDbLiquidacion(data);
      const { data: row } = await supabase.from('liquidaciones').insert(insert).select().single();
      await addAudit('liquidacion_create', 'liquidacion', row!.id, { permisionarioId: data.permisionarioId, total: data.totalRecaudado });
      return mapLiquidacion(row!);
    },
    transferir: async (id: string): Promise<Liquidacion | undefined> => {
      const { data: row } = await supabase.from('liquidaciones').update({
        estado: 'transferida',
        transferido_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (!row) return undefined;
      await addAudit('liquidacion_transferir', 'liquidacion', id, {});
      return mapLiquidacion(row);
    },
  },

  estacionamientos: {
    getAll: async (): Promise<Estacionamiento[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('estacionamientos').select('*');
      return data ? data.map((r) => mapEstacionamiento(r, cache)) : [];
    },
    getActivos: async (): Promise<Estacionamiento[]> => {
      const cache = await loadCuadrasCache(supabase);
      const { data } = await supabase.from('estacionamientos').select('*').eq('estado', 'activo');
      return data ? data.map((r) => mapEstacionamiento(r, cache)) : [];
    },
    create: async (data: Omit<Estacionamiento, 'id'>): Promise<Estacionamiento> => {
      const cache = await loadCuadrasCache(supabase);
      const insert = toDbEstacionamiento(data);
      const { data: row } = await supabase.from('estacionamientos').insert(insert).select().single();
      await addAudit('estacionamiento_create', 'estacionamiento', row!.id, { dominio: data.dominio });
      return mapEstacionamiento(row!, cache);
    },
    update: async (id: string, data: Partial<Estacionamiento>): Promise<Estacionamiento | undefined> => {
      const cache = await loadCuadrasCache(supabase);
      const update: Partial<TablesUpdate<'estacionamientos'>> = {};
      if (data.fin !== undefined) update.fin = data.fin ?? null;
      if (data.activo !== undefined) update.estado = data.activo ? 'activo' as const : 'finalizado' as const;
      if (data.transferido !== undefined) update.transferido = data.transferido;
      const { data: row } = await supabase.from('estacionamientos').update(update).eq('id', id).select().single();
      if (!row) return undefined;
      await addAudit('estacionamiento_update', 'estacionamiento', id, {});
      return mapEstacionamiento(row, cache);
    },
  },

  observados: {
    getAll: async (): Promise<VehiculoObservado[]> => {
      const { data } = await supabase.from('vehiculos_observados').select('*');
      return data ? data.map(mapObservado) : [];
    },
    getByPermisionarioCuadra: async (permisionarioId: string, cuadra: string): Promise<VehiculoObservado[]> => {
      const cuadraId = await resolveCuadraId(cuadra);
      const { data } = await supabase.from('vehiculos_observados').select('*').eq('permisionario_id', permisionarioId).eq('cuadra_id', cuadraId);
      return data ? data.map(mapObservado) : [];
    },
    getByDominio: async (dominio: string): Promise<VehiculoObservado | undefined> => {
      const { data } = await supabase.from('vehiculos_observados').select('*').eq('dominio', dominio.toUpperCase()).limit(1).single();
      return data ? mapObservado(data) : undefined;
    },
    create: async (data: Omit<VehiculoObservado, 'id' | 'timestamp'>): Promise<VehiculoObservado> => {
      const cuadraId = await resolveCuadraId(data.cuadra);
      await supabase.from('vehiculos_observados').delete().eq('dominio', data.dominio.toUpperCase());
      const { data: row } = await supabase.from('vehiculos_observados').insert({
        dominio: data.dominio,
        permisionario_id: data.permisionarioId,
        cuadra_id: cuadraId,
      }).select().single();
      return mapObservado(row!);
    },
    remove: async (dominio: string) => {
      await supabase.from('vehiculos_observados').delete().eq('dominio', dominio.toUpperCase());
    },
  },

  audit: {
    getAll: async (): Promise<AuditEvent[]> => {
      const { data } = await supabase.from('audit_events').select('*').order('timestamp', { ascending: false }).limit(1000);
      return data ? data.map(mapAuditEvent) : [];
    },
  },
};