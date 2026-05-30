'use client';

import { useState, useRef } from 'react';
import { ScanLine, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { validarDominio, normalizarDominio } from '@/domain/validators';
import { scanPlate, type PlateScanResult } from '@/lib/plate-recognizer';
import { CameraCapture } from '@/components/camera-capture';

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
  const [showCamera, setShowCamera] = useState(false);
  const [scanSource, setScanSource] = useState<'plate-recognizer' | 'tesseract' | null>(null);
  const [scanConfidence, setScanConfidence] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validation = value.trim() ? validarDominio(value) : null;

  function handleChange(raw: string) {
    const n = normalizarDominio(raw);
    onChange(n);
    onValidChange?.(validarDominio(n).valido);
    setScanSource(null);
    setScanConfidence(null);
  }

  async function handleCapture(file: File) {
    setShowCamera(false);
    setScanning(true);
    setOcrStatus('Escaneando patente...');
    setScanSource(null);
    setScanConfidence(null);

    try {
      const result: PlateScanResult = await scanPlate(file, (progress, statusMsg) => {
        setOcrStatus(`${statusMsg}${progress > 0 && progress < 100 ? ` ${progress}%` : ''}`);
      });

      const normalized = normalizarDominio(result.plate);
      onChange(normalized);
      onValidChange?.(validarDominio(normalized).valido);
      setScanSource(result.source);
      setScanConfidence(result.confidence);
    } catch (err) {
      console.error(err);
      setOcrStatus('No se pudo leer la patente');
      setTimeout(() => setOcrStatus(''), 4000);
    } finally {
      setScanning(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setOcrStatus('Escaneando patente...');
    setScanSource(null);
    setScanConfidence(null);

    (async () => {
      try {
        const result: PlateScanResult = await scanPlate(file, (progress, statusMsg) => {
          setOcrStatus(`${statusMsg}${progress > 0 && progress < 100 ? ` ${progress}%` : ''}`);
        });

        const normalized = normalizarDominio(result.plate);
        onChange(normalized);
        onValidChange?.(validarDominio(normalized).valido);
        setScanSource(result.source);
        setScanConfidence(result.confidence);
      } catch (err) {
        console.error(err);
        setOcrStatus('No se pudo leer la patente');
        setTimeout(() => setOcrStatus(''), 4000);
      } finally {
        setScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    })();
  }

  function handleCameraFallback() {
    setShowCamera(false);
    fileInputRef.current?.click();
  }

  const confidenceLabel = scanConfidence !== null
    ? scanConfidence >= 0.8 ? 'Alta' : scanConfidence >= 0.5 ? 'Media' : 'Baja'
    : null;

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
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              disabled={disabled || scanning}
              title="Reconocimiento automático de patente (OCR)"
              className="flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 rounded-xl text-blue-700 font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {scanning
                ? <ScanLine className="w-5 h-5 animate-pulse" />
                : <Camera className="w-5 h-5" />
              }
              <span className="hidden sm:inline">{scanning ? 'Escaneando' : 'OCR'}</span>
            </button>
          </>
        )}
      </div>

      {scanning && (
        <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl flex items-center gap-2">
          <ScanLine className="w-4 h-4 animate-pulse" />
          {ocrStatus}
        </p>
      )}

      {scanSource && !scanning && (
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
            scanSource === 'plate-recognizer'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {scanSource}
          </span>
          {confidenceLabel && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
              scanConfidence! >= 0.8 ? 'bg-green-100 text-green-700'
              : scanConfidence! >= 0.5 ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
            }`}>
              Confianza: {confidenceLabel} ({Math.round(scanConfidence! * 100)}%)
            </span>
          )}
          {scanConfidence !== null && scanConfidence < 0.5 && (
            <span className="text-amber-600">Verificá que la patente sea correcta</span>
          )}
        </div>
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

      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
          onFallback={handleCameraFallback}
        />
      )}
    </div>
  );
}