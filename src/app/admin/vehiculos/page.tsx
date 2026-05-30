'use client';

import { Search, Car, Filter, MoreVertical } from 'lucide-react';

export default function VehiculosPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Parque Vehicular</h1>
        <p className="text-sm text-gray-500">Administración y consulta de vehículos registrados</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por patente, DNI o titular..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-municipal-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors">
          <Filter className="w-5 h-5" /> Filtros
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Patente</th>
              <th className="px-6 py-4 font-medium">Marca y Modelo</th>
              <th className="px-6 py-4 font-medium">Titular</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium">Deudas</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-bold font-display bg-gray-100 px-3 py-1 rounded-md text-gray-800 border border-gray-200">
                    AD 123 {String.fromCharCode(64 + i)}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">Toyota Hilux</td>
                <td className="px-6 py-4 text-gray-500">Juan Pérez</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">Activo</span>
                </td>
                <td className="px-6 py-4 text-gray-500">$0</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-municipal-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
