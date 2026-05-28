'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { permisionarioStore, roleStore } from '@/lib/sem-store';
import { NonPaymentForm } from '@/components/non-payment-form';
import type { Permisionario } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function IncumplimientoPage() {
  const [perm, setPerm] = useState<Permisionario | null>(null);

  useEffect(() => {
    const id = roleStore.getActivePermisionarioId();
    if (id) setPerm(permisionarioStore.getById(id) ?? null);
  }, []);

  if (!perm) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-base text-gray-500">Primero seleccioná tu usuario.</p>
        <Link href={ROUTES.permisionario.root} className="btn-xl inline-block bg-municipal-600 text-white rounded-xl px-6">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.permisionario.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrar incumplimiento</h1>
          <p className="text-base text-gray-500">{perm.cuadraAsignada}</p>
        </div>
      </div>

      <NonPaymentForm
        permisionarioId={perm.id}
        cuadra={perm.cuadraAsignada}
        onSuccess={() => {}}
      />
    </div>
  );
}
