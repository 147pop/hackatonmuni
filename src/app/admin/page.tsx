'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, DollarSign,
  BarChart3, CreditCard, AlertTriangle, FileText, Building2, ArrowRight, RefreshCw,
} from 'lucide-react';
import { MetricGrid, type Metric } from '@/components/admin/metric-grid';
import { PerformanceIndicators } from '@/components/admin/performance-indicators';
import { OverstayPanel } from '@/components/admin/overstay-panel';
import { AlertsPanel } from '@/components/admin/alerts-panel';
import {
  ticketStore, pagoStore, deudaStore, emergenciaStore, configStore,
} from '@/lib/sem-store';
import { ROUTES } from '@/lib/routes';

const PERIODO_ACTUAL = new Date().toISOString().slice(0, 7);

interface DashMetrics {
  recaudadoHoy: number;
  recaudadoMes: number;
  ticketsActivosAhora: number;
  deudosPendientesCount: number;
  deudosPendientesTotal: number;
  emergenciasActivas: number;
  ocupacionPct: number;
}

function computeMetrics(): DashMetrics {
  const hoy  = new Date().toISOString().split('T')[0];
  const now  = new Date();
  const pagos = pagoStore.getAll().filter((p) => p.estado === 'success');
  const zonas = configStore.getZonas();

  const recaudadoHoy = pagos.filter((p) => p.createdAt.startsWith(hoy)).reduce((s, p) => s + p.monto, 0);
  const recaudadoMes = pagos.filter((p) => p.createdAt.startsWith(PERIODO_ACTUAL)).reduce((s, p) => s + p.monto, 0);

  const ticketsActivosAhora = ticketStore.getAll().filter((t) => t.activo && new Date(t.vencimiento) > now).length;

  const deudosPendientes = deudaStore.getPendientes();
  const deudosPendientesTotal = deudosPendientes.reduce((s, d) => s + d.monto, 0);

  const emergenciasActivas = emergenciaStore.getActivas().length;

  // Ocupación: cuadras con ticket activo / total cuadras configuradas
  const totalCuadras = zonas.reduce((s, z) => s + z.cuadras.length, 0);
  const cuadrasConTicket = new Set(
    ticketStore.getAll().filter((t) => t.activo && new Date(t.vencimiento) > now).map((t) => t.cuadra),
  ).size;
  const ocupacionPct = totalCuadras > 0 ? Math.round((cuadrasConTicket / totalCuadras) * 100) : 0;

  return { recaudadoHoy, recaudadoMes, ticketsActivosAhora, deudosPendientesCount: deudosPendientes.length, deudosPendientesTotal, emergenciasActivas, ocupacionPct };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashMetrics>(computeMetrics);
  const [emergencias, setEmergencias] = useState(() => emergenciaStore.getActivas());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refresh = useCallback(() => {
    setMetrics(computeMetrics());
    setEmergencias(emergenciaStore.getActivas());
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const m = metrics;
  const kpis: Metric[] = [
    { label: 'Recaudado hoy',        value: `$${m.recaudadoHoy.toLocaleString('es-AR')}`,  color: 'green',   sub: 'pagos aprobados' },
    { label: 'Recaudado este mes',   value: `$${m.recaudadoMes.toLocaleString('es-AR')}`,  color: 'blue',    sub: PERIODO_ACTUAL },
    { label: 'Tickets activos ahora',value: m.ticketsActivosAhora,                          color: 'default', sub: `${m.ocupacionPct}% ocupación` },
    { label: 'Deudas pendientes',    value: m.deudosPendientesCount,                        color: m.deudosPendientesCount > 0 ? 'amber' : 'default', sub: m.deudosPendientesCount > 0 ? `$${m.deudosPendientesTotal.toLocaleString('es-AR')} total` : 'sin deudas' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-7 h-7 text-municipal-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard · RF-ADM-01</h1>
            <p className="text-xs text-gray-400">Actualizado {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          </div>
        </div>
        <button onClick={refresh} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Emergency alert badge */}
      {m.emergenciasActivas > 0 && (
        <Link href={ROUTES.admin.alertas}
          className="flex items-center gap-3 bg-red-50 border-2 border-red-300 rounded-xl p-4 hover:bg-red-100 transition-colors animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-800">{m.emergenciasActivas} alerta{m.emergenciasActivas !== 1 ? 's' : ''} activa{m.emergenciasActivas !== 1 ? 's' : ''}</p>
            <p className="text-sm text-red-600">Ver panel de alertas →</p>
          </div>
        </Link>
      )}

      {/* KPI grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Métricas en vivo</h2>
        <MetricGrid metrics={kpis} />
      </section>

      {/* Performance indicators */}
      <section>
        <PerformanceIndicators />
      </section>

      {/* Overstay panel */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tiempo excedido — Sprint 3 overstay</h2>
        <OverstayPanel />
      </section>

      {/* Active alerts (compact) */}
      {emergencias.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Alertas activas</h2>
            <Link href={ROUTES.admin.alertas} className="text-xs text-municipal-600 hover:underline">Ver todas →</Link>
          </div>
          <AlertsPanel emergencias={emergencias.slice(0, 2)} onResolved={refresh} compact />
        </section>
      )}

      {/* Nav cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NAV_CARDS.map((c) => (
            <Link key={c.href} href={c.href}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-municipal-300 hover:shadow-sm bg-white transition-all">
              <div className={`flex-shrink-0 ${c.color}`}>{c.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{c.label}</p>
                <p className="text-xs text-gray-400 truncate">{c.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

const NAV_CARDS = [
  { href: ROUTES.admin.permisionarios, icon: <Users className="w-5 h-5" />,        color: 'text-blue-500',   label: 'Permisionarios',  desc: 'CRUD · RF-ADM-03' },
  { href: ROUTES.admin.liquidaciones,  icon: <DollarSign className="w-5 h-5" />,   color: 'text-green-500',  label: 'Liquidaciones',   desc: 'Cuota 20% · RF-PER-05' },
  { href: ROUTES.admin.reportes,       icon: <BarChart3 className="w-5 h-5" />,    color: 'text-purple-500', label: 'Reportes',        desc: 'Por período/zona · RF-ADM-02' },
  { href: ROUTES.admin.pagos,          icon: <CreditCard className="w-5 h-5" />,   color: 'text-teal-500',   label: 'Pagos',           desc: 'Tabla completa · RF-ADM-02' },
  { href: ROUTES.admin.deudas,         icon: <AlertTriangle className="w-5 h-5" />,color: 'text-amber-500',  label: 'Deudas',          desc: 'RF-ADM-09' },
  { href: ROUTES.admin.auditoria,      icon: <FileText className="w-5 h-5" />,     color: 'text-gray-500',   label: 'Auditoría',       desc: 'Log completo · RF-ADM-07' },
  { href: ROUTES.admin.alertas,        icon: <AlertTriangle className="w-5 h-5" />,color: 'text-red-500',    label: 'Alertas',         desc: 'Emergencias · RF-EME-03' },
  { href: ROUTES.admin.tarifas,        icon: <DollarSign className="w-5 h-5" />,   color: 'text-indigo-500', label: 'Configuración',   desc: 'Tarifas · Zonas · Feriados' },
];
