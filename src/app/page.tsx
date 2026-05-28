import Link from "next/link";
import { RoleSwitcher } from "@/components/role-switcher";
import { appRoutes } from "@/lib/routes";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-municipal-action">
          SEM Digital · Hackathon
        </p>
        <div className="grid gap-3 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-municipal-ink sm:text-4xl">
              Centro operativo del estacionamiento medido
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-municipal-muted">
              Acceso rapido a los flujos normales del MVP: conductor,
              permisionario, portal publico y administracion municipal.
            </p>
          </div>
          <RoleSwitcher />
        </div>
      </section>

      <section
        aria-label="Areas del MVP"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {appRoutes.map((route) => {
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className="group flex min-h-56 flex-col justify-between rounded-lg border border-municipal-line bg-municipal-panel p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-municipal-action"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-municipal-action text-white">
                  <Icon aria-hidden="true" size={22} />
                </div>
                <span className="rounded-full border border-municipal-line px-3 py-1 text-xs font-medium text-municipal-muted">
                  Demo
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-municipal-ink">
                  {route.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-municipal-muted">
                  {route.description}
                </p>
              </div>
              <span className="text-sm font-semibold text-municipal-action group-hover:text-municipal-actionStrong">
                Abrir modulo
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
