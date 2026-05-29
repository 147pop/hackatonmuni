'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import type { Permisionario } from '@/domain/types';

interface QRCardProps {
  permisionario: Permisionario;
  printable?: boolean;
}

export function QRCard({ permisionario, printable = false }: QRCardProps) {
  // En producción (o dev configurado), usamos APP_URL. Si no, detectamos del window si estamos en el cliente,
  // con fallback a localhost:3001
  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || '')}/pagar/${permisionario.id}`;

  return (
    <div className={`flex flex-col items-center gap-4 ${printable ? 'p-8 bg-white border-2 border-gray-300 rounded-2xl' : ''}`}>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <QRCodeSVG
          value={qrValue}
          size={180}
          level="M"
          includeMargin={false}
        />
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">QR Fijo — SEM Digital</p>
        <p className="text-lg font-bold text-gray-900">{permisionario.nombre} {permisionario.apellido}</p>
        <p className="text-base text-gray-600">{permisionario.cuadraAsignada}</p>
        <p className="text-sm font-mono text-gray-400">Legajo {permisionario.legajo}</p>
      </div>

      {!printable && (
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir QR
        </button>
      )}
    </div>
  );
}
