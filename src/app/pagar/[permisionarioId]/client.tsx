'use client';

import { CredencialCard } from '@/components/credencial-card';
import { QRForm } from './qr-form';
import type { Permisionario } from '@/domain/types';

function IsotipoSalta({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M24 38s-14-9-14-20a9 9 0 0 1 14-7.5A9 9 0 0 1 38 18c0 11-14 20-14 20z" />
    </svg>
  );
}

export function QRPaymentPageClient({ permisionario }: { permisionario: Permisionario }) {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--hueso)' }}>
      <header
        className="text-white sticky top-0 z-40 shadow-md"
        style={{ background: 'var(--azul-noche)', paddingTop: 'var(--safe-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <span
            className="flex items-center justify-center rounded-lg"
            style={{ background: 'var(--azul-vivo)', width: 30, height: 30 }}
          >
            <IsotipoSalta size={17} />
          </span>
          <span className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            SEM <span style={{ color: 'var(--celeste)', fontWeight: 500 }}>· Pago Digital</span>
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        <div>
          <p className="eyebrow-sem mb-3">Verificá la identidad del permisionario</p>
          <CredencialCard permisionario={permisionario} compact />
        </div>

        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
            Pagá tu estacionamiento
          </h2>
          <QRForm permisionario={permisionario} />
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
        Municipalidad de Salta · Sistema de Estacionamiento Medido Digital
      </footer>
    </div>
  );
}