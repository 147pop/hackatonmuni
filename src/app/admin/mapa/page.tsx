'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Info } from 'lucide-react';

export default function MapaCalorPage() {
  const Heatmap = useMemo(() => dynamic(
    () => import('@/components/admin/heatmap'),
    { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse text-gray-500">Cargando mapa de calor...</div> }
  ), []);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Mapa de Calor</h1>
          <p className="text-sm text-gray-500">Monitoreo de ocupación en tiempo real por zonas y sectores</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1A7A4A]"></span> Alta dispon. (&lt;40%)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span> Media (40-70%)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D97706]"></span> Baja (70-90%)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D93025]"></span> Muy baja (&gt;90%)
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
        <Info className="w-5 h-5 text-blue-500" />
        <p className="text-sm">El mapa se actualiza automáticamente mediante <span className="font-bold">Supabase Realtime</span>. Toca cualquier sector para ver detalles de recaudación y previsores asignados.</p>
      </div>

      <div className="flex-1 min-h-[500px] relative rounded-2xl overflow-hidden shadow-sm">
        <Heatmap />
      </div>
    </div>
  );
}
