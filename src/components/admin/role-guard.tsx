'use client';

import { useEffect, useState } from 'react';
import { roleStore } from '@/lib/sem-store';
import type { AdminRole } from '@/domain/types';

export function useAdminRole(): AdminRole {
  const [role, setRole] = useState<AdminRole>('administrador');
  useEffect(() => {
    setRole(roleStore.getAdminRole());
    // Re-read on storage events (tab sync)
    const handler = () => setRole(roleStore.getAdminRole());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  return role;
}

export function ReadOnlyBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium">
      Modo solo lectura — su rol no permite modificaciones (RF-ADM-12).
    </div>
  );
}

export function canEdit(role: AdminRole): boolean {
  return role === 'administrador';
}
