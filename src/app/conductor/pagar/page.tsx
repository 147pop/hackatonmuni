'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PaymentWizard } from '@/components/payment-wizard';
import { conductorStore, roleStore } from '@/lib/sem-store';
import type { Conductor } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function PagarPage() {
  const [conductor, setConductor] = useState<Conductor | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = roleStore.getActiveConductorId();
    if (id) setConductor(conductorStore.getById(id) ?? null);
    setLoaded(true);
  }, []);

  if (!loaded) return <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.conductor.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estacionar</h1>
          <p className="text-base text-gray-500">Pago digital · Descuento 20%</p>
        </div>
      </div>

      <PaymentWizard
        conductorId={conductor?.id}
        dominioDefault={conductor?.dominioDefault}
        ticketLinkFn={(id) => ROUTES.conductor.ticket(id)}
      />
    </div>
  );
}
