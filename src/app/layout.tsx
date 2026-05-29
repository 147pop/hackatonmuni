import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'SEM Digital — Municipalidad de Salta',
  description: 'Sistema de Estacionamiento Medido Digital · Municipalidad de la Ciudad de Salta',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#15326F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

