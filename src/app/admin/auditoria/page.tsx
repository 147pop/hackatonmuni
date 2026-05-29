'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuditLog } from '@/components/admin/audit-log';
import { auditStore } from '@/lib/sem-store';
import type { AuditEvent } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function AuditoriaPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => { setEvents(auditStore.getAll()); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoría · RF-ADM-07</h1>
          <p className="text-sm text-gray-500">Trail completo — {events.length} eventos · últimos 1000 almacenados</p>
        </div>
      </div>

      <AuditLog events={events} maxVisible={50} />
    </div>
  );
}
