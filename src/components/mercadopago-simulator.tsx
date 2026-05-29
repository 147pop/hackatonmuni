'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, CreditCard } from 'lucide-react';
import { mockMPPagar } from '@/lib/mock-mercadopago';

type MPStep = 'idle' | 'processing' | 'success' | 'failed';

interface MercadoPagoSimulatorProps {
  monto: number;
  dominio: string;
  concepto: string;
  onSuccess: (transactionId: string) => void;
  onFailed?: () => void;
  label?: string;
}

export function MercadoPagoSimulator({
  monto,
  dominio,
  concepto,
  onSuccess,
  onFailed,
  label = 'Pagar con MercadoPago',
}: MercadoPagoSimulatorProps) {
  const [step, setStep] = useState<MPStep>('idle');

  async function handlePagar() {
    setStep('processing');
    const result = await mockMPPagar({ monto, dominio, concepto });
    if (result.estado === 'success') {
      setStep('success');
      onSuccess(result.transactionId);
    } else {
      setStep('failed');
      onFailed?.();
    }
  }

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-base font-medium text-gray-700">Procesando en MercadoPago…</p>
        <p className="text-sm text-gray-400">[SIMULACION]</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle className="w-10 h-10 text-green-500" />
        <p className="text-base font-medium text-green-700">Pago aprobado</p>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <XCircle className="w-10 h-10 text-red-500" />
        <p className="text-base font-medium text-red-700">Pago rechazado</p>
        <button onClick={() => setStep('idle')} className="btn-xl bg-gray-100 hover:bg-gray-200 text-gray-700 px-6">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-700">
        <CreditCard className="w-4 h-4 flex-shrink-0" />
        <span>Serás redirigido a MercadoPago para completar el pago</span>
        <span className="ml-auto text-xs bg-blue-100 px-1.5 py-0.5 rounded font-mono">[SIMULACION]</span>
      </div>
      <button
        onClick={handlePagar}
        className="btn-xl bg-blue-500 hover:bg-blue-600 text-white w-full flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" />
        {label} — ${monto.toLocaleString('es-AR')}
      </button>
    </div>
  );
}
