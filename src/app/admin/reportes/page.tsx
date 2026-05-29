'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { MetricGrid, type Metric } from '@/components/admin/metric-grid';
import { pagoStore, permisionarioStore, configStore } from '@/lib/sem-store';
import type { Pago, Zona } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

type Periodo = 'hoy' | 'semana' | 'mes' | 'total';

function rangoFechas(periodo: Periodo): { desde: string; hasta: string } {
  const now = new Date();
  const hasta = now.toISOString();
  if (periodo === 'hoy') {
    return { desde: now.toISOString().split('T')[0] + 'T00:00:00.000Z', hasta };
  }
  if (periodo === 'semana') {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    return { desde: d.toISOString(), hasta };
  }
  if (periodo === 'mes') {
    const d = new Date(now); d.setDate(1); d.setHours(0, 0, 0, 0);
    return { desde: d.toISOString(), hasta };
  }
  return { desde: '2000-01-01T00:00:00.000Z', hasta };
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [zonaId, setZonaId]   = useState('');
  const [permId, setPermId]   = useState('');
  const [metodo, setMetodo]   = useState('');

  const [allPagos, setAllPagos]  = useState<Pago[]>([]);
  const [zonas, setZonas]        = useState<Zona[]>([]);

  useEffect(() => {
    setAllPagos(pagoStore.getAll().filter((p) => p.estado === 'success'));
    setZonas(configStore.getZonas());
  }, []);

  const perms = permisionarioStore.getAll();

  const cuadrasDeZona = useMemo((): Set<string> => {
    if (!zonaId) return new Set();
    return new Set(zonas.find((z) => z.id === zonaId)?.cuadras ?? []);
  }, [zonaId, zonas]);

  const filtered = useMemo(() => {
    const { desde, hasta } = rangoFechas(periodo);
    return allPagos.filter((p) => {
      if (p.createdAt < desde || p.createdAt > hasta) return false;
      if (zonaId && !cuadrasDeZona.has(p.cuadra)) return false;
      if (permId && p.permisionarioId !== permId) return false;
      if (metodo && p.metodoPago !== metodo) return false;
      return true;
    });
  }, [allPagos, periodo, zonaId, permId, metodo, cuadrasDeZona]);

  const totalMonto    = filtered.reduce((s, p) => s + p.monto, 0);
  const countDigital  = filtered.filter((p) => p.metodoPago === 'digital').length;
  const countEfectivo = filtered.filter((p) => p.metodoPago === 'efectivo').length;
  const avgMonto      = filtered.length > 0 ? Math.round(totalMonto / filtered.length) : 0;

  const kpis: Metric[] = [
    { label: 'Total recaudado', value: `$${totalMonto.toLocaleString('es-AR')}`, color: 'green' },
    { label: 'Transacciones',   value: filtered.length,                           color: 'blue' },
    { label: 'Digital',         value: countDigital,                              color: 'blue',    sub: `${filtered.length > 0 ? Math.round((countDigital / filtered.length) * 100) : 0}%` },
    { label: 'Efectivo',        value: countEfectivo,                             color: 'default', sub: `${filtered.length > 0 ? Math.round((countEfectivo / filtered.length) * 100) : 0}%` },
  ];

  // Group by permisionario
  const porPerm = perms.map((p) => ({
    nombre: `${p.nombre} ${p.apellido}`,
    cuadra: p.cuadraAsignada,
    count: filtered.filter((pg) => pg.permisionarioId === p.id).length,
    total: filtered.filter((pg) => pg.permisionarioId === p.id).reduce((s, pg) => s + pg.monto, 0),
  })).filter((r) => r.count > 0).sort((a, b) => b.total - a.total);

  // Group by cuadra
  const porCuadra = Array.from(
    filtered.reduce((map, p) => {
      const prev = map.get(p.cuadra) ?? { count: 0, total: 0 };
      return map.set(p.cuadra, { count: prev.count + 1, total: prev.total + p.monto });
    }, new Map<string, { count: number; total: number }>()),
  ).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  const PERIODOS: { value: Periodo; label: string }[] = [
    { value: 'hoy', label: 'Hoy' }, { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' }, { value: 'total', label: 'Total' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes · RF-ADM-02</h1>
          <p className="text-sm text-gray-500">Recaudación filtrable por período, zona y permisionario</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Período */}
          <div className="col-span-2 sm:col-span-1 flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            {PERIODOS.map((p) => (
              <button key={p.value} onClick={() => setPeriodo(p.value)}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${periodo === p.value ? 'bg-municipal-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <select value={zonaId} onChange={(e) => setZonaId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="">Todas las zonas</option>
            {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
          </select>
          <select value={permId} onChange={(e) => setPermId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="">Todos los permisionarios</option>
            {perms.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
          </select>
          <select value={metodo} onChange={(e) => setMetodo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="">Ambos métodos</option>
            <option value="digital">Digital</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <MetricGrid metrics={kpis} />

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Por permisionario */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Por permisionario</h3>
          </div>
          {porPerm.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
            : <div className="divide-y divide-gray-50">
                {porPerm.map((r) => (
                  <div key={r.nombre} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.nombre}</p>
                      <p className="text-xs text-gray-400">{r.cuadra} · {r.count} pagos</p>
                    </div>
                    <p className="font-bold text-gray-900">${r.total.toLocaleString('es-AR')}</p>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Top cuadras */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Top cuadras</h3>
          </div>
          {porCuadra.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
            : <div className="divide-y divide-gray-50">
                {porCuadra.map(([cuadra, data]) => (
                  <div key={cuadra} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cuadra}</p>
                      <p className="text-xs text-gray-400">{data.count} pagos</p>
                    </div>
                    <p className="font-bold text-gray-900">${data.total.toLocaleString('es-AR')}</p>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {avgMonto > 0 && (
        <p className="text-xs text-gray-400 text-center">Ticket promedio: ${avgMonto.toLocaleString('es-AR')}</p>
      )}
    </div>
  );
}
