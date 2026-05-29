'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PaymentWizard } from '@/components/payment-wizard';
import { ROUTES } from '@/lib/routes';

export default function PortalPagarPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.portal.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagar estacionamiento</h1>
          <p className="text-base text-gray-500">Sin cuenta · Descuento 20% digital</p>
        </div>
      </div>

      {/* No conductorId — portal flow */}
      <PaymentWizard />
    </div>
  );
}
