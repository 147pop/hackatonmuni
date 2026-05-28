'use client';

import { useState } from 'react';
import { ScanLine, AlertCircle, CheckCircle } from 'lucide-react';
import { validarDominio, normalizarDominio } from '@/domain/validators';
import { mockOCRScanPatente } from '@/lib/mock-ocr';

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (valid: boolean) => void;
  disabled?: boolean;
  label?: string;
  showOCR?: boolean;
}

export function PlateInput({
  value,
  onChange,
  onValidChange,
  disabled,
  label = 'Dominio del vehículo',
  showOCR = true,
}: PlateInputProps) {
  const [scanning, setScanning] = useState(false);
  const validation = value.trim() ? validarDominio(value) : null;

  function handleChange(raw: string) {
    const n = normalizarDominio(raw);
    onChange(n);
    onValidChange?.(validarDominio(n).valido);
  }

  async function handleOCR() {
    setScanning(true);
    try {
      const plate = await mockOCRScanPatente();
      onChange(plate);
      onValidChange?.(true);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-base font-semibold text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled || scanning}
          placeholder="AB123CD"
          maxLength={8}
          className={`flex-1 text-xl font-mono px-4 py-3 rounded-xl border-2 uppercase tracking-widest focus:outline-none focus:ring-2 transition-colors ${
            validation?.valido
              ? 'border-green-400 focus:ring-green-200 bg-green-50'
              : validation && !validation.valido
              ? 'border-red-400 focus:ring-red-200 bg-red-50'
              : 'border-gray-300 focus:ring-municipal-200'
          }`}
        />
        {showOCR && (
          <button
            type="button"
            onClick={handleOCR}
            disabled={disabled || scanning}
            title="Reconocimiento automático de patente [SIMULACIÓN]"
            className="flex items-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-700 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <ScanLine className="w-5 h-5" />
            <span className="hidden sm:inline">{scanning ? 'Leyendo…' : 'OCR'}</span>
          </button>
        )}
      </div>

      {scanning && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          <span className="font-bold">[SIMULACIÓN]</span> Reconociendo patente con cámara…
        </p>
      )}
      {validation && !validation.valido && !scanning && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {validation.error}
        </p>
      )}
      {validation?.valido && !scanning && (
        <p className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Dominio válido
        </p>
      )}
    </div>
  );
}
