import type { MPSimulationResult } from '@/domain/types';
import { generateId } from './sem-store';

export type MPOutcome = 'success' | 'failed' | 'pending';

interface MPPaymentParams {
  monto: number;
  dominio: string;
  concepto: string;
  outcome?: MPOutcome; // override for deterministic testing
}

/** [SIMULACION] Simulates MercadoPago payment with realistic latency and failure rate. */
export async function mockMPPagar(params: MPPaymentParams): Promise<MPSimulationResult> {
  const { monto, outcome } = params;

  // Variable latency: 800ms – 2200ms
  const delay = 800 + Math.random() * 1400;
  await new Promise((r) => setTimeout(r, delay));

  let estado: MPOutcome;

  if (outcome) {
    estado = outcome;
  } else {
    // 5% failure rate when NEXT_PUBLIC_MP_MOCK_FAILURE_RATE not set
    const failRate = parseFloat(process.env.NEXT_PUBLIC_MP_MOCK_FAILURE_RATE ?? '0.05');
    const rand = Math.random();
    if (rand < failRate * 0.7) {
      estado = 'failed';
    } else if (rand < failRate) {
      estado = 'pending';
    } else {
      estado = 'success';
    }
  }

  return {
    transactionId: `MP-${generateId()}`,
    estado,
    monto,
    timestamp: new Date().toISOString(),
  };
}

/** Deterministic outcomes for test scenarios */
export const MP_TEST_OUTCOMES = {
  success: 'success' as MPOutcome,
  failed: 'failed' as MPOutcome,
  pending: 'pending' as MPOutcome,
};
