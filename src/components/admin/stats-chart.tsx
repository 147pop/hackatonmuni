'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const data = [
  { time: '08:00', estacionamientos: 1200, recaudacion: 150000, infracciones: 12 },
  { time: '10:00', estacionamientos: 4500, recaudacion: 650000, infracciones: 45 },
  { time: '12:00', estacionamientos: 8900, recaudacion: 1250000, infracciones: 80 },
  { time: '14:00', estacionamientos: 6500, recaudacion: 850000, infracciones: 55 },
  { time: '16:00', estacionamientos: 7800, recaudacion: 1100000, infracciones: 65 },
  { time: '18:00', estacionamientos: 9200, recaudacion: 1450000, infracciones: 90 },
  { time: '20:00', estacionamientos: 3400, recaudacion: 450000, infracciones: 20 },
];

export function StatsChart() {
  const [filter, setFilter] = useState('Hoy');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-gray-900">Estadísticas Generales</h3>
          <p className="text-sm text-gray-500">Evolución operativa y financiera</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['Hoy', 'Semana', 'Mes', 'Año'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRecaudacion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2859AA" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2859AA" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} tickFormatter={(val) => `$${val/1000}k`} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={10} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
            />
            <Area yAxisId="left" type="monotone" dataKey="recaudacion" stroke="#2859AA" strokeWidth={3} fillOpacity={1} fill="url(#colorRecaudacion)" name="Recaudación ($)" />
            <Area yAxisId="right" type="monotone" dataKey="estacionamientos" stroke="#10B981" strokeWidth={2} fill="none" name="Estacionamientos" />
            <Area yAxisId="right" type="monotone" dataKey="infracciones" stroke="#EF4444" strokeWidth={2} fill="none" name="Infracciones" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
