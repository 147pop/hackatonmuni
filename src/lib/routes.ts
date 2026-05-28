import {
  BarChart3,
  Car,
  CreditCard,
  type LucideIcon,
  ShieldCheck
} from "lucide-react";

export type AppRoute = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const appRoutes: AppRoute[] = [
  {
    href: "/conductor",
    label: "Conductor",
    description: "Pago digital, deuda, historial y emergencias.",
    icon: Car
  },
  {
    href: "/portal",
    label: "Portal Publico",
    description: "Pago sin cuenta y consulta de deuda por dominio.",
    icon: CreditCard
  },
  {
    href: "/permisionario",
    label: "Permisionario",
    description: "QR fijo, registros, incumplimientos y actividad diaria.",
    icon: ShieldCheck
  },
  {
    href: "/admin",
    label: "Admin Municipal",
    description: "Dashboard, reportes, auditoria y configuracion.",
    icon: BarChart3
  }
];

export const routeLabels = appRoutes.reduce<Record<string, string>>((acc, route) => {
  acc[route.href] = route.label;
  return acc;
}, {});
