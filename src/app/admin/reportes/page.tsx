'use client';

import { BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function ReportesPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Reportes y Estadísticas</h1>
        <p className="text-sm text-gray-500">Generación de informes exportables del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Ocupación por Zona', desc: 'Análisis de uso y rotación vehicular' },
          { title: 'Recaudación Consolidada', desc: 'Ingresos por medios de pago y sectores' },
          { title: 'Rendimiento de Previsores', desc: 'Actividad y tiempos de conexión' },
          { title: 'Infracciones Emitidas', desc: 'Estadísticas de multas y motivos' },
        ].map((reporte, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-municipal-50 p-3 rounded-xl text-municipal-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{reporte.title}</h3>
                <p className="text-sm text-gray-500">{reporte.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Exportar a Excel">
                <FileSpreadsheet className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Exportar a PDF">
                <FileText className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
