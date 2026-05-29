'use client';

import Link from 'next/link';
import { Globe, CreditCard, AlertTriangle, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

export default function PortalPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Globe className="w-7 h-7 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-900">Portal Público</h1>
        </div>
        <p className="text-base text-gray-500">Pagá o consultá deudas sin necesidad de cuenta. RF-PAG-08.</p>
      </div>

      <div className="space-y-3">
        <Link href={ROUTES.portal.pagar}
          className="flex items-center justify-between btn-xl bg-teal-600 hover:bg-teal-700 text-white rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            <div className="text-left">
              <p className="font-bold">Pagar estacionamiento</p>
              <p className="text-sm text-teal-200">Sin cuenta requerida</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link href={ROUTES.portal.deudas}
          className="flex items-center justify-between btn-xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div className="text-left">
              <p className="font-bold">Consultar deuda por patente</p>
              <p className="text-sm text-gray-400">RF-PAT-07</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-700">
        <p>¿Usás SEM frecuentemente? <Link href={ROUTES.conductor.registro} className="underline font-semibold">Creá tu cuenta</Link> para historial y notificaciones de vencimiento.</p>
      </div>
    </div>
  );
}
