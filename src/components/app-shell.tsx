'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Car, Globe, User, Building2, LayoutDashboard, QrCode, FileText, AlertTriangle } from 'lucide-react';
import { RoleSwitcher } from './role-switcher';
import { ROUTES } from '@/lib/routes';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function getConductorNav(): NavItem[] {
  return [
    { href: ROUTES.conductor.root, label: 'Pagar', icon: <Car className="w-5 h-5" /> },
    { href: ROUTES.conductor.historial, label: 'Historial', icon: <FileText className="w-5 h-5" /> },
    { href: ROUTES.conductor.deudas, label: 'Deudas', icon: <AlertTriangle className="w-5 h-5" /> },
  ];
}

function getPortalNav(): NavItem[] {
  return [
    { href: ROUTES.portal.root, label: 'Pagar', icon: <Globe className="w-5 h-5" /> },
    { href: ROUTES.portal.deudas, label: 'Deudas', icon: <AlertTriangle className="w-5 h-5" /> },
  ];
}

function getPermisionarioNav(): NavItem[] {
  return [
    { href: ROUTES.permisionario.root, label: 'Inicio', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: ROUTES.permisionario.registrar, label: 'Registrar', icon: <QrCode className="w-5 h-5" /> },
    { href: ROUTES.permisionario.actividad, label: 'Actividad', icon: <FileText className="w-5 h-5" /> },
    { href: ROUTES.permisionario.credencial, label: 'Credencial', icon: <User className="w-5 h-5" /> },
  ];
}

function getAdminNav(): NavItem[] {
  return [
    { href: ROUTES.admin.root, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: ROUTES.admin.permisionarios, label: 'Permisionarios', icon: <User className="w-5 h-5" /> },
    { href: ROUTES.admin.reportes, label: 'Reportes', icon: <FileText className="w-5 h-5" /> },
    { href: ROUTES.admin.alertas, label: 'Alertas', icon: <AlertTriangle className="w-5 h-5" /> },
  ];
}

function getNavForPath(pathname: string): NavItem[] {
  if (pathname.startsWith('/conductor')) return getConductorNav();
  if (pathname.startsWith('/portal')) return getPortalNav();
  if (pathname.startsWith('/permisionario')) return getPermisionarioNav();
  if (pathname.startsWith('/admin')) return getAdminNav();
  return [];
}

function getAreaColor(pathname: string): string {
  if (pathname.startsWith('/conductor')) return 'from-blue-600 to-blue-800';
  if (pathname.startsWith('/portal')) return 'from-teal-600 to-teal-800';
  if (pathname.startsWith('/permisionario')) return 'from-amber-600 to-amber-800';
  if (pathname.startsWith('/admin')) return 'from-municipal-700 to-municipal-950';
  return 'from-municipal-700 to-municipal-950';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navItems = getNavForPath(pathname);
  const isHome = pathname === '/';
  const areaColor = getAreaColor(pathname);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className={`bg-gradient-to-r ${areaColor} text-white`}>
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Building2 className="w-5 h-5" />
            <span className="hidden sm:inline">SEM Digital</span>
            <span className="sm:hidden">SEM</span>
          </Link>
          <RoleSwitcher />
        </div>
      </header>

      {/* Desktop sidebar + content */}
      <div className="flex flex-1">
        {!isHome && navItems.length > 0 && (
          <nav className="hidden md:flex flex-col w-56 bg-gray-50 border-r border-gray-200 py-4 gap-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-municipal-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <main className={`flex-1 ${!isHome ? 'pb-20 md:pb-0' : ''}`}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {!isHome && navItems.length > 0 && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-30">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                pathname === item.href
                  ? 'text-municipal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
