'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import { TimeRemaining } from '@/components/time-remaining';
import { ticketStore } from '@/lib/sem-store';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import { puedeTransferir } from '@/domain/rules';
import type { Ticket } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function TicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [minRestantes, setMinRestantes] = useState(0);

  const loadTicket = useCallback(() => {
    const t = ticketStore.getById(ticketId);
    setTicket(t ?? null);
    if (t) setMinRestantes(calcularTiempoRestanteMinutos(t.vencimiento));
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
    const interval = setInterval(loadTicket, 30_000);
    return () => clearInterval(interval);
  }, [loadTicket]);

  if (!ticket) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-base text-gray-500">Ticket no encontrado.</p>
        <Link href={ROUTES.conductor.root} className="btn-xl bg-municipal-600 text-white inline-block px-6">Volver</Link>
      </div>
    );
  }

  const expirado = minRestantes === 0;
  const puedePagar = !expirado;
  const puedeTransferirTicket = puedeTransferir(ticket.vencimiento);
  const vencimientoDate = new Date(ticket.vencimiento);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.conductor.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-mono text-gray-900">{ticket.dominio}</h1>
          <p className="text-sm text-gray-500">{ticket.numero}</p>
        </div>
      </div>

      {/* Countdown */}
      <div className={`rounded-2xl p-5 text-center space-y-2 ${expirado ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
        {expirado ? (
          <div className="space-y-1">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-xl font-bold text-red-700">Ticket vencido</p>
            <p className="text-sm text-gray-500">Venció el {vencimientoDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-green-700">Tiempo restante</p>
            <TimeRemaining
              vencimiento={ticket.vencimiento}
              ticketId={ticket.id}
              dominio={ticket.dominio}
              onExpired={() => setMinRestantes(0)}
            />
            <p className="text-xs text-gray-500">
              Vence a las {vencimientoDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>

      {/* Ticket info */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 text-sm">
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Cuadra" value={ticket.cuadra} />
        <InfoRow icon={<Clock className="w-4 h-4" />} label="Inicio" value={new Date(ticket.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} />
        <InfoRow icon={<Clock className="w-4 h-4" />} label="Duración pagada" value={`${ticket.duracionMinutos} min`} />
        <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Monto" value={`$${ticket.monto.toLocaleString('es-AR')}`} />
        {ticket.descuentoAplicado && (
          <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">Descuento digital 20% aplicado</p>
        )}
      </div>

      {/* Transferencia */}
      {puedeTransferirTicket && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">RF-EST-05: Transferencia disponible</p>
          <p>Podés usar tu tiempo restante en otra cuadra sin costo adicional. Mostrá este ticket al permisionario de la nueva cuadra.</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {puedePagar && (
          <Link href={ROUTES.conductor.pagar}
            className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white w-full flex items-center justify-center gap-2 text-center block">
            <RefreshCw className="w-4 h-4" />
            Extender tiempo (RF-USR-08)
          </Link>
        )}
        <Link href={ROUTES.conductor.historial}
          className="btn-xl bg-gray-100 hover:bg-gray-200 text-gray-700 w-full text-center block">
          Ver historial
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-gray-500">{icon}{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
