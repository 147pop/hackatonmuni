import Link from 'next/link';
import { Car, Globe, User, Building2, ArrowRight } from 'lucide-react';
import { ROUTES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/routes';
import type { UserRole } from '@/lib/routes';
import { ResetDemoDataButton } from '@/components/reset-demo-data-button';

/* Isotipo del brandbook — corazón de línea continua */
function IsotipoSalta({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M24 38s-14-9-14-20a9 9 0 0 1 14-7.5A9 9 0 0 1 38 18c0 11-14 20-14 20z" />
    </svg>
  );
}

type RoleConfig = {
  role: UserRole;
  href: string;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgHover: string;
  label: string;
  desc: string;
};

const ROLE_CONFIG: RoleConfig[] = [
  {
    role: 'conductor',
    href: ROUTES.conductor.root,
    icon: <Car className="w-6 h-6" />,
    accentColor: '#015CB4',
    borderColor: '#bdd4ff',
    bgHover: '#f0f6ff',
    label: ROLE_LABELS.conductor,
    desc: ROLE_DESCRIPTIONS.conductor,
  },
  {
    role: 'portal',
    href: ROUTES.portal.root,
    icon: <Globe className="w-6 h-6" />,
    accentColor: '#2859AA',
    borderColor: '#c3d8f5',
    bgHover: '#eef4fb',
    label: ROLE_LABELS.portal,
    desc: ROLE_DESCRIPTIONS.portal,
  },
  {
    role: 'permisionario',
    href: ROUTES.permisionario.root,
    icon: <User className="w-6 h-6" />,
    accentColor: '#15326F',
    borderColor: '#b8cbee',
    bgHover: '#e8eef8',
    label: ROLE_LABELS.permisionario,
    desc: ROLE_DESCRIPTIONS.permisionario,
  },
  {
    role: 'admin',
    href: ROUTES.admin.root,
    icon: <Building2 className="w-6 h-6" />,
    accentColor: '#0a1a3d',
    borderColor: '#9ab5d4',
    bgHover: '#e0e8f5',
    label: ROLE_LABELS.admin,
    desc: ROLE_DESCRIPTIONS.admin,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Hero ── */}
      <section
        style={{
          background: 'linear-gradient(160deg, var(--azul-noche) 0%, var(--azul-salta) 100%)',
          padding: '40px 24px 48px',
        }}
      >
        <div className="max-w-md mx-auto text-center text-white">
          {/* Isotipo */}
          <div
            className="inline-flex items-center justify-center mb-5"
            style={{
              width: 72, height: 72,
              background: 'rgba(127,181,255,0.15)',
              borderRadius: '20px',
              border: '1.5px solid rgba(127,181,255,0.3)',
              color: 'var(--celeste)',
            }}
          >
            <IsotipoSalta size={40} />
          </div>

          <p
            className="eyebrow-sem mb-2"
            style={{ color: 'var(--celeste)', opacity: 0.9 }}
          >
            Municipalidad de la Ciudad de Salta
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(26px, 7vw, 36px)',
              color: '#fff',
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            SEM Digital
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.5,
              maxWidth: '32ch',
              margin: '0 auto',
            }}
          >
            Sistema de Estacionamiento Medido — gestioná tu ticket, pagá online y consultá deudas.
          </p>
        </div>
      </section>

      {/* ── Role cards ── */}
      <section
        style={{
          background: 'var(--hueso)',
          flex: 1,
          padding: '0 16px 32px',
          marginTop: -20,
        }}
      >
        <div
          className="max-w-md mx-auto"
          style={{
            background: '#fff',
            borderRadius: '20px 20px 0 0',
            padding: '8px 0 0',
            boxShadow: '0 -4px 24px rgba(21,50,111,0.10)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--gris)',
              padding: '16px 20px 8px',
            }}
          >
            Seleccioná tu perfil
          </p>

          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLE_CONFIG.map(({ role, href, icon, accentColor, borderColor, label, desc }) => (
              <Link
                key={role}
                href={href}
                id={`role-card-${role}`}
                className="group flex items-center gap-4 rounded-2xl border-2 transition-all"
                style={{
                  padding: '14px 16px',
                  borderColor,
                  background: '#fff',
                  minHeight: 72,
                  textDecoration: 'none',
                }}
              >
                {/* Icon badge */}
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-xl"
                  style={{
                    width: 48, height: 48,
                    background: `${accentColor}12`,
                    color: accentColor,
                  }}
                >
                  {icon}
                </span>

                {/* Text */}
                <span className="flex-1 min-w-0">
                  <span
                    className="block"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 16,
                      color: 'var(--tinta)',
                      lineHeight: 1.2,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    className="block mt-0.5"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: 'var(--gris)',
                      lineHeight: 1.4,
                    }}
                  >
                    {desc}
                  </span>
                </span>

                {/* Arrow */}
                <ArrowRight
                  className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1"
                  style={{ color: accentColor }}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Reset + footer */}
        <div className="max-w-md mx-auto mt-6 flex flex-col items-center gap-3">
          <ResetDemoDataButton />
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--gris)',
              textAlign: 'center',
            }}
          >
            PunaTech 2026 — Hackathon MVP · Datos simulados en localStorage
          </p>
        </div>
      </section>
    </div>
  );
}
