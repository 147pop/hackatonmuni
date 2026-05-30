'use client';

import { useState } from 'react';
import { Clock, Car, Bike, CheckCircle } from 'lucide-react';
import { PlateInput } from './plate-input';
import { validarDuracion } from '@/domain/validators';
import { calcularMonto, calcularVencimiento } from '@/domain/calculations';
import { esHorarioPermitido } from '@/domain/rules';
import { configStore, ticketStore, pagoStore } from '@/lib/sem-store';
import type { VehicleType, Ticket } from '@/domain/types';

const DURACIONES = [
  { label: '30 min', minutos: 30 },
  { label: '1 hora', minutos: 60 },
  { label: '1h 30min', minutos: 90 },
  { label: '2 horas', minutos: 120 },
  { label: '2h 30min', minutos: 150 },
  { label: '3 horas', minutos: 180 },
];

interface CashPaymentFormProps {
  permisionarioId: string;
  cuadra: string;
  zonaId: string;
  initialDominio?: string;
  onSuccess?: (ticket: Ticket) => void;
}

export function CashPaymentForm({ permisionarioId, cuadra, zonaId, initialDominio, onSuccess }: CashPaymentFormProps) {
  const [dominio, setDominio] = useState(initialDominio ?? '');
  const [dominioValido, setDominioValido] = useState(!!initialDominio);
  const [tipo, setTipo] = useState<VehicleType>('auto');
  const [duracion, setDuracion] = useState(60);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketCreado, setTicketCreado] = useState<Ticket | null>(null);

  const tarifa = configStore.getTarifa();
  const monto = calcularMonto({ tipo, duracionMinutos: duracion, metodoPago: 'efectivo', tarifa });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!dominioValido) {
      setError('Ingresá un dominio válido.');
      return;
    }

    const durErr = validarDuracion(duracion);
    if (!durErr.valido) { setError(durErr.error!); return; }

    // RF-EST-09: use system timestamp
    const ahora = new Date();
    const horarioCheck = esHorarioPermitido({
      timestamp: ahora,
      zonaId,
      zonas: configStore.getZonas(),
      feriados: configStore.getFeriados(),
      config: configStore.getConfig(),
    });
    if (!horarioCheck.permitido) {
      setError(`No se puede registrar fuera de horario: ${horarioCheck.razon}`);
      return;
    }

    setSubmitting(true);
    try {
      const inicio = ahora.toISOString();
      const vencimiento = calcularVencimiento(inicio, duracion);

      const ticket = ticketStore.create({
        dominio,
        tipo,
        cuadra,
        permisionarioId,
        inicio,
        duracionMinutos: duracion,
        vencimiento,
        monto,
        metodoPago: 'efectivo',
        descuentoAplicado: false,
        activo: true,
      });

      pagoStore.create({
        ticketId: ticket.id,
        dominio,
        monto,
        metodoPago: 'efectivo',
        estado: 'success',
        permisionarioId,
        cuadra,
      });

      setTicketCreado(ticket);
      onSuccess?.(ticket);
    } finally {
      setSubmitting(false);
    }
  }

  if (ticketCreado) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <div>
          <p className="text-2xl font-bold text-gray-900">Ticket generado</p>
          <p className="text-3xl font-bold font-mono text-municipal-700 mt-1">{ticketCreado.numero}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-base">
          <Row label="Dominio" value={ticketCreado.dominio} />
          <Row label="Vehículo" value={ticketCreado.tipo === 'auto' ? 'Auto' : 'Moto'} />
          <Row label="Duración" value={`${ticketCreado.duracionMinutos} min`} />
          <Row label="Monto cobrado" value={`$${ticketCreado.monto.toLocaleString('es-AR')}`} highlight />
          <Row label="Cuadra" value={ticketCreado.cuadra} />
        </div>
        <button
          onClick={() => { setTicketCreado(null); setDominio(''); setDominioValido(false); }}
          className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white w-full mt-2"
        >
          Registrar otro pago
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PlateInput
        value={dominio}
        onChange={setDominio}
        onValidChange={setDominioValido}
        disabled={submitting}
      />

      {/* Vehicle type */}
      <div className="space-y-2">
        <label className="block text-base font-semibold text-gray-700">Tipo de vehículo</label>
        <div className="grid grid-cols-2 gap-3">
          {(['auto', 'moto'] as VehicleType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`btn-xl flex items-center justify-center gap-3 border-2 transition-all ${
                tipo === t
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

      {/* Duration */}
      <div className="space-y-2">
        <label className="block text-base font-semibold text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Duración
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DURACIONES.map((d) => (
            <button
              key={d.minutos}
              type="button"
              onClick={() => setDuracion(d.minutos)}
              className={`py-3 px-2 text-base font-medium rounded-xl border-2 transition-all ${
                duracion === d.minutos
                  ? 'bg-municipal-600 border-municipal-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-municipal-400'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount preview */}
      <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
        <span className="text-base text-gray-600">Monto a cobrar (efectivo)</span>
        <span className="text-2xl font-bold text-gray-900">${monto.toLocaleString('es-AR')}</span>
      </div>

      {error && (
        <p className="text-base text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !dominioValido}
        className="btn-xl bg-municipal-600 hover:bg-municipal-700 disabled:bg-gray-300 text-white w-full transition-colors"
      >
        {submitting ? 'Registrando…' : 'Registrar pago efectivo'}
      </button>
    </form>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-municipal-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
