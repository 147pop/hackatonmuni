'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Clock } from 'lucide-react';
import { AlertsPanel } from '@/components/admin/alerts-panel';
import { emergenciaStore, permisionarioStore } from '@/lib/sem-store';
import type { Emergencia } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function AlertasPage() {
  const [activas, setActivas]    = useState<Emergencia[]>([]);
  const [historial, setHistorial] = useState<Emergencia[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [tab, setTab] = useState<'activas' | 'historial'>('activas');

  const refresh = useCallback(() => {
    const all = emergenciaStore.getAll().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivas(all.filter((e) => !e.resuelta));
    setHistorial(all.filter((e) => e.resuelta));
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000); // RF-EME-03: near real-time
    return () => clearInterval(id);
  }, [refresh]);

  const perms = permisionarioStore.getAll();
  const permNombre = (id: string) => {
    const p = perms.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : id;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Alertas · RF-ADM-08 / RF-EME-03</h1>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Actualiza cada 10s · última: {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <button onClick={refresh} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setTab('activas')}
          className={`py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'activas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          Activas
          {activas.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{activas.length}</span>}
        </button>
        <button onClick={() => setTab('historial')}
          className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === 'historial' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          Historial ({historial.length})
        </button>
      </div>

      {tab === 'activas' && (
        <AlertsPanel emergencias={activas} onResolved={refresh} />
      )}

      {tab === 'historial' && (
        <div className="space-y-2">
          {historial.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Sin emergencias resueltas.</p>
          )}
          {historial.map((e) => (
            <div key={e.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${e.tipo === 'panico' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {e.tipo === 'panico' ? 'Pánico' : 'Disputa'}
                    </span>
                    <span className="text-xs text-green-600 font-medium">✓ Resuelta</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{permNombre(e.origenId)}</p>
                  <p className="text-xs text-gray-500">{e.cuadra}</p>
                  {e.notas && <p className="text-xs text-gray-400 mt-0.5 italic">&ldquo;{e.notas}&rdquo;</p>}
                </div>
                <div className="text-right text-xs text-gray-400 flex-shrink-0">
                  <p>{new Date(e.timestamp).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</p>
                  <p>{new Date(e.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
