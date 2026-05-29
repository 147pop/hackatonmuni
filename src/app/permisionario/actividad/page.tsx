'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Banknote, AlertTriangle, Clock, Search } from 'lucide-react';
import { PlateInput } from '@/components/plate-input';
import { permisionarioStore, roleStore, ticketStore, deudaStore } from '@/lib/sem-store';
import type { Permisionario, Ticket, Deuda } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

type Tab = 'hoy' | 'patente';

export default function ActividadPage() {
  const [perm, setPerm] = useState<Permisionario | null>(null);
  const [tab, setTab] = useState<Tab>('hoy');

  // Tab: hoy
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);

  // Tab: patente
  const [dominioBusqueda, setDominioBusqueda] = useState('');
  const [dominioValido, setDominioValido] = useState(false);
  const [historialDominio, setHistorialDominio] = useState<Array<{ tipo: 'ticket' | 'deuda'; fecha: string; item: Ticket | Deuda }> | null>(null);
  const [buscado, setBuscado] = useState('');

  useEffect(() => {
    const id = roleStore.getActivePermisionarioId();
    if (!id) return;
    const p = permisionarioStore.getById(id);
    if (!p) return;
    setPerm(p);

    const hoy = new Date().toISOString().split('T')[0];
    setTickets(ticketStore.getAll().filter((t) => t.permisionarioId === id && t.inicio.startsWith(hoy)));
    setDeudas(deudaStore.getAll().filter((d) => d.permisionarioId === id && d.fecha.startsWith(hoy)));
  }, []);

  function handleBuscarPatente() {
    if (!dominioValido || !perm) return;
    const domUpper = dominioBusqueda.toUpperCase();
    const tks = ticketStore.getByDominio(domUpper).filter((t) => t.permisionarioId === perm.id);
    const dds = deudaStore.getByDominio(domUpper).filter((d) => d.permisionarioId === perm.id);

    const entries = [
      ...tks.map((t) => ({ tipo: 'ticket' as const, fecha: t.inicio, item: t })),
      ...dds.map((d) => ({ tipo: 'deuda' as const, fecha: d.fecha, item: d })),
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    setHistorialDominio(entries);
    setBuscado(domUpper);
  }

  if (!perm) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-base text-gray-500">Primero seleccioná tu usuario.</p>
        <Link href={ROUTES.permisionario.root} className="btn-xl inline-block bg-municipal-600 text-white rounded-xl px-6">Volver</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.permisionario.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actividad</h1>
          <p className="text-base text-gray-500">{perm.cuadraAsignada}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-xl p-1">
        {(['hoy', 'patente'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'hoy' ? 'Actividad de hoy' : 'Buscar por patente'}
          </button>
        ))}
      </div>

      {tab === 'hoy' && <HoyTab tickets={tickets} deudas={deudas} />}
      {tab === 'patente' && (
        <PatenteTab
          dominio={dominioBusqueda}
          setDominio={setDominioBusqueda}
          dominioValido={dominioValido}
          setDominioValido={setDominioValido}
          onBuscar={handleBuscarPatente}
          historial={historialDominio}
          buscado={buscado}
        />
      )}
    </div>
  );
}

// ── Tab: Hoy ────────────────────────────────────────────────────────────────

function HoyTab({ tickets, deudas }: { tickets: Ticket[]; deudas: Deuda[] }) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Pagos registrados ({tickets.length})
        </h2>
        {tickets.length === 0
          ? <EmptyState icon={<CreditCard className="w-8 h-8 text-gray-300" />} message="Todavía no registraste pagos hoy." />
          : tickets.map((t) => <TicketRow key={t.id} ticket={t} />)}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" /> Incumplimientos y horas extra ({deudas.length})
        </h2>
        {deudas.length === 0
          ? <EmptyState icon={<AlertTriangle className="w-8 h-8 text-gray-300" />} message="Sin incumplimientos registrados hoy." />
          : deudas.map((d) => <DeudaRow key={d.id} deuda={d} />)}
      </section>
    </div>
  );
}

// ── Tab: Patente ─────────────────────────────────────────────────────────────

interface PatenteTabProps {
  dominio: string;
  setDominio: (v: string) => void;
  dominioValido: boolean;
  setDominioValido: (v: boolean) => void;
  onBuscar: () => void;
  historial: Array<{ tipo: 'ticket' | 'deuda'; fecha: string; item: Ticket | Deuda }> | null;
  buscado: string;
}

function PatenteTab({ dominio, setDominio, dominioValido, setDominioValido, onBuscar, historial, buscado }: PatenteTabProps) {
  return (
    <div className="space-y-4">
      <PlateInput value={dominio} onChange={setDominio} onValidChange={setDominioValido} />
      <button onClick={onBuscar} disabled={!dominioValido}
        className="btn-xl bg-municipal-600 hover:bg-municipal-700 disabled:bg-gray-300 text-white w-full flex items-center justify-center gap-2">
        <Search className="w-4 h-4" /> Buscar historial
      </button>

      {historial !== null && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500">
            Historial de <span className="font-mono text-gray-900">{buscado}</span> ({historial.length} registros)
          </p>
          {historial.length === 0
            ? <EmptyState icon={<Search className="w-8 h-8 text-gray-300" />} message={`Sin registros para ${buscado} en tu cuadra.`} />
            : historial.map((entry, i) => (
              <div key={i}>
                {entry.tipo === 'ticket'
                  ? <TicketRow ticket={entry.item as Ticket} showDate />
                  : <DeudaRow deuda={entry.item as Deuda} showDate />}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Row components ───────────────────────────────────────────────────────────

function TicketRow({ ticket: t, showDate }: { ticket: Ticket; showDate?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-base font-bold font-mono text-gray-900">{t.dominio}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {showDate
            ? new Date(t.inicio).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' '
            : ''}
          {new Date(t.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          {' · '}{t.duracionMinutos} min
        </p>
        <p className="text-xs text-gray-400">{t.numero}</p>
      </div>
      <div className="text-right space-y-1">
        <p className="text-base font-bold text-gray-900">${t.monto.toLocaleString('es-AR')}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.metodoPago === 'digital' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
          {t.metodoPago === 'digital' ? <CreditCard className="inline w-3 h-3 mr-1" /> : <Banknote className="inline w-3 h-3 mr-1" />}
          {t.metodoPago === 'digital' ? 'Digital' : 'Efectivo'}
        </span>
      </div>
    </div>
  );
}

function DeudaRow({ deuda: d, showDate }: { deuda: Deuda; showDate?: boolean }) {
  const esHoraExtra = d.tipo === 'hora_extra';
  return (
    <div className={`border rounded-xl p-4 flex items-center justify-between ${esHoraExtra ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold font-mono text-gray-900">{d.dominio}</p>
          {esHoraExtra && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Hora extra</span>}
        </div>
        <p className="text-sm text-gray-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {showDate
            ? new Date(d.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' '
            : ''}
          {new Date(d.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {d.minutosExcedidos !== undefined && (
          <p className="text-xs text-amber-700">Excedió {d.minutosExcedidos} min</p>
        )}
      </div>
      <div className="text-right">
        <p className={`text-base font-bold ${esHoraExtra ? 'text-amber-700' : 'text-red-700'}`}>${d.monto.toLocaleString('es-AR')}</p>
        <p className={`text-xs capitalize ${d.estado === 'pagada' ? 'text-green-600' : 'text-red-500'}`}>{d.estado}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center bg-gray-50 rounded-xl">
      {icon}
      <p className="text-base text-gray-400">{message}</p>
    </div>
  );
}
