'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { permisionarioStore, roleStore } from '@/lib/sem-store';
import { CredencialCard } from '@/components/credencial-card';
import { QRCard } from '@/components/qr-card';
import type { Permisionario } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function CredencialPage() {
  const [perm, setPerm] = useState<Permisionario | null>(null);
  const [tab, setTab] = useState<'credencial' | 'qr'>('credencial');

  useEffect(() => {
    const id = roleStore.getActivePermisionarioId();
    if (id) setPerm(permisionarioStore.getById(id) ?? null);
  }, []);

  if (!perm) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-base text-gray-500">Primero seleccioná tu usuario.</p>
        <Link href={ROUTES.permisionario.root} className="btn-xl inline-block bg-municipal-600 text-white rounded-xl px-6">
          Volver
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
        <h1 className="text-2xl font-bold text-gray-900">Credencial y QR</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {(['credencial', 'qr'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-base font-semibold rounded-lg transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'credencial' ? 'Credencial digital' : 'QR Fijo'}
          </button>
        ))}
      </div>

      {tab === 'credencial' ? (
        <div className="space-y-4">
          <CredencialCard permisionario={perm} />
          <p className="text-sm text-gray-400 text-center">
            Esta credencial verifica tu identidad. El conductor la ve al escanear tu QR.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex justify-center">
            <QRCard permisionario={perm} />
          </div>
          <p className="text-sm text-gray-400 text-center">
            Mostrá este QR al conductor para que pueda pagar digitalmente.
          </p>
        </div>
      )}
    </div>
  );
}
