'use client';

import { FileText, Inbox, Play, CheckCircle, Archive } from 'lucide-react';

export default function TramitesPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Trámites y Servicios</h1>
        <p className="text-sm text-gray-500">Gestión de reclamos, exenciones y solicitudes ciudadanas</p>
      </div>

      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <button className="flex items-center gap-2 pb-2 border-b-2 border-municipal-600 text-municipal-700 font-bold px-2"><Inbox className="w-4 h-4"/> Pendientes</button>
        <button className="flex items-center gap-2 pb-2 text-gray-500 font-medium px-2 hover:text-gray-700"><Play className="w-4 h-4"/> En proceso</button>
        <button className="flex items-center gap-2 pb-2 text-gray-500 font-medium px-2 hover:text-gray-700"><CheckCircle className="w-4 h-4"/> Resueltos</button>
        <button className="flex items-center gap-2 pb-2 text-gray-500 font-medium px-2 hover:text-gray-700"><Archive className="w-4 h-4"/> Archivados</button>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-municipal-300 transition-colors cursor-pointer flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">RECLAMO</span>
                <span className="text-sm font-bold text-gray-900">Ticket #{9000 + i}</span>
              </div>
              <h3 className="font-medium text-gray-800">Inconveniente con pago mediante QR en Zona Centro</h3>
              <p className="text-xs text-gray-500 mt-1">Usuario: DNI 30.123.{400 + i}</p>
            </div>
            <button className="px-4 py-2 bg-municipal-50 text-municipal-700 rounded-lg font-bold hover:bg-municipal-100">Ver detalle</button>
          </div>
        ))}
      </div>
    </div>
  );
}
