'use client';

import { useState } from 'react';
import { CreditCard, Banknote, Search } from 'lucide-react';
import { permisionarioStore } from '@/lib/sem-store';
import type { Pago } from '@/domain/types';

interface PaymentsTableProps {
  pagos: Pago[];
  pageSize?: number;
}

export function PaymentsTable({ pagos, pageSize = 20 }: PaymentsTableProps) {
  const [query, setQuery]   = useState('');
  const [metodo, setMetodo] = useState('');
  const [page, setPage]     = useState(0);

  const perms = permisionarioStore.getAll();
  const permNombre = (id: string) => {
    const p = perms.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.apellido[0]}.` : id.slice(0, 6);
  };

  const filtered = pagos
    .filter((p) => {
      if (metodo && p.metodoPago !== metodo) return false;
      if (query && !p.dominio.toUpperCase().includes(query.toUpperCase()) && !p.cuadra.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.ceil(filtered.length / pageSize);
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="Dominio o cuadra…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-municipal-400" />
        </div>
        <select value={metodo} onChange={(e) => { setMetodo(e.target.value); setPage(0); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos los métodos</option>
          <option value="digital">Digital</option>
          <option value="efectivo">Efectivo</option>
        </select>
        <span className="text-xs text-gray-400 self-center">{filtered.length} pagos</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Dominio</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Cuadra</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Permisionario</th>
              <th className="text-right px-4 py-3">Monto</th>
              <th className="text-center px-4 py-3">Método</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin pagos con esos filtros.</td></tr>
            )}
            {visible.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                  {new Date(p.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                  {' '}
                  {new Date(p.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 font-mono font-bold text-gray-900">{p.dominio}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">{p.cuadra}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">{permNombre(p.permisionarioId)}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">${p.monto.toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-center">
                  {p.metodoPago === 'digital'
                    ? <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"><CreditCard className="w-3 h-3" />Digital</span>
                    : <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"><Banknote className="w-3 h-3" />Efectivo</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Anterior</button>
          <span className="text-gray-500">Página {page + 1} de {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente →</button>
        </div>
      )}
    </div>
  );
}
