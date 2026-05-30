'use client';

import { Settings, Shield, Clock, Map, Users } from 'lucide-react';

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-sm text-gray-500">Parámetros operativos y control de acceso</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-municipal-600"/> Horarios y Tarifas SEM</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Tarifa Base (Hora)</span>
                <span className="font-bold bg-gray-100 px-3 py-1 rounded-md">$150.00</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Horario Lunes a Viernes</span>
                <span className="font-bold text-gray-600">08:00 - 20:00</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Feriados</span>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Libre</span>
              </div>
            </div>
            <button className="mt-4 w-full py-2 border-2 border-municipal-200 text-municipal-700 font-bold rounded-xl hover:bg-municipal-50 transition-colors">Modificar</button>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Map className="w-5 h-5 text-municipal-600"/> Zonas y Dársenas</h3>
            <p className="text-sm text-gray-500 mb-4">Administración de polígonos, sectores y capacidad por cuadra.</p>
            <button className="w-full py-2 bg-municipal-50 text-municipal-700 font-bold rounded-xl hover:bg-municipal-100 transition-colors">Gestionar Zonas</button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-municipal-600"/> Usuarios y Roles (RBAC)</h3>
            <p className="text-sm text-gray-500 mb-4">Control de acceso y permisos (RLS aplicado en Supabase).</p>
            <div className="space-y-3">
              {['Super Admin', 'Administrador Municipal', 'Supervisor', 'Auditor/Consulta'].map((rol, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-sm text-gray-800">{rol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
