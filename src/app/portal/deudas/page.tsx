'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { DebtList } from '@/components/debt-list';
import { PlateInput } from '@/components/plate-input';
import { deudaStore } from '@/lib/sem-store';
import type { Deuda } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function PortalDeudasPage() {
  const [dominio, setDominio] = useState('');
  const [dominioValido, setDominioValido] = useState(false);
  const [deudas, setDeudas] = useState<Deuda[] | null>(null);
  const [buscado, setBuscado] = useState('');

  function handleBuscar() {
    if (!dominioValido) return;
    const found = deudaStore.getByDominio(dominio);
    setDeudas(found);
    setBuscado(dominio.toUpperCase());
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.portal.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultar deuda</h1>
          <p className="text-base text-gray-500">RF-PAT-07 — sin cuenta requerida</p>
        </div>
      </div>

      <div className="space-y-3">
        <PlateInput value={dominio} onChange={setDominio} onValidChange={setDominioValido} />
        <button
          onClick={handleBuscar}
          disabled={!dominioValido}
          className="btn-xl bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white w-full flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Consultar deudas
        </button>
      </div>

      {deudas !== null && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500">
            Resultados para <span className="font-mono text-gray-900">{buscado}</span>
          </p>
          <DebtList
            deudas={deudas}
            onPaid={() => setDeudas(deudaStore.getByDominio(buscado))}
            emptyMessage={`Sin deudas registradas para ${buscado}.`}
          />
        </div>
      )}
    </div>
  );
}
