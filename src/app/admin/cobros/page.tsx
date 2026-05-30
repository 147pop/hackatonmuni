'use client';

import { CreditCard, DollarSign, Wallet, QrCode } from 'lucide-react';

export default function CobrosPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Dashboard Financiero</h1>
        <p className="text-sm text-gray-500">Monitoreo de recaudación y medios de pago</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Efectivo', value: '$4.500.000', icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Mercado Pago (QR)', value: '$5.200.000', icon: QrCode, color: 'text-blue-600 bg-blue-50' },
          { label: 'Tarjetas', value: '$2.100.000', icon: CreditCard, color: 'text-purple-600 bg-purple-50' },
          { label: 'Billeteras Virtuales', value: '$650.000', icon: Wallet, color: 'text-amber-600 bg-amber-50' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-500">{item.label}</span>
            </div>
            <h3 className="text-2xl font-display font-bold text-gray-900">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white flex-1 rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-center">
        <p className="text-gray-400 font-medium text-lg">Gráficos financieros en construcción...</p>
      </div>
    </div>
  );
}
