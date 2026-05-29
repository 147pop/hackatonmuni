'use client';

import Link from 'next/link';
import {
  Users, DollarSign, Calendar, MapPin, Clock,
  BarChart3, CreditCard, AlertTriangle, FileText, Building2, ArrowRight,
} from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface NavCard {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  color: string;
  sprint?: number;
}

const GESTION: NavCard[] = [
  { href: ROUTES.admin.permisionarios, icon: <Users className="w-6 h-6" />, label: 'Permisionarios', desc: 'CRUD, cuadras, baja/alta', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { href: ROUTES.admin.liquidaciones,  icon: <DollarSign className="w-6 h-6" />, label: 'Liquidaciones', desc: 'Calcular y transferir cuotas', color: 'text-green-600 bg-green-50 border-green-200' },
];

const CONFIG: NavCard[] = [
  { href: ROUTES.admin.tarifas,   icon: <DollarSign className="w-6 h-6" />, label: 'Tarifas',        desc: 'Precios por hora y descuento digital', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { href: ROUTES.admin.zonas,     icon: <MapPin className="w-6 h-6" />,     label: 'Zonas',          desc: 'Nocturno y cuadras por zona',          color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { href: ROUTES.admin.feriados,  icon: <Calendar className="w-6 h-6" />,   label: 'Feriados',       desc: 'Días no laborables',                   color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { href: ROUTES.admin.normativa, icon: <Clock className="w-6 h-6" />,      label: 'Normativa',      desc: 'Horarios diurnos y nocturnos',         color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
];

const REPORTES: NavCard[] = [
  { href: ROUTES.admin.reportes,  icon: <BarChart3 className="w-6 h-6" />,    label: 'Reportes',   desc: 'Recaudación por período y zona', color: 'text-gray-500 bg-gray-50 border-gray-200', sprint: 5 },
  { href: ROUTES.admin.pagos,     icon: <CreditCard className="w-6 h-6" />,   label: 'Pagos',      desc: 'Tabla completa de transacciones', color: 'text-gray-500 bg-gray-50 border-gray-200', sprint: 5 },
  { href: ROUTES.admin.deudas,    icon: <AlertTriangle className="w-6 h-6" />, label: 'Deudas',    desc: 'Vista admin de deudas', color: 'text-gray-500 bg-gray-50 border-gray-200', sprint: 5 },
  { href: ROUTES.admin.auditoria, icon: <FileText className="w-6 h-6" />,     label: 'Auditoría',  desc: 'Log de eventos del sistema', color: 'text-gray-500 bg-gray-50 border-gray-200', sprint: 5 },
  { href: ROUTES.admin.alertas,   icon: <AlertTriangle className="w-6 h-6" />, label: 'Alertas',   desc: 'Emergencias activas', color: 'text-gray-500 bg-gray-50 border-gray-200', sprint: 5 },
];

export default function AdminPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="w-7 h-7 text-municipal-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración Municipal</h1>
          <p className="text-sm text-gray-500">SEM Digital · RF-ADM-03 a RF-ADM-12</p>
        </div>
      </div>

      <Section title="Gestión" cards={GESTION} />
      <Section title="Configuración" cards={CONFIG} />
      <Section title="Reportes y Monitoreo" cards={REPORTES} note="Sprint 5" />
    </div>
  );
}

function Section({ title, cards, note }: { title: string; cards: NavCard[]; note?: string }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
        {note && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">{note}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 hover:shadow-sm transition-all ${c.color}`}
          >
            <div className="flex-shrink-0">{c.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{c.label}</p>
              <p className="text-xs text-gray-500 truncate">{c.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
