'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  TrendingUp, MapPin, Car, AlertTriangle, Wallet, CheckCircle,
  Menu, User, DollarSign, UserCheck, Activity
} from 'lucide-react';

const Heatmap = dynamic(() => import('@/components/admin/heatmap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-[200px] flex items-center justify-center bg-gray-100 animate-pulse text-gray-500 rounded-xl text-sm">Cargando mapa...</div>
});

const INITIAL_KPIS = {
  vehiculos: 128450,
  estacionamientos: 34892,
  recaudacion: 12450000,
  deudas: 3245,
  previsores: 156
};

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(INITIAL_KPIS);

  // Simulación de Realtime en KPIs
  useEffect(() => {
    const interval = setInterval(() => {
      setKpis(prev => ({
        ...prev,
        estacionamientos: prev.estacionamientos + Math.floor(Math.random() * 5),
        recaudacion: prev.recaudacion + (Math.floor(Math.random() * 50) * 100)
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Greeting */}
      <div className="lc-greeting-card mb-3">
        <div className="lc-avatar">
          <User className="w-7 h-7" style={{ color: '#fff' }} />
        </div>
        <div className="lc-greeting-info">
          <p className="lc-greeting-name">
            Hola, <span className="lc-greeting-highlight">Administrador</span>
          </p>
          <Link href="/admin/configuracion" className="lc-ver-perfil">
            Municipalidad de Salta &rsaquo;
          </Link>
        </div>
        <button className="lc-hamburger">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Stats 2-col */}
      <div className="lc-stats-grid mb-3">
        {/* Resumen */}
        <div className="lc-card">
          <div className="lc-card-head">
            <TrendingUp className="w-4 h-4" style={{ color: '#2563EB' }} />
            <span className="lc-card-title">Resumen</span>
          </div>
          <StatRow icon={<Car className="w-4 h-4" />} iconBg="#EFF6FF" iconColor="#2563EB"
            label="Vehículos reg." value={(kpis.vehiculos).toLocaleString('es-AR')} valueColor="#15181F" sub="+12% vs ayer" />
          <StatRow icon={<CheckCircle className="w-4 h-4" />} iconBg="#F0FDF4" iconColor="#16A34A"
            label="Estacionamientos" value={(kpis.estacionamientos).toLocaleString('es-AR')} valueColor="#16A34A" sub="hoy" />
          <StatRow icon={<UserCheck className="w-4 h-4" />} iconBg="#EFF6FF" iconColor="#2563EB"
            label="Permisionarios" value={kpis.previsores} valueColor="#2563EB" sub="activos" />
        </div>

        {/* Financiero */}
        <div className="lc-card">
          <div className="lc-card-head">
            <Wallet className="w-4 h-4" style={{ color: '#2563EB' }} />
            <span className="lc-card-title">Financiero</span>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <div className="font-body text-[11px] text-[#686868] leading-tight">Recaudación total</div>
              <div className="font-display font-extrabold text-[20px] text-[#2563EB] leading-tight mt-1">
                $ {(kpis.recaudacion).toLocaleString('es-AR')}
              </div>
              <div className="font-body text-[10px] text-green-600 font-bold mt-0.5">+15% vs ayer</div>
            </div>
            
            <div className="pt-2 border-t border-[#F1F5F9]">
              <div className="font-body text-[11px] text-[#686868] leading-tight">Deudas pendientes</div>
              <div className="font-display font-extrabold text-[18px] text-[#EA580C] leading-tight mt-1">
                {kpis.deudas.toLocaleString('es-AR')}
              </div>
              <div className="font-body text-[10px] text-[#686868] mt-0.5">+5% vs ayer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa de Calor */}
      <div className="lc-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(21,50,111,0.07)' }}>
        <div className="lc-card-head" style={{ padding: '14px 14px 10px' }}>
          <MapPin className="w-4 h-4" style={{ color: '#2563EB' }} />
          <span className="lc-card-title">Disponibilidad en tiempo real</span>
        </div>
        <div className="h-[250px] w-full relative border-t border-[#F1F5F9]">
          <Heatmap />
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="lc-card mt-3">
        <div className="lc-card-head mb-2">
          <Activity className="w-4 h-4" style={{ color: '#2563EB' }} />
          <span className="lc-card-title">Actividad Reciente</span>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { id: 1, type: 'pago', text: 'Pago realizado', sub: 'ABC 123 - Zona Centro', time: 'Hace 2 min', val: '$60' },
            { id: 2, type: 'nuevo', text: 'Nuevo estacionamiento', sub: 'DEF 456 - Zona Norte', time: 'Hace 5 min', val: '$50' },
            { id: 3, type: 'infraccion', text: 'Infracción registrada', sub: 'GHI 789 - Exceso de tiempo', time: 'Hace 8 min', val: '$1.200', isRed: true },
          ].map(act => (
            <div key={act.id} className="flex justify-between items-center border-b border-[#F8FAFC] pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${act.isRed ? 'bg-red-500' : 'bg-green-500'}`} />
                <div>
                  <p className="font-display font-bold text-[13px] text-[#15181F]">{act.text}</p>
                  <p className="font-body text-[11px] text-[#686868]">{act.sub}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-body text-[11px] text-[#686868]">{act.time}</p>
                <p className={`font-display font-bold text-[13px] ${act.isRed ? 'text-red-600' : 'text-[#15181F]'}`}>{act.val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatRow({ icon, iconBg, iconColor, label, value, valueColor, sub }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  label: string; value: string | number; valueColor: string; sub: string;
}) {
  return (
    <div className="lc-stat-row">
      <div className="lc-stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div>
        <div className="lc-stat-label">{label}</div>
        <div className="lc-stat-value" style={{ color: valueColor, fontSize: 16 }}>{value}</div>
        <div className="lc-stat-sub">{sub}</div>
      </div>
    </div>
  );
}
