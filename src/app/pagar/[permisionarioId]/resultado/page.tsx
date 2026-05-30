'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { initializeIfNeeded, permisionarioStore, ticketStore, pagoStore } from '@/lib/sem-store';
import { calcularVencimiento } from '@/domain/calculations';
import { formatDuration } from '@/components/duration-selector';
import type { Permisionario, Ticket } from '@/domain/types';

function IsotipoSalta({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M24 38s-14-9-14-20a9 9 0 0 1 14-7.5A9 9 0 0 1 38 18c0 11-14 20-14 20z" />
    </svg>
  );
}

function ResultadoContent() {
  const params = useParams<{ permisionarioId: string }>();
  const searchParams = useSearchParams();

  const [permisionario, setPermisionario] = useState<Permisionario | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loaded, setLoaded] = useState(false);

  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  const externalRef = searchParams.get('external_reference');

  useEffect(() => {
    initializeIfNeeded();
    const p = permisionarioStore.getById(params.permisionarioId);
    setPermisionario(p ?? null);

    if (status === 'approved' && externalRef) {
      try {
        const data = JSON.parse(externalRef);
        const existingTicket = ticketStore.getActivosByDominio(data.dominio);
        if (!existingTicket) {
          const inicio = new Date().toISOString();
          const vencimiento = calcularVencimiento(inicio, data.duracion);
          const t = ticketStore.create({
            dominio: data.dominio,
            tipo: data.vehiculoTipo,
            cuadra: data.cuadra,
            permisionarioId: data.permisionarioId,
            inicio,
            duracionMinutos: data.duracion,
            vencimiento,
            monto: data.monto,
            metodoPago: 'digital',
            descuentoAplicado: true,
            activo: true,
          });
          pagoStore.create({
            ticketId: t.id,
            dominio: data.dominio,
            monto: data.monto,
            metodoPago: 'digital',
            estado: 'success',
            permisionarioId: data.permisionarioId,
            cuadra: data.cuadra,
            mpTransactionId: paymentId || undefined,
          });
          setTicket(t);
        } else {
          setTicket(existingTicket);
        }
      } catch {
        // Si no se puede parsear external_reference, no crear ticket (el webhook lo hará)
      }
    }

    setLoaded(true);
  }, [params.permisionarioId, status, externalRef, paymentId]);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--azul-vivo)' }} />
      </div>
    );
  }

  const permName = permisionario ? `${permisionario.nombre} ${permisionario.apellido}` : '';

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--hueso)' }}>
      <header
        className="text-white sticky top-0 z-40 shadow-md"
        style={{ background: 'var(--azul-noche)', paddingTop: 'var(--safe-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <span
            className="flex items-center justify-center rounded-lg"
            style={{ background: 'var(--azul-vivo)', width: 30, height: 30 }}
          >
            <IsotipoSalta size={17} />
          </span>
          <span className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            SEM <span style={{ color: 'var(--celeste)', fontWeight: 500 }}>· Resultado</span>
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        {status === 'approved' && (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 mx-auto" style={{ color: 'var(--verde)' }} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                ¡Pago exitoso!
              </h1>
              <p className="text-gray-500 mt-1">
                Tu estacionamiento en {permisionario?.cuadraAsignada ?? ''} fue activado.
              </p>
            </div>

            {ticket && (
              <div className="card-sem space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Ticket</span>
                  <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--azul-vivo)' }}>
                    {ticket.numero}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Patente</span>
                  <span className="font-semibold text-gray-900 font-mono">{ticket.dominio}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cuadra</span>
                  <span className="font-semibold text-gray-900">{ticket.cuadra}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duración</span>
                  <span className="font-semibold text-gray-900">{formatDuration(ticket.duracionMinutos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monto</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--azul-vivo)' }}>
                    ${ticket.monto.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vence</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(ticket.vencimiento).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {permName && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Permisionario</span>
                    <span className="font-semibold text-gray-900">{permName}</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-gray-400">
              Guardá esta pantalla como comprobante de tu estacionamiento.
            </p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="text-center space-y-6">
            <XCircle className="w-16 h-16 mx-auto" style={{ color: 'var(--rojo)' }} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                Pago rechazado
              </h1>
              <p className="text-gray-500 mt-1">
                El pago no pudo ser procesado. Intentá de nuevo.
              </p>
            </div>
            <a
              href={`/pagar/${params.permisionarioId}`}
              className="btn-primary inline-block"
            >
              Reintentar pago
            </a>
          </div>
        )}

        {status === 'in_process' && (
          <div className="text-center space-y-6">
            <Clock className="w-16 h-16 mx-auto" style={{ color: 'var(--ambar)' }} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                Pago pendiente
              </h1>
              <p className="text-gray-500 mt-1">
                Tu pago está siendo procesado. Recibirás la confirmación en breve.
              </p>
            </div>
            <a
              href={`/pagar/${params.permisionarioId}`}
              className="btn-outline inline-block"
            >
              Volver al inicio
            </a>
          </div>
        )}

        {!status && (
          <div className="text-center space-y-6">
            <p className="text-gray-500">No se recibió información del pago.</p>
            <a
              href={`/pagar/${params.permisionarioId}`}
              className="btn-outline inline-block"
            >
              Volver al inicio
            </a>
          </div>
        )}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
        Municipalidad de Salta · Sistema de Estacionamiento Medido Digital
      </footer>
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--hueso)' }}>
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--azul-vivo)' }} />
        </div>
      }
    >
      <ResultadoContent />
    </Suspense>
  );
}