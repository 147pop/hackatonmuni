'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  User, Shield, MapPin, Car, AlertTriangle, Wallet, TrendingUp,
  CheckCircle, UserCheck, DollarSign, BarChart3, FileText,
  Settings, Map, ParkingCircle, CreditCard, Activity, ChevronRight,
  ArrowLeft
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
    <div className="adm">
      <style>{STYLES}</style>

      {/* ── Profile Card ── */}
      <div className="adm-profile">
        <div className="adm-profile-bg" />
        <div className="adm-profile-content">
          <div className="adm-avatar">
            <Shield className="w-8 h-8" style={{ color: '#fff' }} />
          </div>
          <h1 className="adm-name">Panel Administrador</h1>
          <p className="adm-role">Municipalidad de Salta · Control Operativo</p>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="adm-section">
        <div className="adm-kpi-grid">
          <KpiCard icon={<Car className="w-4 h-4" />} bg="#EFF6FF" color="#2563EB"
            label="Vehículos" value={kpis.vehiculos.toLocaleString('es-AR')} trend="+12%" positive />
          <KpiCard icon={<ParkingCircle className="w-4 h-4" />} bg="#F0FDF4" color="#16A34A"
            label="Estac. hoy" value={kpis.estacionamientos.toLocaleString('es-AR')} trend="+8%" positive />
          <KpiCard icon={<DollarSign className="w-4 h-4" />} bg="#EFF6FF" color="#2563EB"
            label="Recaudación" value={`$${(kpis.recaudacion / 1000000).toFixed(1)}M`} trend="+15%" positive />
          <KpiCard icon={<AlertTriangle className="w-4 h-4" />} bg="#FFF7ED" color="#EA580C"
            label="Deudas" value={kpis.deudas.toLocaleString('es-AR')} trend="+5%" positive={false} />
        </div>
      </div>

      {/* ── Mini Mapa ── */}
      <div className="adm-section">
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px 8px' }}>
            <MapPin className="w-4 h-4" style={{ color: '#2563EB' }} />
            <span className="adm-card-title">Disponibilidad en tiempo real</span>
          </div>
          <div style={{ height: 200, borderTop: '1px solid #F1F5F9' }}>
            <Heatmap />
          </div>
        </div>
      </div>

      {/* ── Accesos Funcionales ── */}
      <div className="adm-section">
        <p className="adm-section-label">Gestión Operativa</p>
        <div className="adm-menu-grid">
          <MenuBtn icon={<Map />} label="Mapa de calor" color="#2563EB" onClick={() => setView('mapa')} />
          <MenuBtn icon={<Car />} label="Vehículos" color="#0891B2" onClick={() => setView('vehiculos')} />
          <MenuBtn icon={<ParkingCircle />} label="Estacion." color="#16A34A" onClick={() => setView('estacionamientos')} />
          <MenuBtn icon={<AlertTriangle />} label="Infracciones" color="#EA580C" onClick={() => setView('infracciones')} />
          <MenuBtn icon={<UserCheck />} label="Previsores" color="#7C3AED" onClick={() => setView('previsores')} />
          <MenuBtn icon={<CreditCard />} label="Cobros" color="#0D9488" onClick={() => setView('cobros')} />
          <MenuBtn icon={<FileText />} label="Trámites" color="#2563EB" onClick={() => setView('tramites')} />
          <MenuBtn icon={<BarChart3 />} label="Reportes" color="#D97706" onClick={() => setView('reportes')} />
          <MenuBtn icon={<Settings />} label="Config." color="#64748B" onClick={() => setView('configuracion')} />
        </div>
      </div>

      {/* ── Actividad ── */}
      <div className="adm-section" style={{ paddingBottom: 24 }}>
        <p className="adm-section-label">Actividad Reciente</p>
        <div className="adm-card">
          {[
            { text: 'Pago realizado', sub: 'ABC 123 – Zona Centro', time: '2 min', val: '$60', ok: true },
            { text: 'Nuevo estacionamiento', sub: 'DEF 456 – Zona Norte', time: '5 min', val: '$50', ok: true },
            { text: 'Infracción registrada', sub: 'GHI 789 – Exceso de tiempo', time: '8 min', val: '$1.200', ok: false },
            { text: 'Pago realizado', sub: 'JKL 012 – Zona Sur', time: '10 min', val: '$60', ok: true },
          ].map((a, i) => (
            <div key={i} className="adm-act-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`adm-dot ${a.ok ? 'adm-dot--green' : 'adm-dot--red'}`} />
                <div>
                  <p className="adm-act-title">{a.text}</p>
                  <p className="adm-act-sub">{a.sub}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="adm-act-time">Hace {a.time}</p>
                <p className={`adm-act-val ${!a.ok ? 'adm-act-val--red' : ''}`}>{a.val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-views (contenido inventado por módulo) ──────────────────

function SubView({ view, onBack }: { view: ViewMode; onBack: () => void }) {
  const titles: Record<ViewMode, string> = {
    home: '', mapa: 'Mapa de Calor', vehiculos: 'Parque Vehicular', estacionamientos: 'Sesiones',
    infracciones: 'Infracciones', previsores: 'Previsores', cobros: 'Dashboard Financiero',
    tramites: 'Trámites', reportes: 'Reportes', configuracion: 'Configuración'
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

      <div className="adm-sub-body">
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
      <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 350 }}><Heatmap /></div>
      </div>
      <div className="adm-legend">
        <span><span className="adm-legend-dot" style={{ background: '#1A7A4A' }} /> Alta</span>
        <span><span className="adm-legend-dot" style={{ background: '#F59E0B' }} /> Media</span>
        <span><span className="adm-legend-dot" style={{ background: '#D97706' }} /> Baja</span>
        <span><span className="adm-legend-dot" style={{ background: '#D93025' }} /> Muy baja</span>
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
        <div key={i} className="adm-card adm-list-item">
          <div>
            <span className="adm-plate">{v.plate}</span>
            <p className="adm-act-title" style={{ marginTop: 6 }}>{v.model}</p>
            <p className="adm-act-sub">{v.owner}</p>
          </div>
          <span className={`adm-badge ${v.status === 'Deudor' ? 'adm-badge--red' : 'adm-badge--green'}`}>{v.status}</span>
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
        <div key={i} className="adm-card adm-list-item">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="adm-plate">{s.plate}</span>
              <span className={`adm-badge ${s.active ? 'adm-badge--green' : 'adm-badge--gray'}`}>{s.active ? 'Activo' : 'Finalizado'}</span>
            </div>
            <p className="adm-act-sub" style={{ marginTop: 4 }}>{s.zone}</p>
            <p className="adm-act-sub">{s.time} · {s.amount}</p>
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
        <div key={i} className="adm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="adm-plate" style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>{inf.plate}</span>
            <span className="adm-act-time">Pendiente</span>
          </div>
          <p className="adm-act-title">{inf.reason}</p>
          <p className="adm-act-sub">Previsor: {inf.previsor}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 10 }}>
            <span className="adm-act-sub">Importe</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#15181F' }}>{inf.amount}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="adm-action-btn adm-action-btn--green">✓ Aprobar</button>
            <button className="adm-action-btn adm-action-btn--red">✕ Anular</button>
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
        <div key={i} className="adm-card adm-list-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck className="w-5 h-5" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <p className="adm-act-title">{p.name}</p>
              <p className="adm-act-sub">{p.legajo} · {p.zone}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`adm-badge ${p.status === 'Conectado' ? 'adm-badge--green' : 'adm-badge--red'}`}>{p.status}</span>
            <p className="adm-act-sub" style={{ marginTop: 4 }}>🔋 {p.battery}</p>
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
        <div key={i} className="adm-card adm-list-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign className="w-4 h-4" style={{ color: m.color }} />
            </div>
            <span className="adm-act-title">{m.label}</span>
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
        <div key={i} className="adm-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="adm-badge adm-badge--red" style={{ fontSize: 10 }}>{t.tipo}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#15181F' }}>{t.ticket}</span>
          </div>
          <p className="adm-act-title">{t.title}</p>
          <p className="adm-act-sub">DNI: {t.dni}</p>
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
        <div key={i} className="adm-card adm-list-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 className="w-4 h-4" style={{ color: '#D97706' }} />
            </div>
            <div>
              <p className="adm-act-title">{r.title}</p>
              <p className="adm-act-sub">{r.desc}</p>
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
      <div className="adm-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Settings className="w-4 h-4" style={{ color: '#2563EB' }} />
          <span className="adm-card-title">Horarios y Tarifas SEM</span>
        </div>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <span className="adm-act-sub">{it.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#15181F' }}>{it.value}</span>
          </div>
        ))}
      </div>
      <div className="adm-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Shield className="w-4 h-4" style={{ color: '#2563EB' }} />
          <span className="adm-card-title">Usuarios y Roles (RBAC)</span>
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

function KpiCard({ icon, bg, color, label, value, trend, positive }: {
  icon: React.ReactNode; bg: string; color: string;
  label: string; value: string; trend: string; positive: boolean;
}) {
  return (
    <div className="adm-kpi">
      <div className="adm-kpi-icon" style={{ background: bg, color }}>{icon}</div>
      <p className="adm-kpi-label">{label}</p>
      <p className="adm-kpi-value">{value}</p>
      <p className="adm-kpi-trend" style={{ color: positive ? '#16A34A' : '#DC2626' }}>{trend} vs ayer</p>
    </div>
  );
}

function MenuBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button className="adm-menu-btn" onClick={onClick}>
      <div className="adm-menu-icon" style={{ background: `${color}14`, color }}>{icon}</div>
      <span className="adm-menu-label">{label}</span>
    </button>
  );
}

// ── Estilos inyectados ─────────────────────────────────────────

const STYLES = `
  .adm {
    font-family: var(--font-body);
    min-height: 100%;
  }

  /* Profile */
  .adm-profile { position: relative; padding-bottom: 20px; }
  .adm-profile-bg {
    height: 110px;
    background: linear-gradient(135deg, #15326F 0%, #2563EB 100%);
    border-radius: 0 0 28px 28px;
  }
  .adm-profile-content {
    position: relative;
    margin-top: -50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .adm-avatar {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563EB, #15326F);
    border: 4px solid #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(21,50,111,0.2);
  }
  .adm-name {
    font-family: var(--font-display);
    font-weight: 800; font-size: 20px;
    color: #15181F; margin: 8px 0 2px;
  }
  .adm-role {
    font-family: var(--font-body);
    font-size: 12px; color: #686868;
  }

  /* Section */
  .adm-section { padding: 0 14px; margin-bottom: 16px; }
  .adm-section-label {
    font-family: var(--font-display);
    font-weight: 700; font-size: 13px;
    color: #15181F; margin-bottom: 10px;
    padding-left: 2px;
  }

  /* KPIs */
  .adm-kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .adm-kpi {
    background: #fff; border-radius: 14px;
    padding: 12px; box-shadow: 0 1px 4px rgba(21,50,111,0.06);
  }
  .adm-kpi-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
  .adm-kpi-label { font-size: 11px; color: #686868; margin-bottom: 2px; }
  .adm-kpi-value { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: #15181F; line-height: 1.15; }
  .adm-kpi-trend { font-size: 10px; font-weight: 600; margin-top: 2px; }

  /* Card */
  .adm-card {
    background: #fff; border-radius: 14px;
    padding: 14px; box-shadow: 0 1px 4px rgba(21,50,111,0.06);
    margin-bottom: 8px;
  }
  .adm-card-title {
    font-family: var(--font-display);
    font-weight: 700; font-size: 13px; color: #15181F;
  }

  /* Menu grid */
  .adm-menu-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  }
  .adm-menu-btn {
    background: #fff; border: none; border-radius: 14px;
    padding: 14px 8px; display: flex; flex-direction: column;
    align-items: center; gap: 8px; cursor: pointer;
    box-shadow: 0 1px 4px rgba(21,50,111,0.06);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .adm-menu-btn:active { transform: scale(0.96); box-shadow: 0 0 0 rgba(0,0,0,0); }
  .adm-menu-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .adm-menu-icon svg { width: 20px; height: 20px; }
  .adm-menu-label { font-family: var(--font-display); font-weight: 600; font-size: 11px; color: #15181F; }

  /* Activity */
  .adm-act-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 0; border-bottom: 1px solid #F8FAFC;
  }
  .adm-act-row:last-child { border-bottom: none; }
  .adm-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .adm-dot--green { background: #22C55E; }
  .adm-dot--red { background: #EF4444; }
  .adm-act-title { font-family: var(--font-display); font-weight: 700; font-size: 13px; color: #15181F; margin: 0; }
  .adm-act-sub { font-family: var(--font-body); font-size: 11px; color: #686868; margin: 0; }
  .adm-act-time { font-family: var(--font-body); font-size: 11px; color: #94A3B8; }
  .adm-act-val { font-family: var(--font-display); font-weight: 700; font-size: 13px; color: #15181F; }
  .adm-act-val--red { color: #DC2626; }

  /* Sub-view */
  .adm-sub-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 14px 10px; background: #fff;
    border-bottom: 1px solid #F1F5F9;
    position: sticky; top: 0; z-index: 10;
  }
  .adm-back-btn {
    background: none; border: none; color: #2563EB;
    cursor: pointer; display: flex; align-items: center; padding: 4px;
  }
  .adm-sub-title {
    font-family: var(--font-display); font-weight: 800;
    font-size: 17px; color: #15181F; margin: 0;
  }
  .adm-sub-body { padding: 12px 14px 24px; display: flex; flex-direction: column; gap: 8px; }

  /* Badges */
  .adm-badge {
    font-family: var(--font-display); font-weight: 700;
    font-size: 11px; padding: 3px 8px; border-radius: 6px;
  }
  .adm-badge--green { background: #F0FDF4; color: #16A34A; }
  .adm-badge--red { background: #FEF2F2; color: #DC2626; }
  .adm-badge--gray { background: #F1F5F9; color: #64748B; }

  /* Plate */
  .adm-plate {
    font-family: var(--font-display); font-weight: 800;
    font-size: 13px; background: #F1F5F9; color: #15181F;
    padding: 4px 10px; border-radius: 6px;
    border: 1px solid #E2E8F0; display: inline-block;
  }

  /* List item layout */
  .adm-list-item {
    display: flex; justify-content: space-between; align-items: center;
  }

  /* Action buttons */
  .adm-action-btn {
    flex: 1; border: none; border-radius: 10px;
    padding: 10px; font-family: var(--font-display);
    font-weight: 700; font-size: 13px; cursor: pointer;
    transition: opacity 0.15s;
  }
  .adm-action-btn:active { opacity: 0.8; }
  .adm-action-btn--green { background: #F0FDF4; color: #16A34A; }
  .adm-action-btn--red { background: #FEF2F2; color: #DC2626; }

  /* Legend */
  .adm-legend {
    display: flex; justify-content: center; gap: 14px;
    padding: 10px; font-size: 11px; color: #686868;
    font-family: var(--font-display); font-weight: 600;
  }
  .adm-legend-dot {
    display: inline-block; width: 8px; height: 8px;
    border-radius: 50%; margin-right: 4px; vertical-align: middle;
  }
`;
