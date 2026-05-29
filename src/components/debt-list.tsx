'use client';

import { useState } from 'react';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';
import { mockMPPagar } from '@/lib/mock-mercadopago';
import { deudaStore, pagoStore } from '@/lib/sem-store';
import type { Deuda } from '@/domain/types';

interface DebtListProps {
  deudas: Deuda[];
  onPaid?: (deudaId: string) => void;
  emptyMessage?: string;
}

export function DebtList({ deudas, onPaid, emptyMessage = 'Sin deudas pendientes.' }: DebtListProps) {
  const [paying, setPaying] = useState<string | null>(null);
  const [paid, setPaid] = useState<Set<string>>(new Set());

  async function handlePagar(deuda: Deuda) {
    setPaying(deuda.id);
    const result = await mockMPPagar({
      monto: deuda.monto,
      dominio: deuda.dominio,
      concepto: `Deuda ${deuda.dominio} — ${deuda.cuadra}`,
    });

    if (result.estado === 'success') {
      const pago = pagoStore.create({
        dominio: deuda.dominio,
        monto: deuda.monto,
        metodoPago: 'digital',
        estado: 'success',
        permisionarioId: deuda.permisionarioId,
        cuadra: deuda.cuadra,
        mpTransactionId: result.transactionId,
      });
      deudaStore.update(deuda.id, {
        estado: 'pagada',
        pagadoAt: new Date().toISOString(),
        pagoId: pago.id,
      });
      setPaid((prev) => new Set([...prev, deuda.id]));
      onPaid?.(deuda.id);
    }
    setPaying(null);
  }

  const pendientes = deudas.filter((d) => d.estado === 'pendiente' && !paid.has(d.id));
  const pagadas = deudas.filter((d) => d.estado === 'pagada' || paid.has(d.id));

  if (deudas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <CheckCircle className="w-10 h-10 text-green-400" />
        <p className="text-base text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendientes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pendientes</h3>
          {pendientes.map((d) => (
            <div key={d.id} className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <p className="text-lg font-bold font-mono text-gray-900">{d.dominio}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(d.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    {' · '}{d.cuadra}
                  </p>
                  {d.tipo === 'hora_extra' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Hora extra
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-red-700">${d.monto.toLocaleString('es-AR')}</p>
              </div>
              <button
                onClick={() => handlePagar(d)}
                disabled={paying === d.id}
                className="btn-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white w-full flex items-center justify-center gap-2"
              >
                {paying === d.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</>
                ) : (
                  <>Pagar con MercadoPago — ${d.monto.toLocaleString('es-AR')}</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {pagadas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pagadas</h3>
          {pagadas.map((d) => (
            <div key={d.id} className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-base font-bold font-mono text-gray-900">{d.dominio}</p>
                <p className="text-sm text-gray-500">{d.cuadra}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-gray-700">${d.monto.toLocaleString('es-AR')}</p>
                <CheckCircle className="w-4 h-4 text-green-500 ml-auto mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
