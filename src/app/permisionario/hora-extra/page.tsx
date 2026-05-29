'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { PlateInput } from '@/components/plate-input';
import { permisionarioStore, roleStore, ticketStore, deudaStore, configStore } from '@/lib/sem-store';
import { calcularMontoDeuda } from '@/domain/calculations';
import type { Permisionario, Ticket, Deuda, VehicleType } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function HoraExtraPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-8 text-center text-gray-400">Cargando…</div>}>
      <HoraExtraContent />
    </Suspense>
  );
}

function HoraExtraContent() {
  const searchParams = useSearchParams();
  const dominioParam = searchParams.get('dominio') ?? '';
  const ticketIdParam = searchParams.get('ticketId') ?? '';

  const [perm, setPerm] = useState<Permisionario | null>(null);
  const [ticketOriginal, setTicketOriginal] = useState<Ticket | null>(null);
  const [dominio, setDominio] = useState(dominioParam);
  const [dominioValido, setDominioValido] = useState(!!dominioParam);
  const [vehiculoTipo, setVehiculoTipo] = useState<VehicleType>('auto');
  const [deudaCreada, setDeudaCreada] = useState<Deuda | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = roleStore.getActivePermisionarioId();
    if (id) setPerm(permisionarioStore.getById(id) ?? null);

    if (ticketIdParam) {
      const t = ticketStore.getById(ticketIdParam);
      if (t) {
        setTicketOriginal(t);
        setDominio(t.dominio);
        setDominioValido(true);
        setVehiculoTipo(t.tipo);
      }
    }
  }, [ticketIdParam]);

  if (!perm) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-base text-gray-500">Primero seleccioná tu usuario.</p>
        <Link href={ROUTES.permisionario.root} className="btn-xl inline-block bg-municipal-600 text-white rounded-xl px-6">Volver</Link>
      </div>
    );
  }

  if (deudaCreada) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.permisionario.root} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Hora extra registrada</h1>
        </div>
        <div className="text-center py-6 space-y-4">
          <CheckCircle className="w-16 h-16 text-amber-500 mx-auto" />
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2 text-sm">
            <Row label="Dominio" value={deudaCreada.dominio} />
            <Row label="Cuadra" value={deudaCreada.cuadra} />
            <Row label="Monto deuda" value={`$${deudaCreada.monto.toLocaleString('es-AR')}`} />
            {deudaCreada.minutosExcedidos !== undefined && (
              <Row label="Tiempo excedido" value={`${deudaCreada.minutosExcedidos} min`} />
            )}
            <Row label="Estado" value="Pendiente de pago" />
          </div>
          <p className="text-sm text-gray-500">El conductor puede pagar en sem-digital.gob.ar</p>
          <button
            onClick={() => { setDeudaCreada(null); setDominio(dominioParam); setDominioValido(!!dominioParam); }}
            className="btn-xl bg-amber-500 hover:bg-amber-600 text-white w-full"
          >
            Registrar otra hora extra
          </button>
        </div>
      </div>
    );
  }

  const tarifa = configStore.getTarifa();
  const monto = calcularMontoDeuda(vehiculoTipo, tarifa);

  function calcularMinutosExcedidos(): number | undefined {
    const t = ticketOriginal ?? (dominioValido ? ticketStore.getAll().find(
      (tk) => tk.dominio.toUpperCase() === dominio.toUpperCase() && tk.cuadra === perm!.cuadraAsignada && !tk.activo === false
    ) : undefined);
    if (!t) return undefined;
    const diff = Date.now() - new Date(t.vencimiento).getTime();
    return Math.max(0, Math.floor(diff / 60000));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!dominioValido) { setError('Ingresá un dominio válido.'); return; }

    setSubmitting(true);
    try {
      const minExcedidos = calcularMinutosExcedidos();
      const deuda = deudaStore.create({
        dominio: dominio.toUpperCase(),
        cuadra: perm!.cuadraAsignada,
        permisionarioId: perm!.id,
        monto,
        fecha: new Date().toISOString(),
        estado: 'pendiente',
        tipo: 'hora_extra',
        ticketOriginalId: ticketOriginal?.id,
        vencimientoOriginal: ticketOriginal?.vencimiento,
        minutosExcedidos: minExcedidos,
      });
      setDeudaCreada(deuda);
    } finally {
      setSubmitting(false);
    }
  }

  const minExcedidos = calcularMinutosExcedidos();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.permisionario.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobrar hora extra</h1>
          <p className="text-base text-gray-500">{perm.cuadraAsignada}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>RF-EST-OVERSTAY:</strong> El vehículo ya abonó su turno pero continúa estacionado. Registrá la hora adicional como deuda cobrable por web.
      </div>

      {ticketOriginal && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold text-gray-700">Ticket original vinculado</p>
          <Row label="Número" value={ticketOriginal.numero} />
          <Row label="Pagó" value={`${ticketOriginal.duracionMinutos}min ($${ticketOriginal.monto.toLocaleString('es-AR')})`} />
          <Row label="Venció" value={new Date(ticketOriginal.vencimiento).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} />
          {minExcedidos !== undefined && (
            <Row label="Excedido" value={`${minExcedidos} min`} />
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <PlateInput
          value={dominio}
          onChange={(v) => { setDominio(v); if (ticketOriginal?.dominio !== v) setTicketOriginal(null); }}
          onValidChange={setDominioValido}
          disabled={!!ticketOriginal}
        />

        {!ticketOriginal && (
          <div className="space-y-2">
            <label className="block text-base font-semibold text-gray-700">Tipo de vehículo</label>
            <div className="grid grid-cols-2 gap-3">
              {(['auto', 'moto'] as VehicleType[]).map((t) => (
                <button key={t} type="button" onClick={() => setVehiculoTipo(t)}
                  className={`btn-xl border-2 transition-all ${vehiculoTipo === t ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-300 text-gray-700'}`}>
                  {t === 'auto' ? 'Auto' : 'Moto'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
          <div>
            <span className="text-base text-gray-600">Monto deuda</span>
            <p className="text-xs text-gray-400">1 hora tarifa plena sin descuento</p>
          </div>
          <span className="text-2xl font-bold text-amber-700">${monto.toLocaleString('es-AR')}</span>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

        <button type="submit" disabled={submitting || !dominioValido}
          className="btn-xl bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white w-full flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {submitting ? 'Registrando…' : 'Registrar hora extra'}
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
