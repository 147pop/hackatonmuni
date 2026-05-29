'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import { ticketStore } from '@/lib/sem-store';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import type { Ticket } from '@/domain/types';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';

interface CuadraMonitorProps {
  permisionarioId: string;
  cuadra: string;
}

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

export function CuadraMonitor({ permisionarioId, cuadra }: CuadraMonitorProps) {
  const [activos, setActivos] = useState<TicketConEstado[]>([]);
  const [vencidos, setVencidos] = useState<TicketConEstado[]>([]);
  const [cerrando, setCerrando] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const tickets = ticketStore.getByPermisionarioCuadra(permisionarioId, cuadra);
    const { activos: a, vencidos: v } = clasificar(tickets);
    setActivos(a);
    setVencidos(v);
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
  }

  const hayVencidos = vencidos.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Timer className="w-4 h-4" /> Mi cuadra en vivo
        </h2>
        {hayVencidos && (
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
            {vencidos.length} vencido{vencidos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Activos */}
      {activos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Activos ({activos.length})</p>
          {activos.map((t) => (
            <div key={t.id} className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-base font-bold font-mono text-gray-900">{t.dominio}</p>
                <p className="text-xs text-gray-500">{t.tipo === 'auto' ? 'Auto' : 'Moto'} · {t.duracionMinutos}min pagados</p>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1 font-mono text-sm font-bold ${t.minRestantes <= 5 ? 'text-amber-600' : 'text-green-700'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {t.minRestantes}min
                </div>
                {t.minRestantes <= 5 && (
                  <p className="text-xs text-amber-600">¡Por vencer!</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vencidos */}
      {vencidos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-red-400 uppercase tracking-wide flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Vencidos — ¿el auto sigue? ({vencidos.length})
          </p>
          {vencidos.map((t) => (
            <div key={t.id} className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold font-mono text-gray-900">{t.dominio}</p>
                  <p className="text-xs text-gray-500">
                    {t.tipo === 'auto' ? 'Auto' : 'Moto'} · venció hace {t.minutosExcedidos}min
                  </p>
                </div>
                <span className="text-sm font-bold text-red-600">+{t.minutosExcedidos}min</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleYaSeFue(t.id)}
                  disabled={cerrando === t.id}
                  className="btn-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center gap-1.5 text-sm"
                >
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ya se fue
                </button>
                <Link
                  href={`${ROUTES.permisionario.horaExtra}?dominio=${t.dominio}&ticketId=${t.id}`}
                  className="btn-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 text-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Hora extra
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {activos.length === 0 && vencidos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center bg-gray-50 rounded-xl border border-gray-200">
          <CheckCircle className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">No hay tickets activos en tu cuadra ahora.</p>
        </div>
      )}
    </div>
  );
}
