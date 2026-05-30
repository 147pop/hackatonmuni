'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Car, DollarSign, XCircle, UserCheck, UserMinus } from 'lucide-react';

type Activity = {
  id: string;
  type: 'pago' | 'infraccion' | 'estacionamiento' | 'rechazo' | 'conexion' | 'desconexion';
  title: string;
  details: string;
  time: string;
};

const INITIAL_ACTIVITIES: Activity[] = [
  { id: '1', type: 'pago', title: 'Pago realizado', details: 'ABC123 · Zona Centro · $60', time: 'Hace 2 min' },
  { id: '2', type: 'infraccion', title: 'Infracción registrada', details: 'XYZ987 · Sin ticket · $15.000', time: 'Hace 5 min' },
  { id: '3', type: 'estacionamiento', title: 'Nuevo estacionamiento', details: 'DEF456 · Zona Macrocentro', time: 'Hace 12 min' },
  { id: '4', type: 'conexion', title: 'Permisionario conectado', details: 'Juan Pérez · Sector B', time: 'Hace 15 min' },
  { id: '5', type: 'rechazo', title: 'Pago rechazado', details: 'LMN123 · Fondos insuficientes', time: 'Hace 20 min' },
];

export function RealtimeFeed() {
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  // Simulated Realtime
  useEffect(() => {
    const interval = setInterval(() => {
      const types: Activity['type'][] = ['pago', 'estacionamiento', 'infraccion'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: randomType,
        title: randomType === 'pago' ? 'Pago realizado' : randomType === 'estacionamiento' ? 'Nuevo estacionamiento' : 'Infracción registrada',
        details: `AAA111 · Zona Centro · ${randomType === 'pago' ? '$120' : ''}`,
        time: 'Justo ahora'
      };

      setActivities(prev => [newActivity, ...prev].slice(0, 8));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: Activity['type']) => {
    switch(type) {
      case 'pago': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'infraccion': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'estacionamiento': return <Car className="w-5 h-5 text-blue-500" />;
      case 'rechazo': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'conexion': return <UserCheck className="w-5 h-5 text-green-600" />;
      case 'desconexion': return <UserMinus className="w-5 h-5 text-gray-500" />;
      default: return <DollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-display font-bold text-gray-900">Actividad Reciente</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-600 font-medium">En vivo</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="mt-0.5">{getIcon(activity.type)}</div>
              <div>
                <p className="font-bold text-sm text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.details}</p>
              </div>
              <div className="ml-auto text-xs font-medium text-gray-400">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
