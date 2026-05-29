'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Moon, Sun, MapPin } from 'lucide-react';
import { configStore } from '@/lib/sem-store';
import { generateId } from '@/lib/sem-store';
import { useAdminRole, canEdit, ReadOnlyBanner } from '@/components/admin/role-guard';
import type { Zona } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function ZonasPage() {
  const adminRole = useAdminRole();
  const editable = canEdit(adminRole);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [newZonaNombre, setNewZonaNombre] = useState('');
  const [cuadraInputs, setCuadraInputs] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { setZonas(configStore.getZonas()); }, []);

  function save(updated: Zona[]) {
    configStore.setZonas(updated);
    setZonas(updated);
    setSaved('ok');
    setTimeout(() => setSaved(null), 1500);
  }

  function toggleNocturno(zonaId: string) {
    save(zonas.map((z) => z.id === zonaId ? { ...z, nocturnoHabilitado: !z.nocturnoHabilitado } : z));
  }

  function addCuadra(zonaId: string) {
    const cuadra = cuadraInputs[zonaId]?.trim();
    if (!cuadra) return;
    save(zonas.map((z) => z.id === zonaId ? { ...z, cuadras: [...z.cuadras, cuadra] } : z));
    setCuadraInputs((prev) => ({ ...prev, [zonaId]: '' }));
  }

  function removeCuadra(zonaId: string, cuadra: string) {
    save(zonas.map((z) => z.id === zonaId ? { ...z, cuadras: z.cuadras.filter((c) => c !== cuadra) } : z));
  }

  function addZona() {
    if (!newZonaNombre.trim()) return;
    const nueva: Zona = { id: generateId(), nombre: newZonaNombre.trim(), cuadras: [], nocturnoHabilitado: false };
    save([...zonas, nueva]);
    setNewZonaNombre('');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zonas</h1>
          <p className="text-sm text-gray-500">RF-ADM-05 / RF-NOR-07 — turnos diurno y nocturno</p>
        </div>
      </div>

      {!editable && <ReadOnlyBanner />}
      {saved && <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">Cambios guardados.</p>}

      <div className="space-y-4">
        {zonas.map((z) => (
          <div key={z.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-900">{z.nombre}</h3>
              </div>
              {editable && (
                <button
                  onClick={() => toggleNocturno(z.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${
                    z.nocturnoHabilitado
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {z.nocturnoHabilitado ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  {z.nocturnoHabilitado ? 'Nocturno activo' : 'Solo diurno'}
                </button>
              )}
              {!editable && (
                <span className={`text-xs px-2 py-1 rounded-lg ${z.nocturnoHabilitado ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                  {z.nocturnoHabilitado ? 'Nocturno' : 'Solo diurno'}
                </span>
              )}
            </div>

            {/* Cuadras */}
            <div className="flex flex-wrap gap-2">
              {z.cuadras.map((c) => (
                <span key={c} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                  {c}
                  {editable && (
                    <button onClick={() => removeCuadra(z.id, c)} className="text-gray-400 hover:text-red-500 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {z.cuadras.length === 0 && <span className="text-xs text-gray-400 italic">Sin cuadras asignadas</span>}
            </div>

            {editable && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cuadraInputs[z.id] ?? ''}
                  onChange={(e) => setCuadraInputs((prev) => ({ ...prev, [z.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addCuadra(z.id)}
                  placeholder="Agregar cuadra… (Enter)"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-municipal-400"
                />
                <button onClick={() => addCuadra(z.id)}
                  className="px-3 py-1.5 bg-municipal-600 text-white rounded-lg hover:bg-municipal-700 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editable && (
        <div className="border-t pt-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Nueva zona</h3>
          <div className="flex gap-2">
            <input type="text" value={newZonaNombre} onChange={(e) => setNewZonaNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addZona()}
              placeholder="Nombre de la zona…"
              className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-municipal-400" />
            <button onClick={addZona}
              className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Crear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
