'use client';

import { ticketStore, pagoStore, deudaStore } from '@/lib/sem-store';

function pct(n: number, d: number) {
  if (d === 0) return '—';
  return `${Math.round((n / d) * 100)}%`;
}

function fmt(n: number) { return `$${n.toLocaleString('es-AR')}`; }

export function PerformanceIndicators() {
  const pagos    = pagoStore.getAll().filter((p) => p.estado === 'success');
  const tickets  = ticketStore.getAll();
  const deudas   = deudaStore.getAll();

  const digital   = pagos.filter((p) => p.metodoPago === 'digital').length;
  const efectivo  = pagos.filter((p) => p.metodoPago === 'efectivo').length;
  const total     = pagos.length;

  const incumplimientos = deudas.filter((d) => !d.tipo || d.tipo === 'incumplimiento').length;
  const horasExtra      = deudas.filter((d) => d.tipo === 'hora_extra').length;
  const tasaInc         = pct(incumplimientos, tickets.length);

  const avgMonto = total > 0
    ? Math.round(pagos.reduce((s, p) => s + p.monto, 0) / total)
    : 0;

  const overstayConDatos = deudas.filter((d) => d.tipo === 'hora_extra' && d.minutosExcedidos !== undefined);
  const avgOverstay = overstayConDatos.length > 0
    ? Math.round(overstayConDatos.reduce((s, d) => s + (d.minutosExcedidos ?? 0), 0) / overstayConDatos.length)
    : 0;

  const rows: { label: string; value: string; hint: string }[] = [
    { label: 'Pagos digitales',       value: pct(digital, total),    hint: `${digital} de ${total} pagos` },
    { label: 'Pagos efectivo',        value: pct(efectivo, total),   hint: `${efectivo} de ${total} pagos` },
    { label: 'Tasa incumplimiento',   value: tasaInc,                hint: `${incumplimientos} deudas de ${tickets.length} tickets` },
    { label: 'Horas extra cobradas',  value: String(horasExtra),     hint: 'deudas tipo hora_extra' },
    { label: 'Ticket promedio',       value: fmt(avgMonto),          hint: 'monto promedio por pago exitoso' },
    { label: 'Excedencia promedio',   value: avgOverstay > 0 ? `${avgOverstay} min` : '—', hint: 'minutos promedio de overstay registrado' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Indicadores de rendimiento · RF-ADM-10</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p className="text-sm font-medium text-gray-700">{r.label}</p>
              <p className="text-xs text-gray-400">{r.hint}</p>
            </div>
            <p className="text-base font-bold text-gray-900">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
