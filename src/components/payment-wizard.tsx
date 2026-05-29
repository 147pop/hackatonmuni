'use client';

import { useState } from 'react';
import { QrCode, Car, Bike, Clock, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { PlateInput } from './plate-input';
import { MercadoPagoSimulator } from './mercadopago-simulator';
import { calcularMonto, calcularVencimiento } from '@/domain/calculations';
import { esHorarioPermitido } from '@/domain/rules';
import { configStore, permisionarioStore, ticketStore, pagoStore } from '@/lib/sem-store';
import { notifyPagoEntrante } from '@/lib/mock-notifications';
import type { VehicleType, Ticket } from '@/domain/types';
import Link from 'next/link';

const DURACIONES = [
  { label: '30 min', minutos: 30 },
  { label: '1 hora', minutos: 60 },
  { label: '1h 30min', minutos: 90 },
  { label: '2 horas', minutos: 120 },
  { label: '2h 30min', minutos: 150 },
  { label: '3 horas', minutos: 180 },
];

type Step =
  | { type: 'qr' }
  | { type: 'datos'; permisionarioId: string; cuadra: string; zonaId: string }
  | { type: 'pago'; permisionarioId: string; cuadra: string; zonaId: string; dominio: string; vehiculoTipo: VehicleType; duracion: number; monto: number }
  | { type: 'confirmado'; ticket: Ticket };

interface PaymentWizardProps {
  conductorId?: string;
  dominioDefault?: string;
  ticketLinkFn?: (ticketId: string) => string;
  onComplete?: (ticket: Ticket) => void;
}

export function PaymentWizard({ conductorId, dominioDefault, ticketLinkFn, onComplete }: PaymentWizardProps) {
  const [step, setStep] = useState<Step>({ type: 'qr' });
  const [error, setError] = useState('');

  // ── Step 1: QR / select permisionario ─────────────────────────────────────
  if (step.type === 'qr') {
    const permisionarios = permisionarioStore.getAll().filter((p) => p.activo);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <QrCode className="w-4 h-4 flex-shrink-0" />
          <span>Escaneá el QR del permisionario o seleccionalo de la lista</span>
          <span className="ml-auto text-xs font-mono bg-amber-100 px-1.5 py-0.5 rounded">[SIMULACION]</span>
        </div>
        <div className="space-y-2">
          {permisionarios.map((p) => (
            <button
              key={p.id}
              onClick={() => setStep({ type: 'datos', permisionarioId: p.id, cuadra: p.cuadraAsignada, zonaId: p.zonaId })}
              className="w-full text-left btn-xl bg-white border-2 border-gray-200 hover:border-municipal-400 rounded-2xl px-5 flex items-center gap-4 transition-all"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 text-xl font-bold flex-shrink-0">
                {p.nombre[0]}
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">{p.nombre} {p.apellido}</p>
                <p className="text-sm text-gray-500">{p.cuadraAsignada} · Legajo {p.legajo}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: Vehicle data + duration ───────────────────────────────────────
  if (step.type === 'datos') {
    return (
      <DatosStep
        permisionarioId={step.permisionarioId}
        cuadra={step.cuadra}
        zonaId={step.zonaId}
        dominioDefault={dominioDefault}
        onBack={() => setStep({ type: 'qr' })}
        onNext={(dominio, vehiculoTipo, duracion, monto) =>
          setStep({ type: 'pago', permisionarioId: step.permisionarioId, cuadra: step.cuadra, zonaId: step.zonaId, dominio, vehiculoTipo, duracion, monto })
        }
        error={error}
        setError={setError}
      />
    );
  }

  // ── Step 3: Payment ────────────────────────────────────────────────────────
  if (step.type === 'pago') {
    const { permisionarioId, cuadra, dominio, vehiculoTipo, duracion, monto } = step;

    function handleSuccess(transactionId: string) {
      const inicio = new Date().toISOString();
      const vencimiento = calcularVencimiento(inicio, duracion);

      const ticket = ticketStore.create({
        dominio,
        tipo: vehiculoTipo,
        cuadra,
        permisionarioId,
        inicio,
        duracionMinutos: duracion,
        vencimiento,
        monto,
        metodoPago: 'digital',
        descuentoAplicado: true,
        activo: true,
        conductorId,
      });

      pagoStore.create({
        ticketId: ticket.id,
        dominio,
        monto,
        metodoPago: 'digital',
        estado: 'success',
        permisionarioId,
        cuadra,
        mpTransactionId: transactionId,
      });

      notifyPagoEntrante(dominio, monto);
      setStep({ type: 'confirmado', ticket });
      onComplete?.(ticket);
    }

    return (
      <div className="space-y-4">
        <button onClick={() => setStep({ type: 'datos', permisionarioId, cuadra, zonaId: step.zonaId })} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <Row label="Cuadra" value={cuadra} />
          <Row label="Dominio" value={dominio} />
          <Row label="Vehículo" value={vehiculoTipo === 'auto' ? 'Auto' : 'Moto'} />
          <Row label="Duración" value={`${duracion} min`} />
          <Row label="Descuento digital" value="-20%" highlight />
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-gray-900">${monto.toLocaleString('es-AR')}</span>
          </div>
        </div>
        <MercadoPagoSimulator
          monto={monto}
          dominio={dominio}
          concepto={`Estacionamiento ${cuadra} — ${duracion} min`}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  // ── Step 4: Confirmed ──────────────────────────────────────────────────────
  const ticket = step.ticket;
  return (
    <div className="text-center space-y-4 py-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <div>
        <p className="text-2xl font-bold text-gray-900">¡Ticket generado!</p>
        <p className="text-3xl font-bold font-mono text-municipal-700 mt-1">{ticket.numero}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
        <Row label="Dominio" value={ticket.dominio} />
        <Row label="Cuadra" value={ticket.cuadra} />
        <Row label="Duración" value={`${ticket.duracionMinutos} min`} />
        <Row label="Monto pagado" value={`$${ticket.monto.toLocaleString('es-AR')}`} highlight />
      </div>
      <div className="space-y-2">
        {ticketLinkFn && (
          <Link href={ticketLinkFn(ticket.id)} className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white block text-center">
            Ver ticket activo
          </Link>
        )}
        <button onClick={() => setStep({ type: 'qr' })} className="btn-xl bg-gray-100 hover:bg-gray-200 text-gray-700 w-full">
          Nuevo pago
        </button>
      </div>
    </div>
  );
}

// ── Sub-component: datos step ──────────────────────────────────────────────

interface DatosStepProps {
  permisionarioId: string;
  cuadra: string;
  zonaId: string;
  dominioDefault?: string;
  onBack: () => void;
  onNext: (dominio: string, tipo: VehicleType, duracion: number, monto: number) => void;
  error: string;
  setError: (e: string) => void;
}

function DatosStep({ cuadra, zonaId, dominioDefault, onBack, onNext, error, setError }: DatosStepProps) {
  const [dominio, setDominio] = useState(dominioDefault ?? '');
  const [dominioValido, setDominioValido] = useState(!!dominioDefault);
  const [vehiculoTipo, setVehiculoTipo] = useState<VehicleType>('auto');
  const [duracion, setDuracion] = useState(60);

  const tarifa = configStore.getTarifa();
  const monto = calcularMonto({ tipo: vehiculoTipo, duracionMinutos: duracion, metodoPago: 'digital', tarifa });

  function handleNext() {
    setError('');
    if (!dominioValido) { setError('Ingresá un dominio válido.'); return; }

    const horarioCheck = esHorarioPermitido({
      timestamp: new Date(),
      zonaId,
      zonas: configStore.getZonas(),
      feriados: configStore.getFeriados(),
      config: configStore.getConfig(),
    });
    if (!horarioCheck.permitido) { setError(`Fuera de horario: ${horarioCheck.razon}`); return; }

    onNext(dominio, vehiculoTipo, duracion, monto);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <p className="text-base font-bold text-gray-900">{cuadra}</p>
          <p className="text-sm text-gray-500">Pago digital · Descuento 20%</p>
        </div>
      </div>

      <PlateInput value={dominio} onChange={setDominio} onValidChange={setDominioValido} />

      <div className="space-y-2">
        <label className="block text-base font-semibold text-gray-700">Tipo de vehículo</label>
        <div className="grid grid-cols-2 gap-3">
          {(['auto', 'moto'] as VehicleType[]).map((t) => (
            <button key={t} type="button" onClick={() => setVehiculoTipo(t)}
              className={`btn-xl flex items-center justify-center gap-3 border-2 transition-all ${vehiculoTipo === t ? 'bg-municipal-600 border-municipal-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-municipal-400'}`}>
              {t === 'auto' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
              {t === 'auto' ? 'Auto' : 'Moto'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-base font-semibold text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Duración
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DURACIONES.map((d) => (
            <button key={d.minutos} type="button" onClick={() => setDuracion(d.minutos)}
              className={`py-3 px-2 text-base font-medium rounded-xl border-2 transition-all ${duracion === d.minutos ? 'bg-municipal-600 border-municipal-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-municipal-400'}`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-700">Total con descuento 20%</span>
          <span className="text-2xl font-bold text-blue-800">${monto.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

      <button onClick={handleNext} disabled={!dominioValido}
        className="btn-xl bg-municipal-600 hover:bg-municipal-700 disabled:bg-gray-300 text-white w-full">
        Continuar al pago
      </button>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
