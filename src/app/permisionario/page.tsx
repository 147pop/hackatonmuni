'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Clock, CreditCard, AlertTriangle, IdCard, ArrowRight, Timer } from 'lucide-react';
import { permisionarioStore, roleStore, configStore } from '@/lib/sem-store';
import { esHorarioPermitido } from '@/domain/rules';
import { DailySummary } from '@/components/daily-summary';
import { EmergencyActions } from '@/components/emergency-actions';
import { CuadraMonitor } from '@/components/cuadra-monitor';
import type { Permisionario } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function PermisionarioPage() {
  const [perm, setPerm] = useState<Permisionario | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = roleStore.getActivePermisionarioId();
    if (id) {
      setPerm(permisionarioStore.getById(id) ?? null);
    }
    setLoaded(true);
  }, []);

  function selectPermisionario(id: string) {
    roleStore.setActivePermisionarioId(id);
    setPerm(permisionarioStore.getById(id) ?? null);
  }

  if (!loaded) return null;

  if (!perm) {
    return <PermisionarioSelector onSelect={selectPermisionario} />;
  }

  const ahora = new Date();
  const horario = esHorarioPermitido({
    timestamp: ahora,
    zonaId: perm.zonaId,
    zonas: configStore.getZonas(),
    feriados: configStore.getFeriados(),
    config: configStore.getConfig(),
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {perm.nombre} {perm.apellido}
            </h1>
            <div className="flex items-center gap-1.5 text-base text-gray-500 mt-0.5">
              <MapPin className="w-4 h-4" />
              {perm.cuadraAsignada}
            </div>
          </div>
          <button
            onClick={() => { roleStore.setActivePermisionarioId(null); setPerm(null); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Cambiar
          </button>
        </div>

        {/* Shift status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium ${
          horario.permitido
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          <Clock className="w-4 h-4" />
          {horario.permitido ? '● Turno activo' : `○ Fuera de horario${horario.razon ? ` — ${horario.razon}` : ''}`}
        </div>
      </div>

      {/* Quick actions — large buttons for RNF-16 */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wide">Acciones</h2>
        <Link href={ROUTES.permisionario.registrar} className="flex items-center justify-between btn-xl bg-municipal-600 hover:bg-municipal-700 text-white rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            <span>Registrar pago efectivo</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link href={ROUTES.permisionario.incumplimiento} className="flex items-center justify-between btn-xl bg-red-600 hover:bg-red-700 text-white rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <span>Registrar incumplimiento</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link href={ROUTES.permisionario.horaExtra} className="flex items-center justify-between btn-xl bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <Timer className="w-6 h-6" />
            <span>Cobrar hora extra</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link href={ROUTES.permisionario.credencial} className="flex items-center justify-between btn-xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <IdCard className="w-6 h-6" />
            <span>Ver credencial y QR</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Live cuadra monitor — Sprint 3, task 15 */}
      <CuadraMonitor permisionarioId={perm.id} cuadra={perm.cuadraAsignada} />

      {/* Daily summary */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wide">Resumen de hoy</h2>
        <DailySummary permisionarioId={perm.id} />
      </div>

      {/* Emergency actions */}
      <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
        <span className="text-sm text-gray-400">Emergencias</span>
        <EmergencyActions permisionarioId={perm.id} cuadra={perm.cuadraAsignada} />
      </div>
    </div>
  );
}

function PermisionarioSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const permisionarios = permisionarioStore.getAll().filter((p) => p.activo);

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">¿Quién sos?</h1>
        <p className="text-base text-gray-500 mt-1">Seleccioná tu usuario para continuar.</p>
      </div>
      <div className="space-y-3">
        {permisionarios.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="w-full text-left btn-xl bg-white border-2 border-gray-200 hover:border-municipal-400 rounded-2xl px-5 flex items-center gap-4 transition-all"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 text-xl font-bold flex-shrink-0">
              {p.nombre[0]}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{p.nombre} {p.apellido}</p>
              <p className="text-base text-gray-500">{p.cuadraAsignada} · Legajo {p.legajo}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
