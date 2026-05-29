'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Banknote, Clock } from 'lucide-react';
import { conductorStore, roleStore, ticketStore } from '@/lib/sem-store';
import type { Ticket } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function HistorialPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [conductorNombre, setConductorNombre] = useState('');

  useEffect(() => {
    const id = roleStore.getActiveConductorId();
    if (!id) return;
    const c = conductorStore.getById(id);
    if (!c) return;
    setConductorNombre(c.nombre);
    // RF-USR-03: history by dominio
    const all = ticketStore.getByDominio(c.dominioDefault);
    setTickets(all.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()));
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.conductor.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
          {conductorNombre && <p className="text-base text-gray-500">{conductorNombre} · RF-USR-03</p>}
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Clock className="w-12 h-12 text-gray-200" />
          <p className="text-base text-gray-400">Sin estacionamientos registrados.</p>
          <Link href={ROUTES.conductor.pagar} className="btn-xl bg-municipal-600 text-white px-6">
            Estacionar ahora
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const activo = t.activo && new Date(t.vencimiento) > new Date();
            return (
              <Link
                key={t.id}
                href={ROUTES.conductor.ticket(t.id)}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-municipal-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-gray-900">{t.cuadra}</p>
                      {activo && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Activo</span>}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(t.inicio).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      {' · '}
                      {new Date(t.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{t.duracionMinutos}min
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{t.numero}</p>
                  </div>
                  <div className="text-right space-y-1.5">
                    <p className="text-lg font-bold text-gray-900">${t.monto.toLocaleString('es-AR')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 justify-end ${t.metodoPago === 'digital' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {t.metodoPago === 'digital' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                      {t.metodoPago === 'digital' ? 'Digital' : 'Efectivo'}
                    </span>
                    {t.descuentoAplicado && <p className="text-xs text-blue-500">20% dto.</p>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
