'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PaymentsTable } from '@/components/admin/payments-table';
import { pagoStore } from '@/lib/sem-store';
import type { Pago } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);

  useEffect(() => { setPagos(pagoStore.getAll()); }, []);

  const exitosos = pagos.filter((p) => p.estado === 'success');
  const total    = exitosos.reduce((s, p) => s + p.monto, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos · RF-ADM-02</h1>
          <p className="text-sm text-gray-500">{exitosos.length} exitosos · ${total.toLocaleString('es-AR')} total</p>
        </div>
      </div>

      <PaymentsTable pagos={exitosos} />
    </div>
  );
}
