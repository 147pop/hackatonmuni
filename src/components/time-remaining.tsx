'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import { notifyVencimientoProximo } from '@/lib/mock-notifications';

interface TimeRemainingProps {
  vencimiento: string;
  ticketId: string;
  dominio: string;
  onExpired?: () => void;
}

export function TimeRemaining({ vencimiento, ticketId, dominio, onExpired }: TimeRemainingProps) {
  const [segsRestantes, setSegsRestantes] = useState(0);
  const notifiedRef = useRef(false);

  useEffect(() => {
    function calcularSegs() {
      const diff = new Date(vencimiento).getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    }

    setSegsRestantes(calcularSegs());

    const interval = setInterval(() => {
      const segs = calcularSegs();
      setSegsRestantes(segs);

      // RF-USR-07: notify 5 min before expiry (once)
      const mins = Math.ceil(segs / 60);
      if (!notifiedRef.current && mins <= 5 && segs > 0) {
        notifiedRef.current = true;
        notifyVencimientoProximo(dominio, mins, ticketId);
      }

      if (segs === 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [vencimiento, ticketId, dominio, onExpired]);

  const minutos = Math.floor(segsRestantes / 60);
  const segundos = segsRestantes % 60;
  const expirado = segsRestantes === 0;
  const proximoVencer = minutos <= 5 && !expirado;

  if (expirado) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-semibold">
        <AlertTriangle className="w-4 h-4" />
        <span>Ticket vencido</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${proximoVencer ? 'text-amber-600' : 'text-gray-900'}`}>
      <Clock className={`w-5 h-5 ${proximoVencer ? 'text-amber-500' : 'text-gray-500'}`} />
      <span>{String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}</span>
      {proximoVencer && <span className="text-sm font-normal text-amber-600 ml-1">¡Por vencer!</span>}
    </div>
  );
}

export function tiempoRestanteMinutos(vencimiento: string): number {
  return calcularTiempoRestanteMinutos(vencimiento);
}
