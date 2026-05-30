'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, MapPin, Car, AlertTriangle, Wallet, CheckCircle,
  Clock, SlidersHorizontal, DollarSign, LayoutGrid,
  BarChart3, MoreHorizontal, ChevronDown, AlertCircle, Menu, User,
} from 'lucide-react';
import {
  permisionarioStore, roleStore, configStore,
  observadoStore, ticketStore, pagoStore,
} from '@/lib/sem-store';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import type { Permisionario, Ticket, VehiculoObservado } from '@/domain/types';
import { ROUTES } from '@/lib/routes';
import { PlateInput } from '@/components/plate-input';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getTurno(zonaId: string): string {
  const zonas = configStore.getZonas();
  const zona = zonas.find((z) => z.id === zonaId);
  if (!zona) return '–';
  if (zona.nocturnoHabilitado) return '19:00 – 05:00';
  return '07:00 – 21:00';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

import React from 'react';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: unknown}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <div style={{padding: 20, color: 'red'}}><h1>Something went wrong in PermisionarioPage.</h1><pre>{(this.state.error as Error)?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

function PermisionarioPageContent() {
  const [perm, setPerm] = useState<Permisionario | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'inicio' | 'vehiculos' | 'cobros' | 'reportes' | 'mas'>('inicio');

  useEffect(() => {
    try {
      const id = roleStore.getActivePermisionarioId();
      if (id) setPerm(permisionarioStore.getById(id) ?? null);
    } catch (e) {
      console.error("Error in PermisionarioPageContent useEffect:", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  function selectPermisionario(id: string) {
    roleStore.setActivePermisionarioId(id);
    setPerm(permisionarioStore.getById(id) ?? null);
  }

  if (!loaded) return <div style={{padding: 20}}>Cargando permisionario...</div>;
  if (!perm) return <PermisionarioSelector onSelect={selectPermisionario} />;

  return <DashboardView perm={perm} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

export default function PermisionarioPage() {
  return (
    <ErrorBoundary>
      <PermisionarioPageContent />
    </ErrorBoundary>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardView({
  perm, activeTab, setActiveTab,
}: {
  perm: Permisionario;
  activeTab: string;
  setActiveTab: (t: 'inicio' | 'vehiculos' | 'cobros' | 'reportes' | 'mas') => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [patenteValue, setPatenteValue] = useState('');
  const [patenteValid, setPatenteValid] = useState(false);
  const cuadra = perm.cuadraAsignada;

  function refresh() { setRefreshKey((k) => k + 1); setPatenteValue(''); setPatenteValid(false); }

  const tickets = ticketStore.getByPermisionarioCuadra(perm.id, cuadra);
  const hoy = new Date().toISOString().split('T')[0];
  const pagosHoy = pagoStore.getAll().filter(
    (p) => p.permisionarioId === perm.id && p.createdAt.startsWith(hoy) && p.estado === 'success'
  );
  const totalRecaudado = pagosHoy.reduce((s, p) => s + p.monto, 0);

  const observados = observadoStore.getByPermisionarioCuadra(perm.id, cuadra);
  const ticketsActivos = tickets.filter((t) => calcularTiempoRestanteMinutos(t.vencimiento) > 0);
  const ticketsVencidos = tickets.filter((t) => calcularTiempoRestanteMinutos(t.vencimiento) <= 0);
  const impagosObs = observados.filter(
    (obs) =>
      !ticketsActivos.some((t) => t.dominio.toUpperCase() === obs.dominio.toUpperCase()) &&
      !ticketsVencidos.some((t) => t.dominio.toUpperCase() === obs.dominio.toUpperCase())
  );

  const vehiculosEnZona = ticketsActivos.length + impagosObs.length + ticketsVencidos.length;
  const pagosRealizados = pagosHoy.length;
  const impagosCount = impagosObs.length + ticketsVencidos.length;
  const turnoActual = getTurno(perm.zonaId);

  return (
    <div className="lc-app" key={refreshKey}>
      <style>{STYLES}</style>

      {/* ── Header ── */}
      <header className="lc-header">
        <img src="/logomain.png" alt="La Cuadra — Municipalidad de Salta" className="lc-logo" />
      </header>

      {/* ── Scroll body ── */}
      <div className="lc-body">

        {/* Greeting */}
        <div className="lc-greeting-card">
          <div className="lc-avatar">
            <User className="w-7 h-7" style={{ color: '#fff' }} />
          </div>
          <div className="lc-greeting-info">
            <p className="lc-greeting-name">
              Hola, <span className="lc-greeting-highlight">{perm.nombre}</span>
            </p>
            <Link href={ROUTES.permisionario.credencial} className="lc-ver-perfil">
              Ver perfil &rsaquo;
            </Link>
          </div>
          <button
            className="lc-hamburger"
            onClick={() => { roleStore.setActivePermisionarioId(null); window.location.reload(); }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Stats 2-col */}
        <div className="lc-stats-grid">
          {/* Resumen */}
          <div className="lc-card">
            <div className="lc-card-head">
              <TrendingUp className="w-4 h-4" style={{ color: '#2563EB' }} />
              <span className="lc-card-title">Resumen</span>
            </div>
            <StatRow icon={<Car className="w-4 h-4" />} iconBg="#EFF6FF" iconColor="#2563EB"
              label="Activos" value={ticketsActivos.length} valueColor="#2563EB" sub="vehículos" />
            <StatRow icon={<AlertTriangle className="w-4 h-4" />} iconBg="#FFF7ED" iconColor="#EA580C"
              label="Impagos" value={impagosCount} valueColor="#EA580C" sub="vehículos" />
            <StatRow icon={<Wallet className="w-4 h-4" />} iconBg="#EFF6FF" iconColor="#2563EB"
              label="Recaudado" value={`$ ${totalRecaudado.toLocaleString('es-AR')}`} valueColor="#2563EB" sub="hoy" smallValue />
          </div>

          {/* Mi cuadra */}
          <div className="lc-card">
            <div className="lc-card-head">
              <MapPin className="w-4 h-4" style={{ color: '#2563EB' }} />
              <span className="lc-card-title">Mi cuadra</span>
            </div>
            {/* Selector de cuadra */}
            <div className="lc-cuadra-sel">
              <MapPin className="w-3 h-3" style={{ color: '#2563EB', flexShrink: 0 }} />
              <span className="lc-cuadra-sel-text">{cuadra}</span>
              <ChevronDown className="w-3 h-3" style={{ color: '#64748B', flexShrink: 0 }} />
            </div>
            {/* Zone stats */}
            <ZoneStat icon={<Car className="w-3.5 h-3.5" />} bg="#EFF6FF" color="#2563EB"
              label="Vehículos en zona" value={vehiculosEnZona} valueColor="#2563EB" />
            <ZoneStat icon={<CheckCircle className="w-3.5 h-3.5" />} bg="#F0FDF4" color="#16A34A"
              label="Pagos realizados" value={pagosRealizados} valueColor="#15181F" />
            <ZoneStat icon={<AlertCircle className="w-3.5 h-3.5" />} bg="#FFF7ED" color="#EA580C"
              label="Impagos" value={impagosCount} valueColor="#EA580C" />
            <ZoneStat icon={<Clock className="w-3.5 h-3.5" />} bg="#EFF6FF" color="#2563EB"
              label="Turno actual" value={turnoActual} valueColor="#2563EB" isText />
          </div>
        </div>

        {/* Patente */}
        <div className="lc-patente-card">
          <PlateInput
            value={patenteValue}
            onChange={setPatenteValue}
            onValidChange={setPatenteValid}
            showOCR={true}
          />
          {patenteValid && (
            <button className="lc-registrar-btn" onClick={() => {
              observadoStore.create({ dominio: patenteValue, permisionarioId: perm.id, cuadra });
              setPatenteValue('');
              setPatenteValid(false);
              refresh();
            }}>Registrar vehículo</button>
          )}
        </div>

        {/* Tabla */}
        <VehiculosTable
          key={refreshKey}
          tickets={tickets}
          observados={impagosObs}
        />

      </div>

      {/* ── Bottom Nav ── */}
      <nav className="lc-bottom-nav">
        {([
          { id: 'inicio',    label: 'Inicio',    icon: LayoutGrid,     href: ROUTES.permisionario.root },
          { id: 'vehiculos', label: 'Vehículos', icon: Car,            href: ROUTES.permisionario.vehiculos },
          { id: 'cobros',    label: 'Cobros',    icon: DollarSign,     href: ROUTES.permisionario.cobrarQr },
          { id: 'reportes',  label: 'Reportes',  icon: BarChart3,      href: ROUTES.permisionario.actividad },
          { id: 'mas',       label: 'Más',       icon: MoreHorizontal, href: ROUTES.permisionario.credencial },
        ] as const).map(({ id, label, icon: Icon, href }) => (
          <Link
            key={id}
            href={href}
            className={`lc-nav-item ${activeTab === id ? 'lc-nav-item--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatRow({ icon, iconBg, iconColor, label, value, valueColor, sub, smallValue }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  label: string; value: string | number; valueColor: string; sub: string; smallValue?: boolean;
}) {
  return (
    <div className="lc-stat-row">
      <div className="lc-stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div>
        <div className="lc-stat-label">{label}</div>
        <div className="lc-stat-value" style={{ color: valueColor, fontSize: smallValue ? 15 : 22 }}>{value}</div>
        <div className="lc-stat-sub">{sub}</div>
      </div>
    </div>
  );
}

function ZoneStat({ icon, bg, color, label, value, valueColor, isText }: {
  icon: React.ReactNode; bg: string; color: string;
  label: string; value: string | number; valueColor: string; isText?: boolean;
}) {
  return (
    <div className="lc-zone-row">
      <div className="lc-zone-icon" style={{ background: bg, color }}>{icon}</div>
      <div>
        <div className="lc-zone-label">{label}</div>
        <div className="lc-zone-value" style={{ color: valueColor, fontSize: isText ? 13 : 18 }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Vehículos Table ──────────────────────────────────────────────────────────

type VehRow =
  | { kind: 'activo';   ticket: Ticket & { minRestantes: number } }
  | { kind: 'vencido';  ticket: Ticket & { minutosExcedidos: number } }
  | { kind: 'observado'; obs: VehiculoObservado };

function VehiculosTable({ tickets, observados }: {
  tickets: Ticket[]; observados: VehiculoObservado[];
}) {
  const now = Date.now();

  const rows: VehRow[] = [
    ...observados.map((obs) => ({ kind: 'observado' as const, obs })),
    ...tickets.map((t) => {
      const minRestantes = calcularTiempoRestanteMinutos(t.vencimiento);
      const minutosExcedidos = Math.max(0, Math.floor((now - new Date(t.vencimiento).getTime()) / 60000));
      return minRestantes > 0
        ? { kind: 'activo' as const, ticket: { ...t, minRestantes } }
        : { kind: 'vencido' as const, ticket: { ...t, minutosExcedidos } };
    }),
  ];

  if (rows.length === 0) {
    return (
      <div className="lc-table-card">
        <TableHeader />
        <div className="lc-empty">
          <Car className="w-8 h-8" style={{ color: '#CBD5E1' }} />
          <p>No hay vehículos en tu cuadra</p>
          <span>Ingresá una patente arriba para registrar</span>
        </div>
      </div>
    );
  }

  return (
    <div className="lc-table-card">
      <TableHeader />

      {/* Column headers */}
      <div className="lc-col-heads">
        <span>Estado</span>
        <span>Patente</span>
        <span>Inicio</span>
        <span>Fin</span>
        <span>Pago</span>
      </div>

      {/* Rows */}
      {rows.map((row) => {
        if (row.kind === 'observado') {
          const obs = row.obs;
          return (
            <div key={obs.id} className="lc-row">
              <span className="lc-dot lc-dot--orange" />
              <div className="lc-row-info">
                <span className="lc-row-plate">{obs.dominio}</span>
                <span className="lc-row-model lc-row-model--orange">Sin ticket</span>
              </div>
              <span className="lc-time">{fmt(obs.timestamp)}</span>
              <span className="lc-time lc-time--muted">–</span>
              <Link href={`${ROUTES.permisionario.registrar}?dominio=${obs.dominio}`} className="lc-pay-btn lc-pay-btn--blue">
                <DollarSign className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        }
        if (row.kind === 'vencido') {
          const t = row.ticket;
          return (
            <div key={t.id} className="lc-row">
              <span className="lc-dot lc-dot--orange" />
              <div className="lc-row-info">
                <span className="lc-row-plate">{t.dominio}</span>
                <span className="lc-row-model lc-row-model--gray">{t.tipo === 'auto' ? 'Auto' : 'Moto'}</span>
              </div>
              <span className="lc-time">{fmt(t.inicio)}</span>
              <span className="lc-time lc-time--red">{fmt(t.vencimiento)}</span>
              <Link href={`${ROUTES.permisionario.horaExtra}?dominio=${t.dominio}&ticketId=${t.id}`} className="lc-pay-btn lc-pay-btn--orange">
                <AlertTriangle className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        }
        // activo
        const t = row.ticket;
        return (
          <div key={t.id} className="lc-row">
            <span className="lc-dot lc-dot--green" />
            <div className="lc-row-info">
              <span className="lc-row-plate">{t.dominio}</span>
              <span className="lc-row-model lc-row-model--gray">{t.tipo === 'auto' ? 'Auto' : 'Moto'}</span>
            </div>
            <span className="lc-time">{fmt(t.inicio)}</span>
            <span className="lc-time">{fmt(t.vencimiento)}</span>
            <Link href={`${ROUTES.permisionario.horaExtra}?dominio=${t.dominio}&ticketId=${t.id}`} className="lc-pay-btn lc-pay-btn--blue">
              <DollarSign className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function TableHeader() {
  return (
    <div className="lc-table-head">
      <div className="lc-table-title">
        <Car className="w-4 h-4" style={{ color: '#2563EB' }} />
        <span>Vehículos en calle</span>
      </div>
      <button className="lc-filter-btn">
        <SlidersHorizontal className="w-4 h-4" style={{ color: '#64748B' }} />
      </button>
    </div>
  );
}

// ─── Selector ─────────────────────────────────────────────────────────────────

function PermisionarioSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const permisionarios = permisionarioStore.getAll().filter((p) => p.activo);
  return (
    <div style={{ minHeight: '100dvh', background: '#F5F7FA' }}>
      <style>{STYLES}</style>
      <header className="lc-header">
        <img src="/logomain.png" alt="La Cuadra" className="lc-logo" />
      </header>
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#15181F', marginBottom: 4 }}>¿Quién sos?</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#686868', marginBottom: 20 }}>Seleccioná tu usuario para continuar.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {permisionarios.map((p) => (
            <button key={p.id} onClick={() => onSelect(p.id)} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              background: '#fff', border: '1.5px solid #DDE4EF', borderRadius: 16,
              cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 4px rgba(21,50,111,0.06)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: '#15326F',
                color: '#7FB5FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, flexShrink: 0,
              }}>{p.nombre[0]}</div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#15181F' }}>{p.nombre} {p.apellido}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#686868', marginTop: 2 }}>{p.cuadraAsignada} · Legajo {p.legajo}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  /* ── App shell ── */
  .lc-app {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: #F5F7FA;
    max-width: 480px;
    margin: 0 auto;
    font-family: var(--font-body);
  }

  /* ── Header ── */
  .lc-header {
    background: #2557C7;
    padding-top: env(safe-area-inset-top, 0px);
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(21,50,111,0.3);
  }
  .lc-logo {
    height: 90px;
    width: auto;
    display: block;
    object-fit: contain;
  }

  /* ── Body ── */
  .lc-body {
    flex: 1;
    padding: 12px 12px 80px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }

  /* ── Greeting card ── */
  .lc-greeting-card {
    background: #fff;
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 4px rgba(21,50,111,0.07);
  }
  .lc-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #64748B;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .lc-greeting-info { flex: 1; }
  .lc-greeting-name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 20px;
    color: #15181F;
    margin: 0;
  }
  .lc-greeting-highlight { color: #2563EB; }
  .lc-ver-perfil {
    font-family: var(--font-body);
    font-size: 13px;
    color: #2563EB;
    text-decoration: none;
    display: block;
    margin-top: 2px;
  }
  .lc-hamburger {
    background: none;
    border: none;
    color: #15181F;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
  }

  /* ── Stats 2-column grid ── */
  .lc-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .lc-card {
    background: #fff;
    border-radius: 14px;
    padding: 14px 12px;
    box-shadow: 0 1px 4px rgba(21,50,111,0.07);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .lc-card-head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lc-card-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 13px;
    color: #15181F;
  }

  /* Stat row (Resumen) */
  .lc-stat-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .lc-stat-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .lc-stat-label {
    font-family: var(--font-body);
    font-size: 11px;
    color: #686868;
    line-height: 1.3;
  }
  .lc-stat-value {
    font-family: var(--font-display);
    font-weight: 800;
    line-height: 1.15;
  }
  .lc-stat-sub {
    font-family: var(--font-body);
    font-size: 10px;
    color: #686868;
  }

  /* Zone stat (Mi Cuadra) */
  .lc-cuadra-sel {
    display: flex;
    align-items: center;
    gap: 5px;
    background: #F1F5F9;
    border-radius: 8px;
    padding: 6px 8px;
  }
  .lc-cuadra-sel-text {
    flex: 1;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 11px;
    color: #15181F;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lc-zone-row {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .lc-zone-icon {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .lc-zone-label {
    font-family: var(--font-body);
    font-size: 10px;
    color: #686868;
    line-height: 1.2;
  }
  .lc-zone-value {
    font-family: var(--font-display);
    font-weight: 800;
    line-height: 1.1;
  }

  /* ── Patente section ── */
  .lc-patente-card {
    background: #EEF3FF;
    border-radius: 14px;
    padding: 12px 14px 14px;
    box-shadow: 0 1px 4px rgba(21,50,111,0.07);
  }
  .lc-patente-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .lc-patente-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .lc-patente-icon {
    width: 36px;
    height: 36px;
    background: #DBEAFE;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2563EB;
    flex-shrink: 0;
  }
  .lc-patente-label {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 15px;
    color: #15181F;
  }
  .lc-camera-btn {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #2563EB;
    color: #fff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .lc-camera-btn:hover { background: #1D4ED8; }
  .lc-camera-btn:disabled { opacity: 0.6; cursor: default; }
  .lc-patente-input {
    width: 100%;
    background: #fff;
    border: 1.5px solid #E2E8F0;
    border-radius: 10px;
    padding: 11px 14px;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 15px;
    color: #15181F;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .lc-patente-input:focus { border-color: #2563EB; }
  .lc-patente-input::placeholder { color: #94A3B8; font-weight: 400; letter-spacing: 0; }
  .lc-ocr-status {
    font-size: 12px; color: #686868; margin-top: 6px; padding-left: 2px;
  }
  .lc-registrar-btn {
    margin-top: 10px; width: 100%;
    background: #2563EB; color: #fff;
    border: none; border-radius: 10px;
    padding: 13px; font-family: var(--font-display);
    font-weight: 700; font-size: 14px;
    cursor: pointer; transition: background 0.15s;
  }
  .lc-registrar-btn:hover { background: #1D4ED8; }
  .lc-spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lc-spin 0.6s linear infinite;
  }
  @keyframes lc-spin { to { transform: rotate(360deg); } }

  /* ── Table card ── */
  .lc-table-card {
    background: #fff;
    border-radius: 14px;
    padding: 14px 12px 6px;
    box-shadow: 0 1px 4px rgba(21,50,111,0.07);
  }
  .lc-table-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .lc-table-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 14px;
    color: #15181F;
  }
  .lc-filter-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;
  }

  /* Column header row */
  .lc-col-heads {
    display: grid;
    grid-template-columns: 48px 1fr 50px 50px 42px;
    gap: 8px;
    padding: 0 4px 8px;
    border-bottom: 1.5px solid #F1F5F9;
    font-family: var(--font-display);
    font-size: 10px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  /* Estado centered, times centered, pago centered */
  .lc-col-heads span:nth-child(1) { text-align: center; }
  .lc-col-heads span:nth-child(2) { padding-left: 10px; }
  .lc-col-heads span:nth-child(3),
  .lc-col-heads span:nth-child(4) { text-align: center; }
  .lc-col-heads span:nth-child(5) { text-align: center; }

  /* Data rows */
  .lc-row {
    display: grid;
    grid-template-columns: 48px 1fr 50px 50px 42px;
    gap: 8px;
    align-items: center;
    padding: 10px 4px;
    border-bottom: 1px solid #F8FAFC;
  }
  .lc-row:last-child { border-bottom: none; }

  /* Dot */
  .lc-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    justify-self: center;
  }
  .lc-dot--green  { background: #22C55E; }
  .lc-dot--orange { background: #F97316; }
  .lc-dot--gray   { background: #94A3B8; }

  /* Plate + model */
  .lc-row-info { min-width: 0; padding-left: 10px; }
  .lc-row-plate {
    display: block;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 13px;
    color: #15181F;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lc-row-model {
    display: block;
    font-family: var(--font-body);
    font-size: 11px;
    line-height: 1.2;
  }
  .lc-row-model--gray   { color: #94A3B8; }
  .lc-row-model--orange { color: #EA580C; }

  /* Time chips */
  .lc-time {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 11px;
    color: #475569;
    background: #EFF6FF;
    border-radius: 6px;
    padding: 4px 0;
    text-align: center;
    white-space: nowrap;
  }
  .lc-time--red  { color: #DC2626; background: #FEF2F2; }
  .lc-time--muted { color: #94A3B8; background: #F1F5F9; }

  /* Pay button */
  .lc-pay-btn {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    text-decoration: none;
    justify-self: center;
    transition: opacity 0.15s;
  }
  .lc-pay-btn:hover { opacity: 0.85; }
  .lc-pay-btn--blue   { background: #2563EB; }
  .lc-pay-btn--orange { background: #EA580C; }

  /* Empty */
  .lc-empty {
    display: flex; flex-direction: column;
    align-items: center; gap: 8px;
    padding: 32px 20px; text-align: center;
  }
  .lc-empty p { font-family: var(--font-display); font-weight: 600; font-size: 14px; color: #15181F; margin: 0; }
  .lc-empty span { font-family: var(--font-body); font-size: 12px; color: #686868; }

  /* ── Bottom Nav ── */
  .lc-bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 480px;
    background: #fff;
    border-top: 1px solid #E2E8F0;
    display: flex;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-shadow: 0 -2px 12px rgba(21,50,111,0.08);
    z-index: 30;
  }
  .lc-nav-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 3px;
    padding: 10px 4px;
    color: #94A3B8;
    text-decoration: none;
    font-family: var(--font-display);
    font-size: 10px; font-weight: 600;
    transition: color 0.15s;
  }
  .lc-nav-item:hover { color: #64748B; }
  .lc-nav-item--active { color: #2563EB; }
`;