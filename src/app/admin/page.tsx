'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  User, Shield, MapPin, Car, AlertTriangle, Wallet, TrendingUp,
  CheckCircle, UserCheck, DollarSign, BarChart3, FileText,
  Settings, Map, ParkingCircle, CreditCard, Activity, ChevronRight,
  ArrowLeft, Menu
} from 'lucide-react';

const Heatmap = dynamic(() => import('@/components/admin/heatmap'), {
  ssr: false,
  loading: () => <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', borderRadius: 12, color: '#94A3B8', fontSize: 13 }}>Cargando mapa...</div>
});

// ── Tipos de vista ──
type ViewMode = 'home' | 'mapa' | 'vehiculos' | 'estacionamientos' | 'infracciones' | 'previsores' | 'cobros' | 'tramites' | 'reportes' | 'configuracion';

const INITIAL_KPIS = {
  vehiculos: 128450,
  estacionamientos: 34892,
  recaudacion: 12450000,
  deudas: 3245,
  previsores: 156
};

export default function AdminDashboard() {
  const [view, setView] = useState<ViewMode>('home');
  const [kpis, setKpis] = useState(INITIAL_KPIS);

  useEffect(() => {
    const interval = setInterval(() => {
      setKpis(prev => ({
        ...prev,
        estacionamientos: prev.estacionamientos + Math.floor(Math.random() * 5),
        recaudacion: prev.recaudacion + (Math.floor(Math.random() * 50) * 100)
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (view !== 'home') {
    return <SubView view={view} onBack={() => setView('home')} />;
  }

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
            <Shield className="w-7 h-7" style={{ color: '#fff' }} />
          </div>
          <div className="lc-greeting-info">
            <p className="lc-greeting-name">
              Hola, <span className="lc-greeting-highlight">Administrador</span>
            </p>
            <span className="lc-ver-perfil">
              Control Operativo
            </span>
          </div>
          <button className="lc-hamburger">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* ── KPIs ── */}
        <div className="lc-stats-grid">
          <div className="lc-card">
            <div className="lc-card-head">
              <TrendingUp className="w-4 h-4" style={{ color: '#2563EB' }} />
              <span className="lc-card-title">Resumen Operativo</span>
            </div>
            <KpiCard icon={<Car className="w-4 h-4" />} bg="#EFF6FF" color="#2563EB"
              label="Vehículos" value={kpis.vehiculos.toLocaleString('es-AR')} trend="+12%" />
            <KpiCard icon={<ParkingCircle className="w-4 h-4" />} bg="#F0FDF4" color="#16A34A"
              label="Estac. hoy" value={kpis.estacionamientos.toLocaleString('es-AR')} trend="+8%" />
            <KpiCard icon={<DollarSign className="w-4 h-4" />} bg="#EFF6FF" color="#2563EB"
              label="Recaudación" value={`$${(kpis.recaudacion / 1000000).toFixed(1)}M`} trend="+15%" />
            <KpiCard icon={<AlertTriangle className="w-4 h-4" />} bg="#FFF7ED" color="#EA580C"
              label="Deudas" value={kpis.deudas.toLocaleString('es-AR')} trend="+5%" negative />
          </div>

          <div className="lc-card">
            <div className="lc-card-head">
              <MapPin className="w-4 h-4" style={{ color: '#2563EB' }} />
              <span className="lc-card-title">Disponibilidad en vivo</span>
            </div>
            <div style={{ height: 160, borderRadius: 10, overflow: 'hidden', marginTop: 4 }}>
              <Heatmap />
            </div>
          </div>
        </div>

        {/* ── Accesos Funcionales ── */}
        <div className="lc-section">
          <p className="lc-section-label">Gestión Operativa</p>
          <div className="lc-menu-grid">
            <MenuBtn icon={<Map />} label="Mapa de calor" color="#2563EB" onClick={() => setView('mapa')} />
            <MenuBtn icon={<Car />} label="Vehículos" color="#0891B2" onClick={() => setView('vehiculos')} />
            <MenuBtn icon={<ParkingCircle />} label="Estacionam." color="#16A34A" onClick={() => setView('estacionamientos')} />
            <MenuBtn icon={<AlertTriangle />} label="Infracciones" color="#EA580C" onClick={() => setView('infracciones')} />
            <MenuBtn icon={<UserCheck />} label="Previsores" color="#7C3AED" onClick={() => setView('previsores')} />
            <MenuBtn icon={<CreditCard />} label="Cobros" color="#0D9488" onClick={() => setView('cobros')} />
            <MenuBtn icon={<FileText />} label="Trámites" color="#2563EB" onClick={() => setView('tramites')} />
            <MenuBtn icon={<BarChart3 />} label="Reportes" color="#D97706" onClick={() => setView('reportes')} />
            <MenuBtn icon={<Settings />} label="Config." color="#64748B" onClick={() => setView('configuracion')} />
          </div>
        </div>

        {/* ── Actividad ── */}
        <div className="lc-section" style={{ paddingBottom: 24 }}>
          <p className="lc-section-label">Actividad Reciente</p>
          <div className="lc-card">
            {[
              { text: 'Pago realizado', sub: 'ABC 123 – Zona Centro', time: '2 min', val: '$60', ok: true },
              { text: 'Nuevo estacionamiento', sub: 'DEF 456 – Zona Norte', time: '5 min', val: '$50', ok: true },
              { text: 'Infracción registrada', sub: 'GHI 789 – Exceso de tiempo', time: '8 min', val: '$1.200', ok: false },
              { text: 'Pago realizado', sub: 'JKL 012 – Zona Sur', time: '10 min', val: '$60', ok: true },
            ].map((a, i) => (
              <div key={i} className="lc-act-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`lc-dot ${a.ok ? 'lc-dot--green' : 'lc-dot--red'}`} />
                  <div>
                    <p className="lc-act-title">{a.text}</p>
                    <p className="lc-act-sub">{a.sub}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="lc-act-time">Hace {a.time}</p>
                  <p className={`lc-act-val ${!a.ok ? 'lc-act-val--red' : ''}`}>{a.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-views ──────────────────

function SubView({ view, onBack }: { view: ViewMode; onBack: () => void }) {
  const titles: Record<ViewMode, string> = {
    home: '', mapa: 'Mapa de Calor', vehiculos: 'Parque Vehicular', estacionamientos: 'Sesiones',
    infracciones: 'Infracciones', previsores: 'Previsores', cobros: 'Dashboard Financiero',
    tramites: 'Trámites', reportes: 'Reportes', configuracion: 'Configuración'
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

      <div className="lc-body">
        {view === 'mapa' && <MapaView />}
        {view === 'vehiculos' && <VehiculosView />}
        {view === 'estacionamientos' && <EstacionamientosView />}
        {view === 'infracciones' && <InfraccionesView />}
        {view === 'previsores' && <PrevisoresView />}
        {view === 'cobros' && <CobrosView />}
        {view === 'tramites' && <TramitesView />}
        {view === 'reportes' && <ReportesView />}
        {view === 'configuracion' && <ConfigView />}
      </div>
    </div>
  );
}

function MapaView() {
  return (
    <>
      <div className="lc-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 350 }}><Heatmap /></div>
      </div>
      <div className="lc-legend">
        <span><span className="lc-dot lc-dot--green" /> Alta</span>
        <span><span className="lc-dot lc-dot--orange" /> Media</span>
        <span><span className="lc-dot" style={{background: '#D97706'}} /> Baja</span>
        <span><span className="lc-dot lc-dot--red" /> Muy baja</span>
      </div>
    </>
  );
}

function VehiculosView() {
  const vehicles = [
    { plate: 'AD 123 A', model: 'Toyota Hilux', owner: 'Juan Pérez', status: 'Activo' },
    { plate: 'BC 456 D', model: 'VW Gol', owner: 'María López', status: 'Activo' },
    { plate: 'EF 789 G', model: 'Ford Ranger', owner: 'Carlos Ruiz', status: 'Deudor' },
    { plate: 'GH 012 J', model: 'Renault Sandero', owner: 'Ana García', status: 'Activo' },
  ];
  return (
    <>
      {vehicles.map((v, i) => (
        <div key={i} className="lc-card lc-list-item">
          <div>
            <span className="lc-plate">{v.plate}</span>
            <p className="lc-act-title" style={{ marginTop: 6 }}>{v.model}</p>
            <p className="lc-act-sub">{v.owner}</p>
          </div>
          <span className={`lc-badge ${v.status === 'Deudor' ? 'lc-badge--red' : 'lc-badge--green'}`}>{v.status}</span>
        </div>
      ))}
    </>
  );
}

function EstacionamientosView() {
  const sessions = [
    { plate: 'AB 101 CD', zone: 'Zona Centro – Belgrano 1200', time: '10:00 – 12:00', amount: '$300', active: true },
    { plate: 'EF 202 GH', zone: 'Zona Norte – Güemes 500', time: '09:30 – 11:30', amount: '$250', active: false },
    { plate: 'IJ 303 KL', zone: 'Zona Sur – San Martín 800', time: '11:00 – 13:00', amount: '$400', active: true },
  ];
  return (
    <>
      {sessions.map((s, i) => (
        <div key={i} className="lc-card lc-list-item">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="lc-plate">{s.plate}</span>
              <span className={`lc-badge ${s.active ? 'lc-badge--green' : 'lc-badge--gray'}`}>{s.active ? 'Activo' : 'Finalizado'}</span>
            </div>
            <p className="lc-act-sub" style={{ marginTop: 4 }}>{s.zone}</p>
            <p className="lc-act-sub">{s.time} · {s.amount}</p>
          </div>
        </div>
      ))}
    </>
  );
}

function InfraccionesView() {
  const infracciones = [
    { plate: 'AA 145 BB', reason: 'Estacionamiento sin ticket', previsor: 'Carlos M.', amount: '$15.000' },
    { plate: 'CC 267 DD', reason: 'Exceso de tiempo permitido', previsor: 'Laura G.', amount: '$8.500' },
    { plate: 'EE 389 FF', reason: 'Zona prohibida', previsor: 'Pedro R.', amount: '$20.000' },
  ];
  return (
    <>
      {infracciones.map((inf, i) => (
        <div key={i} className="lc-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="lc-plate" style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>{inf.plate}</span>
            <span className="lc-act-time">Pendiente</span>
          </div>
          <p className="lc-act-title">{inf.reason}</p>
          <p className="lc-act-sub">Previsor: {inf.previsor}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 10 }}>
            <span className="lc-act-sub">Importe</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#15181F' }}>{inf.amount}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="lc-action-btn" style={{ background: '#F0FDF4', color: '#16A34A' }}>✓ Aprobar</button>
            <button className="lc-action-btn lc-action-btn--red">✕ Anular</button>
          </div>
        </div>
      ))}
    </>
  );
}

function PrevisoresView() {
  const previsores = [
    { name: 'Carlos Martínez', legajo: '#1001', zone: 'Sector A', battery: '85%', status: 'Conectado' },
    { name: 'Laura Gómez', legajo: '#1002', zone: 'Sector B', battery: '72%', status: 'Conectado' },
    { name: 'Pedro Rodríguez', legajo: '#1003', zone: 'Sector C', battery: '45%', status: 'Desconectado' },
  ];
  return (
    <>
      {previsores.map((p, i) => (
        <div key={i} className="lc-card lc-list-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck className="w-5 h-5" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <p className="lc-act-title">{p.name}</p>
              <p className="lc-act-sub">{p.legajo} · {p.zone}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`lc-badge ${p.status === 'Conectado' ? 'lc-badge--green' : 'lc-badge--red'}`}>{p.status}</span>
            <p className="lc-act-sub" style={{ marginTop: 4 }}>🔋 {p.battery}</p>
          </div>
        </div>
      ))}
    </>
  );
}

function CobrosView() {
  const medios = [
    { label: 'Efectivo', value: '$4.500.000', color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Mercado Pago (QR)', value: '$5.200.000', color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Tarjetas', value: '$2.100.000', color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Billeteras Virtuales', value: '$650.000', color: '#D97706', bg: '#FFFBEB' },
  ];
  return (
    <>
      {medios.map((m, i) => (
        <div key={i} className="lc-card lc-list-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign className="w-4 h-4" style={{ color: m.color }} />
            </div>
            <span className="lc-act-title">{m.label}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: m.color }}>{m.value}</span>
        </div>
      ))}
    </>
  );
}

function TramitesView() {
  const tramites = [
    { tipo: 'RECLAMO', ticket: '#9001', title: 'Inconveniente con pago QR', dni: '30.123.401' },
    { tipo: 'EXENCIÓN', ticket: '#9002', title: 'Solicitud de exención por discapacidad', dni: '28.456.789' },
    { tipo: 'CONSULTA', ticket: '#9003', title: 'Consulta sobre zona de estacionamiento', dni: '35.987.654' },
  ];
  return (
    <>
      {tramites.map((t, i) => (
        <div key={i} className="lc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="lc-badge lc-badge--red" style={{ fontSize: 10 }}>{t.tipo}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#15181F' }}>{t.ticket}</span>
          </div>
          <p className="lc-act-title">{t.title}</p>
          <p className="lc-act-sub">DNI: {t.dni}</p>
        </div>
      ))}
    </>
  );
}

function ReportesView() {
  const reportes = [
    { title: 'Ocupación por Zona', desc: 'Análisis de uso y rotación vehicular' },
    { title: 'Recaudación Consolidada', desc: 'Ingresos por medios de pago y sectores' },
    { title: 'Rendimiento de Previsores', desc: 'Actividad y tiempos de conexión' },
    { title: 'Infracciones Emitidas', desc: 'Estadísticas de multas y motivos' },
  ];
  return (
    <>
      {reportes.map((r, i) => (
        <div key={i} className="lc-card lc-list-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 className="w-4 h-4" style={{ color: '#D97706' }} />
            </div>
            <div>
              <p className="lc-act-title">{r.title}</p>
              <p className="lc-act-sub">{r.desc}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: '#94A3B8' }} />
        </div>
      ))}
    </>
  );
}

function ConfigView() {
  const items = [
    { label: 'Tarifa Base (Hora)', value: '$150.00' },
    { label: 'Horario L-V', value: '08:00 – 20:00' },
    { label: 'Feriados', value: 'Libre' },
  ];
  const roles = ['Super Admin', 'Administrador Municipal', 'Supervisor', 'Auditor / Consulta'];
  return (
    <>
      <div className="lc-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Settings className="w-4 h-4" style={{ color: '#2563EB' }} />
          <span className="lc-card-title">Horarios y Tarifas SEM</span>
        </div>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <span className="lc-act-sub">{it.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#15181F' }}>{it.value}</span>
          </div>
        ))}
      </div>
      <div className="lc-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Shield className="w-4 h-4" style={{ color: '#2563EB' }} />
          <span className="lc-card-title">Usuarios y Roles (RBAC)</span>
        </div>
        {roles.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#F8FAFC', borderRadius: 10, marginBottom: 6 }}>
            <User className="w-4 h-4" style={{ color: '#94A3B8' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#15181F', fontWeight: 500 }}>{r}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Componentes auxiliares ─────────────────────────────────────

function KpiCard({ icon, bg, color, label, value, trend, negative }: {
  icon: React.ReactNode; bg: string; color: string;
  label: string; value: string; trend: string; negative?: boolean;
}) {
  return (
    <div className="lc-stat-row" style={{ flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="lc-stat-icon" style={{ background: bg, color }}>{icon}</div>
        <div>
          <div className="lc-stat-label">{label}</div>
          <div className="lc-stat-value" style={{ color: '#15181F', fontSize: 18 }}>{value}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: negative ? '#DC2626' : '#16A34A', paddingLeft: 2 }}>{trend} vs ayer</div>
    </div>
  );
}

function MenuBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button className="lc-menu-btn" onClick={onClick}>
      <div className="lc-menu-icon" style={{ background: `${color}14`, color }}>{icon}</div>
      <span className="lc-menu-label">{label}</span>
    </button>
  );
}

// ── Estilos inyectados ─────────────────────────────────────────

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
    height: 90px;
    width: auto;
    display: block;
    object-fit: contain;
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

  /* ── Stats ── */
  .lc-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .lc-stat-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .lc-stat-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .lc-stat-label {
    font-family: var(--font-body);
    font-size: 11px;
    color: #686868;
    line-height: 1.3;
  }
  .lc-stat-value {
    font-family: var(--font-display);
    font-weight: 800;
    line-height: 1.15;
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
  .lc-act-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 0; border-bottom: 1px solid #F8FAFC;
  }
  .lc-act-row:last-child { border-bottom: none; }
  .lc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .lc-dot--green { background: #22C55E; }
  .lc-dot--red { background: #DC2626; }
  .lc-dot--orange { background: #F97316; }
  .lc-act-title { font-family: var(--font-display); font-weight: 700; font-size: 13px; color: #15181F; margin: 0; }
  .lc-act-sub { font-family: var(--font-body); font-size: 11px; color: #686868; margin: 0; }
  .lc-act-time { font-family: var(--font-body); font-size: 11px; color: #94A3B8; }
  .lc-act-val { font-family: var(--font-display); font-weight: 700; font-size: 13px; color: #15181F; }
  .lc-act-val--red { color: #DC2626; }

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
    flex-direction: row; /* reset direction for card */
  }

  .lc-action-btn {
    flex: 1; border: none; border-radius: 10px;
    padding: 10px; font-family: var(--font-display);
    font-weight: 700; font-size: 13px; cursor: pointer;
    transition: opacity 0.15s; background: #F1F5F9; color: #475569;
  }
  .lc-action-btn:active { opacity: 0.8; }
  .lc-action-btn--red { background: #FEF2F2; color: #DC2626; }

  .lc-legend {
    display: flex; justify-content: center; gap: 14px;
    padding: 10px; font-size: 11px; color: #686868;
    font-family: var(--font-display); font-weight: 600;
  }
`;
