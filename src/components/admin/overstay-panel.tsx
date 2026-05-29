'use client';

import { ticketStore, deudaStore, permisionarioStore } from '@/lib/sem-store';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export function OverstayPanel() {
  const now = new Date();

  // Tickets vencidos sin cerrar (activo: true pero vencimiento < now)
  const vencidosSinCerrar = ticketStore.getAll().filter(
    (t) => t.activo && new Date(t.vencimiento) < now,
  );

  const deudas     = deudaStore.getAll();
  const horasExtra = deudas.filter((d) => d.tipo === 'hora_extra');
  const incs       = deudas.filter((d) => !d.tipo || d.tipo === 'incumplimiento');

  const conDatos    = horasExtra.filter((d) => d.minutosExcedidos !== undefined);
  const avgOverstay = conDatos.length > 0
    ? Math.round(conDatos.reduce((s, d) => s + (d.minutosExcedidos ?? 0), 0) / conDatos.length)
    : 0;

  const perms = permisionarioStore.getAll();
  const permNombre = (id: string) => {
    const p = perms.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.apellido[0]}.` : '—';
  };

  return (
    <div className="space-y-5">
      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-800">{vencidosSinCerrar.length}</p>
          <p className="text-xs text-amber-600 mt-0.5">Tickets vencidos sin cerrar</p>
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-800">{horasExtra.length}</p>
          <p className="text-xs text-orange-600 mt-0.5">Deudas hora extra</p>
        </div>
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{avgOverstay > 0 ? `${avgOverstay}m` : '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Excedencia promedio</p>
        </div>
      </div>

      {/* Vencidos sin cerrar */}
      {vencidosSinCerrar.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tickets vencidos sin cierre</h3>
          <div className="overflow-x-auto rounded-xl border border-amber-200">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-xs font-semibold text-amber-700 uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Dominio</th>
                  <th className="text-left px-3 py-2 hidden sm:table-cell">Cuadra</th>
                  <th className="text-left px-3 py-2">Permisionario</th>
                  <th className="text-right px-3 py-2">Excedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 bg-white">
                {vencidosSinCerrar.map((t) => {
                  const min = Math.floor((now.getTime() - new Date(t.vencimiento).getTime()) / 60000);
                  return (
                    <tr key={t.id} className="hover:bg-amber-50">
                      <td className="px-3 py-2 font-mono font-bold text-gray-900">{t.dominio}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs hidden sm:table-cell">{t.cuadra}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{permNombre(t.permisionarioId)}</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-700">+{min}min</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deudas hora_extra vs incumplimiento */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Deudas por tipo — hora extra vs incumplimiento
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex">
            <div className="flex-1 p-4 text-center border-r border-gray-100">
              <p className="text-xl font-bold text-amber-700">{horasExtra.length}</p>
              <p className="text-xs text-amber-600">Hora extra</p>
              <p className="text-xs text-gray-400">${horasExtra.reduce((s, d) => s + d.monto, 0).toLocaleString('es-AR')} total</p>
            </div>
            <div className="flex-1 p-4 text-center">
              <p className="text-xl font-bold text-red-700">{incs.length}</p>
              <p className="text-xs text-red-600">Incumplimiento</p>
              <p className="text-xs text-gray-400">${incs.reduce((s, d) => s + d.monto, 0).toLocaleString('es-AR')} total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Últimas horas extra con ticket original */}
      {horasExtra.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Últimas horas extra</h3>
          <div className="space-y-1.5">
            {horasExtra.slice(0, 5).map((d) => {
              const tOrig = d.ticketOriginalId ? ticketStore.getById(d.ticketOriginalId) : undefined;
              return (
                <div key={d.id} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-gray-900">{d.dominio}</span>
                    <span className="ml-2 text-xs text-gray-500">{d.cuadra}</span>
                    {d.minutosExcedidos !== undefined && (
                      <span className="ml-2 text-xs text-amber-700">+{d.minutosExcedidos}min</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-700">${d.monto.toLocaleString('es-AR')}</span>
                    {tOrig && (
                      <Link href={ROUTES.admin.deudas} className="text-xs text-blue-500 hover:text-blue-700">
                        {tOrig.numero} <ExternalLink className="inline w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {horasExtra.length === 0 && vencidosSinCerrar.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Sin eventos de tiempo excedido registrados.</p>
      )}
    </div>
  );
}
