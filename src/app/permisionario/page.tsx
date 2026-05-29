'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Clock, CreditCard, AlertTriangle, IdCard, ArrowRight, Timer } from 'lucide-react';
import { permisionarioStore, roleStore, configStore } from '@/lib/sem-store';
import { esHorarioPermitido } from '@/domain/rules';
import { DailySummary } from '@/components/daily-summary';
import { EmergencyActions } from '@/components/emergency-actions';
import { CuadraMonitor } from '@/components/cuadra-monitor';
import type { Permisionario } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function PermisionarioPage() {
  const [perm, setPerm] = useState<Permisionario | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = roleStore.getActivePermisionarioId();
    if (id) setPerm(permisionarioStore.getById(id) ?? null);
    setLoaded(true);
  }, []);

  function selectPermisionario(id: string) {
    roleStore.setActivePermisionarioId(id);
    setPerm(permisionarioStore.getById(id) ?? null);
  }

  if (!loaded) return null;
  if (!perm) return <PermisionarioSelector onSelect={selectPermisionario} />;

  const ahora = new Date();
  const horario = esHorarioPermitido({
    timestamp: ahora,
    zonaId: perm.zonaId,
    zonas: configStore.getZonas(),
    feriados: configStore.getFeriados(),
    config: configStore.getConfig(),
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--tinta)' }}>
              {perm.nombre} {perm.apellido}
            </h1>
            <div className="flex items-center gap-1.5 mt-1" style={{ color: 'var(--gris)', fontSize: 14 }}>
              <MapPin className="w-4 h-4" />
              <span style={{ fontFamily: 'var(--font-body)' }}>{perm.cuadraAsignada}</span>
            </div>
          </div>
          <button
            onClick={() => { roleStore.setActivePermisionarioId(null); setPerm(null); }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--azul-vivo)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cambiar
          </button>
        </div>

        {/* Turno status */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={horario.permitido
            ? { background: 'rgba(127,181,255,0.12)', border: '1px solid rgba(127,181,255,0.25)', color: 'var(--azul-vivo)' }
            : { background: 'rgba(104,104,104,0.08)', border: '1px solid rgba(104,104,104,0.15)', color: 'var(--gris)' }
          }
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>
            {horario.permitido
              ? '● Turno activo'
              : `○ Fuera de horario${horario.razon ? ` — ${horario.razon}` : ''}`}
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)' }}>
          Acciones
        </p>

        <Link
          href={ROUTES.permisionario.registrar}
          className="flex items-center justify-between btn-xl w-full"
          style={{ background: 'var(--azul-vivo)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 12px rgba(1,92,180,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            <span>Registrar pago efectivo</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link
          href={ROUTES.permisionario.incumplimiento}
          className="flex items-center justify-between btn-xl w-full"
          style={{ background: 'var(--rojo)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 8px rgba(217,48,37,0.25)' }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <span>Registrar incumplimiento</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link
          href={ROUTES.permisionario.horaExtra}
          className="flex items-center justify-between btn-xl w-full"
          style={{ background: 'var(--ambar)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 8px rgba(217,119,6,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <Timer className="w-6 h-6" />
            <span>Cobrar hora extra</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link
          href={ROUTES.permisionario.credencial}
          className="flex items-center justify-between btn-xl w-full"
          style={{ background: '#fff', border: '1.5px solid var(--linea)', color: 'var(--tinta)', textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <IdCard className="w-6 h-6" style={{ color: 'var(--azul-salta)' }} />
            <span>Ver credencial y QR</span>
          </div>
          <ArrowRight className="w-5 h-5" style={{ color: 'var(--gris)' }} />
        </Link>
      </div>

      {/* Live cuadra monitor */}
      <CuadraMonitor permisionarioId={perm.id} cuadra={perm.cuadraAsignada} />

      {/* Daily summary */}
      <div className="space-y-3">
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)' }}>
          Resumen de hoy
        </p>
        <DailySummary permisionarioId={perm.id} />
      </div>

      {/* Emergency */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--linea)' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--gris)' }}>Emergencias</span>
        <EmergencyActions permisionarioId={perm.id} cuadra={perm.cuadraAsignada} />
      </div>
    </div>
  );
}

function PermisionarioSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const permisionarios = permisionarioStore.getAll().filter((p) => p.activo);

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--tinta)' }}>
          ¿Quién sos?
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gris)', marginTop: 4 }}>
          Seleccioná tu usuario para continuar.
        </p>
      </div>

      <div className="space-y-3">
        {permisionarios.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="w-full text-left btn-xl rounded-2xl px-5 flex items-center gap-4 transition-all"
            style={{ background: '#fff', border: '1.5px solid var(--linea)', boxShadow: '0 1px 4px rgba(21,50,111,0.06)' }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-bold"
              style={{ width: 48, height: 48, background: 'var(--azul-noche)', color: 'var(--celeste)', fontFamily: 'var(--font-display)' }}
            >
              {p.nombre[0]}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--tinta)' }}>
                {p.nombre} {p.apellido}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gris)' }}>
                {p.cuadraAsignada} · Legajo {p.legajo}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
