import { ShieldCheck, ShieldOff, User } from 'lucide-react';
import type { Permisionario } from '@/domain/types';

interface CredencialCardProps {
  permisionario: Permisionario;
  compact?: boolean;
}

/** Isotipo institucional — mismo que en AppShell */
function IsotipoSalta({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 38s-14-9-14-20a9 9 0 0 1 14-7.5A9 9 0 0 1 38 18c0 11-14 20-14 20z" />
    </svg>
  );
}

export function CredencialCard({ permisionario, compact = false }: CredencialCardProps) {
  const turnos = [
    permisionario.horariosAutorizados.diurno && 'Turno diurno',
    permisionario.horariosAutorizados.nocturno && 'Turno nocturno',
  ].filter(Boolean).join(' · ');

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, var(--azul-noche) 0%, #0d2458 60%, var(--azul-salta) 100%)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(21,50,111,0.35)',
        padding: compact ? 16 : 24,
        position: 'relative',
      }}
    >
      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160,
        background: 'rgba(127,181,255,0.06)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Header — logo institucional */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: compact ? 12 : 18 }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28,
          background: 'var(--azul-vivo)',
          borderRadius: 8,
          color: '#fff',
        }}>
          <IsotipoSalta size={16} />
        </span>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--celeste)',
        }}>
          Municipalidad de Salta · SEM
        </span>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Avatar */}
        <div style={{
          flexShrink: 0,
          width: compact ? 56 : 72,
          height: compact ? 56 : 72,
          background: 'rgba(127,181,255,0.15)',
          border: '1.5px solid rgba(127,181,255,0.3)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--celeste)',
        }}>
          <User size={compact ? 28 : 36} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Estado badge */}
          <div style={{ marginBottom: 6 }}>
            {permisionario.activo ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(127,181,255,0.15)',
                border: '1px solid rgba(127,181,255,0.3)',
                color: 'var(--celeste)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 999,
              }}>
                <ShieldCheck size={10} />
                ACTIVO
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(217,48,37,0.15)',
                border: '1px solid rgba(217,48,37,0.3)',
                color: '#f87171',
                fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 999,
              }}>
                <ShieldOff size={10} />
                INACTIVO
              </span>
            )}
          </div>

          <p style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: compact ? 17 : 22,
            color: '#fff',
            lineHeight: 1.2,
            marginBottom: 2,
          }}>
            {permisionario.nombre} {permisionario.apellido}
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: compact ? 12 : 14, color: 'rgba(255,255,255,0.55)' }}>
            Legajo {permisionario.legajo}
          </p>

          {!compact && (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>
                {permisionario.cuadraAsignada}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                {turnos}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer strip */}
      <div style={{
        marginTop: compact ? 12 : 20,
        paddingTop: 10,
        borderTop: '1px solid rgba(127,181,255,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
          SEM DIGITAL
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
          municipalidadsalta.gob.ar
        </span>
      </div>
    </div>
  );
}
