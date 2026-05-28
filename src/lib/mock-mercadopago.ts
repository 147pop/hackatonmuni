import type { MPSimulationResult } from '@/domain/types';
import { generateId } from './sem-store';

export type MPOutcome = 'success' | 'failed' | 'pending';

interface MPPaymentParams {
  monto: number;
  dominio: string;
  concepto: string;
  outcome?: MPOutcome; // override for deterministic testing
}

const DEFAULT_DELAY_MS = 1500;

/** [SIMULACION] Simulates MercadoPago redirect + payment resolution. */
export async function mockMPPagar(params: MPPaymentParams): Promise<MPSimulationResult> {
  const { monto, outcome = 'success' } = params;

  await new Promise((r) => setTimeout(r, DEFAULT_DELAY_MS));

  return {
    transactionId: `MP-${generateId()}`,
    estado: outcome,
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
