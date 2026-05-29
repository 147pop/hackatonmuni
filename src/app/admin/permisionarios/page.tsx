'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, Search, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { permisionarioStore, ticketStore, deudaStore } from '@/lib/sem-store';
import { useAdminRole, canEdit } from '@/components/admin/role-guard';
import type { Permisionario } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function PermisionariosPage() {
  const adminRole = useAdminRole();
  const editable = canEdit(adminRole);
  const [permisionarios, setPermisionarios] = useState<Permisionario[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setPermisionarios(permisionarioStore.getAll());
  }, []);

  const filtered = permisionarios.filter((p) =>
    `${p.nombre} ${p.apellido} ${p.legajo} ${p.cuadraAsignada}`.toLowerCase().includes(query.toLowerCase()),
  );

  function handleToggleActivo(id: string, activo: boolean) {
    permisionarioStore.update(id, { activo: !activo });
    setPermisionarios(permisionarioStore.getAll());
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Permisionarios</h1>
          <p className="text-sm text-gray-500">RF-ADM-03 / RF-PER-10 — {permisionarios.length} registrados</p>
        </div>
        {editable && (
          <Link href={ROUTES.admin.permisionarioNuevo}
            className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white flex items-center gap-2 px-4">
            <Plus className="w-4 h-4" /> Nuevo
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, legajo o cuadra…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-municipal-400"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((p) => {
          const totalTickets = ticketStore.getAll().filter((t) => t.permisionarioId === p.id).length;
          const deudas = deudaStore.getAll().filter((d) => d.permisionarioId === p.id && d.estado === 'pendiente').length;
          return (
            <div key={p.id} className={`bg-white border-2 rounded-xl p-4 ${p.activo ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold flex-shrink-0">
                  {p.nombre[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{p.nombre} {p.apellido}</p>
                    {p.activo
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <p className="text-sm text-gray-500">{p.cuadraAsignada} · Legajo {p.legajo}</p>
                  <p className="text-xs text-gray-400">{totalTickets} tickets · {deudas} deudas pendientes</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editable && (
                    <button
                      onClick={() => handleToggleActivo(p.id, p.activo)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        p.activo
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {p.activo ? 'Dar de baja' : 'Activar'}
                    </button>
                  )}
                  <Link href={ROUTES.admin.permisionario(p.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">Sin resultados para «{query}»</div>
        )}
      </div>
    </div>
  );
}
