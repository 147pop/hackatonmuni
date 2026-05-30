'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, AlertTriangle, Timer, ChevronDown, ChevronUp, CreditCard, Hourglass, QrCode } from 'lucide-react';
import { ticketStore, observadoStore } from '@/lib/sem-store';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import type { Ticket, VehiculoObservado } from '@/domain/types';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';

interface CuadraMonitorProps {
  permisionarioId: string;
  cuadra: string;
}

type VehiculoEntry =
  | { kind: 'observado'; data: VehiculoObservado }
  | { kind: 'activo'; data: TicketConEstado }
  | { kind: 'vencido'; data: TicketConEstado };

interface TicketConEstado extends Ticket {
  minRestantes: number;
  minutosExcedidos: number;
}

function clasificar(tickets: Ticket[]): { activos: TicketConEstado[]; vencidos: TicketConEstado[] } {
  const ahora = Date.now();
  const activos: TicketConEstado[] = [];
  const vencidos: TicketConEstado[] = [];

  for (const t of tickets) {
    const minRestantes = calcularTiempoRestanteMinutos(t.vencimiento);
    const diff = ahora - new Date(t.vencimiento).getTime();
    const minutosExcedidos = Math.max(0, Math.floor(diff / 60000));
    const enriquecido = { ...t, minRestantes, minutosExcedidos };
    if (minRestantes > 0) {
      activos.push(enriquecido);
    } else {
      vencidos.push(enriquecido);
    }
  }

  return {
    activos: activos.sort((a, b) => a.minRestantes - b.minRestantes),
    vencidos: vencidos.sort((a, b) => b.minutosExcedidos - a.minutosExcedidos),
  };
}

function formatHM(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function CuadraMonitor({ permisionarioId, cuadra }: CuadraMonitorProps) {
  const [activos, setActivos] = useState<TicketConEstado[]>([]);
  const [vencidos, setVencidos] = useState<TicketConEstado[]>([]);
  const [observados, setObservados] = useState<VehiculoObservado[]>([]);
  const [cerrando, setCerrando] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const tickets = ticketStore.getByPermisionarioCuadra(permisionarioId, cuadra);
    const { activos: a, vencidos: v } = clasificar(tickets);
    setActivos(a);
    setVencidos(v);

    const allObservados = observadoStore.getByPermisionarioCuadra(permisionarioId, cuadra);
    const impagos = allObservados.filter((obs) =>
      !a.some((t) => t.dominio.toUpperCase() === obs.dominio.toUpperCase()) &&
      !v.some((t) => t.dominio.toUpperCase() === obs.dominio.toUpperCase())
    );
    setObservados(impagos.sort((o1, o2) => new Date(o2.timestamp).getTime() - new Date(o1.timestamp).getTime()));
  }, [permisionarioId, cuadra]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  function handleYaSeFue(ticketId: string) {
    setCerrando(ticketId);
    ticketStore.update(ticketId, { activo: false });
    refresh();
    setCerrando(null);
    setExpandido(null);
  }

  function handleQuitarObservado(dominio: string) {
    observadoStore.remove(dominio);
    refresh();
    setExpandido(null);
  }

  function toggleExpansion(key: string) {
    setExpandido((prev) => (prev === key ? null : key));
  }

  const impagos: VehiculoEntry[] = [
    ...observados.map((o) => ({ kind: 'observado' as const, data: o })),
    ...vencidos.map((t) => ({ kind: 'vencido' as const, data: t })),
  ];

  const pagados: VehiculoEntry[] = [
    ...activos.map((t) => ({ kind: 'activo' as const, data: t })),
  ];

  const total = impagos.length + pagados.length;
  const hayVencidos = vencidos.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)' }}>
          Vehículos en mi cuadra
        </h2>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(127,181,255,0.15)', color: 'var(--azul-vivo)' }}>
              {total}
            </span>
          )}
          {hayVencidos && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
              {vencidos.length} vencido{vencidos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {total === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center bg-gray-50 rounded-xl border border-gray-200">
          <CheckCircle className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">No hay vehículos registrados en tu cuadra ahora.</p>
          <p className="text-xs text-gray-300">Registrá un vehículo con la patente arriba.</p>
        </div>
      )}

      {impagos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b91c1c' }}>
              Sin pagar ({impagos.length})
            </h3>
          </div>
          {impagos.map((entry) => {
            const key = entry.kind === 'observado'
              ? `obs-${entry.data.id}`
              : `tk-${entry.data.id}`;
            const isOpen = expandido === key;

            if (entry.kind === 'observado') {
              const o = entry.data;
              const minEstacionado = Math.floor((Date.now() - new Date(o.timestamp).getTime()) / 60000);
              return (
                <div key={key} className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleExpansion(key)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
                      <div>
                        <p className="text-base font-bold font-mono text-gray-900">{o.dominio}</p>
                        <p className="text-xs text-red-600 font-medium">
                          Debe {formatHM(minEstacionado)}hs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-red-100 text-red-700">
                        Sin ticket
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 pt-1 space-y-2 border-t border-red-100">
                      <Link
                        href={`${ROUTES.permisionario.registrar}?dominio=${o.dominio}`}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        Cobrar efectivo
                      </Link>
                      <Link
                        href={`${ROUTES.permisionario.cobrarQr}?dominio=${o.dominio}`}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                        Cobrar con QR
                      </Link>
                      <Link
                        href={`${ROUTES.permisionario.incumplimiento}?dominio=${o.dominio}`}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Registrar incumplimiento
                      </Link>
                      <button
                        onClick={() => handleQuitarObservado(o.dominio)}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Se fue
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // vencido (impago)
            const t = entry.data;
            return (
              <div key={key} className="bg-red-50 border border-red-200 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleExpansion(key)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-100/50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
                    <div>
                      <p className="text-base font-bold font-mono text-gray-900">{t.dominio}</p>
                      <p className="text-xs text-red-600 font-medium">
                        Vencido — debe {formatHM(t.minutosExcedidos)}hs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                      +{formatHM(t.minutosExcedidos)}hs
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 pt-1 space-y-2 border-t border-red-200">
                    <Link
                      href={`${ROUTES.permisionario.horaExtra}?dominio=${t.dominio}&ticketId=${t.id}`}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <Timer className="w-4 h-4" />
                      Cobrar hora extra
                    </Link>
                    <Link
                      href={`${ROUTES.permisionario.incumplimiento}?dominio=${t.dominio}`}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Registrar incumplimiento
                    </Link>
                    <button
                      onClick={() => handleYaSeFue(t.id)}
                      disabled={cerrando === t.id}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {cerrando === t.id ? 'Cerrando…' : 'Ya se fue'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagados.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#15803d' }}>
              Al día ({pagados.length})
            </h3>
          </div>
          {pagados.map((entry) => {
            if (entry.kind !== 'activo') return null;
            const key = `tk-${entry.data.id}`;
            const isOpen = expandido === key;
            const t = entry.data;
            const horasPagadas = formatHM(t.duracionMinutos);
            const horasRestantes = formatHM(t.minRestantes);
            const proximoVencer = t.minRestantes <= 5;

            return (
              <div key={key} className="bg-green-50 border border-green-200 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleExpansion(key)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-100/50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500" />
                    <div>
                      <p className="text-base font-bold font-mono text-gray-900">{t.dominio}</p>
                      <p className="text-xs text-green-700 font-medium">
                        Pagó {horasPagadas}hs · {t.tipo === 'auto' ? 'Auto' : 'Moto'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 font-mono text-sm font-bold ${proximoVencer ? 'text-amber-600' : 'text-green-700'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      {horasRestantes}hs
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 pt-1 space-y-2 border-t border-green-200">
                    {proximoVencer && (
                      <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                        <Hourglass className="w-3.5 h-3.5" /> ¡Por vencer!
                      </p>
                    )}
                    <Link
                      href={`${ROUTES.permisionario.horaExtra}?dominio=${t.dominio}&ticketId=${t.id}`}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <Timer className="w-4 h-4" />
                      Cobrar hora extra
                    </Link>
                    <button
                      onClick={() => handleYaSeFue(t.id)}
                      disabled={cerrando === t.id}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {cerrando === t.id ? 'Cerrando…' : 'Ya se fue'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}