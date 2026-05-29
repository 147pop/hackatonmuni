'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { DebtList } from '@/components/debt-list';
import { conductorStore, roleStore, deudaStore } from '@/lib/sem-store';
import type { Deuda } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function DeudasPage() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [dominio, setDominio] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = roleStore.getActiveConductorId();
    if (id) {
      const c = conductorStore.getById(id);
      if (c) {
        setDominio(c.dominioDefault);
        setDeudas(deudaStore.getByDominio(c.dominioDefault));
      }
    }
    setLoaded(true);
  }, []);

  const pendientes = deudas.filter((d) => d.estado === 'pendiente');

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.conductor.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis deudas</h1>
          {dominio && <p className="text-base text-gray-500 font-mono">{dominio} · RF-PAT-06</p>}
        </div>
      </div>

      {loaded && pendientes.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{pendientes.length} deuda{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} — Total: ${pendientes.reduce((s, d) => s + d.monto, 0).toLocaleString('es-AR')}</span>
        </div>
      )}

      <DebtList
        deudas={deudas}
        onPaid={() => {
          const id = roleStore.getActiveConductorId();
          if (id) {
            const c = conductorStore.getById(id);
            if (c) setDeudas(deudaStore.getByDominio(c.dominioDefault));
          }
        }}
        emptyMessage="No tenés deudas. ¡Todo en orden!"
      />
    </div>
  );
}
