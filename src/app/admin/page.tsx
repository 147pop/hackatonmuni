'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car, ParkingCircle, DollarSign, AlertTriangle, UserCheck, 
  Map, FileText, BarChart3, TrendingUp, TrendingDown
} from 'lucide-react';
import { RealtimeFeed } from '@/components/admin/realtime-feed';
import { StatsChart } from '@/components/admin/stats-chart';

// KPIs mockeados para demostración (Deberían venir de Supabase Realtime)
const INITIAL_KPIS = [
  { id: 'vehiculos', label: 'Vehículos registrados', value: '128.450', trend: '+12%', isPositive: true, icon: Car, color: 'bg-blue-500' },
  { id: 'estacionamientos', label: 'Estacionamientos hoy', value: '34.892', trend: '+8%', isPositive: true, icon: ParkingCircle, color: 'bg-green-500' },
  { id: 'recaudacion', label: 'Recaudación total', value: '$12.450.000', trend: '+15%', isPositive: true, icon: DollarSign, color: 'bg-municipal-600' },
  { id: 'deudas', label: 'Deudas pendientes', value: '3.245', trend: '+5%', isPositive: false, icon: AlertTriangle, color: 'bg-red-500' },
  { id: 'previsores', label: 'Previsores activos', value: '156', trend: '+3%', isPositive: true, icon: UserCheck, color: 'bg-indigo-500' },
];

const ACCESOS_RAPIDOS = [
  { href: '/admin/mapa', icon: Map, label: 'Mapa de Calor', color: 'text-blue-500 bg-blue-50' },
  { href: '/admin/vehiculos', icon: Car, label: 'Vehículos', color: 'text-indigo-500 bg-indigo-50' },
  { href: '/admin/estacionamientos', icon: ParkingCircle, label: 'Estacionamientos', color: 'text-green-500 bg-green-50' },
  { href: '/admin/infracciones', icon: AlertTriangle, label: 'Infracciones', color: 'text-red-500 bg-red-50' },
  { href: '/admin/tramites', icon: FileText, label: 'Trámites', color: 'text-amber-500 bg-amber-50' },
  { href: '/admin/reportes', icon: BarChart3, label: 'Reportes', color: 'text-purple-500 bg-purple-50' },
];

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(INITIAL_KPIS);

  // Simulación de Realtime en KPIs
  useEffect(() => {
    const interval = setInterval(() => {
      setKpis(prev => prev.map(kpi => {
        if (kpi.id === 'estacionamientos') {
          const val = parseInt(kpi.value.replace('.', '')) + Math.floor(Math.random() * 5);
          return { ...kpi, value: val.toLocaleString('es-AR') };
        }
        if (kpi.id === 'recaudacion') {
          const val = parseInt(kpi.value.replace('$', '').replace(/\./g, '')) + (Math.floor(Math.random() * 50) * 100);
          return { ...kpi, value: `$${val.toLocaleString('es-AR')}` };
        }
        return kpi;
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl text-white ${kpi.color} shadow-inner`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${kpi.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {kpi.trend}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{kpi.label}</p>
              <h3 className="text-2xl font-display font-bold text-gray-900 mt-1">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 min-h-[400px]">
          <StatsChart />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1 min-h-[400px] h-full">
          <RealtimeFeed />
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div>
        <h3 className="font-display font-bold text-lg text-gray-900 mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ACCESOS_RAPIDOS.map((acceso) => (
            <Link 
              key={acceso.href} 
              href={acceso.href}
              className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-municipal-300 transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className={`p-3 rounded-2xl ${acceso.color} group-hover:scale-110 transition-transform`}>
                <acceso.icon className="w-6 h-6" />
              </div>
              <span className="font-medium text-sm text-gray-700 text-center">{acceso.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
