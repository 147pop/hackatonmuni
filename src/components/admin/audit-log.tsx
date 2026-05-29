'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { AuditEvent } from '@/domain/types';

interface AuditLogProps {
  events: AuditEvent[];
  maxVisible?: number;
}

const TIPO_COLOR: Record<string, string> = {
  ticket_create:         'bg-blue-100 text-blue-700',
  pago_create:           'bg-green-100 text-green-700',
  deuda_create:          'bg-red-100 text-red-700',
  deuda_update:          'bg-amber-100 text-amber-700',
  emergencia_create:     'bg-red-200 text-red-800',
  emergencia_resolver:   'bg-green-200 text-green-800',
  tarifa_update:         'bg-purple-100 text-purple-700',
  config_update:         'bg-purple-100 text-purple-700',
  zonas_update:          'bg-teal-100 text-teal-700',
  feriados_update:       'bg-orange-100 text-orange-700',
  feriado_add:           'bg-orange-100 text-orange-700',
  feriado_remove:        'bg-orange-100 text-orange-700',
  permisionario_create:  'bg-indigo-100 text-indigo-700',
  permisionario_update:  'bg-indigo-100 text-indigo-700',
  liquidacion_create:    'bg-green-100 text-green-700',
  liquidacion_transferir:'bg-green-200 text-green-800',
  role_switch:           'bg-gray-100 text-gray-600',
  sistema_init:          'bg-gray-100 text-gray-500',
};

function badge(tipo: string) {
  return TIPO_COLOR[tipo] ?? 'bg-gray-100 text-gray-600';
}

function datosResumen(datos: Record<string, unknown>): string {
  const entries = Object.entries(datos).slice(0, 3);
  if (entries.length === 0) return '';
  return entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(' · ');
}

export function AuditLog({ events, maxVisible = 100 }: AuditLogProps) {
  const [filterTipo, setFilterTipo] = useState('');
  const [showAll, setShowAll] = useState(false);

  const tipos = Array.from(new Set(events.map((e) => e.tipo))).sort();

  const filtered = events
    .filter((e) => !filterTipo || e.tipo === filterTipo)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const visible = showAll ? filtered : filtered.slice(0, maxVisible);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-municipal-400"
        >
          <option value="">Todos los tipos ({events.length})</option>
          {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} eventos</span>
      </div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <FileText className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-400">Sin eventos de auditoría.</p>
        </div>
      )}

      <div className="space-y-1.5">
        {visible.map((e) => (
          <div key={e.id} className="bg-white border border-gray-100 rounded-lg px-3 py-2 flex items-start gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium flex-shrink-0 mt-0.5 ${badge(e.tipo)}`}>
              {e.tipo}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">{e.entidad}/{e.entidadId.slice(0, 8)}</span>
                <span className="text-xs text-gray-400">· {e.usuarioRol}</span>
              </div>
              {Object.keys(e.datos).length > 0 && (
                <p className="text-xs text-gray-400 truncate">{datosResumen(e.datos)}</p>
              )}
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
              {new Date(e.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      {filtered.length > maxVisible && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-sm text-municipal-600 hover:underline w-full text-center">
          Ver {filtered.length - maxVisible} eventos más…
        </button>
      )}
    </div>
  );
}
