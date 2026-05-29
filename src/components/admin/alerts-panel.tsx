'use client';

import { useState } from 'react';
import { AlertTriangle, HelpCircle, CheckCircle, MapPin, Clock } from 'lucide-react';
import { emergenciaStore, permisionarioStore } from '@/lib/sem-store';
import type { Emergencia } from '@/domain/types';

interface AlertsPanelProps {
  emergencias: Emergencia[];
  onResolved: () => void;
  compact?: boolean;
}

export function AlertsPanel({ emergencias, onResolved, compact }: AlertsPanelProps) {
  const [resolving, setResolving] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});

  function handleResolve(id: string) {
    setResolving(id);
    emergenciaStore.resolver(id, notas[id] ?? '');
    onResolved();
    setResolving(null);
  }

  if (emergencias.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle className="w-10 h-10 text-green-300" />
        <p className="text-sm text-gray-400">Sin alertas activas. Todo en orden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {emergencias.map((e) => {
        const perm = permisionarioStore.getById(e.origenId);
        const minutos = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / 60000);
        const esPanico = e.tipo === 'panico';
        return (
          <div key={e.id} className={`border-2 rounded-xl p-4 space-y-3 ${esPanico ? 'border-red-300 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${esPanico ? 'bg-red-500' : 'bg-orange-400'}`}>
                {esPanico ? <HelpCircle className="w-5 h-5 text-white" /> : <AlertTriangle className="w-5 h-5 text-white" />}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${esPanico ? 'text-red-800' : 'text-orange-800'}`}>
                  {esPanico ? 'ALERTA DE PÁNICO' : 'Disputa / Conflicto'}
                  <span className="ml-2 text-xs font-normal opacity-60 capitalize">{e.origenRol}</span>
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.cuadra}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />hace {minutos}min</span>
                </div>
                {perm && <p className="text-xs text-gray-500 mt-0.5">{perm.nombre} {perm.apellido} · Legajo {perm.legajo}</p>}
                <p className="text-xs text-gray-400">GPS: {e.coordenadas.lat.toFixed(4)}, {e.coordenadas.lng.toFixed(4)} [SIMULACION]</p>
              </div>
            </div>
            {!compact && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={notas[e.id] ?? ''}
                  onChange={(ev) => setNotas((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                  placeholder="Notas de resolución (opcional)…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-municipal-400"
                />
                <button
                  onClick={() => handleResolve(e.id)}
                  disabled={resolving === e.id}
                  className="btn-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white w-full text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {resolving === e.id ? 'Resolviendo…' : 'Marcar como resuelta (RF-EME-05)'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
