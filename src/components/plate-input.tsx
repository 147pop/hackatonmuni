'use client';

import { useState, useRef } from 'react';
import { ScanLine, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { validarDominio, normalizarDominio } from '@/domain/validators';
import { scanPlateFromImage } from '@/lib/ocr';

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
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const validation = value.trim() ? validarDominio(value) : null;

  function handleChange(raw: string) {
    const n = normalizarDominio(raw);
    onChange(n);
    onValidChange?.(validarDominio(n).valido);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setOcrStatus('Iniciando cámara...');
    
    try {
      const plate = await scanPlateFromImage(file, (progress, statusMsg) => {
        setOcrStatus(`${statusMsg} ${progress > 0 ? progress + '%' : ''}`);
      });
      
      const normalized = normalizarDominio(plate);
      onChange(normalized);
      onValidChange?.(validarDominio(normalized).valido);
    } catch (err) {
      console.error(err);
      setOcrStatus('Error al procesar la imagen');
      setTimeout(() => setOcrStatus(''), 3000);
    } finally {
      setScanning(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleOCRClick() {
    fileInputRef.current?.click();
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
          <>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleOCRClick}
              disabled={disabled || scanning}
              title="Reconocimiento automático de patente (OCR)"
              className="flex items-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-700 font-semibold text-sm transition-colors disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              <span className="hidden sm:inline">{scanning ? 'Escaneando' : 'OCR'}</span>
            </button>
          </>
        )}
      </div>

      {scanning && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 animate-pulse" />
            {ocrStatus}
          </span>
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
