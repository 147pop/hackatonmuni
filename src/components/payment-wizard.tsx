'use client';

import { useState } from 'react';
import { Car, Bike, ArrowLeft, CheckCircle, MapPin } from 'lucide-react';
import { PlateInput } from './plate-input';
import { MercadoPagoSimulator } from './mercadopago-simulator';
import { calcularMonto, calcularVencimiento } from '@/domain/calculations';
import { esHorarioPermitido } from '@/domain/rules';
import { configStore, permisionarioStore, ticketStore, pagoStore } from '@/lib/sem-store';
import { notifyPagoEntrante } from '@/lib/mock-notifications';
import { DurationSelector, formatDuration } from './duration-selector';
import type { VehicleType, Ticket } from '@/domain/types';
import Link from 'next/link';

type Step =
  | { type: 'datos' }
  | { type: 'pago'; permisionarioId: string; cuadra: string; zonaId: string; dominio: string; vehiculoTipo: VehicleType; duracion: number; monto: number }
  | { type: 'confirmado'; ticket: Ticket };

interface PaymentWizardProps {
  conductorId?: string;
  dominioDefault?: string;
  ticketLinkFn?: (ticketId: string) => string;
  onComplete?: (ticket: Ticket) => void;
}

export function PaymentWizard({ conductorId, dominioDefault, ticketLinkFn, onComplete }: PaymentWizardProps) {
  const [step, setStep] = useState<Step>({ type: 'datos' });
  const [error, setError] = useState('');

  if (step.type === 'datos') {
    return (
      <DatosStep
        dominioDefault={dominioDefault}
        onNext={(dominio, cuadra, zonaId, permisionarioId, vehiculoTipo, duracion, monto) =>
          setStep({ type: 'pago', permisionarioId, cuadra, zonaId, dominio, vehiculoTipo, duracion, monto })
        }
        error={error}
        setError={setError}
      />
    );
  }

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
        <button
          onClick={() => setStep({ type: 'datos' })}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <Row label="Dominio" value={dominio} />
          <Row label="Cuadra" value={cuadra} />
          <Row label="Vehículo" value={vehiculoTipo === 'auto' ? 'Auto' : 'Moto'} />
          <Row label="Duración" value={formatDuration(duracion)} />
          <Row label="Descuento digital" value="-20%" highlight />
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-gray-900">${monto.toLocaleString('es-AR')}</span>
          </div>
        </div>
        <MercadoPagoSimulator
          monto={monto}
          dominio={dominio}
          concepto={`Estacionamiento ${cuadra} — ${formatDuration(duracion)}`}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

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
        <Row label="Duración" value={formatDuration(ticket.duracionMinutos)} />
        <Row label="Monto pagado" value={`$${ticket.monto.toLocaleString('es-AR')}`} highlight />
      </div>
      <div className="space-y-2">
        {ticketLinkFn && (
          <Link
            href={ticketLinkFn(ticket.id)}
            className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white block text-center"
          >
            Ver ticket activo
          </Link>
        )}
        <button
          onClick={() => setStep({ type: 'datos' })}
          className="btn-xl bg-gray-100 hover:bg-gray-200 text-gray-700 w-full"
        >
          Nuevo pago
        </button>
      </div>
    </div>
  );
}

interface DatosStepProps {
  dominioDefault?: string;
  onNext: (
    dominio: string,
    cuadra: string,
    zonaId: string,
    permisionarioId: string,
    tipo: VehicleType,
    duracion: number,
    monto: number,
  ) => void;
  error: string;
  setError: (e: string) => void;
}

function DatosStep({ dominioDefault, onNext, error, setError }: DatosStepProps) {
  const [dominio, setDominio] = useState(dominioDefault ?? '');
  const [dominioValido, setDominioValido] = useState(!!dominioDefault);
  const [selectedCuadra, setSelectedCuadra] = useState('');
  const [vehiculoTipo, setVehiculoTipo] = useState<VehicleType>('auto');
  const [duracion, setDuracion] = useState(60);

  const zonas = configStore.getZonas();
  const tarifa = configStore.getTarifa();
  const monto = calcularMonto({ tipo: vehiculoTipo, duracionMinutos: duracion, metodoPago: 'digital', tarifa });
  const isValid = dominioValido && !!selectedCuadra;

  function handleNext() {
    setError('');
    if (!dominioValido) { setError('Ingresá un dominio válido.'); return; }
    if (!selectedCuadra) { setError('Seleccioná dónde estacionaste.'); return; }

    const zona = zonas.find((z) => z.cuadras.includes(selectedCuadra));
    if (!zona) return;

    const horarioCheck = esHorarioPermitido({
      timestamp: new Date(),
      zonaId: zona.id,
      zonas,
      feriados: configStore.getFeriados(),
      config: configStore.getConfig(),
    });
    if (!horarioCheck.permitido) { setError(`Fuera de horario: ${horarioCheck.razon}`); return; }

    const permisionario =
      permisionarioStore.getAll().find((p) => p.cuadraAsignada === selectedCuadra && p.activo) ??
      permisionarioStore.getAll().find((p) => p.activo);

    onNext(dominio, selectedCuadra, zona.id, permisionario?.id ?? 'sistema', vehiculoTipo, duracion, monto);
  }

  return (
    <div className="space-y-5">
      {/* Plate */}
      <PlateInput
        value={dominio}
        onChange={setDominio}
        onValidChange={setDominioValido}
        label="Patente del vehículo"
      />

      {/* Cuadra selector */}
      <div className="space-y-3">
        <label className="block text-base font-semibold text-gray-700">
          <MapPin className="w-4 h-4 inline mr-1.5 mb-0.5" />
          ¿Dónde estacionaste?
        </label>
        {zonas.map((zona) => (
          <div key={zona.id}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{zona.nombre}</p>
            <div className="grid grid-cols-2 gap-2">
              {zona.cuadras.map((cuadra) => (
                <button
                  key={cuadra}
                  type="button"
                  onClick={() => setSelectedCuadra(cuadra)}
                  className={`py-3 px-3 text-sm font-medium rounded-xl border-2 text-left transition-all ${
                    selectedCuadra === cuadra
                      ? 'bg-municipal-600 border-municipal-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-municipal-400'
                  }`}
                >
                  {cuadra}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle type */}
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

      {/* Price */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-700">Total con descuento 20%</span>
          <span className="text-2xl font-bold text-blue-800">${monto.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
      )}

      <button
        onClick={handleNext}
        disabled={!isValid}
        className="btn-xl bg-municipal-600 hover:bg-municipal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white w-full"
      >
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
