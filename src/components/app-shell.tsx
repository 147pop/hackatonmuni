'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Car, Globe, User, LayoutDashboard, QrCode, FileText,
  AlertTriangle, DollarSign, Settings, BarChart3, CreditCard, MapPin, Clock,
} from 'lucide-react';
import { RoleSwitcher } from './role-switcher';
import { NotificationBell } from './notification-bell';
import { ROUTES } from '@/lib/routes';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function getConductorNav(): NavItem[] {
  return [
    { href: ROUTES.conductor.root,     label: 'Pagar',    icon: <Car className="w-5 h-5" /> },
    { href: ROUTES.conductor.historial, label: 'Historial', icon: <FileText className="w-5 h-5" /> },
    { href: ROUTES.conductor.deudas,   label: 'Deudas',   icon: <AlertTriangle className="w-5 h-5" /> },
  ];
}

function getPortalNav(): NavItem[] {
  return [
    { href: ROUTES.portal.root,   label: 'Pagar',  icon: <Globe className="w-5 h-5" /> },
    { href: ROUTES.portal.deudas, label: 'Deudas', icon: <AlertTriangle className="w-5 h-5" /> },
  ];
}

function getPermisionarioNav(): NavItem[] {
  return [
    { href: ROUTES.permisionario.root,       label: 'Inicio',    icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: ROUTES.permisionario.registrar,  label: 'Vehículos', icon: <Car className="w-5 h-5" /> },
    { href: ROUTES.permisionario.cobrarQr,   label: 'Cobros',    icon: <QrCode className="w-5 h-5" /> },
    { href: ROUTES.permisionario.actividad,  label: 'Reportes',  icon: <FileText className="w-5 h-5" /> },
    { href: ROUTES.permisionario.credencial, label: 'Más',       icon: <User className="w-5 h-5" /> },
  ];
}

function getAdminNav(): NavItem[] {
  return [
    { href: ROUTES.admin.root,           label: 'Inicio',         icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: ROUTES.admin.permisionarios, label: 'Permisionarios', icon: <User className="w-5 h-5" /> },
    { href: ROUTES.admin.liquidaciones,  label: 'Liquidaciones',  icon: <DollarSign className="w-5 h-5" /> },
    { href: ROUTES.admin.tarifas,        label: 'Config',         icon: <Settings className="w-5 h-5" /> },
  ];
}

function getAdminSidebarNav(): NavItem[] {
  return [
    { href: ROUTES.admin.root,           label: 'Dashboard',      icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: ROUTES.admin.permisionarios, label: 'Permisionarios', icon: <User className="w-4 h-4" /> },
    { href: ROUTES.admin.liquidaciones,  label: 'Liquidaciones',  icon: <DollarSign className="w-4 h-4" /> },
    { href: ROUTES.admin.reportes,       label: 'Reportes',       icon: <BarChart3 className="w-4 h-4" /> },
    { href: ROUTES.admin.pagos,          label: 'Pagos',          icon: <CreditCard className="w-4 h-4" /> },
    { href: ROUTES.admin.deudas,         label: 'Deudas',         icon: <AlertTriangle className="w-4 h-4" /> },
    { href: ROUTES.admin.auditoria,      label: 'Auditoría',      icon: <FileText className="w-4 h-4" /> },
    { href: ROUTES.admin.alertas,        label: 'Alertas',        icon: <AlertTriangle className="w-4 h-4" /> },
    { href: ROUTES.admin.tarifas,        label: 'Tarifas',        icon: <DollarSign className="w-4 h-4" /> },
    { href: ROUTES.admin.zonas,          label: 'Zonas',          icon: <MapPin className="w-4 h-4" /> },
    { href: ROUTES.admin.feriados,       label: 'Feriados',       icon: <Settings className="w-4 h-4" /> },
    { href: ROUTES.admin.normativa,      label: 'Normativa',      icon: <Clock className="w-4 h-4" /> },
  ];
}

function getNavForPath(pathname: string): NavItem[] {
  if (pathname.startsWith('/conductor'))   return getConductorNav();
  if (pathname.startsWith('/portal'))      return getPortalNav();
  if (pathname.startsWith('/permisionario')) return getPermisionarioNav();
  if (pathname.startsWith('/admin'))       return getAdminNav();
  return [];
}

function getSidebarNavForPath(pathname: string): NavItem[] {
  if (pathname.startsWith('/admin')) return getAdminSidebarNav();
  return getNavForPath(pathname);
}

/** Isotipo institucional — corazón de línea continua del brandbook */
function IsotipoSalta({ size = 24, className = '' }: { size?: number; className?: string }) {
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
      className={className}
      aria-hidden="true"
    >
      <path d="M24 38s-14-9-14-20a9 9 0 0 1 14-7.5A9 9 0 0 1 38 18c0 11-14 20-14 20z" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navItems     = getNavForPath(pathname);
  const sidebarItems = getSidebarNavForPath(pathname);
  const isHome = pathname === '/';

  const isPublic = pathname.startsWith('/pagar');
  if (isPublic) {
    return <>{children}</>;
  }

  // The permisionario pages have their own embedded mobile app layout
  const isPermisionarioApp = pathname === ROUTES.permisionario.root || pathname.startsWith(ROUTES.permisionario.root + '/');
  if (isPermisionarioApp) {
    return <>{children}</>;
  }

  // The admin pages have their own embedded mobile app layout
  const isAdminApp = pathname === ROUTES.admin.root || pathname.startsWith(ROUTES.admin.root + '/');
  if (isAdminApp) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Header institucional ── */}
      <header
        style={{ background: 'var(--azul-noche)', paddingTop: 'var(--safe-top)' }}
        className="text-white sticky top-0 z-40 shadow-md"
      >
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 select-none"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            <span
              className="flex items-center justify-center rounded-lg"
              style={{ background: 'var(--azul-vivo)', width: 30, height: 30 }}
            >
              <IsotipoSalta size={17} />
            </span>
            <span className="text-white text-base leading-tight hidden sm:block">
              SEM <span style={{ color: 'var(--celeste)', fontWeight: 500 }}>· Municipalidad de Salta</span>
            </span>
            <span className="text-white text-base sm:hidden">SEM</span>
          </Link>

          <div className="flex items-center gap-1">
            {(pathname.startsWith('/permisionario') || pathname.startsWith('/conductor')) && (
              <NotificationBell />
            )}
            <RoleSwitcher />
          </div>
        </div>
      </header>

      {/* ── Desktop sidebar + content ── */}
      <div className="flex flex-1 min-h-0">
        {!isHome && sidebarItems.length > 0 && (
          <nav
            className="hidden md:flex flex-col w-56 py-4 gap-0.5 px-2"
            style={{ background: 'var(--hueso)', borderRight: '1px solid var(--linea)' }}
          >
            {sidebarItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={active
                    ? { background: 'var(--azul-vivo)', color: '#fff', fontFamily: 'var(--font-display)' }
                    : { color: 'var(--gris)', fontFamily: 'var(--font-display)' }
                  }
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <main className={`flex-1 min-w-0 ${!isHome ? 'pb-20 md:pb-0' : ''}`}>
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      {!isHome && navItems.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-30 flex bottom-nav-safe"
          style={{
            background: '#fff',
            borderTop: '1px solid var(--linea)',
            boxShadow: '0 -2px 12px rgba(21,50,111,0.08)',
          }}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors"
                style={{
                  color: active ? 'var(--azul-vivo)' : 'var(--gris)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
