'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Banknote, AlertTriangle, Clock } from 'lucide-react';
import { permisionarioStore, roleStore, ticketStore, deudaStore } from '@/lib/sem-store';
import type { Permisionario, Ticket, Deuda } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function ActividadPage() {
  const [perm, setPerm] = useState<Permisionario | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);

  useEffect(() => {
    const id = roleStore.getActivePermisionarioId();
    if (!id) return;
    const p = permisionarioStore.getById(id);
    if (!p) return;
    setPerm(p);

    const hoy = new Date().toISOString().split('T')[0];
    setTickets(
      ticketStore.getAll().filter((t) => t.permisionarioId === id && t.inicio.startsWith(hoy)),
    );
    setDeudas(
      deudaStore.getAll().filter((d) => d.permisionarioId === id && d.fecha.startsWith(hoy)),
    );
  }, []);

  if (!perm) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-base text-gray-500">Primero seleccioná tu usuario.</p>
        <Link href={ROUTES.permisionario.root} className="btn-xl inline-block bg-municipal-600 text-white rounded-xl px-6">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.permisionario.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actividad de hoy</h1>
          <p className="text-base text-gray-500">{perm.cuadraAsignada}</p>
        </div>
      </div>

      {/* Tickets */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Pagos registrados ({tickets.length})
        </h2>
        {tickets.length === 0 ? (
          <EmptyState icon={<CreditCard className="w-8 h-8 text-gray-300" />} message="Todavía no registraste pagos hoy." />
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-lg font-bold font-mono text-gray-900">{t.dominio}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(t.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{t.duracionMinutos} min
                  </p>
                  <p className="text-sm text-gray-400">{t.numero}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-lg font-bold text-gray-900">${t.monto.toLocaleString('es-AR')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.metodoPago === 'digital'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {t.metodoPago === 'digital' ? <CreditCard className="inline w-3 h-3 mr-1" /> : <Banknote className="inline w-3 h-3 mr-1" />}
                    {t.metodoPago === 'digital' ? 'Digital' : 'Efectivo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Debts */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" /> Incumplimientos ({deudas.length})
        </h2>
        {deudas.length === 0 ? (
          <EmptyState icon={<AlertTriangle className="w-8 h-8 text-gray-300" />} message="Sin incumplimientos registrados hoy." />
        ) : (
          <div className="space-y-2">
            {deudas.map((d) => (
              <div key={d.id} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-lg font-bold font-mono text-gray-900">{d.dominio}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(d.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-700">${d.monto.toLocaleString('es-AR')}</p>
                  <p className="text-xs text-red-500 capitalize">{d.estado}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      {icon}
      <p className="text-base text-gray-400">{message}</p>
    </div>
  );
}
