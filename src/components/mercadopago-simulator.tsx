'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle, XCircle, Loader2, CreditCard } from 'lucide-react';
import { mockMPPagar } from '@/lib/mock-mercadopago';
import { MercadoPagoBrickLoader } from './mercadopago-brick';

// Dynamic import to avoid SSR issues with the MP SDK
const MercadoPagoBrick = dynamic(
  () => import('./mercadopago-brick').then((m) => ({ default: m.MercadoPagoBrick })),
  { ssr: false, loading: () => <MercadoPagoBrickLoader /> },
);

type MPStep = 'idle' | 'processing' | 'success' | 'failed';

interface MercadoPagoSimulatorProps {
  monto: number;
  dominio: string;
  concepto: string;
  onSuccess: (transactionId: string) => void;
  onFailed?: () => void;
  label?: string;
}

const hasRealMP = !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

export function MercadoPagoSimulator({
  monto,
  dominio,
  concepto,
  onSuccess,
  onFailed,
  label = 'Pagar con MercadoPago',
}: MercadoPagoSimulatorProps) {
  const [step, setStep] = useState<MPStep>('idle');
  const [failReason, setFailReason] = useState('');

  function handleSuccess(transactionId: string) {
    setStep('success');
    onSuccess(transactionId);
  }

  function handleFailed(detail?: string) {
    setStep('failed');
    setFailReason(detail ?? '');
    onFailed?.();
  }

  // ── Shared status views ────────────────────────────────────────────────────

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
        {failReason && (
          <p className="text-xs text-gray-400 font-mono">{failReason}</p>
        )}
        <button
          onClick={() => { setStep('idle'); setFailReason(''); }}
          className="btn-xl bg-gray-100 hover:bg-gray-200 text-gray-700 px-6"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ── Real MP Brick ──────────────────────────────────────────────────────────

  if (hasRealMP) {
    return (
      <MercadoPagoBrick
        monto={monto}
        concepto={concepto}
        onSuccess={handleSuccess}
        onFailed={handleFailed}
      />
    );
  }

  // ── Mock flow ──────────────────────────────────────────────────────────────

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-base font-medium text-gray-700">Procesando en MercadoPago…</p>
        <p className="text-sm text-gray-400 font-mono">[SIMULACION]</p>
      </div>
    );
  }

  async function handleMockPagar() {
    setStep('processing');
    const result = await mockMPPagar({ monto, dominio, concepto });
    if (result.estado === 'success') {
      handleSuccess(result.transactionId);
    } else {
      handleFailed(result.estado);
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-700">
        <CreditCard className="w-4 h-4 flex-shrink-0" />
        <span>Serás redirigido a MercadoPago para completar el pago</span>
        <span className="ml-auto text-xs bg-blue-100 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
          [SIMULACION]
        </span>
      </div>
      <button
        onClick={handleMockPagar}
        className="btn-xl bg-blue-500 hover:bg-blue-600 text-white w-full flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" />
        {label} — ${monto.toLocaleString('es-AR')}
      </button>
    </div>
  );
}
