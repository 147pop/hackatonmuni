"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { appRoutes } from "@/lib/routes";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-municipal-surface pb-20 lg:pb-0">
      <header className="border-b border-municipal-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex flex-col">
            <span className="text-lg font-semibold text-municipal-ink">
              SEM Digital
            </span>
            <span className="text-xs text-municipal-muted">
              Municipalidad de Salta
            </span>
          </Link>
          <nav aria-label="Navegacion principal" className="hidden gap-2 lg:flex">
            {appRoutes.map((route) => {
              const active = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-municipal-action text-white"
                      : "text-municipal-muted hover:bg-municipal-surface hover:text-municipal-ink"
                  }`}
                >
                  {route.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {children}

      <nav
        aria-label="Navegacion movil"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-municipal-line bg-white lg:hidden"
      >
        {appRoutes.map((route) => {
          const Icon = route.icon;
          const active = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-medium ${
                active
                  ? "text-municipal-action"
                  : "text-municipal-muted hover:text-municipal-ink"
              }`}
            >
              <Icon aria-hidden="true" size={20} />
              <span>{route.label.replace(" Municipal", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
