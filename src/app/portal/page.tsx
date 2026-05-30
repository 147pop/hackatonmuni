'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe, CreditCard, AlertTriangle, ArrowLeft, Info,
  CheckCircle, Search,
} from 'lucide-react';
import { PlateInput } from '@/components/plate-input';
import { PaymentWizard } from '@/components/payment-wizard';
import { DebtList } from '@/components/debt-list';
import { deudaStore, initializeIfNeeded } from '@/lib/sem-store';
import { ROUTES } from '@/lib/routes';
import type { Deuda } from '@/domain/types';

type Mode = 'home' | 'pagar' | 'deudas';

export default function PortalPage() {
  const [mode, setMode] = useState<Mode>('home');
  const [dominio, setDominio] = useState('');
  const [dominioValido, setDominioValido] = useState(false);
  const [deudas, setDeudas] = useState<Deuda[] | null>(null);

  useEffect(() => { initializeIfNeeded(); }, []);

  function handleConsultarDeuda() {
    if (!dominioValido) return;
    setDeudas(deudaStore.getByDominio(dominio));
    setMode('deudas');
  }

  function handleBack() {
    setMode('home');
    setDeudas(null);
  }

  // ── Pagar flow ──────────────────────────────────────────────────────────────
  if (mode === 'pagar') {
    return (
      <div className="lc-app">
        <style>{STYLES}</style>
        <header className="lc-header">
          <img src="/logomain.png" alt="La Cuadra" className="lc-logo" />
        </header>
        <div className="lc-body">
          <button onClick={handleBack} className="lc-back-btn">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
          <div className="lc-section-title">Pagar estacionamiento</div>
          <div className="lc-card">
            <PaymentWizard dominioDefault={dominio} />
          </div>
        </div>
      </div>
    );
  }

  // ── Deudas flow ─────────────────────────────────────────────────────────────
  if (mode === 'deudas') {
    return (
      <div className="lc-app">
        <style>{STYLES}</style>
        <header className="lc-header">
          <img src="/logomain.png" alt="La Cuadra" className="lc-logo" />
        </header>
        <div className="lc-body">
          <button onClick={handleBack} className="lc-back-btn">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="lc-section-title" style={{ margin: 0 }}>Deudas para</div>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: '#DC2626', letterSpacing: '0.08em' }}>
              {dominio}
            </span>
          </div>
          <div className="lc-card">
            <DebtList
              deudas={deudas ?? []}
              onPaid={() => setDeudas(deudaStore.getByDominio(dominio))}
              emptyMessage={`Sin deudas registradas para ${dominio}.`}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Home ────────────────────────────────────────────────────────────────────
  return (
    <div className="lc-app">
      <style>{STYLES}</style>

      <header className="lc-header">
        <img src="/logomain.png" alt="La Cuadra" className="lc-logo" />
      </header>

      <div className="lc-body">

        {/* Greeting */}
        <div className="lc-greeting-card">
          <div className="lc-avatar" style={{ background: '#EFF6FF' }}>
            <Globe className="w-7 h-7" style={{ color: '#2563EB' }} />
          </div>
          <div className="lc-greeting-info">
            <p className="lc-greeting-name">Portal Público</p>
            <span className="lc-ver-perfil">Municipalidad de Salta</span>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: '0 4px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#686868', lineHeight: 1.5, margin: 0 }}>
            Ingresá la patente para pagar tu estacionamiento o consultar deudas sin crear una cuenta.
          </p>
        </div>

        {/* Plate input */}
        <div className="lc-card">
          <PlateInput
            value={dominio}
            onChange={setDominio}
            onValidChange={setDominioValido}
            label="Patente del vehículo"
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          <button
            onClick={() => dominioValido && setMode('pagar')}
            disabled={!dominioValido}
            className="lc-action-btn"
            style={{ opacity: dominioValido ? 1 : 0.5 }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: dominioValido ? '#EFF6FF' : '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CreditCard className="w-5 h-5" style={{ color: dominioValido ? '#2563EB' : '#94A3B8' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#15181F', margin: 0 }}>
                Pagar estacionamiento
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#686868', margin: 0 }}>
                Ticket inmediato · 20% descuento digital
              </p>
            </div>
          </button>

          <button
            onClick={handleConsultarDeuda}
            disabled={!dominioValido}
            className="lc-action-btn"
            style={{ opacity: dominioValido ? 1 : 0.5 }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: dominioValido ? '#FEF2F2' : '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Search className="w-5 h-5" style={{ color: dominioValido ? '#DC2626' : '#94A3B8' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: dominioValido ? '#DC2626' : '#15181F', margin: 0 }}>
                Consultar deuda
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#686868', margin: 0 }}>
                Multas e infracciones pendientes
              </p>
            </div>
          </button>

        </div>

        {/* Register promo */}
        <div className="lc-card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Info className="w-5 h-5" style={{ color: '#64748B', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#475569', lineHeight: 1.4, margin: 0 }}>
                ¿Usás el estacionamiento medido frecuentemente?
              </p>
              <Link
                href={ROUTES.conductor.registro}
                style={{ color: '#2563EB', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, display: 'inline-block', marginTop: 4 }}
              >
                Creá tu cuenta gratis ›
              </Link>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#686868', margin: '4px 0 0' }}>
                Historial completo y alertas antes de que venza tu tiempo.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const STYLES = `
  .lc-app {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: #F5F7FA;
    max-width: 480px;
    margin: 0 auto;
    font-family: var(--font-body);
  }

  .lc-header {
    background: #2557C7;
    padding-top: env(safe-area-inset-top, 0px);
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(21,50,111,0.3);
  }
  .lc-logo {
    height: 63px;
    width: auto;
    display: block;
    object-fit: contain;
    margin: 12px 0;
  }

  .lc-body {
    flex: 1;
    padding: 12px 12px 80px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }

  .lc-greeting-card {
    background: #fff;
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 4px rgba(21,50,111,0.07);
  }
  .lc-avatar {
    width: 50px; height: 50px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .lc-greeting-info { flex: 1; }
  .lc-greeting-name {
    font-family: var(--font-display);
    font-weight: 700; font-size: 20px;
    color: #15181F; margin: 0;
  }
  .lc-ver-perfil {
    font-family: var(--font-body);
    font-size: 13px; color: #686868;
    display: block; margin-top: 2px;
  }

  .lc-card {
    background: #fff;
    border-radius: 14px;
    padding: 14px 12px;
    box-shadow: 0 1px 4px rgba(21,50,111,0.07);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .lc-section-title {
    font-family: var(--font-display);
    font-weight: 700; font-size: 16px;
    color: #15181F;
    margin: 4px 0 0;
    padding: 0 4px;
  }

  .lc-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 13px;
    color: #64748B;
    padding: 4px 0;
    margin-bottom: 2px;
  }
  .lc-back-btn:hover { color: #2563EB; }

  .lc-action-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #fff;
    border: 1.5px solid #E2E8F0;
    border-radius: 14px;
    padding: 12px 14px;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(21,50,111,0.07);
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    text-align: left;
  }
  .lc-action-btn:not(:disabled):hover {
    border-color: #93C5FD;
    box-shadow: 0 2px 8px rgba(37,87,199,0.12);
  }
  .lc-action-btn:disabled { cursor: default; }
`;
