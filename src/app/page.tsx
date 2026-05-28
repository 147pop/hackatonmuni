import Link from 'next/link';
import { Car, Globe, User, Building2, ArrowRight } from 'lucide-react';
import { ROUTES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/routes';
import type { UserRole } from '@/lib/routes';
import { ResetDemoDataButton } from '@/components/reset-demo-data-button';

const ROLE_CONFIG: Array<{
  role: UserRole;
  href: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = [
  {
    role: 'conductor',
    href: ROUTES.conductor.root,
    icon: <Car className="w-8 h-8" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    role: 'portal',
    href: ROUTES.portal.root,
    icon: <Globe className="w-8 h-8" />,
    color: 'text-teal-600',
    bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
  },
  {
    role: 'permisionario',
    href: ROUTES.permisionario.root,
    icon: <User className="w-8 h-8" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
  {
    role: 'admin',
    href: ROUTES.admin.root,
    icon: <Building2 className="w-8 h-8" />,
    color: 'text-municipal-700',
    bg: 'bg-municipal-50 hover:bg-municipal-100 border-municipal-200',
  },
];

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <Building2 className="w-12 h-12 text-municipal-700 mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-gray-900">SEM Digital</h1>
        <p className="text-gray-500 mt-1">Sistema de Estacionamiento Medido — Municipalidad de Salta</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROLE_CONFIG.map(({ role, href, icon, color, bg }) => (
          <Link
            key={role}
            href={href}
            className={`group flex flex-col gap-3 p-6 rounded-2xl border-2 transition-all ${bg}`}
          >
            <div className={color}>{icon}</div>
            <div>
              <div className="font-semibold text-gray-900 text-lg">{ROLE_LABELS[role]}</div>
              <div className="text-sm text-gray-500 mt-0.5">{ROLE_DESCRIPTIONS[role]}</div>
            </div>
            <ArrowRight className={`w-4 h-4 ${color} mt-auto self-end group-hover:translate-x-1 transition-transform`} />
          </Link>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <ResetDemoDataButton />
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        PunaTech 2026 — Hackathon MVP. Datos simulados en localStorage.
      </p>
    </div>
  );
}
