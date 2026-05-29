'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DebtsTable } from '@/components/admin/debts-table';
import { deudaStore } from '@/lib/sem-store';
import type { Deuda } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function DeudasAdminPage() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);

  useEffect(() => { setDeudas(deudaStore.getAll()); }, []);

  const pendientes  = deudas.filter((d) => d.estado === 'pendiente');
  const horasExtra  = deudas.filter((d) => d.tipo === 'hora_extra');
  const totalPend   = pendientes.reduce((s, d) => s + d.monto, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deudas · RF-ADM-09</h1>
          <p className="text-sm text-gray-500">
            {pendientes.length} pendientes · ${totalPend.toLocaleString('es-AR')} · {horasExtra.length} horas extra
          </p>
        </div>
      </div>

      <DebtsTable deudas={deudas} />
    </div>
  );
}
