'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, User, Building2, Car, Globe } from 'lucide-react';
import type { UserRole } from '@/lib/routes';
import { ROLE_LABELS, ROUTES } from '@/lib/routes';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  conductor: <Car className="w-4 h-4" />,
  portal: <Globe className="w-4 h-4" />,
  permisionario: <User className="w-4 h-4" />,
  admin: <Building2 className="w-4 h-4" />,
};

const ROLE_ROOT: Record<UserRole, string> = {
  conductor: ROUTES.conductor.root,
  portal: ROUTES.portal.root,
  permisionario: ROUTES.permisionario.root,
  admin: ROUTES.admin.root,
};

function getStoredRole(): UserRole {
  if (typeof window === 'undefined') return 'conductor';
  return (localStorage.getItem('sem_active_role') as UserRole) ?? 'conductor';
}

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>('conductor');
  const router = useRouter();

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  function selectRole(newRole: UserRole) {
    localStorage.setItem('sem_active_role', newRole);
    setRole(newRole);
    setOpen(false);
    router.push(ROLE_ROOT[newRole]);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
        aria-label="Cambiar rol"
      >
        {ROLE_ICONS[role]}
        <span className="hidden sm:inline">{ROLE_LABELS[role]}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r, label]) => (
              <button
                key={r}
                onClick={() => selectRole(r)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${
                  r === role ? 'bg-municipal-50 text-municipal-700 font-medium' : 'text-gray-700'
                }`}
              >
                <span className="text-gray-400">{ROLE_ICONS[r]}</span>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
