import { ShieldCheck, ShieldOff, User } from 'lucide-react';
import type { Permisionario } from '@/domain/types';

interface CredencialCardProps {
  permisionario: Permisionario;
  compact?: boolean;
}

export function CredencialCard({ permisionario, compact = false }: CredencialCardProps) {
  return (
    <div className={`bg-gradient-to-br from-municipal-700 to-municipal-950 text-white rounded-2xl overflow-hidden shadow-lg ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`flex-shrink-0 ${compact ? 'w-16 h-16' : 'w-24 h-24'} bg-white/20 rounded-xl flex items-center justify-center`}>
          <User className={compact ? 'w-8 h-8 text-white/70' : 'w-12 h-12 text-white/70'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {permisionario.activo ? (
              <span className="flex items-center gap-1 text-xs font-bold bg-green-400/30 text-green-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                ACTIVO
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold bg-red-400/30 text-red-200 px-2 py-0.5 rounded-full">
                <ShieldOff className="w-3 h-3" />
                INACTIVO
              </span>
            )}
          </div>

          <p className={`font-bold text-white ${compact ? 'text-lg' : 'text-2xl'}`}>
            {permisionario.nombre} {permisionario.apellido}
          </p>
          <p className={`text-white/70 font-mono ${compact ? 'text-sm' : 'text-base'}`}>
            Legajo {permisionario.legajo}
          </p>
          {!compact && (
            <>
              <p className="text-white/90 text-base mt-2">{permisionario.cuadraAsignada}</p>
              <p className="text-white/60 text-sm">
                Autorizado: {[
                  permisionario.horariosAutorizados.diurno && 'Turno diurno',
                  permisionario.horariosAutorizados.nocturno && 'Turno nocturno',
                ].filter(Boolean).join(' · ')}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-xs text-white/50">
        <span>Municipalidad de Salta — SEM Digital</span>
        <span>PunaTech 2026</span>
      </div>
    </div>
  );
}
