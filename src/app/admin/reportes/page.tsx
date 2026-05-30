'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Car, DollarSign, AlertTriangle, FileSpreadsheet, FileText } from 'lucide-react';
import { db } from '@/lib/db';
import type { Pago, Estacionamiento, Deuda } from '@/domain/types';

export default function ReportesPage() {
  const [resumen, setResumen] = useState<{
    totalRecaudado: number;
    totalEstacionamientos: number;
    totalDeudas: number;
    porPermisionario: { nombre: string; apellido: string; recaudado: number; estacionamientos: number; deudas: number }[];
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [perms, pagos, estacionamientos, deudas] = await Promise.all([
          db.permisionarios.getAll(),
          db.pagos.getAll(),
          db.estacionamientos.getAll(),
          db.deudas.getAll(),
        ]);

        const successPagos = pagos.filter(p => p.estado === 'success');
        const totalRecaudado = successPagos.reduce((s, p) => s + p.monto, 0);
        const totalDeudas = deudas.filter(d => d.estado === 'pendiente').reduce((s, d) => s + d.monto, 0);

        const porPermisionario = perms.map(perm => {
          const recaudado = successPagos.filter(p => p.permisionarioId === perm.id).reduce((s, p) => s + p.monto, 0);
          const est = estacionamientos.filter(e => e.permisionarioId === perm.id).length;
          const deu = deudas.filter(d => d.permisionarioId === perm.id && d.estado === 'pendiente').reduce((s, d) => s + d.monto, 0);
          return { nombre: perm.nombre, apellido: perm.apellido, recaudado, estacionamientos: est, deudas: deu };
        });

        setResumen({
          totalRecaudado,
          totalEstacionamientos: estacionamientos.length,
          totalDeudas,
          porPermisionario,
        });
      } catch (err) {
        console.error('Error loading reportes:', err);
      }
    }
    load();
  }, []);

  const reportes = resumen ? [
    { title: 'Ocupación por Zona', desc: 'Análisis de uso y rotación vehicular', icon: Car, value: `${resumen.totalEstacionamientos} estacionamientos` },
    { title: 'Recaudación Consolidada', desc: 'Ingresos por medios de pago y sectores', icon: DollarSign, value: `$${resumen.totalRecaudado.toLocaleString('es-AR')}` },
    { title: 'Rendimiento de Previsores', desc: 'Actividad y tiempos de conexión', icon: TrendingUp, value: `${resumen.porPermisionario.length} previsores` },
    { title: 'Infracciones Emitidas', desc: 'Estadísticas de multas y motivos', icon: AlertTriangle, value: `$${resumen.totalDeudas.toLocaleString('es-AR')} pendiente` },
  ] : [
    { title: 'Ocupación por Zona', desc: 'Análisis de uso y rotación vehicular', icon: Car, value: '' },
    { title: 'Recaudación Consolidada', desc: 'Ingresos por medios de pago y sectores', icon: DollarSign, value: '' },
    { title: 'Rendimiento de Previsores', desc: 'Actividad y tiempos de conexión', icon: TrendingUp, value: '' },
    { title: 'Infracciones Emitidas', desc: 'Estadísticas de multas y motivos', icon: AlertTriangle, value: '' },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Reportes y Estadísticas</h1>
        <p className="text-sm text-gray-500">Generación de informes exportables del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportes.map((reporte, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-municipal-50 p-3 rounded-xl text-municipal-600">
                <reporte.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{reporte.title}</h3>
                <p className="text-sm text-gray-500">{reporte.desc}</p>
                {reporte.value && (
                  <p className="text-lg font-bold text-municipal-600 mt-1">{reporte.value}</p>
                )}
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

      {resumen && resumen.porPermisionario.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Rendimiento por Permisionario</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Permisionario</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Estacionamientos</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Recaudado</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Deudas</th>
                </tr>
              </thead>
              <tbody>
                {resumen.porPermisionario.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-900">{p.nombre} {p.apellido}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{p.estacionamientos}</td>
                    <td className="py-2 px-3 text-right text-gray-900 font-bold">${p.recaudado.toLocaleString('es-AR')}</td>
                    <td className="py-2 px-3 text-right text-red-600">${p.deudas.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}