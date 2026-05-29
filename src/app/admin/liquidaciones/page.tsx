'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { permisionarioStore, pagoStore, liquidacionStore } from '@/lib/sem-store';
import { calcularLiquidacion } from '@/domain/calculations';
import { useAdminRole, canEdit, ReadOnlyBanner } from '@/components/admin/role-guard';
import type { Permisionario, Pago, Liquidacion } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

interface PermResumen {
  perm: Permisionario;
  pagos: Pago[];
  total: number;
  cuotaMunicipal: number;
  montoLiquidado: number;
  liquidaciones: Liquidacion[];
}

const PERIODO_ACTUAL = new Date().toISOString().slice(0, 7); // "2026-05"

function formatPeriodo(p: string) {
  const [y, m] = p.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${meses[parseInt(m) - 1]} ${y}`;
}

export default function LiquidacionesPage() {
  const adminRole = useAdminRole();
  const editable = canEdit(adminRole);
  const [resumen, setResumen] = useState<PermResumen[]>([]);
  const [periodo, setPeriodo] = useState(PERIODO_ACTUAL);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { load(); }, [periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  function load() {
    const perms = permisionarioStore.getAll();
    const allPagos = pagoStore.getAll().filter((p) => p.estado === 'success');

    const data: PermResumen[] = perms.map((perm) => {
      const pagos = allPagos.filter((p) => {
        if (p.permisionarioId !== perm.id) return false;
        return p.createdAt.startsWith(periodo);
      });
      const total = pagos.reduce((s, p) => s + p.monto, 0);
      const { cuotaMunicipal, montoLiquidado } = calcularLiquidacion(total);
      const liquidaciones = liquidacionStore.getByPermisionario(perm.id).filter((l) => l.periodo === periodo);
      return { perm, pagos, total, cuotaMunicipal, montoLiquidado, liquidaciones };
    });

    setResumen(data);
  }

  function handleTransferir(permId: string, total: number, cuotaMunicipal: number, montoLiquidado: number) {
    setProcessing(permId);
    const liq = liquidacionStore.create({
      permisionarioId: permId,
      periodo,
      totalRecaudado: total,
      cuotaMunicipal,
      montoLiquidado,
      estado: 'pendiente',
    });
    liquidacionStore.transferir(liq.id);
    setTimeout(() => { load(); setProcessing(null); }, 600);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const yaLiquidadoIds = new Set(resumen.filter((r) => r.liquidaciones.some((l) => l.estado === 'transferida')).map((r) => r.perm.id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Liquidaciones</h1>
          <p className="text-sm text-gray-500">RF-ADM-11 / RF-PER-05 / RF-PER-06 — cuota 20% municipal</p>
        </div>
        <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)}
          className="border-2 border-gray-200 focus:border-municipal-400 rounded-xl px-3 py-2 text-sm outline-none" />
      </div>

      {!editable && <ReadOnlyBanner />}

      {/* Summary totals */}
      {resumen.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Total recaudado" value={`$${resumen.reduce((s, r) => s + r.total, 0).toLocaleString('es-AR')}`} />
          <MetricCard label="Cuota municipal (20%)" value={`$${resumen.reduce((s, r) => s + r.cuotaMunicipal, 0).toLocaleString('es-AR')}`} highlight />
          <MetricCard label="Liquidado a perms." value={`$${resumen.reduce((s, r) => s + r.montoLiquidado, 0).toLocaleString('es-AR')}`} />
        </div>
      )}

      {/* Per-permisionario breakdown */}
      <div className="space-y-3">
        {resumen.map((r) => {
          const yaLiquidado = yaLiquidadoIds.has(r.perm.id);
          const isExpanded = expanded.has(r.perm.id);
          return (
            <div key={r.perm.id} className={`bg-white border-2 rounded-xl overflow-hidden ${yaLiquidado ? 'border-green-200' : 'border-gray-200'}`}>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-bold flex-shrink-0">
                    {r.perm.nombre[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{r.perm.nombre} {r.perm.apellido}</p>
                      {yaLiquidado && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-xs text-gray-500">{r.perm.cuadraAsignada} · {r.pagos.length} pagos en {formatPeriodo(periodo)}</p>
                  </div>
                  <button onClick={() => toggleExpand(r.perm.id)} className="p-1 text-gray-400 hover:text-gray-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {r.total > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <LiqRow label="Recaudado" value={r.total} />
                    <LiqRow label="Cuota 20%" value={r.cuotaMunicipal} accent />
                    <LiqRow label="Liquidado" value={r.montoLiquidado} />
                  </div>
                )}

                {r.total === 0 && (
                  <p className="mt-2 text-sm text-gray-400 text-center">Sin recaudación en {formatPeriodo(periodo)}</p>
                )}

                {editable && r.total > 0 && !yaLiquidado && (
                  <button
                    onClick={() => handleTransferir(r.perm.id, r.total, r.cuotaMunicipal, r.montoLiquidado)}
                    disabled={processing === r.perm.id}
                    className="mt-3 btn-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <DollarSign className="w-4 h-4" />
                    {processing === r.perm.id ? 'Procesando…' : `Transferir $${r.montoLiquidado.toLocaleString('es-AR')} [SIMULACION]`}
                  </button>
                )}

                {yaLiquidado && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">
                    <CheckCircle className="w-4 h-4" />
                    Liquidación transferida
                  </div>
                )}
              </div>

              {/* Expanded: pagos detail */}
              {isExpanded && r.pagos.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Detalle de pagos</p>
                  {r.pagos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-gray-700">{p.dominio}</span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(p.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                        {' · '}{p.metodoPago}
                      </span>
                      <span className="font-bold text-gray-900">${p.monto.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Liquidaciones históricas */}
              {isExpanded && r.liquidaciones.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Historial de liquidaciones</p>
                  {r.liquidaciones.map((l) => (
                    <div key={l.id} className="flex justify-between text-xs">
                      <span className="text-gray-500">{formatPeriodo(l.periodo)}</span>
                      <span className={`font-medium ${l.estado === 'transferida' ? 'text-green-600' : 'text-gray-500'}`}>{l.estado}</span>
                      <span className="font-bold">${l.montoLiquidado.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center border-2 ${highlight ? 'bg-municipal-50 border-municipal-200' : 'bg-gray-50 border-gray-200'}`}>
      <p className={`text-lg font-bold ${highlight ? 'text-municipal-700' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function LiqRow({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-2 ${accent ? 'bg-municipal-50' : 'bg-gray-50'}`}>
      <p className={`text-sm font-bold ${accent ? 'text-municipal-700' : 'text-gray-900'}`}>${value.toLocaleString('es-AR')}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
