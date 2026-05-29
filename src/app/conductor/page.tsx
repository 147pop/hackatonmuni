'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, CreditCard, FileText, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { conductorStore, roleStore, ticketStore, deudaStore } from '@/lib/sem-store';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import type { Conductor, Ticket } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function ConductorPage() {
  const [conductor, setConductor] = useState<Conductor | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [deudaPendiente, setDeudaPendiente] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = roleStore.getActiveConductorId();
    if (id) {
      const c = conductorStore.getById(id);
      if (c) {
        setConductor(c);
        const ticket = ticketStore.getActivosByDominio(c.dominioDefault);
        setActiveTicket(ticket ?? null);
        const deudas = deudaStore.getByDominio(c.dominioDefault);
        setDeudaPendiente(deudas.some((d) => d.estado === 'pendiente'));
      }
    }
    setLoaded(true);
  }, []);

  function handleSelect(id: string) {
    roleStore.setActiveConductorId(id);
    const c = conductorStore.getById(id);
    if (c) {
      setConductor(c);
      const ticket = ticketStore.getActivosByDominio(c.dominioDefault);
      setActiveTicket(ticket ?? null);
      const deudas = deudaStore.getByDominio(c.dominioDefault);
      setDeudaPendiente(deudas.some((d) => d.estado === 'pendiente'));
    }
  }

  if (!loaded) return null;

  if (!conductor) {
    return <ConductorSelector onSelect={handleSelect} />;
  }

  const minRestantes = activeTicket ? calcularTiempoRestanteMinutos(activeTicket.vencimiento) : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {conductor.nombre}</h1>
          <p className="text-base text-gray-500 font-mono">{conductor.dominioDefault}</p>
        </div>
        <button
          onClick={() => { roleStore.setActiveConductorId(null); setConductor(null); }}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Cambiar
        </button>
      </div>

      {/* Active ticket banner */}
      {activeTicket && minRestantes > 0 && (
        <Link href={ROUTES.conductor.ticket(activeTicket.id)}
          className="block bg-green-50 border border-green-200 rounded-2xl p-4 hover:bg-green-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700">Ticket activo</p>
              <p className="text-base font-bold text-gray-900">{activeTicket.cuadra}</p>
            </div>
            <div className="flex items-center gap-1.5 text-green-700 font-mono font-bold">
              <Clock className="w-4 h-4" />
              {minRestantes}min restantes
            </div>
          </div>
        </Link>
      )}

      {/* Debt alert */}
      {deudaPendiente && (
        <Link href={ROUTES.conductor.deudas}
          className="block bg-red-50 border border-red-200 rounded-2xl p-4 hover:bg-red-100 transition-colors">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-base font-semibold text-red-700">Tenés deudas pendientes</p>
            <ArrowRight className="w-4 h-4 text-red-500 ml-auto" />
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Acciones</h2>
        <Link href={ROUTES.conductor.pagar}
          className="flex items-center justify-between btn-xl bg-municipal-600 hover:bg-municipal-700 text-white rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <Car className="w-6 h-6" />
            <span>{activeTicket && minRestantes > 0 ? 'Extender / nuevo ticket' : 'Estacionar'}</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link href={ROUTES.conductor.historial}
          className="flex items-center justify-between btn-xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <span>Historial</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link href={ROUTES.conductor.deudas}
          className="flex items-center justify-between btn-xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span>Consultar deudas</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

function ConductorSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const conductores = conductorStore.getAll();
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Car className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conductor</h1>
          <p className="text-base text-gray-500">Seleccioná tu perfil para continuar</p>
        </div>
      </div>
      <div className="space-y-3">
        {conductores.map((c) => (
          <button key={c.id} onClick={() => onSelect(c.id)}
            className="w-full text-left btn-xl bg-white border-2 border-gray-200 hover:border-blue-400 rounded-2xl px-5 flex items-center gap-4 transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-xl font-bold flex-shrink-0">
              {c.nombre[0]}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{c.nombre}</p>
              <p className="text-sm font-mono text-gray-500">{c.dominioDefault}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="border-t pt-4">
        <Link href={ROUTES.conductor.registro}
          className="flex items-center justify-center gap-2 btn-xl bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl px-6">
          <CreditCard className="w-5 h-5" />
          Registrarme
        </Link>
      </div>
    </div>
  );
}
