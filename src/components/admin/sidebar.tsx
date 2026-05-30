'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Map, Car, ParkingCircle, AlertTriangle, 
  UserCheck, CreditCard, FileText, BarChart3, Settings, X
} from 'lucide-react';

const MENU_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/mapa', icon: Map, label: 'Mapa de calor' },
  { href: '/admin/vehiculos', icon: Car, label: 'Vehículos' },
  { href: '/admin/estacionamientos', icon: ParkingCircle, label: 'Estacionamientos' },
  { href: '/admin/infracciones', icon: AlertTriangle, label: 'Infracciones' },
  { href: '/admin/previsores', icon: UserCheck, label: 'Permisionarios' },
  { href: '/admin/cobros', icon: CreditCard, label: 'Cobros y pagos' },
  { href: '/admin/tramites', icon: FileText, label: 'Trámites y servicios' },
  { href: '/admin/reportes', icon: BarChart3, label: 'Reportes' },
  { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-municipal-900 text-white flex flex-col z-50 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-municipal-700/50 flex flex-col items-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 text-municipal-300 hover:text-white lg:hidden">
            <X className="w-6 h-6" />
          </button>
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-2 border border-white/20 shadow-inner">
            <Car className="w-7 h-7 text-municipal-300" />
          </div>
          <h1 className="font-display font-bold text-lg text-center tracking-tight leading-tight text-white">
            La Cuadra
          </h1>
          <p className="text-[10px] text-municipal-300 font-medium tracking-wider uppercase mt-1">Municipalidad de Salta</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { if(window.innerWidth < 1024) onClose(); }}
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
      </aside>
    </>
  );
}
