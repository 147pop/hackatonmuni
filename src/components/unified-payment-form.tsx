'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Car, Bike, CheckCircle, QrCode, Loader2, Banknote, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PlateInput } from './plate-input';
import { validarDuracion } from '@/domain/validators';
import { calcularMonto, calcularVencimiento } from '@/domain/calculations';
import { esHorarioPermitido } from '@/domain/rules';
import { configStore, ticketStore, pagoStore, estacionamientoStore } from '@/lib/sem-store';
import type { VehicleType, Ticket } from '@/domain/types';

const DURACIONES = [
  { label: '30 min', minutos: 30 },
  { label: '1 hora', minutos: 60 },
  { label: '1h 30min', minutos: 90 },
  { label: '2 horas', minutos: 120 },
  { label: '2h 30min', minutos: 150 },
  { label: '3 horas', minutos: 180 },
];

interface UnifiedPaymentFormProps {
  permisionarioId: string;
  cuadra: string;
  zonaId: string;
  initialDominio?: string;
  initialMethod?: 'efectivo' | 'qr';
  onSuccess?: (ticket: Ticket) => void;
}

export function UnifiedPaymentForm({ permisionarioId, cuadra, zonaId, initialDominio, initialMethod = 'efectivo', onSuccess }: UnifiedPaymentFormProps) {
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'qr'>(initialMethod);
  const [dominio, setDominio] = useState(initialDominio ?? '');
  const [dominioValido, setDominioValido] = useState(!!initialDominio);
  const [tipo, setTipo] = useState<VehicleType>('auto');
  const [duracion, setDuracion] = useState(60);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketCreado, setTicketCreado] = useState<Ticket | null>(null);

  // MP State
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string>('');
  const [externalRef, setExternalRef] = useState<string | null>(null);

  const tarifa = configStore.getTarifa();
  const monto = calcularMonto({ tipo, duracionMinutos: duracion, metodoPago: metodoPago === 'qr' ? 'digital' : 'efectivo', tarifa });

  // 1. Crear preferencia cuando los datos sean válidos, cambien, y el método sea QR
  useEffect(() => {
    let active = true;
    
    if (metodoPago !== 'qr') {
      setQrUrl('');
      setQrError('');
      setExternalRef(null);
      return;
    }

    if (!dominioValido || monto <= 0) {
      setQrUrl('');
      setQrError('');
      setExternalRef(null);
      return;
    }

    const durErr = validarDuracion(duracion);
    if (!durErr.valido) return;

    async function crearPreferencia() {
      setLoadingQr(true);
      setQrError('');
      try {
        const res = await fetch('/api/pagos/crear-preferencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monto,
            dominio,
            cuadra,
            duracion,
            permisionarioId,
            vehiculoTipo: tipo,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (active) setQrError(data.detail?.message || data.error || 'Error generando QR');
          return;
        }

        if (active) {
          setQrUrl(data.init_point);
          setExternalRef(data.externalReference);
        }
      } catch (err) {
        if (active) setQrError('Error de red al generar QR');
        console.error(err);
      } finally {
        if (active) setLoadingQr(false);
      }
    }

    crearPreferencia();

    return () => { active = false; };
  }, [metodoPago, monto, dominio, dominioValido, cuadra, duracion, permisionarioId, tipo]);

  const registrarTicketExitoso = useCallback(() => {
    setSubmitting(true);
    try {
      const ahora = new Date();
      const inicio = ahora.toISOString();
      const vencimiento = calcularVencimiento(inicio, duracion);

      const ticket = ticketStore.create({
        dominio,
        tipo,
        cuadra,
        permisionarioId,
        inicio,
        duracionMinutos: duracion,
        vencimiento,
        monto,
        metodoPago: metodoPago === 'qr' ? 'digital' : 'efectivo',
        descuentoAplicado: false,
        activo: true,
      });

      pagoStore.create({
        ticketId: ticket.id,
        dominio,
        monto,
        metodoPago: metodoPago === 'qr' ? 'digital' : 'efectivo',
        estado: 'success',
        permisionarioId,
        cuadra,
      });

      estacionamientoStore.create({
        dominio,
        tipo,
        zonaId,
        cuadra,
        permisionarioId,
        inicio,
        duracionMinutos: duracion,
        metodoPago: metodoPago === 'qr' ? 'digital' : 'efectivo',
        activo: true,
        transferido: false,
      });

      setTicketCreado(ticket);
      onSuccess?.(ticket);
    } finally {
      setSubmitting(false);
    }
  }, [dominio, tipo, cuadra, permisionarioId, zonaId, duracion, monto, metodoPago, onSuccess]);

  // 2. Polling del estado del pago (solo para QR)
  useEffect(() => {
    let active = true;

    if (metodoPago !== 'qr' || !externalRef) return;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/pagos/estado-referencia?ref=${encodeURIComponent(externalRef!)}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (active && data.status === 'approved') {
          registrarTicketExitoso();
          setExternalRef(null);
        }
      } catch (err) {
        console.error('[Polling] Error:', err);
      }
    }

    const intervalId = setInterval(checkStatus, 5000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [externalRef, metodoPago, registrarTicketExitoso]);

  function handleEfectivoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (metodoPago !== 'efectivo') return;

    if (!dominioValido) {
      setError('Ingresá un dominio válido.');
      return;
    }

    const durErr = validarDuracion(duracion);
    if (!durErr.valido) { setError(durErr.error!); return; }

    const horarioCheck = esHorarioPermitido({
      timestamp: new Date(),
      zonaId,
      zonas: configStore.getZonas(),
      feriados: configStore.getFeriados(),
      config: configStore.getConfig(),
    });
    if (!horarioCheck.permitido) {
      setError(`No se puede registrar fuera de horario: ${horarioCheck.razon}`);
      return;
    }

    registrarTicketExitoso();
  }

  if (ticketCreado) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <div>
          <p className="text-2xl font-bold text-gray-900">Ticket generado</p>
          <p className="text-3xl font-bold font-mono text-municipal-700 mt-1">{ticketCreado.numero}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-base">
          <Row label="Dominio" value={ticketCreado.dominio} />
          <Row label="Vehículo" value={ticketCreado.tipo === 'auto' ? 'Auto' : 'Moto'} />
          <Row label="Duración" value={`${ticketCreado.duracionMinutos} min`} />
          <Row label="Método de pago" value={ticketCreado.metodoPago === 'efectivo' ? 'Efectivo' : 'QR / Digital'} />
          <Row label="Monto cobrado" value={`$${ticketCreado.monto.toLocaleString('es-AR')}`} highlight />
          <Row label="Cuadra" value={ticketCreado.cuadra} />
        </div>
        <button
          onClick={() => { setTicketCreado(null); setDominio(''); setDominioValido(false); }}
          className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white w-full mt-2"
        >
          Registrar otro pago
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Método de Pago */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setMetodoPago('efectivo')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            metodoPago === 'efectivo'
              ? 'border-municipal-600 bg-municipal-50 text-municipal-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-municipal-300'
          }`}
        >
          <Banknote className="w-6 h-6 mb-2" />
          <span className="font-semibold">Efectivo</span>
        </button>
        <button
          type="button"
          onClick={() => setMetodoPago('qr')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            metodoPago === 'qr'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-300'
          }`}
        >
          <Smartphone className="w-6 h-6 mb-2" />
          <span className="font-semibold">QR / MercadoPago</span>
        </button>
      </div>

      <form onSubmit={metodoPago === 'efectivo' ? handleEfectivoSubmit : (e) => e.preventDefault()} className="space-y-6">
        <PlateInput
          value={dominio}
          onChange={setDominio}
          onValidChange={setDominioValido}
          disabled={submitting}
        />

        {/* Vehicle type */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-gray-700">Tipo de vehículo</label>
          <div className="grid grid-cols-2 gap-3">
            {(['auto', 'moto'] as VehicleType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`btn-xl flex items-center justify-center gap-3 border-2 transition-all ${
                  tipo === t
                    ? 'bg-municipal-600 border-municipal-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-municipal-400'
                }`}
              >
                {t === 'auto' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                {t === 'auto' ? 'Auto' : 'Moto'}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Duración
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DURACIONES.map((d) => (
              <button
                key={d.minutos}
                type="button"
                onClick={() => setDuracion(d.minutos)}
                className={`py-3 px-2 text-base font-medium rounded-xl border-2 transition-all ${
                  duracion === d.minutos
                    ? 'bg-municipal-600 border-municipal-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-municipal-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* QR Code Section (Only if method is QR) */}
        {metodoPago === 'qr' && (
          <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-sm mt-6">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-2">
              <QrCode className="w-6 h-6" />
              <span>Escaneá con MercadoPago</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center" style={{ minHeight: 200, minWidth: 200 }}>
              {loadingQr || !dominioValido || qrError ? (
                <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                  {!dominioValido ? (
                    <p className="text-sm">Ingresá la patente</p>
                  ) : qrError ? (
                    <p className="text-sm text-red-500 text-center px-2">{qrError}</p>
                  ) : (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      <p className="text-sm">Generando QR...</p>
                    </>
                  )}
                </div>
              ) : qrUrl ? (
                <QRCodeSVG value={qrUrl} size={200} />
              ) : null}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Monto a cobrar</p>
              <p className="text-3xl font-bold text-gray-900">${monto.toLocaleString('es-AR')}</p>
            </div>
            <button
              type="button"
              disabled={true}
              className="btn-xl bg-indigo-50 border border-indigo-200 text-indigo-400 w-full transition-colors flex items-center justify-center gap-2 cursor-not-allowed mt-4"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Esperando confirmación de pago...
            </button>
          </div>
        )}

        {/* Efectivo Section */}
        {metodoPago === 'efectivo' && (
          <div className="mt-6">
            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center mb-6">
              <span className="text-base text-gray-600">Monto a cobrar (efectivo)</span>
              <span className="text-2xl font-bold text-gray-900">${monto.toLocaleString('es-AR')}</span>
            </div>
            <button
              type="submit"
              disabled={submitting || !dominioValido}
              className="btn-xl bg-municipal-600 hover:bg-municipal-700 disabled:bg-gray-300 text-white w-full transition-colors"
            >
              {submitting ? 'Registrando…' : 'Registrar pago efectivo'}
            </button>
          </div>
        )}
        
        {error && (
          <p className="text-base text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
        )}
      </form>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-municipal-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
