'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Map, Car, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const NAV_ITEMS = [
    { id: '/admin',              label: 'Inicio',       icon: LayoutDashboard },
    { id: '/admin/mapa',         label: 'Mapa',         icon: Map },
    { id: '/admin/vehiculos',    label: 'Vehículos',    icon: Car },
    { id: '/admin/infracciones', label: 'Infrac.',      icon: AlertTriangle },
    { id: '/admin/configuracion',label: 'Más',          icon: MoreHorizontal },
  ];

  return (
    <div className="lc-app">
      <style>{STYLES}</style>
      
      {/* ── Header ── */}
      <header className="lc-header">
        <img src="/logomain.png" alt="La Cuadra — Municipalidad de Salta" className="lc-logo" />
      </header>

      {/* ── Scroll body ── */}
      <div className="lc-body">
        {children}
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="lc-bottom-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={id}
            className={`lc-nav-item ${pathname === id ? 'lc-nav-item--active' : ''}`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    position: relative;
    box-shadow: 0 0 20px rgba(0,0,0,0.05); /* Separación visual en desktop */
  }

  /* ── Header ── */
  .lc-header {
    background: #15326F; /* Azul oscuro Salta */
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
    overflow-x: hidden;
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
    color: #2563EB;
    text-decoration: none;
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

  /* ── Stats 2-column grid ── */
  .lc-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
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

  /* Stat row */
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
  .lc-stat-sub {
    font-family: var(--font-body);
    font-size: 10px;
    color: #686868;
  }

  /* ── Bottom Nav ── */
  .lc-bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 480px;
    background: #fff;
    border-top: 1px solid #E2E8F0;
    display: flex;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-shadow: 0 -2px 12px rgba(21,50,111,0.08);
    z-index: 30;
  }
  .lc-nav-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 3px;
    padding: 10px 4px;
    color: #94A3B8;
    text-decoration: none;
    font-family: var(--font-display);
    font-size: 10px; font-weight: 600;
    transition: color 0.15s;
  }
  .lc-nav-item:hover { color: #64748B; }
  .lc-nav-item--active { color: #2563EB; }
`;
