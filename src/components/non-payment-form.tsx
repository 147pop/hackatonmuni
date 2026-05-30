'use client';

import { useState } from 'react';
import { AlertTriangle, Car, Bike } from 'lucide-react';
import { PlateInput } from './plate-input';
import { calcularMontoDeuda } from '@/domain/calculations';
import { configStore, deudaStore } from '@/lib/sem-store';
import type { VehicleType, Deuda } from '@/domain/types';

interface NonPaymentFormProps {
  permisionarioId: string;
  cuadra: string;
  initialDominio?: string;
  onSuccess?: (deuda: Deuda) => void;
}

export function NonPaymentForm({ permisionarioId, cuadra, initialDominio, onSuccess }: NonPaymentFormProps) {
  const [dominio, setDominio] = useState(initialDominio ?? '');
  const [dominioValido, setDominioValido] = useState(!!initialDominio);
  const [tipo, setTipo] = useState<VehicleType>('auto');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deudaCreada, setDeudaCreada] = useState<Deuda | null>(null);

  const tarifa = configStore.getTarifa();
  const monto = calcularMontoDeuda(tipo, tarifa);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!dominioValido) {
      setError('Ingresá un dominio válido.');
      return;
    }

    setSubmitting(true);
    try {
      const deuda = deudaStore.create({
        dominio,
        cuadra,
        permisionarioId,
        monto,
        fecha: new Date().toISOString(),
        estado: 'pendiente',
      });

      setDeudaCreada(deuda);
      onSuccess?.(deuda);
    } finally {
      setSubmitting(false);
    }
  }

  if (deudaCreada) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">Incumplimiento registrado</p>
          <p className="text-base text-gray-500 mt-1">{new Date().toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left space-y-2 text-base">
          <Row label="Dominio" value={deudaCreada.dominio} />
          <Row label="Tipo" value={tipo === 'auto' ? 'Auto' : 'Moto'} />
          <Row label="Monto deuda" value={`$${deudaCreada.monto.toLocaleString('es-AR')}`} />
          <Row label="Cuadra" value={deudaCreada.cuadra} />
          <Row label="Estado" value="Pendiente de pago" />
        </div>
        <p className="text-sm text-gray-500">
          El conductor puede consultar y pagar su deuda en sem-digital.gob.ar
        </p>
        <button
          onClick={() => { setDeudaCreada(null); setDominio(''); setDominioValido(false); }}
          className="btn-xl bg-red-600 hover:bg-red-700 text-white w-full"
        >
          Registrar otro incumplimiento
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-base text-amber-800">
        <strong>RF-PAT-04:</strong> Registrá el dominio del vehículo que no pagó.
        Se generará una deuda cobrable por web.
      </div>

      <PlateInput
        value={dominio}
        onChange={setDominio}
        onValidChange={setDominioValido}
        disabled={submitting}
      />

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
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
              }`}
            >
              {t === 'auto' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
              {t === 'auto' ? 'Auto' : 'Moto'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
        <span className="text-base text-gray-600">Monto de deuda</span>
        <span className="text-2xl font-bold text-red-700">${monto.toLocaleString('es-AR')}</span>
      </div>

      {error && (
        <p className="text-base text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !dominioValido}
        className="btn-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white w-full"
      >
        {submitting ? 'Registrando…' : 'Registrar incumplimiento'}
      </button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
