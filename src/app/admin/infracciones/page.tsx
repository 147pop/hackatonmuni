'use client';

import { AlertTriangle, Check, X, ArrowRight } from 'lucide-react';

export default function InfraccionesPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Gestión de Infracciones</h1>
          <p className="text-sm text-gray-500">Aprobación y seguimiento de actas</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="px-4 py-2 bg-white border border-municipal-500 text-municipal-600 rounded-lg font-bold shadow-sm">Pendientes (12)</button>
        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-lg font-medium hover:bg-gray-50">Pagadas</button>
        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-lg font-medium hover:bg-gray-50">Apeladas</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="font-bold font-display bg-red-50 text-red-700 px-3 py-1 rounded-md border border-red-200">
                AA {i}45 BB
              </span>
              <span className="text-xs font-bold text-gray-400">Hace 15 min</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Estacionamiento sin ticket</h3>
            <p className="text-sm text-gray-500 mb-4">Zona Monumento - Previsor: Carlos M.</p>
            
            <div className="flex items-center justify-between text-sm mb-6 bg-gray-50 p-3 rounded-xl">
              <span className="text-gray-500">Importe a cobrar</span>
              <span className="font-bold text-gray-900 text-lg">$15.000</span>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex justify-center items-center gap-2 bg-green-50 text-green-700 py-2 rounded-xl font-bold hover:bg-green-100 transition-colors">
                <Check className="w-4 h-4" /> Aprobar
              </button>
              <button className="flex-1 flex justify-center items-center gap-2 bg-red-50 text-red-700 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors">
                <X className="w-4 h-4" /> Anular
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
