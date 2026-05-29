'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Calendar } from 'lucide-react';
import { configStore } from '@/lib/sem-store';
import { useAdminRole, canEdit, ReadOnlyBanner } from '@/components/admin/role-guard';
import type { Feriado } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function FeriadosPage() {
  const adminRole = useAdminRole();
  const editable = canEdit(adminRole);
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { setFeriados(configStore.getFeriados()); }, []);

  function handleAdd() {
    if (!fecha || !descripcion.trim()) return;
    configStore.addFeriado({ fecha, descripcion: descripcion.trim() });
    setFeriados(configStore.getFeriados());
    setFecha(''); setDescripcion('');
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }

  function handleRemove(id: string) {
    configStore.removeFeriado(id);
    setFeriados(configStore.getFeriados());
  }

  const sorted = [...feriados].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feriados</h1>
          <p className="text-sm text-gray-500">RF-ADM-06 / RF-NOR-02 — {feriados.length} configurados</p>
        </div>
      </div>

      {!editable && <ReadOnlyBanner />}
      {saved && <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">Feriado agregado. Los pagos en esa fecha quedarán bloqueados.</p>}

      {/* Add form */}
      {editable && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Agregar feriado</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-municipal-400 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Descripción</label>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Día de la Patria…"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full border-2 border-gray-200 focus:border-municipal-400 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <button onClick={handleAdd} disabled={!fecha || !descripcion.trim()}
            className="btn-xl bg-municipal-600 hover:bg-municipal-700 disabled:bg-gray-300 text-white w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Agregar feriado
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">Sin feriados configurados.</div>
        )}
        {sorted.map((f) => {
          const date = new Date(f.fecha + 'T12:00:00');
          const hoy = new Date().toISOString().split('T')[0];
          const pasado = f.fecha < hoy;
          return (
            <div key={f.id} className={`flex items-center gap-4 bg-white border-2 rounded-xl p-3 ${pasado ? 'opacity-50 border-gray-100' : 'border-orange-200'}`}>
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{f.descripcion}</p>
                <p className="text-xs text-gray-500">
                  {date.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  {pasado && ' · Pasado'}
                </p>
              </div>
              {editable && (
                <button onClick={() => handleRemove(f.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
