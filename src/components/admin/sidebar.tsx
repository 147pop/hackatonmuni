'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Car,
  ParkingCircle,
  AlertTriangle,
  UserCheck,
  CreditCard,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';

const MENU_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/mapa', icon: Map, label: 'Mapa de Calor' },
  { href: '/admin/vehiculos', icon: Car, label: 'Vehículos' },
  { href: '/admin/estacionamientos', icon: ParkingCircle, label: 'Estacionamientos' },
  { href: '/admin/infracciones', icon: AlertTriangle, label: 'Infracciones' },
  { href: '/admin/previsores', icon: UserCheck, label: 'Previsores' },
  { href: '/admin/cobros', icon: CreditCard, label: 'Cobros y Pagos' },
  { href: '/admin/tramites', icon: FileText, label: 'Trámites y Servicios' },
  { href: '/admin/reportes', icon: BarChart3, label: 'Reportes' },
  { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-municipal-900 text-white flex flex-col z-50 shadow-xl">
      <div className="p-6 border-b border-municipal-700/50 flex flex-col items-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-3 border border-white/20 shadow-inner">
          <Car className="w-8 h-8 text-municipal-300" />
        </div>
        <h1 className="font-display font-bold text-xl text-center tracking-tight leading-tight text-white">
          La Cuadra
        </h1>
        <p className="text-xs text-municipal-300 font-medium tracking-wide">MUNICIPALIDAD DE SALTA</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body text-sm ${
                isActive 
                  ? 'bg-municipal-600 text-white font-semibold shadow-md border border-municipal-500/50' 
                  : 'text-municipal-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-municipal-300'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-municipal-700/50 text-xs text-municipal-400 text-center font-body flex flex-col gap-1">
        <span>CCO · Centro de Control Operativo</span>
        <span>Versión 1.0.0</span>
      </div>
    </aside>
  );
}
