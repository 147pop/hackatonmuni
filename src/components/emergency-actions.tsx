'use client';

import { useState } from 'react';
import { MessageSquareWarning, HelpCircle, CheckCircle } from 'lucide-react';
import { emergenciaStore } from '@/lib/sem-store';
import { getCoordsForCuadra } from '@/lib/mock-geolocation';

interface EmergencyActionsProps {
  permisionarioId: string;
  cuadra: string;
}

export function EmergencyActions({ permisionarioId, cuadra }: EmergencyActionsProps) {
  const [disputaEnviada, setDisputaEnviada] = useState(false);

  // RF-EME-01, RF-EME-06: panic button — ZERO visual/audio feedback on press
  // Looks like a neutral help icon so it doesn't attract attention
  function handlePanico() {
    emergenciaStore.create({
      tipo: 'panico',
      origenRol: 'permisionario',
      origenId: permisionarioId,
      cuadra,
      coordenadas: getCoordsForCuadra(cuadra),
    });
    // RF-EME-06: no feedback — intentionally empty
  }

  // RF-EME-04: dispute button — visible feedback
  function handleDisputa() {
    emergenciaStore.create({
      tipo: 'disputa',
      origenRol: 'permisionario',
      origenId: permisionarioId,
      cuadra,
      coordenadas: getCoordsForCuadra(cuadra),
    });
    setDisputaEnviada(true);
    setTimeout(() => setDisputaEnviada(false), 4000);
  }

  return (
    <div className="flex items-center gap-3">
      {/* RF-EME-06: silent panic — neutral appearance, zero visual feedback on press */}
      <button
        onClick={handlePanico}
        aria-label="Ayuda"
        className="p-2 text-gray-400 hover:text-gray-500 rounded-lg transition-colors"
        title="[SIMULACIÓN] Alerta silenciosa"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* RF-EME-04: dispute — visible button and feedback */}
      <button
        onClick={handleDisputa}
        className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold text-base rounded-xl border border-orange-300 transition-colors"
      >
        {disputaEnviada ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Alerta enviada
          </>
        ) : (
          <>
            <MessageSquareWarning className="w-4 h-4" />
            Disputar
          </>
        )}
      </button>
    </div>
  );
}
