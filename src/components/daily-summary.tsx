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
        icon={<Banknote className="w-5 h-5" style={{ color: 'var(--verde)' }} />}
        label="Efectivo"
        value={summary.pagosEfectivo}
        sub={`$${summary.totalEfectivo.toLocaleString('es-AR')}`}
        accentColor="var(--verde)"
      />
      <StatCard
        icon={<CreditCard className="w-5 h-5" style={{ color: 'var(--azul-vivo)' }} />}
        label="Digital"
        value={summary.pagosDigital}
        sub={`$${summary.totalDigital.toLocaleString('es-AR')}`}
        accentColor="var(--azul-vivo)"
      />
      <StatCard
        icon={<AlertTriangle className="w-5 h-5" style={{ color: 'var(--rojo)' }} />}
        label="Incumplimientos"
        value={summary.deudas}
        sub="generados hoy"
        accentColor="var(--rojo)"
      />
      <StatCard
        icon={<DollarSign className="w-5 h-5" style={{ color: 'var(--azul-salta)' }} />}
        label="Total recaudado"
        value={`$${total.toLocaleString('es-AR')}`}
        sub={`${summary.totalTickets} vehículos`}
        accentColor="var(--azul-salta)"
        bigValue
      />
    </div>
  );
}

function StatCard({
  icon, label, value, sub, accentColor, bigValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accentColor: string;
  bigValue?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 space-y-1"
      style={{
        background: '#fff',
        border: '1px solid var(--linea)',
        boxShadow: '0 1px 4px rgba(21,50,111,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {icon}
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--gris)' }}>
          {label}
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: bigValue ? 18 : 26,
        color: accentColor,
        lineHeight: 1.1,
      }}>
        {value}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gris)' }}>{sub}</p>
    </div>
  );
}
