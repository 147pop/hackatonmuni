'use client';

import { useMemo } from 'react';
import { roleStore } from '@/lib/sem-store';
import { Bell, ShieldAlert, User, Menu } from 'lucide-react';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const adminRole = roleStore.getAdminRole();
  
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  }, []);

  const roleLabels = {
    administrador: 'Administrador',
    supervisor: 'Supervisor',
    consulta: 'Auditor'
  };

  return (
    <header className="h-16 md:h-20 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:block">
          <h2 className="font-display font-bold text-gray-900 capitalize md:text-lg">
            Hoy, {formattedDate}
          </h2>
          <p className="text-xs font-medium text-gray-500">Panel de Control Operativo</p>
        </div>
        <div className="md:hidden">
          <h2 className="font-display font-bold text-gray-900 text-lg">Dashboard</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-6">
        <button className="relative p-2 text-gray-400 hover:text-municipal-600 hover:bg-municipal-50 rounded-full transition-colors">
          <Bell className="w-5 h-5 md:w-6 md:h-6" />
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        
        <div className="hidden md:block h-8 w-px bg-gray-200"></div>
        
        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 md:p-1.5 rounded-xl transition-colors">
          <div className="text-right hidden sm:block">
            <p className="font-body font-bold text-sm text-gray-900">{roleLabels[adminRole]}</p>
            <p className="font-body text-xs text-municipal-600 font-medium">Municipalidad de Salta</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-municipal-100 rounded-full flex items-center justify-center border-2 border-municipal-200 shadow-inner">
            <User className="w-4 h-4 md:w-5 md:h-5 text-municipal-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
