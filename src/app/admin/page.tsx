'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Car, ParkingCircle, DollarSign, AlertTriangle, UserCheck, 
  Map, FileText, BarChart3, TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react';
import { RealtimeFeed } from '@/components/admin/realtime-feed';
import { StatsChart } from '@/components/admin/stats-chart';

// Importación dinámica del Heatmap para evitar errores de SSR con Leaflet
const Heatmap = dynamic(() => import('@/components/admin/heatmap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-gray-100 animate-pulse text-gray-500 rounded-2xl">Cargando mapa...</div>
});

const INITIAL_KPIS = [
  { id: 'vehiculos', label: 'Vehículos registrados', value: '128.450', trend: '+12%', isPositive: true },
  { id: 'estacionamientos', label: 'Estacionamientos hoy', value: '34.892', trend: '+8%', isPositive: true },
  { id: 'recaudacion', label: 'Recaudación total', value: '$ 12.450.000', trend: '+15%', isPositive: true },
  { id: 'deudas', label: 'Deudas pendientes', value: '3.245', trend: '+5%', isPositive: false },
  { id: 'previsores', label: 'Permisionarios activos', value: '156', trend: '+3%', isPositive: true },
];

const ACCESOS_RAPIDOS = [
  { href: '/admin/mapa', icon: Map, label: 'Mapa de calor', sub: 'Ver disponibilidad' },
  { href: '/admin/vehiculos', icon: Car, label: 'Vehículos', sub: 'Gestionar vehículos' },
  { href: '/admin/estacionamientos', icon: ParkingCircle, label: 'Estacionamientos', sub: 'Historial y comprobantes' },
  { href: '/admin/infracciones', icon: AlertTriangle, label: 'Infracciones', sub: 'Consultar y pagar' },
  { href: '/admin/tramites', icon: FileText, label: 'Trámites y servicios', sub: 'Todos los trámites' },
  { href: '/admin/reportes', icon: BarChart3, label: 'Reportes', sub: 'Estadísticas y reportes' },
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
          const val = parseInt(kpi.value.replace('$ ', '').replace(/\./g, '')) + (Math.floor(Math.random() * 50) * 100);
          return { ...kpi, value: `$ ${(val).toLocaleString('es-AR')}` };
        }
        return kpi;
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 lg:space-y-8 pb-8 max-w-7xl mx-auto">
      {/* Title only visible on Desktop, since mobile has it on the Header */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-display font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {kpis.map((kpi, index) => (
          <div 
            key={kpi.id} 
            className={`bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between
            ${index === 2 ? 'col-span-2 md:col-span-1' : ''}`}
          >
            <p className="text-gray-500 text-xs lg:text-sm font-medium mb-2">{kpi.label}</p>
            <h3 className="text-xl lg:text-2xl font-display font-bold text-gray-900 mb-2 truncate">{kpi.value}</h3>
            <div className={`flex items-center gap-1 text-xs font-bold ${kpi.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {kpi.trend} <span className="text-gray-400 font-medium ml-1">vs ayer</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Heatmap Widget */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[350px]">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-display font-bold text-gray-900 flex items-center gap-2">
              Mapa de calor <span className="text-xs text-gray-400 font-normal">- Disponibilidad en tiempo real</span>
            </h3>
          </div>
          <div className="flex-1 relative">
            <Heatmap />
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1A7A4A]"></span> Alta</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Media</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span> Baja</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D93025]"></span> Muy baja</div>
          </div>
        </div>

        {/* Stats Chart */}
        <div className="lg:col-span-5 min-h-[350px]">
          <StatsChart />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-3 min-h-[350px]">
          <RealtimeFeed />
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div>
        <h3 className="font-display font-bold text-lg text-gray-900 mb-4">Accesos rápidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {ACCESOS_RAPIDOS.map((acceso) => (
            <Link 
              key={acceso.href} 
              href={acceso.href}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-municipal-300 transition-all flex flex-col items-start gap-3 group"
            >
              <acceso.icon className="w-6 h-6 text-municipal-600 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-bold text-sm text-gray-900 leading-tight">{acceso.label}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{acceso.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
