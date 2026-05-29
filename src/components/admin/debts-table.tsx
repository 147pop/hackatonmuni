'use client';

import { useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { ticketStore } from '@/lib/sem-store';
import type { Deuda, DebtType } from '@/domain/types';

interface DebtsTableProps {
  deudas: Deuda[];
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-red-100 text-red-700',
  pagada:    'bg-green-100 text-green-700',
  vencida:   'bg-gray-100 text-gray-600',
};

const TIPO_COLOR: Record<DebtType, string> = {
  incumplimiento: 'bg-red-50 text-red-600',
  hora_extra:     'bg-amber-100 text-amber-700',
};

export function DebtsTable({ deudas }: DebtsTableProps) {
  const [query, setQuery]   = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo]     = useState('');

  const filtered = deudas
    .filter((d) => {
      if (estado && d.estado !== estado) return false;
      if (tipo === 'incumplimiento' && d.tipo && d.tipo !== 'incumplimiento') return false;
      if (tipo === 'hora_extra' && d.tipo !== 'hora_extra') return false;
      if (query && !d.dominio.toUpperCase().includes(query.toUpperCase()) && !d.cuadra.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Dominio o cuadra…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-municipal-400" />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos los tipos</option>
          <option value="incumplimiento">Incumplimiento</option>
          <option value="hora_extra">Hora extra</option>
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagada">Pagada</option>
          <option value="vencida">Vencida</option>
        </select>
        <span className="text-xs text-gray-400 self-center">{filtered.length} deudas</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Dominio</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Cuadra</th>
              <th className="text-center px-4 py-3">Tipo</th>
              <th className="text-right px-4 py-3">Monto</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-center px-4 py-3 hidden md:table-cell">Ticket orig.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Sin deudas con esos filtros.</td></tr>
            )}
            {filtered.map((d) => {
              const tOrig = d.ticketOriginalId ? ticketStore.getById(d.ticketOriginalId) : undefined;
              const tipoLabel = d.tipo ?? 'incumplimiento';
              return (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap tabular-nums">
                    {new Date(d.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{d.dominio}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">{d.cuadra}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[tipoLabel as DebtType] ?? 'bg-gray-100 text-gray-600'}`}>
                      {tipoLabel === 'hora_extra' ? 'Hora extra' : 'Incumplimiento'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">${d.monto.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[d.estado] ?? ''}`}>
                      {d.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    {tOrig
                      ? <span className="text-xs font-mono text-blue-600" title={`${tOrig.duracionMinutos}min · ${tOrig.cuadra}`}>{tOrig.numero} <ExternalLink className="inline w-3 h-3" /></span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
