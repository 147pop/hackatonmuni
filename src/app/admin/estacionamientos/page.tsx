'use client';

import { ParkingCircle, Filter, Download } from 'lucide-react';

export default function EstacionamientosPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Sesiones de Estacionamiento</h1>
          <p className="text-sm text-gray-500">Visualización completa de sesiones activas e históricas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-municipal-600 text-white rounded-xl hover:bg-municipal-700 font-medium transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Patente</th>
              <th className="px-6 py-4 font-medium">Zona / Dársena</th>
              <th className="px-6 py-4 font-medium">Inicio - Fin</th>
              <th className="px-6 py-4 font-medium">Importe</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium">Método Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-bold font-display bg-gray-100 px-3 py-1 rounded-md text-gray-800 border border-gray-200">
                    AB {i}01 CD
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">Zona Centro</p>
                  <p className="text-xs text-gray-500">Belgrano 1200</p>
                </td>
                <td className="px-6 py-4 text-gray-500">10:00 - 12:00</td>
                <td className="px-6 py-4 font-medium text-gray-900">${i * 150}</td>
                <td className="px-6 py-4">
                  {i % 2 === 0 ? (
                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">Activo</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-bold">Finalizado</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500">App Municipal</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
