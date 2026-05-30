'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';

const DURACIONES_HORA = [
  { label: '1 hora', minutos: 60 },
  { label: '2 horas', minutos: 120 },
];

const DURACIONES_FRACCION = [
  { label: '2h 15', minutos: 135 },
  { label: '2h 30', minutos: 150 },
  { label: '2h 45', minutos: 165 },
  { label: '3 horas', minutos: 180 },
];

const MINUTOS_OPTIONS = [0, 15, 30, 45];

const ALL_PRESETS = [...DURACIONES_HORA, ...DURACIONES_FRACCION];

export function formatDuration(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return h === 1 ? '1 hora' : `${h} horas`;
  return `${h}h ${m}min`;
}

const btnBase = 'font-medium rounded-xl border-2 transition-all';

const btnOff = 'bg-white border-gray-300 text-gray-700 hover:border-municipal-400';

const btnOn = 'bg-municipal-600 border-municipal-600 text-white';

interface DurationSelectorProps {
  value: number;
  onChange: (minutos: number) => void;
  className?: string;
}

export function DurationSelector({ value, onChange, className }: DurationSelectorProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);

  const isPreset = !customMode && ALL_PRESETS.some((d) => d.minutos === value);

  function selectPreset(minutos: number) {
    setCustomMode(false);
    onChange(minutos);
  }

  function enableCustom() {
    if (customMode) return;
    const h = Math.max(1, Math.floor(value / 60));
    const raw = value % 60;
    const m = MINUTOS_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev
    );
    setCustomHours(h);
    setCustomMinutes(m >= 60 ? 0 : m);
    setCustomMode(true);
    const total = h * 60 + (m >= 60 ? 0 : m);
    if (total >= 60) onChange(total);
  }

  function handleHoursChange(delta: number) {
    const newH = Math.max(1, Math.min(24, customHours + delta));
    setCustomHours(newH);
    const total = newH * 60 + customMinutes;
    if (total >= 60) onChange(total);
  }

  function handleMinutesChange(m: number) {
    setCustomMinutes(m);
    const total = customHours * 60 + m;
    if (total >= 60) onChange(total);
  }

  return (
    <div className={className}>
      <label className="block text-base font-semibold text-gray-700 flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4" /> Duración
      </label>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Hora completa</p>
          <div className="grid grid-cols-3 gap-2">
            {DURACIONES_HORA.map((d) => (
              <button
                key={d.minutos}
                type="button"
                onClick={() => selectPreset(d.minutos)}
                className={`py-3 px-2 text-sm ${btnBase} ${
                  value === d.minutos && !customMode ? btnOn : btnOff
                }`}
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={enableCustom}
              className={`py-3 px-2 text-sm ${btnBase} ${customMode ? btnOn : btnOff}`}
            >
              Personalizado
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Fracciones (desde 2h, cada 15 min)</p>
          <div className="grid grid-cols-4 gap-2">
            {DURACIONES_FRACCION.map((d) => (
              <button
                key={d.minutos}
                type="button"
                onClick={() => selectPreset(d.minutos)}
                className={`py-2.5 px-1.5 text-xs ${btnBase} ${
                  value === d.minutos && !customMode ? btnOn : btnOff
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {customMode && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500">Horas</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleHoursChange(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 text-gray-600 hover:border-municipal-500 hover:text-municipal-600 hover:bg-white transition-colors text-lg font-bold"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center text-2xl font-bold text-gray-900 py-2 select-none">
                    {customHours}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleHoursChange(1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 text-gray-600 hover:border-municipal-500 hover:text-municipal-600 hover:bg-white transition-colors text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500">Minutos</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {MINUTOS_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinutesChange(m)}
                      className={`py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                        customMinutes === m
                          ? 'bg-municipal-600 border-municipal-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-municipal-400'
                      }`}
                    >
                      {m === 0 ? '0' : `${m}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500">
              Total: <span className="font-semibold text-gray-900">{formatDuration(customHours * 60 + customMinutes)}</span>
              {customHours * 60 + customMinutes < 60 && (
                <span className="text-red-500 ml-1">(mínimo 1 hora)</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}