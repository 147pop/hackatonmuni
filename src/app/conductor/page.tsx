'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Car, Map as MapIcon, FileText, User, AlertCircle,
  ArrowLeft, CreditCard, CheckCircle2, AlertTriangle, Clock,
  Menu, CheckCircle, XCircle
} from 'lucide-react';
import {
  deudaStore, conductorStore, roleStore, ticketStore,
  vehiculoStore, initializeIfNeeded,
} from '@/lib/sem-store';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import type { Conductor, Deuda, Vehiculo, Ticket } from '@/domain/types';

const AvailabilityMap = dynamic(() => import('@/components/conductor/availability-map'), { ssr: false });
const Heatmap = dynamic(() => import('@/components/admin/heatmap'), {
  ssr: false,
  loading: () => <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9' }}>Cargando mapa...</div>
});

type ViewType = 'home' | 'vehiculos' | 'mapa' | 'comprobantes' | 'cuenta' | 'reclamos' | 'deudas';

// ─── Conductor Selector ──────────────────────────────────────────────────────

function ConductorSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const conductores = conductorStore.getAll();

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F7FA' }}>
      <style>{STYLES}</style>
      <header className="lc-header">
        <img src="/logomain.png" alt="La Cuadra" className="lc-logo" />
      </header>
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#15181F', marginBottom: 4 }}>
          ¿Quién soy?
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#686868', marginBottom: 20 }}>
          Seleccioná tu perfil para continuar.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {conductores.map((c) => (
            <button key={c.id} onClick={() => onSelect(c.id)} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              background: '#fff', border: '1.5px solid #DDE4EF', borderRadius: 16,
              cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 4px rgba(21,50,111,0.06)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: '#15326F',
                color: '#7FB5FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, flexShrink: 0,
              }}>
                <Car className="w-5 h-5" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#15181F' }}>{c.nombre}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#686868', marginTop: 2 }}>
                  <span className="lc-plate" style={{ fontSize: 11 }}>{c.dominioDefault}</span>
                  <span style={{ marginLeft: 8 }}>{c.email}</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConductorPage() {
  const [view, setView] = useState<ViewType>('home');
  const [isMounted, setIsMounted] = useState(false);
  const [conductor, setConductor] = useState<Conductor | null>(null);
  const [pendingDeudas, setPendingDeudas] = useState<Deuda[]>([]);
  const [paymentBanner, setPaymentBanner] = useState<'success' | 'failure' | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    initializeIfNeeded();

    const condId = roleStore.getActiveConductorId();
    if (condId) {
      const cond = conductorStore.getById(condId);
      if (cond) {
        setConductor(cond);
        const pending = deudaStore.getByDominio(cond.dominioDefault).filter(d => d.estado === 'pendiente');
        setPendingDeudas(pending);
        const ticket = ticketStore.getActivosByDominio(cond.dominioDefault);
        if (ticket) setActiveTicket(ticket);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const pago = params.get('pago');
    const externalRef = params.get('external_reference');

    if (pago === 'success' && externalRef) {
      deudaStore.update(externalRef, {
        estado: 'pagada',
        pagadoAt: new Date().toISOString(),
      });
      // Refrescar badge con el count actualizado
      const condId2 = roleStore.getActiveConductorId();
      if (condId2) {
        const cond2 = conductorStore.getById(condId2);
        if (cond2) {
          setPendingDeudas(deudaStore.getByDominio(cond2.dominioDefault).filter(d => d.estado === 'pendiente'));
        }
      }
      window.history.replaceState({}, '', '/conductor');
      setPaymentBanner('success');
      setView('deudas');
    } else if (pago === 'failure') {
      window.history.replaceState({}, '', '/conductor');
      setPaymentBanner('failure');
      setView('deudas');
    } else if (pago === 'pending') {
      window.history.replaceState({}, '', '/conductor');
    }

    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  function selectConductor(id: string) {
    roleStore.setActiveConductorId(id);
    const cond = conductorStore.getById(id);
    if (cond) {
      setConductor(cond);
      setPendingDeudas(deudaStore.getByDominio(cond.dominioDefault).filter(d => d.estado === 'pendiente'));
      const ticket = ticketStore.getActivosByDominio(cond.dominioDefault);
      if (ticket) setActiveTicket(ticket);
      else setActiveTicket(null);
    }
    setView('home');
  }

  if (!conductor) return <ConductorSelector onSelect={selectConductor} />;

  if (view !== 'home') {
    return <SubView view={view} onBack={() => setView('home')} conductor={conductor} paymentBanner={paymentBanner} />;
  }

  const ticketMinutes = activeTicket ? calcularTiempoRestanteMinutos(activeTicket.vencimiento) : null;

  return (
    <div className="lc-app">
      <style>{STYLES}</style>

      {/* ── Header ── */}
      <header className="lc-header">
        <img src="/logomain.png" alt="La Cuadra" className="lc-logo" />
      </header>

      {/* ── Scroll body ── */}
      <div className="lc-body">

        {/* ── Profile Card ── */}
        <div className="lc-greeting-card">
          <div className="lc-avatar">
            <User className="w-7 h-7" style={{ color: '#fff' }} />
          </div>
          <div className="lc-greeting-info">
            <p className="lc-greeting-name">
              Hola, <span className="lc-greeting-highlight">{conductor.nombre.split(' ')[0]}</span>
            </p>
            <span className="lc-ver-perfil">
              Conductor Registrado · {conductor.dominioDefault}
            </span>
          </div>
          <button
            className="lc-hamburger"
            onClick={() => { roleStore.setActiveConductorId(null); window.location.reload(); }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* ── Alertas ── */}
        <div className="lc-section">
          {activeTicket && ticketMinutes !== null && ticketMinutes > 0 ? (
            <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #16A34A', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock className="w-5 h-5" style={{ color: '#16A34A' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="lc-act-title">Estacionado · {ticketMinutes} min restantes</p>
                  <p className="lc-act-sub">{activeTicket.cuadra}</p>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#16A34A' }}>{ticketMinutes}m</span>
              </div>
            </div>
          ) : (
            <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #94A3B8', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car className="w-5 h-5" style={{ color: '#94A3B8' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="lc-act-title" style={{ color: '#64748B' }}>Sin estacionamiento activo</p>
                  <p className="lc-act-sub">Pagá estacionamiento para comenzar</p>
                </div>
              </div>
            </div>
          )}

          {paymentBanner === 'success' && (
            <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #16A34A', background: '#F0FDF4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle className="w-5 h-5" style={{ color: '#16A34A', flexShrink: 0 }} />
                <p className="lc-act-title" style={{ color: '#16A34A' }}>Pago aprobado por MercadoPago</p>
              </div>
            </div>
          )}
          {paymentBanner === 'failure' && (
            <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #DC2626', background: '#FEF2F2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <XCircle className="w-5 h-5" style={{ color: '#DC2626', flexShrink: 0 }} />
                <p className="lc-act-title" style={{ color: '#DC2626' }}>El pago fue rechazado</p>
              </div>
            </div>
          )}
          {pendingDeudas.length > 0 ? (
            <button
              onClick={() => setView('deudas')}
              className="lc-card"
              style={{ padding: '12px 14px', borderLeft: '4px solid #DC2626', background: '#FEF2F2', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="lc-act-title" style={{ color: '#DC2626' }}>
                    {pendingDeudas.length === 1 ? 'Deuda Pendiente' : pendingDeudas.length + ' Deudas Pendientes'}
                  </p>
                  <p className="lc-act-sub">{pendingDeudas[0].cuadra} · Tocá para ver y pagar</p>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#DC2626' }}>
                  ${pendingDeudas.reduce((s, d) => s + d.monto, 0).toLocaleString('es-AR')}
                </span>
              </div>
            </button>
          ) : (
            <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #16A34A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 className="w-5 h-5" style={{ color: '#16A34A' }} />
                </div>
                <p className="lc-act-title" style={{ color: '#16A34A' }}>Sin deudas pendientes</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Accesos Funcionales ── */}
        <div className="lc-section">
          <p className="lc-section-label">Módulos</p>
          <div className="lc-menu-grid">
            <MenuBtn icon={<Car />} label="Vehículos" color="#2563EB" onClick={() => setView('vehiculos')} />
            <MenuBtn icon={<MapIcon />} label="Disponibilidad" color="#16A34A" onClick={() => setView('mapa')} />
            <MenuBtn icon={<FileText />} label="Comprobantes" color="#0D9488" onClick={() => setView('comprobantes')} />
            <MenuBtn icon={<User />} label="Mi Cuenta" color="#7C3AED" onClick={() => setView('cuenta')} />
            <MenuBtn icon={<AlertTriangle />} label="Reclamos" color="#EA580C" onClick={() => setView('reclamos')} />
            <MenuBtn
              icon={<AlertCircle />}
              label="Deudas"
              color="#DC2626"
              onClick={() => setView('deudas')}
              badge={pendingDeudas.length > 0 ? pendingDeudas.length : undefined}
            />
          </div>
        </div>

        {/* ── Mini Mapa de Calor ── */}
        <div className="lc-section" style={{ paddingBottom: 24 }}>
          <div className="lc-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px 8px' }}>
              <MapIcon className="w-4 h-4" style={{ color: '#2563EB' }} />
              <span className="lc-card-title">Mapa de Calor (En Vivo)</span>
            </div>
            <div style={{ height: 200, borderTop: '1px solid #F1F5F9' }}>
              <Heatmap />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Sub-views ──────────────────────────────────────────

function SubView({ view, onBack, conductor, paymentBanner }: { view: ViewType; onBack: () => void; conductor: Conductor; paymentBanner?: 'success' | 'failure' | null }) {
  const titles: Record<ViewType, string> = {
    home: '', mapa: 'Mapa de Disponibilidad', vehiculos: 'Mis Vehículos',
    comprobantes: 'Comprobantes', cuenta: 'Mi Cuenta', reclamos: 'Centro de Reclamos',
    deudas: 'Mis Deudas',
  };

  return (
    <div className="lc-app">
      <style>{STYLES}</style>

      {/* ── Header ── */}
      <header className="lc-header">
        <img src="/logomain.png" alt="La Cuadra" className="lc-logo" />
      </header>

      {/* ── Sub-header ── */}
      <div className="lc-sub-header">
        <button className="lc-back-btn" onClick={onBack}><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="lc-sub-title">{titles[view]}</h2>
        <div style={{ width: 32 }} />
      </div>

      <div className="lc-body" style={{ flex: 1 }}>
        {view === 'mapa' && <MapaView />}
        {view === 'vehiculos' && <VehiculosView conductor={conductor} />}
        {view === 'comprobantes' && <ComprobantesView conductor={conductor} />}
        {view === 'cuenta' && <CuentaView conductor={conductor} initialBanner={paymentBanner} />}
        {view === 'reclamos' && <ReclamosView />}
        {view === 'deudas' && <DeudasView conductor={conductor} initialBanner={paymentBanner} />}
      </div>
    </div>
  );
}

function MapaView() {
  return (
    <div style={{ height: 'calc(100vh - 80px)', margin: '-12px -14px -24px -14px' }}>
      <AvailabilityMap />
    </div>
  );
}

function VehiculosView({ conductor }: { conductor: Conductor }) {
  const [loaded, setLoaded] = useState(false);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

  useEffect(() => {
    setVehiculos(vehiculoStore.getAll().filter(v => v.conductorId === conductor.id));
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <>
      {vehiculos.length === 0 ? (
        <div className="lc-card" style={{ padding: 16, textAlign: 'center' }}>
          <Car className="w-8 h-8" style={{ color: '#CBD5E1', margin: '0 auto' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#15181F', marginTop: 8 }}>
            No tenés vehículos registrados
          </p>
        </div>
      ) : (
        vehiculos.map((v) => (
          <div key={v.id} className="lc-card lc-list-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car className="w-5 h-5" style={{ color: '#2563EB' }} />
              </div>
              <div>
                <span className="lc-plate">{v.dominio}</span>
                <p className="lc-act-sub" style={{ marginTop: 6 }}>{v.tipo === 'auto' ? 'Auto' : 'Moto'}</p>
              </div>
            </div>
            {v.dominio === conductor.dominioDefault && <span className="lc-badge lc-badge--green">Predeterminado</span>}
          </div>
        ))
      )}

      <div className="lc-card" style={{ marginTop: 12, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <p className="lc-card-title" style={{ color: '#1E3A8A' }}>Acciones Rápidas</p>
        <button className="lc-action-btn" style={{ background: '#2563EB', color: '#fff', width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CreditCard className="w-4 h-4" /> Pagar Estacionamiento
        </button>
      </div>
    </>
  );
}

function ComprobantesView({ conductor }: { conductor: Conductor }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const all = ticketStore.getByDominio(conductor.dominioDefault);
    setTickets(all.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()));
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (tickets.length === 0) {
    return (
      <div className="lc-card" style={{ padding: 16, textAlign: 'center' }}>
        <FileText className="w-8 h-8" style={{ color: '#CBD5E1', margin: '0 auto' }} />
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#15181F', marginTop: 8 }}>
          Sin comprobantes
        </p>
      </div>
    );
  }

  return (
    <>
      {tickets.map((t) => {
        const activo = t.activo && calcularTiempoRestanteMinutos(t.vencimiento) > 0;
        return (
          <div key={t.id} className="lc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <p className="lc-act-title" style={{ fontSize: 12 }}>
                Estacionamiento · {t.cuadra}
              </p>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: activo ? '#16A34A' : '#475569' }}>
                ${t.monto.toLocaleString('es-AR')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="lc-act-sub">
                {new Date(t.inicio).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                {' · '}
                {new Date(t.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className={`lc-badge ${activo ? 'lc-badge--green' : 'lc-badge--gray'}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {activo ? <><CheckCircle2 className="w-3 h-3" /> Activo</> : <><CheckCircle className="w-3 h-3" /> Pagado</>}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function CuentaView({ conductor, initialBanner }: { conductor: Conductor; initialBanner?: 'success' | 'failure' | null }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deudas, setDeudas] = useState<Deuda[]>([]);

  useEffect(() => {
    setDeudas(deudaStore.getByDominio(conductor.dominioDefault));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePagar = async (deuda: Deuda) => {
    setLoadingId(deuda.id);
    try {
      const res = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: deuda.monto,
          title: `Deuda ${deuda.dominio} — ${deuda.cuadra} | Municipalidad de Salta`,
          deudaId: deuda.id,
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(`MercadoPago rechazó la operación:\n\n${data.error || 'Desconocido'}\nDetalle: ${data.details || ''}`);
        setLoadingId(null);
      }
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
      setLoadingId(null);
    }
  };

  const pendientes = deudas.filter(d => d.estado === 'pendiente');
  const pagadas = deudas.filter(d => d.estado === 'pagada');
  const initials = conductor.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Profile */}
      <div className="lc-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
        <div className="lc-avatar" style={{ width: 60, height: 60, border: '2px solid #fff' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#fff' }}>{initials}</span>
        </div>
        <div>
          <h2 className="lc-greeting-name" style={{ fontSize: 18, margin: 0 }}>{conductor.nombre}</h2>
          <p className="lc-ver-perfil">{conductor.email}</p>
          {conductor.dominioDefault && (
            <span className="lc-plate" style={{ marginTop: 4, display: 'inline-block' }}>{conductor.dominioDefault}</span>
          )}
        </div>
      </div>

      {/* Payment result banner */}
      {initialBanner === 'success' && (
        <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #16A34A', background: '#F0FDF4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#16A34A', flexShrink: 0 }} />
            <p className="lc-act-title" style={{ color: '#16A34A' }}>Pago aprobado — deuda saldada</p>
          </div>
        </div>
      )}
      {initialBanner === 'failure' && (
        <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #DC2626', background: '#FEF2F2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#DC2626', flexShrink: 0 }} />
            <p className="lc-act-title" style={{ color: '#DC2626' }}>El pago fue rechazado. Podés reintentar.</p>
          </div>
        </div>
      )}

      {/* Pending debts */}
      {pendientes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="lc-section-label" style={{ paddingLeft: 2 }}>
            {pendientes.length === 1 ? 'Deuda pendiente' : pendientes.length + ' deudas pendientes'}
          </p>
          {pendientes.map(deuda => (
            <div key={deuda.id} className="lc-card" style={{ padding: '14px', borderLeft: '4px solid #DC2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="lc-act-title" style={{ color: '#DC2626' }}>Deuda pendiente</p>
                  <p className="lc-act-sub">{deuda.cuadra} · {new Date(deuda.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                  {deuda.tipo === 'hora_extra' && (
                    <span className="lc-badge" style={{ background: '#FEF3C7', color: '#92400E', marginTop: 4, display: 'inline-block' }}>Hora extra</span>
                  )}
                  {deuda.tipo === 'incumplimiento' && (
                    <span className="lc-badge" style={{ background: '#FEE2E2', color: '#991B1B', marginTop: 4, display: 'inline-block' }}>Incumplimiento</span>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#DC2626' }}>
                  ${deuda.monto.toLocaleString('es-AR')}
                </span>
              </div>
              <button
                onClick={() => handlePagar(deuda)}
                disabled={loadingId === deuda.id}
                className="lc-action-btn"
                style={{ background: '#009EE3', color: '#fff', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, opacity: loadingId === deuda.id ? 0.7 : 1 }}
              >
                <CreditCard className="w-4 h-4" />
                {loadingId === deuda.id ? 'Conectando con MercadoPago...' : `Pagar $${deuda.monto.toLocaleString('es-AR')} con MercadoPago`}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="lc-card" style={{ padding: '14px', borderLeft: '4px solid #16A34A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#16A34A' }} />
            <p className="lc-act-title" style={{ color: '#16A34A' }}>Sin deudas pendientes</p>
          </div>
        </div>
      )}

      {/* Paid debts history */}
      {pagadas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="lc-section-label" style={{ paddingLeft: 2 }}>Historial</p>
          {pagadas.map(deuda => (
            <div key={deuda.id} className="lc-card" style={{ padding: '12px 14px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="lc-act-title">{deuda.cuadra}</p>
                <p className="lc-act-sub">{deuda.pagadoAt ? new Date(deuda.pagadoAt).toLocaleDateString('es-AR') : new Date(deuda.fecha).toLocaleDateString('es-AR')}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>${deuda.monto.toLocaleString('es-AR')}</p>
                <span className="lc-badge lc-badge--green" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <CheckCircle2 className="w-3 h-3" /> Pagada
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account settings */}
      <div className="lc-card" style={{ padding: 0 }}>
        <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: 16, background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#15181F', cursor: 'pointer' }}>
          Datos Personales <span style={{ color: '#94A3B8' }}>›</span>
        </button>
        <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: 16, background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#15181F', cursor: 'pointer' }}>
          Métodos de Pago <span style={{ color: '#94A3B8' }}>›</span>
        </button>
        <button
          onClick={() => { roleStore.setActiveConductorId(null); window.location.reload(); }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: 16, background: 'none', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </>
  );
}

function ReclamosView() {
  return (
    <div className="lc-card" style={{ padding: 16 }}>
      <p className="lc-card-title" style={{ marginBottom: 16 }}>Iniciá un trámite o consulta</p>

      <div style={{ marginBottom: 12 }}>
        <label className="lc-section-label" style={{ display: 'block', fontSize: 11, color: '#686868' }}>Motivo</label>
        <select style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}>
          <option>Ticket cobrado erróneamente</option>
          <option>Vehículo mal estacionado</option>
          <option>Consulta general</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="lc-section-label" style={{ display: 'block', fontSize: 11, color: '#686868' }}>Mensaje</label>
        <textarea rows={4} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', resize: 'none' }} placeholder="Describí tu situación..."></textarea>
      </div>

      <button className="lc-action-btn" style={{ background: '#2563EB', color: '#fff', width: '100%' }}>
        Enviar Reclamo
      </button>
    </div>
  );
}

// ── Deudas ─────────────────────────────────────────────────────
function DeudasView({ conductor, initialBanner }: { conductor: Conductor; initialBanner?: 'success' | 'failure' | null }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deudas, setDeudas] = useState<Deuda[]>([]);

  useEffect(() => {
    setDeudas(deudaStore.getByDominio(conductor.dominioDefault));
  }, [conductor.dominioDefault]);

  const pendientes = deudas.filter(d => d.estado === 'pendiente');
  const pagadas = deudas.filter(d => d.estado === 'pagada');
  const totalPendiente = pendientes.reduce((s, d) => s + d.monto, 0);

  const handlePagar = async (deuda: Deuda) => {
    setLoadingId(deuda.id);
    try {
      const res = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: deuda.monto,
          title: 'Deuda ' + deuda.dominio + ' — ' + deuda.cuadra + ' | Municipalidad de Salta',
          deudaId: deuda.id,
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert('MercadoPago rechazó la operación:\n\n' + (data.error || 'Desconocido'));
        setLoadingId(null);
      }
    } catch (err: unknown) {
      alert('Error: ' + (err as Error).message);
      setLoadingId(null);
    }
  };

  function tipoLabel(tipo?: string) {
    if (tipo === 'hora_extra') return 'Hora extra';
    if (tipo === 'incumplimiento') return 'Sin pago';
    return 'Multa';
  }

  function tipoColor(tipo?: string) {
    if (tipo === 'hora_extra') return { bg: '#FEF3C7', text: '#92400E' };
    return { bg: '#FEE2E2', text: '#991B1B' };
  }

  if (deudas.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 16px', textAlign: 'center' }}>
        <CheckCircle2 className="w-12 h-12" style={{ color: '#16A34A' }} />
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#15181F' }}>Sin deudas</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#686868' }}>No tenés infracciones ni multas pendientes.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Banners de resultado de pago */}
      {initialBanner === 'success' && (
        <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #16A34A', background: '#F0FDF4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle className="w-5 h-5" style={{ color: '#16A34A', flexShrink: 0 }} />
            <p className="lc-act-title" style={{ color: '#16A34A' }}>Pago aprobado — deuda saldada</p>
          </div>
        </div>
      )}
      {initialBanner === 'failure' && (
        <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #DC2626', background: '#FEF2F2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle className="w-5 h-5" style={{ color: '#DC2626', flexShrink: 0 }} />
            <p className="lc-act-title" style={{ color: '#DC2626' }}>El pago fue rechazado. Podés reintentar.</p>
          </div>
        </div>
      )}

      {/* Resumen total */}
      {pendientes.length > 0 && (
        <div className="lc-card" style={{ padding: '16px 14px', background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#991B1B' }}>
              {pendientes.length === 1 ? '1 deuda pendiente' : pendientes.length + ' deudas pendientes'}
            </p>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#DC2626' }}>
              ${totalPendiente.toLocaleString('es-AR')}
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#B91C1C' }}>
            Dominio: {conductor.dominioDefault}
          </p>
        </div>
      )}

      {/* Lista de deudas pendientes */}
      {pendientes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="lc-section-label" style={{ paddingLeft: 2 }}>Pendientes</p>
          {pendientes.map(deuda => {
            const fecha = new Date(deuda.fecha);
            const { bg, text } = tipoColor(deuda.tipo);
            return (
              <div key={deuda.id} className="lc-card" style={{ padding: '14px', borderLeft: '4px solid #DC2626', gap: 0 }}>

                {/* Fila superior: calle + monto */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <AlertCircle className="w-4 h-4" style={{ color: '#DC2626', flexShrink: 0 }} />
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#15181F' }}>
                        {deuda.cuadra}
                      </p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11,
                      background: bg, color: text, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>
                      {tipoLabel(deuda.tipo)}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#DC2626', lineHeight: 1 }}>
                    ${deuda.monto.toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Fila detalle: fecha y hora */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 14, padding: '8px 10px',
                  background: '#FEF9F9', borderRadius: 8, border: '1px solid #FECACA' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>FECHA</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#374151' }}>
                      {fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </p>
                  </div>
                  <div style={{ width: 1, background: '#FECACA' }} />
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>HORA</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#374151' }}>
                      {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {deuda.minutosExcedidos && (
                    <>
                      <div style={{ width: 1, background: '#FECACA' }} />
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>EXCESO</p>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#DC2626' }}>
                          {deuda.minutosExcedidos} min
                        </p>
                      </div>
                    </>
                  )}
                  {deuda.vencimientoOriginal && (
                    <>
                      <div style={{ width: 1, background: '#FECACA' }} />
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>VENCIÓ</p>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#374151' }}>
                          {new Date(deuda.vencimientoOriginal).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Botón pagar */}
                <button
                  onClick={() => handlePagar(deuda)}
                  disabled={!!loadingId}
                  className="lc-action-btn"
                  style={{
                    background: loadingId === deuda.id ? '#64B5D9' : '#009EE3',
                    color: '#fff', width: '100%',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                    padding: 14, opacity: loadingId && loadingId !== deuda.id ? 0.5 : 1,
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  {loadingId === deuda.id
                    ? 'Conectando con MercadoPago...'
                    : 'Pagar $' + deuda.monto.toLocaleString('es-AR') + ' con MercadoPago'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de deudas pagadas */}
      {pagadas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="lc-section-label" style={{ paddingLeft: 2 }}>Historial pagado</p>
          {pagadas.map(deuda => {
            const fecha = new Date(deuda.fecha);
            return (
              <div key={deuda.id} className="lc-card"
                style={{ padding: '12px 14px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #16A34A' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#16A34A' }} />
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#15181F' }}>{deuda.cuadra}</p>
                  </div>
                  <p className="lc-act-sub">
                    {fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    {' · '}
                    {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#16A34A' }}>
                    ${deuda.monto.toLocaleString('es-AR')}
                  </p>
                  <span className="lc-badge lc-badge--green" style={{ marginTop: 4, display: 'inline-block' }}>Pagada</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pendientes.length === 0 && pagadas.length > 0 && (
        <div className="lc-card" style={{ padding: '12px 14px', borderLeft: '4px solid #16A34A', background: '#F0FDF4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#16A34A' }} />
            <p className="lc-act-title" style={{ color: '#16A34A' }}>Todo al día — sin deudas pendientes</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Aux ────────────────────────────────────────────────────────
function MenuBtn({ icon, label, color, onClick, badge }: { icon: React.ReactNode; label: string; color: string; onClick: () => void; badge?: number }) {
  return (
    <button className="lc-menu-btn" onClick={onClick} style={{ position: 'relative' }}>
      {badge !== undefined && badge > 0 && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          background: '#DC2626', color: '#fff',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10,
          width: 18, height: 18, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}>{badge}</span>
      )}
      <div className="lc-menu-icon" style={{ background: `${color}14`, color }}>{icon}</div>
      <span className="lc-menu-label">{label}</span>
    </button>
  );
}

// ── Estilos inyectados (Idénticos a Admin y Permisionario) ─────
const STYLES = `
  /* ── App shell ── */
  .lc-app {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: #F5F7FA;
    max-width: 480px;
    margin: 0 auto;
    font-family: var(--font-body);
  }

  /* ── Header ── */
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

  /* ── Body ── */
  .lc-body {
    flex: 1;
    padding: 12px 12px 80px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }

  /* ── Greeting card ── */
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
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #64748B;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .lc-greeting-info { flex: 1; }
  .lc-greeting-name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 20px;
    color: #15181F;
    margin: 0;
  }
  .lc-greeting-highlight { color: #2563EB; }
  .lc-ver-perfil {
    font-family: var(--font-body);
    font-size: 13px;
    color: #686868;
    display: block;
    margin-top: 2px;
  }
  .lc-hamburger {
    background: none;
    border: none;
    color: #15181F;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
  }

  /* ── Cards ── */
  .lc-card {
    background: #fff;
    border-radius: 14px;
    padding: 14px 12px;
    box-shadow: 0 1px 4px rgba(21,50,111,0.07);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .lc-legend {
    display: flex; justify-content: center; gap: 14px;
    padding: 10px; font-size: 11px; color: #686868;
    font-family: var(--font-display); font-weight: 600;
  }
  .lc-card-head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lc-card-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 13px;
    color: #15181F;
  }

  /* ── Sections ── */
  .lc-section { padding: 0 4px; margin-top: 6px; }
  .lc-section-label {
    font-family: var(--font-display);
    font-weight: 700; font-size: 13px;
    color: #15181F; margin-bottom: 10px;
    padding-left: 2px;
  }

  /* ── Menu Grid ── */
  .lc-menu-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  }
  .lc-menu-btn {
    background: #fff; border: none; border-radius: 14px;
    padding: 14px 8px; display: flex; flex-direction: column;
    align-items: center; gap: 8px; cursor: pointer;
    box-shadow: 0 1px 4px rgba(21,50,111,0.06);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .lc-menu-btn:active { transform: scale(0.96); box-shadow: 0 0 0 rgba(0,0,0,0); }
  .lc-menu-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .lc-menu-icon svg { width: 20px; height: 20px; }
  .lc-menu-label { font-family: var(--font-display); font-weight: 600; font-size: 11px; color: #15181F; }

  /* ── Activity ── */
  .lc-act-title { font-family: var(--font-display); font-weight: 700; font-size: 13px; color: #15181F; margin: 0; }
  .lc-act-sub { font-family: var(--font-body); font-size: 11px; color: #686868; margin: 0; }

  /* ── Sub Views ── */
  .lc-sub-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px 10px; background: #fff;
    border-bottom: 1px solid #F1F5F9;
    position: sticky; top: 90px; z-index: 10;
  }
  .lc-back-btn {
    background: none; border: none; color: #2563EB;
    cursor: pointer; display: flex; align-items: center; padding: 4px;
  }
  .lc-sub-title {
    font-family: var(--font-display); font-weight: 800;
    font-size: 17px; color: #15181F; margin: 0;
  }

  .lc-badge {
    font-family: var(--font-display); font-weight: 700;
    font-size: 11px; padding: 3px 8px; border-radius: 6px;
  }
  .lc-badge--green { background: #F0FDF4; color: #16A34A; }
  .lc-badge--red { background: #FEF2F2; color: #DC2626; }
  .lc-badge--gray { background: #F1F5F9; color: #64748B; }

  .lc-plate {
    font-family: var(--font-display); font-weight: 800;
    font-size: 13px; background: #F1F5F9; color: #15181F;
    padding: 4px 10px; border-radius: 6px;
    border: 1px solid #E2E8F0; display: inline-block;
  }

  .lc-list-item {
    display: flex; justify-content: space-between; align-items: center;
    flex-direction: row;
  }

  .lc-action-btn {
    flex: 1; border: none; border-radius: 10px;
    padding: 10px; font-family: var(--font-display);
    font-weight: 700; font-size: 13px; cursor: pointer;
    transition: opacity 0.15s; background: #F1F5F9; color: #475569;
  }
  .lc-action-btn:active { opacity: 0.8; }
`;