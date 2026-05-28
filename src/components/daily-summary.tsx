'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Banknote, AlertTriangle, DollarSign } from 'lucide-react';
import { ticketStore, pagoStore, deudaStore } from '@/lib/sem-store';

interface DailySummaryProps {
  permisionarioId: string;
  className?: string;
}

interface Summary {
  totalTickets: number;
  pagosEfectivo: number;
  pagosDigital: number;
  deudas: number;
  totalEfectivo: number;
  totalDigital: number;
}

function getSummary(permisionarioId: string): Summary {
  const hoy = new Date().toISOString().split('T')[0];

  const tickets = ticketStore
    .getAll()
    .filter((t) => t.permisionarioId === permisionarioId && t.inicio.startsWith(hoy));

  const pagos = pagoStore
    .getAll()
    .filter((p) => p.permisionarioId === permisionarioId && p.createdAt.startsWith(hoy) && p.estado === 'success');

  const deudas = deudaStore
    .getAll()
    .filter((d) => d.permisionarioId === permisionarioId && d.fecha.startsWith(hoy));

  const ef = pagos.filter((p) => p.metodoPago === 'efectivo');
  const dg = pagos.filter((p) => p.metodoPago === 'digital');

  return {
    totalTickets: tickets.length,
    pagosEfectivo: ef.length,
    pagosDigital: dg.length,
    deudas: deudas.length,
    totalEfectivo: ef.reduce((s, p) => s + p.monto, 0),
    totalDigital: dg.reduce((s, p) => s + p.monto, 0),
  };
}

export function DailySummary({ permisionarioId, className = '' }: DailySummaryProps) {
  const [summary, setSummary] = useState<Summary>(() => getSummary(permisionarioId));

  // Refresh on focus (simple polling alternative)
  useEffect(() => {
    const refresh = () => setSummary(getSummary(permisionarioId));
    window.addEventListener('focus', refresh);
    const id = setInterval(refresh, 5000);
    return () => { window.removeEventListener('focus', refresh); clearInterval(id); };
  }, [permisionarioId]);

  const total = summary.totalEfectivo + summary.totalDigital;

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <StatCard
        icon={<Banknote className="w-5 h-5 text-green-600" />}
        label="Efectivo"
        value={summary.pagosEfectivo}
        sub={`$${summary.totalEfectivo.toLocaleString('es-AR')}`}
        bg="bg-green-50"
      />
      <StatCard
        icon={<CreditCard className="w-5 h-5 text-blue-600" />}
        label="Digital"
        value={summary.pagosDigital}
        sub={`$${summary.totalDigital.toLocaleString('es-AR')}`}
        bg="bg-blue-50"
      />
      <StatCard
        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        label="Incumplimientos"
        value={summary.deudas}
        sub="generados hoy"
        bg="bg-red-50"
      />
      <StatCard
        icon={<DollarSign className="w-5 h-5 text-municipal-700" />}
        label="Total recaudado"
        value={`$${total.toLocaleString('es-AR')}`}
        sub={`${summary.totalTickets} vehículos`}
        bg="bg-municipal-50"
        bigValue
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  bg,
  bigValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  bg: string;
  bigValue?: boolean;
}) {
  return (
    <div className={`${bg} rounded-xl p-4 space-y-1`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className={`font-bold text-gray-900 ${bigValue ? 'text-xl' : 'text-2xl'}`}>{value}</p>
      <p className="text-sm text-gray-500">{sub}</p>
    </div>
  );
}
