import type { ReactNode } from 'react';

export interface Metric {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'green' | 'blue' | 'red' | 'amber' | 'default';
  icon?: ReactNode;
}

const COLOR: Record<NonNullable<Metric['color']>, string> = {
  green:   'bg-green-50   border-green-200  text-green-800',
  blue:    'bg-blue-50    border-blue-200   text-blue-800',
  red:     'bg-red-50     border-red-200    text-red-800',
  amber:   'bg-amber-50   border-amber-200  text-amber-800',
  default: 'bg-gray-50    border-gray-200   text-gray-800',
};

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className={`grid gap-3 ${metrics.length <= 2 ? 'grid-cols-2' : metrics.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {metrics.map((m, i) => {
        const cls = COLOR[m.color ?? 'default'];
        return (
          <div key={i} className={`rounded-xl border-2 p-4 ${cls}`}>
            {m.icon && <div className="mb-1 opacity-70">{m.icon}</div>}
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-70">{m.label}</p>
            {m.sub && <p className="text-xs opacity-50 mt-0.5">{m.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}
