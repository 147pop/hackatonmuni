'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, CreditCard, FileText, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { conductorStore, roleStore, ticketStore, deudaStore } from '@/lib/sem-store';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import type { Conductor, Ticket } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function ConductorPage() {
  const [conductor, setConductor] = useState<Conductor | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [deudaPendiente, setDeudaPendiente] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = roleStore.getActiveConductorId();
    if (id) {
      const c = conductorStore.getById(id);
      if (c) {
        setConductor(c);
        const ticket = ticketStore.getActivosByDominio(c.dominioDefault);
        setActiveTicket(ticket ?? null);
        const deudas = deudaStore.getByDominio(c.dominioDefault);
        setDeudaPendiente(deudas.some((d) => d.estado === 'pendiente'));
      }
    }
    setLoaded(true);
  }, []);

  function handleSelect(id: string) {
    roleStore.setActiveConductorId(id);
    const c = conductorStore.getById(id);
    if (c) {
      setConductor(c);
      const ticket = ticketStore.getActivosByDominio(c.dominioDefault);
      setActiveTicket(ticket ?? null);
      const deudas = deudaStore.getByDominio(c.dominioDefault);
      setDeudaPendiente(deudas.some((d) => d.estado === 'pendiente'));
    }
  }

  if (!loaded) return null;
  if (!conductor) return <ConductorSelector onSelect={handleSelect} />;

  const minRestantes = activeTicket ? calcularTiempoRestanteMinutos(activeTicket.vencimiento) : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--tinta)' }}>
            Hola, {conductor.nombre}
          </h1>
          <p className="text-sm font-mono mt-0.5" style={{ color: 'var(--gris)' }}>
            {conductor.dominioDefault}
          </p>
        </div>
        <button
          onClick={() => { roleStore.setActiveConductorId(null); setConductor(null); }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--azul-vivo)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Cambiar
        </button>
      </div>

      {/* Active ticket banner */}
      {activeTicket && minRestantes > 0 && (
        <Link
          href={ROUTES.conductor.ticket(activeTicket.id)}
          className="block rounded-2xl p-4 transition-all"
          style={{ background: 'linear-gradient(135deg, var(--azul-noche) 0%, var(--azul-salta) 100%)', textDecoration: 'none' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--celeste)', marginBottom: 4 }}>
                Ticket activo
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#fff' }}>
                {activeTicket.cuadra}
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 font-mono font-bold"
              style={{ background: 'rgba(127,181,255,0.15)', border: '1px solid rgba(127,181,255,0.3)', color: 'var(--celeste)', padding: '6px 12px', borderRadius: 999, fontSize: 14 }}
            >
              <Clock className="w-4 h-4" />
              {minRestantes}min
            </div>
          </div>
        </Link>
      )}

      {/* Debt alert */}
      {deudaPendiente && (
        <Link
          href={ROUTES.conductor.deudas}
          className="flex items-center gap-3 p-4 rounded-2xl transition-all"
          style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', textDecoration: 'none' }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--rojo)' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--rojo)', flex: 1 }}>
            Tenés deudas pendientes
          </p>
          <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--rojo)' }} />
        </Link>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)' }}>
          Acciones
        </p>

        <Link
          href={ROUTES.conductor.pagar}
          className="flex items-center justify-between btn-xl w-full"
          style={{ background: 'var(--azul-vivo)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 12px rgba(1,92,180,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <Car className="w-6 h-6" />
            <span>{activeTicket && minRestantes > 0 ? 'Extender / nuevo ticket' : 'Estacionar'}</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link
          href={ROUTES.conductor.historial}
          className="flex items-center justify-between btn-xl w-full"
          style={{ background: '#fff', border: '1.5px solid var(--linea)', color: 'var(--tinta)', textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" style={{ color: 'var(--azul-salta)' }} />
            <span>Historial</span>
          </div>
          <ArrowRight className="w-5 h-5" style={{ color: 'var(--gris)' }} />
        </Link>

        <Link
          href={ROUTES.conductor.deudas}
          className="flex items-center justify-between btn-xl w-full"
          style={{ background: '#fff', border: '1.5px solid var(--linea)', color: 'var(--tinta)', textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--rojo)' }} />
            <span>Consultar deudas</span>
          </div>
          <ArrowRight className="w-5 h-5" style={{ color: 'var(--gris)' }} />
        </Link>
      </div>
    </div>
  );
}

function ConductorSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const conductores = conductorStore.getAll();
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <span
          className="flex items-center justify-center rounded-2xl"
          style={{ width: 48, height: 48, background: 'var(--azul-noche)', color: 'var(--celeste)' }}
        >
          <Car className="w-6 h-6" />
        </span>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--tinta)' }}>
            Conductor
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gris)' }}>
            Seleccioná tu perfil para continuar
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {conductores.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="w-full text-left btn-xl rounded-2xl px-5 flex items-center gap-4 transition-all"
            style={{ background: '#fff', border: '1.5px solid var(--linea)', boxShadow: '0 1px 4px rgba(21,50,111,0.06)' }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-bold"
              style={{ width: 48, height: 48, background: 'var(--azul-noche)', color: 'var(--celeste)', fontFamily: 'var(--font-display)' }}
            >
              {c.nombre[0]}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--tinta)' }}>
                {c.nombre}
              </p>
              <p className="font-mono text-sm mt-0.5" style={{ color: 'var(--gris)' }}>
                {c.dominioDefault}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--linea)', paddingTop: 16 }}>
        <Link
          href={ROUTES.conductor.registro}
          className="flex items-center justify-center gap-2 btn-xl rounded-2xl w-full"
          style={{ background: 'var(--hueso)', color: 'var(--azul-vivo)', textDecoration: 'none', border: '1.5px solid var(--linea)' }}
        >
          <CreditCard className="w-5 h-5" />
          Registrarme
        </Link>
      </div>
    </div>
  );
}
