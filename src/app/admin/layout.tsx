'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { roleStore } from '@/lib/sem-store';
import type { AdminRole } from '@/domain/types';

const ROLES: { value: AdminRole; label: string; desc: string }[] = [
  { value: 'administrador', label: 'Administrador', desc: 'Acceso completo' },
  { value: 'supervisor',    label: 'Supervisor',    desc: 'Lectura + alertas' },
  { value: 'consulta',      label: 'Consulta',      desc: 'Solo lectura' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [adminRole, setAdminRole] = useState<AdminRole>('administrador');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAdminRole(roleStore.getAdminRole());
    setMounted(true);
  }, []);

  function handleRoleChange(r: AdminRole) {
    roleStore.setAdminRole(r);
    setAdminRole(r);
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      {/* RF-ADM-12: Sub-role selector */}
      <div className="bg-municipal-900 border-b border-municipal-700 px-4 py-2">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-municipal-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="font-medium">Sub-rol:</span>
          </div>
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRoleChange(r.value)}
                title={r.desc}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  adminRole === r.value
                    ? 'bg-white text-municipal-900'
                    : 'text-municipal-300 hover:bg-municipal-700 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {adminRole !== 'administrador' && (
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
              adminRole === 'consulta'
                ? 'bg-amber-500 text-white'
                : 'bg-blue-500 text-white'
            }`}>
              {adminRole === 'consulta' ? 'Solo lectura — edición bloqueada' : 'Supervisor — sin configuración'}
            </span>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
