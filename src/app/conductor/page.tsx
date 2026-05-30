'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Car, Map as MapIcon, FileText, User, AlertCircle, 
  ArrowLeft, CreditCard, CheckCircle2, AlertTriangle, Shield, Clock
} from 'lucide-react';

const AvailabilityMap = dynamic(() => import('@/components/conductor/availability-map'), { ssr: false });
const Heatmap = dynamic(() => import('@/components/admin/heatmap'), { 
  ssr: false,
  loading: () => <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9' }}>Cargando mapa...</div>
});

type ViewType = 'home' | 'vehiculos' | 'mapa' | 'comprobantes' | 'cuenta' | 'reclamos';

// --- MOCK DATA ---
const mockVehiculos = [
  { plate: 'AB 123 CD', model: 'Toyota Corolla', default: true },
  { plate: 'EF 456 GH', model: 'Ford Fiesta', default: false }
];

export default function ConductorPage() {
  const [view, setView] = useState<ViewType>('home');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  if (view !== 'home') {
    return <SubView view={view} onBack={() => setView('home')} />;
  }

  return (
    <div className="adm">
      <style>{STYLES}</style>

      {/* ── Profile Card ── */}
      <div className="adm-profile">
        <div className="adm-profile-bg" />
        <div className="adm-profile-content">
          <div className="adm-avatar">
            <User className="w-8 h-8" style={{ color: '#fff' }} />
          </div>
          <h1 className="adm-name">Juan Pérez</h1>
          <p className="adm-role">Conductor Registrado · AB 123 CD</p>
        </div>
      </div>

      {/* ── Alertas (si hay ticket o deudas) ── */}
      <div className="adm-section">
        <div className="adm-card" style={{ padding: '12px 14px', borderLeft: '4px solid #16A34A', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock className="w-5 h-5" style={{ color: '#16A34A' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="adm-act-title">Estacionado · 45 min restantes</p>
              <p className="adm-act-sub">Independencia 700</p>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#16A34A' }}>45m</span>
          </div>
        </div>

        <div className="adm-card" style={{ padding: '12px 14px', borderLeft: '4px solid #DC2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="adm-act-title" style={{ color: '#DC2626' }}>Deuda Pendiente</p>
              <p className="adm-act-sub">Multa por exceso de tiempo</p>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#DC2626' }}>$1.500</span>
          </div>
        </div>
      </div>

      {/* ── Accesos Funcionales ── */}
      <div className="adm-section">
        <p className="adm-section-label">Módulos</p>
        <div className="adm-menu-grid">
          <MenuBtn icon={<Car />} label="Vehículos" color="#2563EB" onClick={() => setView('vehiculos')} />
          <MenuBtn icon={<MapIcon />} label="Disponibilidad" color="#16A34A" onClick={() => setView('mapa')} />
          <MenuBtn icon={<FileText />} label="Comprobantes" color="#0D9488" onClick={() => setView('comprobantes')} />
          <MenuBtn icon={<User />} label="Mi Cuenta" color="#7C3AED" onClick={() => setView('cuenta')} />
          <MenuBtn icon={<AlertTriangle />} label="Reclamos" color="#EA580C" onClick={() => setView('reclamos')} />
        </div>
      </div>

      {/* ── Mini Mapa de Calor ── */}
      <div className="adm-section" style={{ paddingBottom: 24 }}>
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px 8px' }}>
            <MapIcon className="w-4 h-4" style={{ color: '#2563EB' }} />
            <span className="adm-card-title">Mapa de Calor (En Vivo)</span>
          </div>
          <div style={{ height: 200, borderTop: '1px solid #F1F5F9' }}>
            <Heatmap />
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Sub-views ──────────────────

function SubView({ view, onBack }: { view: ViewType; onBack: () => void }) {
  const titles: Record<ViewType, string> = {
    home: '', mapa: 'Mapa de Disponibilidad', vehiculos: 'Mis Vehículos', 
    comprobantes: 'Comprobantes', cuenta: 'Mi Cuenta', reclamos: 'Centro de Reclamos'
  };

  return (
    <div className="adm">
      <style>{STYLES}</style>

      {/* ── Sub-header ── */}
      <div className="adm-sub-header">
        <button className="adm-back-btn" onClick={onBack}><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="adm-sub-title">{titles[view]}</h2>
        <div style={{ width: 32 }} />
      </div>

      <div className="adm-sub-body" style={{ flex: 1 }}>
        {view === 'mapa' && <MapaView />}
        {view === 'vehiculos' && <VehiculosView />}
        {view === 'comprobantes' && <ComprobantesView />}
        {view === 'cuenta' && <CuentaView />}
        {view === 'reclamos' && <ReclamosView />}
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

function VehiculosView() {
  return (
    <>
      <button className="adm-action-btn adm-action-btn--green" style={{ marginBottom: 12, padding: 14 }}>
        + Agregar Vehículo
      </button>

      {mockVehiculos.map((v, i) => (
        <div key={i} className="adm-card adm-list-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car className="w-5 h-5" style={{ color: '#2563EB' }} />
            </div>
            <div>
              <span className="adm-plate">{v.plate}</span>
              <p className="adm-act-sub" style={{ marginTop: 6 }}>{v.model}</p>
            </div>
          </div>
          {v.default && <span className="adm-badge adm-badge--green">Predeterminado</span>}
        </div>
      ))}

      <div className="adm-card" style={{ marginTop: 12, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <p className="adm-card-title" style={{ color: '#1E3A8A' }}>Acciones Rápidas</p>
        <button className="adm-action-btn" style={{ background: '#2563EB', color: '#fff', width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CreditCard className="w-4 h-4" /> Pagar Estacionamiento
        </button>
      </div>
    </>
  );
}

function ComprobantesView() {
  const comprobantes = [
    { title: 'Estacionamiento - Independencia 700', date: '28 May 2026 · 14:30', amount: '$560' },
    { title: 'Estacionamiento - Belgrano 1200', date: '25 May 2026 · 10:15', amount: '$700' },
    { title: 'Estacionamiento - Caseros 800', date: '20 May 2026 · 16:45', amount: '$1.120' },
  ];
  return (
    <>
      {comprobantes.map((c, i) => (
        <div key={i} className="adm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p className="adm-act-title" style={{ fontSize: 12 }}>{c.title}</p>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#16A34A' }}>{c.amount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="adm-act-sub">{c.date}</p>
            <span className="adm-badge adm-badge--green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 className="w-3 h-3" /> Pagado
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

function CuentaView() {
  const [loadingMp, setLoadingMp] = useState(false);
  const deudaBase = 700;
  const descuento = deudaBase * 0.20; // 20% de descuento por pago digital según ordenanza
  const totalAPagar = deudaBase - descuento;

  const handlePago = async () => {
    setLoadingMp(true);
    try {
      const res = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAPagar, title: 'Pago Digital de Deuda (Descuento 20% Aplicado) - Municipalidad de Salta' })
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(`Mercado Pago rechazó la operación:\n\n${data.error || 'Desconocido'}\nDetalle: ${data.details || ''}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error en el servidor: ${err.message || err.toString()}\n\n(Tip: Si acabamos de instalar Mercado Pago, por favor REINICIÁ la terminal donde corre Next.js - ctrl+c y npm run dev)`);
    } finally {
      setLoadingMp(false);
    }
  };

  return (
    <>
      <div className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
        <div className="adm-avatar" style={{ width: 60, height: 60, border: '2px solid #fff' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#fff' }}>JP</span>
        </div>
        <div>
          <h2 className="adm-name" style={{ fontSize: 18, margin: 0 }}>Juan Pérez</h2>
          <p className="adm-role">juan.perez@ejemplo.com</p>
        </div>
      </div>

      <div className="adm-card" style={{ padding: '16px 14px', borderLeft: '4px solid #DC2626', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p className="adm-act-title" style={{ color: '#DC2626' }}>Deuda Pendiente</p>
            <p className="adm-act-sub">Infracción #4829</p>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#DC2626', textDecoration: 'line-through', opacity: 0.5 }}>${deudaBase}</span>
        </div>

        <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '10px 12px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #BBF7D0' }}>
          <div>
            <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, display: 'block' }}>DESCUENTO 20% (PAGO DIGITAL)</span>
            <span style={{ fontSize: 11, color: '#15803D' }}>Según Ordenanza N.º 12.170</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#16A34A', display: 'block' }}>${totalAPagar}</span>
          </div>
        </div>

        <button 
          onClick={handlePago}
          disabled={loadingMp}
          className="adm-action-btn" 
          style={{ background: '#009EE3', color: '#fff', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14 }}
        >
          {loadingMp ? 'Conectando...' : 'Pagar Deuda con Mercado Pago'}
        </button>
      </div>

      <div className="adm-card" style={{ marginTop: 8, padding: 0 }}>
        <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: 16, background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#15181F' }}>
          Datos Personales <span style={{ color: '#94A3B8' }}>›</span>
        </button>
        <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: 16, background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#15181F' }}>
          Métodos de Pago <span style={{ color: '#94A3B8' }}>›</span>
        </button>
        <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: 16, background: 'none', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#DC2626' }}>
          Cerrar Sesión
        </button>
      </div>
    </>
  );
}

function ReclamosView() {
  return (
    <div className="adm-card" style={{ padding: 16 }}>
      <p className="adm-card-title" style={{ marginBottom: 16 }}>Iniciá un trámite o consulta</p>
      
      <div style={{ marginBottom: 12 }}>
        <label className="adm-section-label" style={{ display: 'block', fontSize: 11, color: '#686868' }}>Motivo</label>
        <select style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}>
          <option>Ticket cobrado erróneamente</option>
          <option>Vehículo mal estacionado</option>
          <option>Consulta general</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="adm-section-label" style={{ display: 'block', fontSize: 11, color: '#686868' }}>Mensaje</label>
        <textarea rows={4} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', resize: 'none' }} placeholder="Describí tu situación..."></textarea>
      </div>

      <button className="adm-action-btn" style={{ background: '#2563EB', color: '#fff', width: '100%' }}>
        Enviar Reclamo
      </button>
    </div>
  );
}

// ── Aux ────────────────────────────────────────────────────────
function MenuBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button className="adm-menu-btn" onClick={onClick}>
      <div className="adm-menu-icon" style={{ background: `${color}14`, color }}>{icon}</div>
      <span className="adm-menu-label">{label}</span>
    </button>
  );
}

// ── Estilos inyectados (Idénticos a Admin) ─────────────────────
const STYLES = `
  .adm { font-family: var(--font-body); min-height: 100%; display: flex; flex-direction: column; }
  .adm-profile { position: relative; padding-bottom: 20px; flex-shrink: 0; }
  .adm-profile-bg { height: 110px; background: linear-gradient(135deg, #15326F 0%, #2563EB 100%); border-radius: 0 0 28px 28px; }
  .adm-profile-content { position: relative; margin-top: -50px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .adm-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #2563EB, #15326F); border: 4px solid #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(21,50,111,0.2); }
  .adm-name { font-family: var(--font-display); font-weight: 800; font-size: 20px; color: #15181F; margin: 8px 0 2px; }
  .adm-role { font-family: var(--font-body); font-size: 12px; color: #686868; }
  .adm-section { padding: 0 14px; margin-bottom: 16px; flex-shrink: 0; }
  .adm-section-label { font-family: var(--font-display); font-weight: 700; font-size: 13px; color: #15181F; margin-bottom: 10px; padding-left: 2px; }
  .adm-card { background: #fff; border-radius: 14px; padding: 14px; box-shadow: 0 1px 4px rgba(21,50,111,0.06); margin-bottom: 8px; }
  .adm-card-title { font-family: var(--font-display); font-weight: 700; font-size: 13px; color: #15181F; }
  .adm-menu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .adm-menu-btn { background: #fff; border: none; border-radius: 14px; padding: 14px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 1px 4px rgba(21,50,111,0.06); transition: transform 0.15s, box-shadow 0.15s; }
  .adm-menu-btn:active { transform: scale(0.96); box-shadow: 0 0 0 rgba(0,0,0,0); }
  .adm-menu-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .adm-menu-icon svg { width: 20px; height: 20px; }
  .adm-menu-label { font-family: var(--font-display); font-weight: 600; font-size: 11px; color: #15181F; }
  .adm-act-title { font-family: var(--font-display); font-weight: 700; font-size: 13px; color: #15181F; margin: 0; }
  .adm-act-sub { font-family: var(--font-body); font-size: 11px; color: #686868; margin: 0; }
  .adm-sub-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 10px; background: #fff; border-bottom: 1px solid #F1F5F9; position: sticky; top: 0; z-index: 10; flex-shrink: 0; }
  .adm-back-btn { background: none; border: none; color: #2563EB; cursor: pointer; display: flex; align-items: center; padding: 4px; }
  .adm-sub-title { font-family: var(--font-display); font-weight: 800; font-size: 17px; color: #15181F; margin: 0; }
  .adm-sub-body { padding: 12px 14px 24px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .adm-badge { font-family: var(--font-display); font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 6px; }
  .adm-badge--green { background: #F0FDF4; color: #16A34A; }
  .adm-plate { font-family: var(--font-display); font-weight: 800; font-size: 13px; background: #F1F5F9; color: #15181F; padding: 4px 10px; border-radius: 6px; border: 1px solid #E2E8F0; display: inline-block; }
  .adm-list-item { display: flex; justify-content: space-between; align-items: center; }
  .adm-action-btn { flex: 1; border: none; border-radius: 10px; padding: 10px; font-family: var(--font-display); font-weight: 700; font-size: 13px; cursor: pointer; transition: opacity 0.15s; }
  .adm-action-btn:active { opacity: 0.8; }
  .adm-action-btn--green { background: #F0FDF4; color: #16A34A; }
`;
