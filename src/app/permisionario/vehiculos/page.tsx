'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car, Clock, TrendingUp,
  AlertTriangle, AlertCircle, MapPin, DollarSign,
  LayoutGrid, BarChart3, MoreHorizontal, User, Menu,
  Smartphone, Banknote, Search,
} from 'lucide-react';
import { db } from '@/lib/db';
import { ticketStore, observadoStore, roleStore } from '@/lib/sem-store';
import type { Permisionario, Ticket, VehiculoObservado, Deuda } from '@/domain/types';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import { ROUTES } from '@/lib/routes';

import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: unknown }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 20, color: 'red' }}><h1>Something went wrong.</h1><pre>{(this.state.error as Error)?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

type FilterTab = 'encalle' | 'finalizados' | 'todos';

type VehRow =
  | { kind: 'activo'; ticket: Ticket & { minRestantes: number } }
  | { kind: 'vencido'; ticket: Ticket & { minutosExcedidos: number } }
  | { kind: 'observado'; obs: VehiculoObservado }
  | { kind: 'finalizado'; ticket: Ticket };

function fmt(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  activo: { label: 'Activo', color: '#16A34A', bg: '#F0FDF4', dot: 'lc-dot--green' },
  vencido: { label: 'Vencido', color: '#EA580C', bg: '#FFF7ED', dot: 'lc-dot--orange' },
  finalizado: { label: 'Finalizado', color: '#64748B', bg: '#F8FAFC', dot: 'lc-dot--gray' },
  incumplimiento: { label: 'Incumpl.', color: '#DC2626', bg: '#FEF2F2', dot: 'lc-dot--orange' },
  observado: { label: 'Sin ticket', color: '#EA580C', bg: '#FFF7ED', dot: 'lc-dot--orange' },
};

export default function VehiculosPage() {
  const [perm, setPerm] = useState<Permisionario | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const id = db.role.getActivePermisionarioId();
        if (id) {
          const p = await db.permisionarios.getById(id);
          setPerm(p ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  if (!loaded) return <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>;
  if (!perm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-gray-500 mb-4">No hay permisionario activo.</p>
        <Link href={ROUTES.permisionario.root} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Volver</Link>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <VehiculosDashboard perm={perm} />
    </ErrorBoundary>
  );
}

function VehiculosDashboard({ perm }: { perm: Permisionario }) {
  const cuadra = perm.cuadraAsignada;
  const [filter, setFilter] = useState<FilterTab>('encalle');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historial, setHistorial] = useState<(Ticket | VehiculoObservado)[]>([]);
  const [deudasExpandidas, setDeudasExpandidas] = useState<Deuda[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const allTickets = ticketStore.getAll().filter((t) => t.permisionarioId === perm.id && t.cuadra === cuadra);
  const activeTickets = allTickets.filter((t) => t.activo);
  const observados = observadoStore.getByPermisionarioCuadra(perm.id, cuadra);

  const now = Date.now();
  const rows: VehRow[] = [
    ...observados.map((obs) => ({ kind: 'observado' as const, obs })),
    ...activeTickets.map((t) => {
      const minRestantes = calcularTiempoRestanteMinutos(t.vencimiento);
      const minutosExcedidos = Math.max(0, Math.floor((now - new Date(t.vencimiento).getTime()) / 60000));
      return minRestantes > 0
        ? { kind: 'activo' as const, ticket: { ...t, minRestantes } }
        : { kind: 'vencido' as const, ticket: { ...t, minutosExcedidos } };
    }),
  ];

  const finalizedTickets = allTickets.filter((t) => !t.activo);

  const filtered = rows.filter((row) => {
    const dominio = row.kind === 'observado' ? row.obs.dominio : row.ticket.dominio;
    if (searchQuery && !dominio.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filter === 'encalle') return true;
    if (filter === 'finalizados') return false;
    return true;
  });

  const finalizedFiltered = finalizedTickets.filter((t) =>
    !searchQuery || t.dominio.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

  const allRows: (VehRow | { kind: 'finalizado'; ticket: Ticket })[] = filter === 'finalizados'
    ? finalizedFiltered.map((t) => ({ kind: 'finalizado' as const, ticket: t }))
    : filtered;

  async function handleExpand(row: RowItem) {
    const rowId = row.kind === 'observado' ? row.obs.id : row.ticket.id;
    if (expandedId === rowId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(rowId);
    const dominio = row.kind === 'observado' ? row.obs.dominio : row.ticket.dominio;
    const [domTickets, domDeudas] = await Promise.all([
      db.tickets.getByDominio(dominio),
      db.deudas.getByDominio(dominio),
    ]);
    setHistorial(domTickets);
    setDeudasExpandidas(domDeudas.filter((d) => d.estado === 'pendiente'));
  }

  return (
    <div className="lc-app">
      <style>{STYLES}</style>

      <header className="lc-header">
        <img src="/logomain.png" alt="La Cuadra" className="lc-logo" />
      </header>

      <div className="lc-body">

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

        <div className="lc-card" style={{ padding: '14px 12px' }}>
          <div className="lc-card-head">
            <Car className="w-4 h-4" style={{ color: '#2563EB' }} />
            <span className="lc-card-title">Vehículos en tu cuadra</span>
            <span className="lc-veh-count">{rows.length}</span>
          </div>
          <div className="lc-cuadra-sel" style={{ marginTop: 8 }}>
            <MapPin className="w-3 h-3" style={{ color: '#2563EB', flexShrink: 0 }} />
            <span className="lc-cuadra-sel-text">{cuadra}</span>
          </div>
        </div>

        <div className="lc-search-container">
          <Search className="w-4 h-4 lc-search-icon" />
          <input
            type="text"
            placeholder="Buscar patente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="lc-search-input"
          />
        </div>

        <div className="lc-filter-pills">
          {([
            { id: 'encalle' as FilterTab, label: 'En calle' },
            { id: 'finalizados' as FilterTab, label: 'Finalizados' },
            { id: 'todos' as FilterTab, label: 'Todos' },
          ]).map(({ id, label }) => (
            <button
              key={id}
              className={`lc-filter-pill ${filter === id ? 'lc-filter-pill--active' : ''}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {allRows.length === 0 ? (
          <div className="lc-table-card">
            <TableHeader count={0} />
            <div className="lc-empty">
              <Car className="w-8 h-8" style={{ color: '#CBD5E1' }} />
              <p>No hay vehículos</p>
              <span>{filter === 'encalle' ? 'No hay vehículos en calle ahora' : 'No hay registros'}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="lc-table-card">
              <TableHeader count={allRows.length} />
              <div className="lc-col-heads">
                <span>Estado</span>
                <span>Patente</span>
                <span>Inicio</span>
                <span>Fin</span>
                <span>Pago</span>
              </div>

              {allRows.map((row) => {
                if (row.kind === 'observado') {
                  const obs = row.obs;
                  const cfg = STATUS_CONFIG.observado;
                  const isExpanded = expandedId === obs.id;

                  return (
                    <div key={obs.id}>
                      <div
                        className="lc-row lc-row--clickable"
                        onClick={() => handleExpand(row as VehRow)}
                      >
                        <span className={`lc-dot ${cfg.dot}`} />
                        <div className="lc-row-info">
                          <span className="lc-row-plate">{obs.dominio}</span>
                          <span className="lc-row-model lc-row-model--orange">Sin ticket</span>
                        </div>
                        <span className="lc-time">{fmt(obs.timestamp)}</span>
                        <span className="lc-time lc-time--muted">–</span>
                        <span className="lc-pay-badge lc-pay-badge--efectivo">
                          <Banknote className="w-3 h-3" />
                        </span>
                      </div>

                      {isExpanded && (
                        <ExpandedObservadoDetail obs={obs} deudas={deudasExpandidas} cfg={cfg} />
                      )}
                    </div>
                  );
                }

                if (row.kind === 'finalizado') {
                  const t = row.ticket;
                  const cfg = STATUS_CONFIG.finalizado;
                  const isExpanded = expandedId === t.id;

                  return (
                    <div key={t.id}>
                      <div
                        className="lc-row lc-row--clickable"
                        onClick={() => handleExpand({ kind: 'finalizado', ticket: t })}
                      >
                        <span className={`lc-dot ${cfg.dot}`} />
                        <div className="lc-row-info">
                          <span className="lc-row-plate">{t.dominio}</span>
                          <span className="lc-row-model lc-row-model--gray">
                            {t.tipo === 'auto' ? 'Auto' : 'Moto'}
                          </span>
                        </div>
                        <span className="lc-time">{fmt(t.inicio)}</span>
                        <span className="lc-time lc-time--muted">–</span>
                        <span className={`lc-pay-badge ${t.metodoPago === 'digital' ? 'lc-pay-badge--digital' : 'lc-pay-badge--efectivo'}`}>
                          {t.metodoPago === 'digital' ? <Smartphone className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                        </span>
                      </div>

                      {isExpanded && (
                        <ExpandedFinalizadoDetail ticket={t} historial={historial} deudas={deudasExpandidas} cfg={cfg} />
                      )}
                    </div>
                  );
                }

                const t = row.ticket;
                const st = row.kind === 'activo' ? 'activo' : 'vencido';
                const cfg = STATUS_CONFIG[st] ?? STATUS_CONFIG.finalizado;
                const isExpanded = expandedId === t.id;

                return (
                  <div key={t.id}>
                    <div
                      className="lc-row lc-row--clickable"
                      onClick={() => handleExpand(row as VehRow)}
                    >
                      <span className={`lc-dot ${cfg.dot}`} />
                      <div className="lc-row-info">
                        <span className="lc-row-plate">{t.dominio}</span>
                        <span className={`lc-row-model ${st === 'vencido' ? 'lc-row-model--orange' : 'lc-row-model--gray'}`}>
                          {t.tipo === 'auto' ? 'Auto' : 'Moto'}
                        </span>
                      </div>
                      <span className="lc-time">{fmt(t.inicio)}</span>
                      <span className={`lc-time ${st === 'vencido' ? 'lc-time--red' : ''}`}>
                        {fmt(t.vencimiento)}
                      </span>
                      <span className={`lc-pay-badge ${t.metodoPago === 'digital' ? 'lc-pay-badge--digital' : 'lc-pay-badge--efectivo'}`}>
                        {t.metodoPago === 'digital' ? <Smartphone className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                      </span>
                    </div>

                    {isExpanded && (
                      <ExpandedTicketDetail ticket={t} historial={historial} deudas={deudasExpandidas} cfg={cfg} row={row as VehRow} />
                    )}
                  </div>
                );
              })}
            </div>

            {allRows.length > 5 && (
              <p className="lc-showing-info">
                Mostrando {allRows.length} vehículo{allRows.length !== 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </div>

      <nav className="lc-bottom-nav">
        {([
          { id: 'inicio', label: 'Inicio', icon: LayoutGrid, href: ROUTES.permisionario.root },
          { id: 'vehiculos', label: 'Vehículos', icon: Car, href: ROUTES.permisionario.vehiculos },
          { id: 'cobros', label: 'Cobros', icon: DollarSign, href: ROUTES.permisionario.cobrarQr },
          { id: 'reportes', label: 'Reportes', icon: BarChart3, href: ROUTES.permisionario.actividad },
          { id: 'mas', label: 'Más', icon: MoreHorizontal, href: ROUTES.permisionario.credencial },
        ] as const).map(({ id, label, icon: Icon, href }) => (
          <Link
            key={id}
            href={href}
            className={`lc-nav-item ${id === 'vehiculos' ? 'lc-nav-item--active' : ''}`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function ExpandedTicketDetail({ ticket: t, historial, deudas, cfg, row }: {
  ticket: Ticket & { minRestantes?: number; minutosExcedidos?: number };
  historial: (Ticket | VehiculoObservado)[];
  deudas: Deuda[];
  cfg: { label: string; color: string; bg: string };
  row: VehRow;
}) {
  const remaining = row.kind === 'activo' ? (row.ticket).minRestantes ?? calcularTiempoRestanteMinutos(t.vencimiento) : 0;

  return (
    <div className="lc-expand-panel">
      <div className="lc-expand-status-row">
        <span className="lc-expand-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
        {row.kind === 'activo' && remaining > 0 && (
          <span className="lc-expand-time-left">
            <Clock className="w-3 h-3" style={{ color: cfg.color }} />
            {remaining < 60 ? `${remaining} min restantes` : `${Math.floor(remaining / 60)}h ${remaining % 60}m restantes`}
          </span>
        )}
        {row.kind === 'vencido' && (
          <span className="lc-expand-time-left" style={{ color: '#DC2626' }}>
            <AlertTriangle className="w-3 h-3" style={{ color: '#DC2626' }} />
            Vencido
          </span>
        )}
      </div>

      <div className="lc-expand-info-grid">
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Duración</span>
          <span className="lc-expand-info-value">{fmtDuration(t.duracionMinutos)}</span>
        </div>
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Método</span>
          <span className="lc-expand-info-value">{t.metodoPago === 'digital' ? 'Digital' : 'Efectivo'}</span>
        </div>
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Inicio</span>
          <span className="lc-expand-info-value">{fmt(t.inicio)}</span>
        </div>
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Vencimiento</span>
          <span className="lc-expand-info-value">{fmt(t.vencimiento)}</span>
        </div>
      </div>

      {deudas.length > 0 && (
        <div className="lc-expand-section">
          <div className="lc-expand-section-head">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#EA580C' }} />
            <span>Deudas pendientes</span>
            <span className="lc-expand-section-badge lc-expand-section-badge--red">{deudas.length}</span>
          </div>
          {deudas.map((d) => (
            <div key={d.id} className="lc-expand-deuda-row">
              <span>{d.tipo === 'hora_extra' ? 'Hora extra' : 'Incumplimiento'}</span>
              <span className="lc-expand-deuda-monto">${d.monto.toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      )}

      {historial.length > 1 && (
        <div className="lc-expand-section">
          <div className="lc-expand-section-head">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#2563EB' }} />
            <span>Historial ({historial.length})</span>
          </div>
          <div className="lc-expand-timeline">
            {historial.slice(0, 5).map((h) => {
              const isObs = 'timestamp' in h && !('inicio' in h);
              const hst = isObs ? 'observado' : getTicketStatus(h as Ticket);
              const hcfg = STATUS_CONFIG[hst] ?? STATUS_CONFIG.finalizado;
              const hInicio = isObs ? (h as VehiculoObservado).timestamp : (h as Ticket).inicio;
              return (
                <div key={h.id} className="lc-expand-timeline-row">
                  <span className={`lc-dot ${hcfg.dot}`} style={{ width: 8, height: 8, flexShrink: 0 }} />
                  <span className="lc-expand-timeline-date">{fmtDate(hInicio)}</span>
                  <span className="lc-expand-timeline-time">{fmt(hInicio)}</span>
                  <span className="lc-expand-timeline-status" style={{ color: hcfg.color }}>{hcfg.label}</span>
                </div>
              );
            })}
            {historial.length > 5 && (
              <span className="lc-expand-timeline-more">+{historial.length - 5} más</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandedObservadoDetail({ obs, deudas, cfg }: {
  obs: VehiculoObservado;
  deudas: Deuda[];
  cfg: { label: string; color: string; bg: string };
}) {
  return (
    <div className="lc-expand-panel">
      <div className="lc-expand-status-row">
        <span className="lc-expand-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
        <span className="lc-expand-time-left" style={{ color: '#EA580C' }}>
          <AlertCircle className="w-3 h-3" style={{ color: '#EA580C' }} />
          Sin ticket de estacionamiento
        </span>
      </div>

      <div className="lc-expand-info-grid">
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Observado desde</span>
          <span className="lc-expand-info-value">{fmt(obs.timestamp)}</span>
        </div>
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Cuadra</span>
          <span className="lc-expand-info-value">{obs.cuadra}</span>
        </div>
      </div>

      {deudas.length > 0 && (
        <div className="lc-expand-section">
          <div className="lc-expand-section-head">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#EA580C' }} />
            <span>Deudas pendientes</span>
            <span className="lc-expand-section-badge lc-expand-section-badge--red">{deudas.length}</span>
          </div>
          {deudas.map((d) => (
            <div key={d.id} className="lc-expand-deuda-row">
              <span>{d.tipo === 'hora_extra' ? 'Hora extra' : 'Incumplimiento'}</span>
              <span className="lc-expand-deuda-monto">${d.monto.toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type RowItem = VehRow | { kind: 'finalizado'; ticket: Ticket };

function ExpandedFinalizadoDetail({ ticket: t, historial, deudas, cfg }: {
  ticket: Ticket;
  historial: (Ticket | VehiculoObservado)[];
  deudas: Deuda[];
  cfg: { label: string; color: string; bg: string };
}) {
  return (
    <div className="lc-expand-panel">
      <div className="lc-expand-status-row">
        <span className="lc-expand-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      <div className="lc-expand-info-grid">
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Duración</span>
          <span className="lc-expand-info-value">{fmtDuration(t.duracionMinutos)}</span>
        </div>
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Método</span>
          <span className="lc-expand-info-value">{t.metodoPago === 'digital' ? 'Digital' : 'Efectivo'}</span>
        </div>
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Inicio</span>
          <span className="lc-expand-info-value">{fmt(t.inicio)}</span>
        </div>
        <div className="lc-expand-info-item">
          <span className="lc-expand-info-label">Vencimiento</span>
          <span className="lc-expand-info-value">{fmt(t.vencimiento)}</span>
        </div>
      </div>

      {deudas.length > 0 && (
        <div className="lc-expand-section">
          <div className="lc-expand-section-head">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#EA580C' }} />
            <span>Deudas pendientes</span>
            <span className="lc-expand-section-badge lc-expand-section-badge--red">{deudas.length}</span>
          </div>
          {deudas.map((d) => (
            <div key={d.id} className="lc-expand-deuda-row">
              <span>{d.tipo === 'hora_extra' ? 'Hora extra' : 'Incumplimiento'}</span>
              <span className="lc-expand-deuda-monto">${d.monto.toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      )}

      {historial.length > 1 && (
        <div className="lc-expand-section">
          <div className="lc-expand-section-head">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#2563EB' }} />
            <span>Historial ({historial.length})</span>
          </div>
          <div className="lc-expand-timeline">
            {historial.slice(0, 5).map((h) => {
              const isObs = 'timestamp' in h && !('inicio' in h);
              const hst = isObs ? 'observado' : getTicketStatus(h as Ticket);
              const hcfg = STATUS_CONFIG[hst] ?? STATUS_CONFIG.finalizado;
              const hInicio = isObs ? (h as VehiculoObservado).timestamp : (h as Ticket).inicio;
              return (
                <div key={h.id} className="lc-expand-timeline-row">
                  <span className={`lc-dot ${hcfg.dot}`} style={{ width: 8, height: 8, flexShrink: 0 }} />
                  <span className="lc-expand-timeline-date">{fmtDate(hInicio)}</span>
                  <span className="lc-expand-timeline-time">{fmt(hInicio)}</span>
                  <span className="lc-expand-timeline-status" style={{ color: hcfg.color }}>{hcfg.label}</span>
                </div>
              );
            })}
            {historial.length > 5 && (
              <span className="lc-expand-timeline-more">+{historial.length - 5} más</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getTicketStatus(t: Ticket): string {
  if (!t.activo) return 'finalizado';
  const remaining = calcularTiempoRestanteMinutos(t.vencimiento);
  if (remaining <= 0) return 'vencido';
  return 'activo';
}

function TableHeader({ count }: { count: number }) {
  return (
    <div className="lc-table-head">
      <div className="lc-table-title">
        <Car className="w-4 h-4" style={{ color: '#2563EB' }} />
        <span>Vehículos</span>
      </div>
      <span className="lc-table-badge">{count}</span>
    </div>
  );
}

const STYLES = `
  .lc-app {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: #F5F7FA;
    max-width: 480px;
    margin: 0 auto;
    font-family: var(--font-body);
  }
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
    height: 63px;
    width: auto;
    display: block;
    object-fit: contain;
    margin: 12px 0;
  }
  .lc-body {
    flex: 1;
    padding: 12px 12px 80px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }
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
  .lc-veh-count {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 12px;
    color: #2563EB;
    background: #EFF6FF;
    border-radius: 20px;
    padding: 2px 8px;
    margin-left: auto;
  }
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

  .lc-search-container {
    position: relative;
    margin: 4px 0;
  }
  .lc-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94A3B8;
  }
  .lc-search-input {
    width: 100%;
    background: #fff;
    border: 1.5px solid #E2E8F0;
    border-radius: 12px;
    padding: 10px 14px 10px 36px;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 14px;
    color: #15181F;
    text-transform: uppercase;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
    box-shadow: 0 1px 4px rgba(21,50,111,0.04);
  }
  .lc-search-input:focus { border-color: #2563EB; }
  .lc-search-input::placeholder { color: #94A3B8; font-weight: 400; text-transform: none; }

  .lc-filter-pills {
    display: flex;
    gap: 8px;
  }
  .lc-filter-pill {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 12px;
    padding: 7px 16px;
    border-radius: 20px;
    border: none;
    background: #F1F5F9;
    color: #64748B;
    cursor: pointer;
    transition: all 0.15s;
  }
  .lc-filter-pill--active {
    background: #2563EB;
    color: #fff;
  }

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
  .lc-table-badge {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 11px;
    color: #64748B;
    background: #F1F5F9;
    border-radius: 20px;
    padding: 2px 8px;
  }

  .lc-col-heads {
    display: grid;
    grid-template-columns: 56px 1fr 50px 50px 32px;
    gap: 6px;
    padding: 0 4px 8px;
    border-bottom: 1.5px solid #F1F5F9;
    font-family: var(--font-display);
    font-size: 10px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .lc-col-heads span:nth-child(1) { text-align: center; }
  .lc-col-heads span:nth-child(2) { padding-left: 0; }
  .lc-col-heads span:nth-child(3),
  .lc-col-heads span:nth-child(4) { text-align: center; }
  .lc-col-heads span:nth-child(5) { text-align: center; }

  .lc-row {
    display: grid;
    grid-template-columns: 56px 1fr 50px 50px 32px;
    gap: 6px;
    align-items: center;
    padding: 10px 4px;
    border-bottom: 1px solid #F8FAFC;
  }
  .lc-row:last-child { border-bottom: none; }
  .lc-row--clickable {
    cursor: pointer;
    transition: background 0.12s;
  }
  .lc-row--clickable:hover { background: #F8FAFC; }
  .lc-row--clickable:active { background: #EFF6FF; }

  .lc-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    justify-self: center;
  }
  .lc-dot--green { background: #22C55E; }
  .lc-dot--orange { background: #F97316; }
  .lc-dot--gray { background: #94A3B8; }
  .lc-dot--red { background: #DC2626; }

  .lc-row-info { min-width: 0; padding-left: 0; }
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
  .lc-row-model--gray { color: #94A3B8; }
  .lc-row-model--orange { color: #EA580C; }

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
  .lc-time--red { color: #DC2626; background: #FEF2F2; }
  .lc-time--muted { color: #94A3B8; background: #F1F5F9; }

  .lc-pay-badge {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    justify-self: center;
    color: #fff;
  }
  .lc-pay-badge--digital { background: #2563EB; }
  .lc-pay-badge--efectivo { background: #64748B; }

  .lc-expand-panel {
    background: #F8FAFC;
    border-radius: 12px;
    margin: 4px 8px 10px;
    padding: 12px;
  }

  .lc-expand-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .lc-expand-status-badge {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 20px;
  }
  .lc-expand-time-left {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 12px;
    color: #475569;
  }

  .lc-expand-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }
  .lc-expand-info-item {
    background: #fff;
    border-radius: 8px;
    padding: 8px 10px;
  }
  .lc-expand-info-label {
    display: block;
    font-family: var(--font-body);
    font-size: 10px;
    color: #686868;
    margin-bottom: 2px;
  }
  .lc-expand-info-value {
    display: block;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 13px;
    color: #15181F;
  }

  .lc-expand-section {
    border-top: 1px solid #E2E8F0;
    padding-top: 10px;
    margin-top: 2px;
  }
  .lc-expand-section-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 12px;
    color: #15181F;
    margin-bottom: 8px;
  }
  .lc-expand-section-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 20px;
    background: #F1F5F9;
    color: #64748B;
  }
  .lc-expand-section-badge--red {
    background: #FEF2F2;
    color: #DC2626;
  }

  .lc-expand-deuda-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: #FEF2F2;
    border-radius: 8px;
    margin-bottom: 4px;
    font-family: var(--font-body);
    font-size: 12px;
    color: #991B1B;
  }
  .lc-expand-deuda-monto {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 13px;
    color: #DC2626;
  }

  .lc-expand-timeline {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .lc-expand-timeline-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    padding: 4px 0;
  }
  .lc-expand-timeline-date {
    font-family: var(--font-display);
    font-weight: 600;
    color: #475569;
    min-width: 40px;
  }
  .lc-expand-timeline-time {
    font-family: var(--font-body);
    color: #64748B;
    flex: 1;
  }
  .lc-expand-timeline-status {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10px;
  }
  .lc-expand-timeline-more {
    font-family: var(--font-body);
    font-size: 11px;
    color: #2563EB;
    text-align: center;
    padding-top: 4px;
  }

  .lc-showing-info {
    font-family: var(--font-body);
    font-size: 11px;
    color: #64748B;
    text-align: center;
    padding: 4px 0 8px;
  }

  .lc-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 20px;
    text-align: center;
  }
  .lc-empty p { font-family: var(--font-display); font-weight: 600; font-size: 14px; color: #15181F; margin: 0; }
  .lc-empty span { font-family: var(--font-body); font-size: 12px; color: #686868; }

  .lc-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #E2E8F0;
    border-top-color: #2563EB;
    border-radius: 50%;
    animation: lc-spin 0.6s linear infinite;
  }
  @keyframes lc-spin { to { transform: rotate(360deg); } }

  .lc-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-top: 1px solid #E2E8F0;
    display: flex;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-shadow: 0 -2px 12px rgba(21,50,111,0.08);
    z-index: 30;
  }
  .lc-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 10px 4px;
    color: #94A3B8;
    text-decoration: none;
    font-family: var(--font-display);
    font-size: 10px;
    font-weight: 600;
    transition: color 0.15s;
  }
  .lc-nav-item:hover { color: #64748B; }
  .lc-nav-item--active { color: #2563EB; }
`;