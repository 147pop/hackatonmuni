'use client';

import { useMemo } from 'react';
import { roleStore } from '@/lib/sem-store';
import { Bell, ShieldAlert, User } from 'lucide-react';

export function Header() {
  const adminRole = roleStore.getAdminRole();
  
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  }, []);

  const roleLabels = {
    administrador: 'Administrador General',
    supervisor: 'Supervisor',
    consulta: 'Auditor / Consulta'
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div>
        <h2 className="font-display font-bold text-gray-900 capitalize text-lg">
          Hoy, {formattedDate}
        </h2>
        <p className="text-xs font-medium text-gray-500">Panel de Control Operativo</p>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-municipal-600 hover:bg-municipal-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-200"></div>
        
        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-colors">
          <div className="text-right hidden md:block">
            <p className="font-body font-bold text-sm text-gray-900">{roleLabels[adminRole]}</p>
            <p className="font-body text-xs text-municipal-600 font-medium">Municipalidad de Salta</p>
          </div>
          <div className="w-10 h-10 bg-municipal-100 rounded-full flex items-center justify-center border-2 border-municipal-200 shadow-inner">
            <User className="w-5 h-5 text-municipal-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
