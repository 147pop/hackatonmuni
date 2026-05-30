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

export interface DbStore {
  initializeIfNeeded(): Promise<void>;
  resetToDemo(): Promise<void>;

  role: {
    getRole(): UserRole;
    setRole(r: UserRole): void;
    getAdminRole(): AdminRole;
    setAdminRole(r: AdminRole): void;
    getActiveConductorId(): string | null;
    setActiveConductorId(id: string | null): void;
    getActivePermisionarioId(): string | null;
    setActivePermisionarioId(id: string | null): void;
  };

  config: {
    getTarifa(): Promise<Tarifa>;
    setTarifa(t: Tarifa): Promise<void>;
    getConfig(): Promise<ConfiguracionNormativa>;
    setConfig(c: ConfiguracionNormativa): Promise<void>;
    getZonas(): Promise<Zona[]>;
    setZonas(z: Zona[]): Promise<void>;
    getFeriados(): Promise<Feriado[]>;
    setFeriados(f: Feriado[]): Promise<void>;
    addFeriado(f: Omit<Feriado, 'id'>): Promise<Feriado>;
    removeFeriado(id: string): Promise<void>;
  };

  permisionarios: {
    getAll(): Promise<Permisionario[]>;
    getById(id: string): Promise<Permisionario | undefined>;
    create(data: Omit<Permisionario, 'id' | 'createdAt'>): Promise<Permisionario>;
    update(id: string, data: Partial<Permisionario>): Promise<Permisionario | undefined>;
    delete(id: string): Promise<void>;
  };

  conductores: {
    getAll(): Promise<Conductor[]>;
    getById(id: string): Promise<Conductor | undefined>;
    create(data: Omit<Conductor, 'id' | 'createdAt'>): Promise<Conductor>;
    update(id: string, data: Partial<Conductor>): Promise<Conductor | undefined>;
  };

  vehiculos: {
    getAll(): Promise<Vehiculo[]>;
    getByDominio(dominio: string): Promise<Vehiculo | undefined>;
    create(data: Omit<Vehiculo, 'id'>): Promise<Vehiculo>;
  };

  tickets: {
    getAll(): Promise<Ticket[]>;
    getById(id: string): Promise<Ticket | undefined>;
    getByDominio(dominio: string): Promise<Ticket[]>;
    getActivos(): Promise<Ticket[]>;
    getActivosByDominio(dominio: string): Promise<Ticket | undefined>;
    getByPermisionarioCuadra(permisionarioId: string, cuadra: string): Promise<Ticket[]>;
    create(data: Omit<Ticket, 'id' | 'numero'>): Promise<Ticket>;
    update(id: string, data: Partial<Ticket>): Promise<Ticket | undefined>;
  };

  pagos: {
    getAll(): Promise<Pago[]>;
    getById(id: string): Promise<Pago | undefined>;
    getByPermisionario(permisionarioId: string): Promise<Pago[]>;
    create(data: Omit<Pago, 'id' | 'createdAt'>): Promise<Pago>;
    update(id: string, data: Partial<Pago>): Promise<Pago | undefined>;
  };

  deudas: {
    getAll(): Promise<Deuda[]>;
    getByDominio(dominio: string): Promise<Deuda[]>;
    getPendientes(): Promise<Deuda[]>;
    create(data: Omit<Deuda, 'id'>): Promise<Deuda>;
    update(id: string, data: Partial<Deuda>): Promise<Deuda | undefined>;
  };

  emergencias: {
    getAll(): Promise<Emergencia[]>;
    getActivas(): Promise<Emergencia[]>;
    create(data: Omit<Emergencia, 'id' | 'timestamp' | 'resuelta'>): Promise<Emergencia>;
    resolver(id: string, notas?: string): Promise<Emergencia | undefined>;
  };

  liquidaciones: {
    getAll(): Promise<Liquidacion[]>;
    getByPermisionario(permisionarioId: string): Promise<Liquidacion[]>;
    create(data: Omit<Liquidacion, 'id' | 'createdAt'>): Promise<Liquidacion>;
    transferir(id: string): Promise<Liquidacion | undefined>;
  };

  estacionamientos: {
    getAll(): Promise<Estacionamiento[]>;
    getActivos(): Promise<Estacionamiento[]>;
    getByPermisionarioCuadra(permisionarioId: string, cuadra: string): Promise<Estacionamiento[]>;
    getByDominio(dominio: string): Promise<Estacionamiento[]>;
    create(data: Omit<Estacionamiento, 'id'>): Promise<Estacionamiento>;
    update(id: string, data: Partial<Estacionamiento>): Promise<Estacionamiento | undefined>;
  };

  observados: {
    getAll(): Promise<VehiculoObservado[]>;
    getByPermisionarioCuadra(permisionarioId: string, cuadra: string): Promise<VehiculoObservado[]>;
    getByDominio(dominio: string): Promise<VehiculoObservado | undefined>;
    create(data: Omit<VehiculoObservado, 'id' | 'timestamp'>): Promise<VehiculoObservado>;
    remove(dominio: string): Promise<void>;
  };

  audit: {
    getAll(): Promise<AuditEvent[]>;
  };
}