'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';

interface ChartData {
  time: string;
  estacionamientos: number;
  recaudacion: number;
  infracciones: number;
}

export function StatsChart() {
  const [filter, setFilter] = useState('Hoy');
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const pagos = await db.pagos.getAll();
        const estacionamientos = await db.estacionamientos.getAll();
        const deudas = await db.deudas.getAll();
        const successPagos = pagos.filter(p => p.estado === 'success');

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        const hours: ChartData[] = [];
        for (let h = 7; h <= 21; h++) {
          const hourStr = h.toString().padStart(2, '0') + ':00';
          const nextHourStr = (h + 1).toString().padStart(2, '0') + ':00';

          const pagosEnHora = successPagos.filter(p => {
            const d = new Date(p.createdAt);
            return d.toISOString().split('T')[0] === todayStr &&
              d.toISOString().slice(11, 16) >= hourStr &&
              d.toISOString().slice(11, 16) < nextHourStr;
          });

          const estEnHora = estacionamientos.filter(e => {
            const d = new Date(e.inicio);
            return d.toISOString().split('T')[0] === todayStr &&
              d.toISOString().slice(11, 16) >= hourStr &&
              d.toISOString().slice(11, 16) < nextHourStr;
          });

          const deudasEnHora = deudas.filter(d => {
            const dd = new Date(d.fecha);
            return dd.toISOString().split('T')[0] === todayStr &&
              dd.toISOString().slice(11, 16) >= hourStr &&
              dd.toISOString().slice(11, 16) < nextHourStr;
          });

          hours.push({
            time: hourStr,
            estacionamientos: estEnHora.length,
            recaudacion: pagosEnHora.reduce((s, p) => s + p.monto, 0),
            infracciones: deudasEnHora.length,
          });
        }

        setData(hours);
      } catch (err) {
        console.error('Error loading chart data:', err);
        setData([]);
      }
    }
    loadData();
  }, [filter]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-gray-900">Estadísticas Generales</h3>
          <p className="text-sm text-gray-500">Evolución operativa y financiera</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['Hoy'].map(f => (
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
        {data.length > 0 ? (
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
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Cargando datos...
          </div>
        )}
      </div>
    </div>
  );
}