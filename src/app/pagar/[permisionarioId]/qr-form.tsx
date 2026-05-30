'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PlateInput } from '@/components/plate-input';
import { DurationSelector, formatDuration } from '@/components/duration-selector';
import { calcularMonto, calcularVencimiento } from '@/domain/calculations';
import { configStore, ticketStore, pagoStore } from '@/lib/sem-store';
import { Car, Bike, ShieldCheck, Loader2, ExternalLink, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import type { VehicleType, Permisionario, Ticket } from '@/domain/types';

type Step = 'form' | 'paying' | 'success' | 'error';

export function QRForm({ permisionario }: { permisionario: Permisionario }) {
  const [step, setStep] = useState<Step>('form');
  const [dominio, setDominio] = useState('');
  const [dominioValido, setDominioValido] = useState(false);
  const [vehiculoTipo, setVehiculoTipo] = useState<VehicleType>('auto');
  const [duracion, setDuracion] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [isMock, setIsMock] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const tarifa = configStore.getTarifa();
  const monto = calcularMonto({ tipo: vehiculoTipo, duracionMinutos: duracion, metodoPago: 'digital', tarifa });

  async function handleCrearPago() {
    if (!dominioValido) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/pagos/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto,
          dominio: dominio.toUpperCase(),
          cuadra: permisionario.cuadraAsignada,
          duracion,
          permisionarioId: permisionario.id,
          vehiculoTipo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear pago');

      const checkoutUrl = data.sandbox_init_point || data.init_point;
      if (!checkoutUrl) throw new Error('No se obtuvo URL de pago');

      setPaymentUrl(checkoutUrl);
      setIsMock(data.mock === true);

      if (data.mock) {
        handleMockSuccess(data);
      } else {
        setStep('paying');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleMockSuccess(data: { payment_id?: string; external_reference?: string } & Record<string, unknown>) {
    const inicio = new Date().toISOString();
    const vencimiento = calcularVencimiento(inicio, duracion);

    const t = ticketStore.create({
      dominio: dominio.toUpperCase(),
      tipo: vehiculoTipo,
      cuadra: permisionario.cuadraAsignada,
      permisionarioId: permisionario.id,
      inicio,
      duracionMinutos: duracion,
      vencimiento,
      monto,
      metodoPago: 'digital',
      descuentoAplicado: true,
      activo: true,
    });

    pagoStore.create({
      ticketId: t.id,
      dominio: t.dominio,
      monto,
      metodoPago: 'digital',
      estado: 'success',
      permisionarioId: permisionario.id,
      cuadra: permisionario.cuadraAsignada,
      mpTransactionId: (data.payment_id as string) || undefined,
    });

    setTicket(t);
    setStep('success');
  }

  function handleBack() {
    setStep('form');
    setPaymentUrl('');
    setError('');
  }

  if (step === 'success' && ticket) {
    return (
      <div className="text-center space-y-5">
        <CheckCircle className="w-16 h-16 mx-auto" style={{ color: 'var(--verde)' }} />
        <div>
          <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
            ¡Pago exitoso!
          </h3>
          <p className="text-gray-500 mt-1">
            Tu estacionamiento en {permisionario.cuadraAsignada} fue activado.
          </p>
        </div>

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
        </div>

        <button onClick={() => { setStep('form'); setDominio(''); setDominioValido(false); }} className="btn-outline w-full">
          Nuevo pago
        </button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="text-center space-y-4 py-4">
        <XCircle className="w-12 h-12 mx-auto" style={{ color: 'var(--rojo)' }} />
        <p className="text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
        <button onClick={handleBack} className="btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  if (step === 'paying') {
    return <PayingStep paymentUrl={paymentUrl} isMock={isMock} onBack={handleBack} />;
  }

  return (
    <div className="space-y-5">
      <PlateInput
        value={dominio}
        onChange={setDominio}
        onValidChange={setDominioValido}
        label="Patente del vehículo"
        showOCR={false}
      />

      <div className="space-y-2">
        <label className="block text-base font-semibold text-gray-700">Tipo de vehículo</label>
        <div className="grid grid-cols-2 gap-3">
          {(['auto', 'moto'] as VehicleType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setVehiculoTipo(t)}
              className={`btn-xl flex items-center justify-center gap-3 border-2 transition-all ${
                vehiculoTipo === t
                  ? 'bg-municipal-600 border-municipal-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-municipal-400'
              }`}
            >
              {t === 'auto' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
              {t === 'auto' ? 'Auto' : 'Moto'}
            </button>
          ))}
        </div>
      </div>

      <DurationSelector value={duracion} onChange={setDuracion} />

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-700">Total con descuento 20%</span>
          <span className="text-2xl font-bold text-blue-800">${monto.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-blue-500">Cuadra: {permisionario.cuadraAsignada}</span>
          <span className="text-xs text-blue-500">{formatDuration(duracion)} · {vehiculoTipo === 'auto' ? 'Auto' : 'Moto'}</span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
      )}

      <button
        onClick={handleCrearPago}
        disabled={!dominioValido || loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Generando pago…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Pagar con MercadoPago
          </span>
        )}
      </button>
    </div>
  );
}

function PayingStep({ paymentUrl, isMock, onBack }: { paymentUrl: string; isMock: boolean; onBack: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [polling, setPolling] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isMock) {
      setPolling(false);
      return;
    }
    const urlObj = new URL(paymentUrl);
    const paymentId = urlObj.searchParams.get('payment_id');
    if (!paymentId) {
      setPolling(false);
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagos/estado?payment_id=${paymentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'approved') {
            window.location.href = paymentUrl;
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paymentUrl, isMock]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Escaneá con MercadoPago
        </h3>
        <p className="text-sm text-gray-500">
          Abrí la app de MercadoPago y escaneá este código QR para pagar.
        </p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 flex justify-center shadow-sm">
        <QRCodeSVG
          value={paymentUrl}
          size={220}
          level="M"
          includeMargin={false}
        />
      </div>

      <p className="text-center text-xs text-gray-400">
        Tiempo de espera: {mm}:{ss}
      </p>

      <div className="space-y-3">
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-5 h-5" />
          Abrir en MercadoPago
        </a>

        <p className="text-xs text-gray-400 text-center">
          Si no podés escanear el QR, tocá el botón para abrir MercadoPago directamente.
        </p>
      </div>

      {isMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-xs font-bold text-amber-700 tracking-wider uppercase">[Simulación]</p>
          <p className="text-sm text-amber-600 mt-1">
            En producción se mostrará el QR real de MercadoPago.
          </p>
        </div>
      )}

      {polling && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Esperando confirmación de pago…
        </div>
      )}
    </div>
  );
}