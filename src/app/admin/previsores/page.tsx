'use client';

import { UserCheck, MapPin, Battery, Wifi } from 'lucide-react';

export default function PrevisoresPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Control Operativo de Previsores</h1>
        <p className="text-sm text-gray-500">Monitoreo en tiempo real de permisionarios activos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-municipal-100 rounded-full flex items-center justify-center border-2 border-municipal-200">
                <UserCheck className="w-6 h-6 text-municipal-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Previsor {i}</h3>
                <p className="text-xs text-gray-500">Legajo #{1000 + i}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1"><MapPin className="w-4 h-4" /> Zona</span>
                <span className="font-bold">Sector {String.fromCharCode(64 + i)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Battery className="w-4 h-4" /> Batería</span>
                <span className="font-bold text-green-600">8{i}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Wifi className="w-4 h-4" /> Conexión</span>
                <span className="font-bold text-green-600">Estable</span>
              </div>
            </div>

            <button className="w-full py-2 bg-municipal-50 text-municipal-700 font-bold rounded-xl hover:bg-municipal-100 transition-colors">
              Ver ubicación GPS
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
