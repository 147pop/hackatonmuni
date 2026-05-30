export const ROUTES = {
  home: '/',
  conductor: {
    root: '/conductor',
    registro: '/conductor/registro',
    pagar: '/conductor/pagar',
    ticket: (id: string) => `/conductor/ticket/${id}`,
    historial: '/conductor/historial',
    deudas: '/conductor/deudas',
  },
  portal: {
    root: '/portal',
    pagar: '/portal/pagar',
    deudas: '/portal/deudas',
  },
  pagar: (permisionarioId: string) => `/pagar/${permisionarioId}`,
  permisionario: {
    root: '/permisionario',
    registrar: '/permisionario/registrar',
    cobrarQr: '/permisionario/cobrar-qr',
    incumplimiento: '/permisionario/incumplimiento',
    horaExtra: '/permisionario/hora-extra',
    actividad: '/permisionario/actividad',
    credencial: '/permisionario/credencial',
  },
  admin: {
    root: '/admin',
    permisionarios: '/admin/permisionarios',
    permisionario: (id: string) => `/admin/permisionarios/${id}`,
    permisionarioNuevo: '/admin/permisionarios/nuevo',
    tarifas: '/admin/configuracion/tarifas',
    zonas: '/admin/configuracion/zonas',
    feriados: '/admin/configuracion/feriados',
    normativa: '/admin/configuracion/normativa',
    liquidaciones: '/admin/liquidaciones',
    reportes: '/admin/reportes',
    pagos: '/admin/pagos',
    deudas: '/admin/deudas',
    auditoria: '/admin/auditoria',
    alertas: '/admin/alertas',
  },
} as const;

export type UserRole = 'conductor' | 'portal' | 'permisionario' | 'admin';
export type AdminRole = 'administrador' | 'supervisor' | 'consulta';

export const ROLE_LABELS: Record<UserRole, string> = {
  conductor: 'Conductor',
  portal: 'Portal Público',
  permisionario: 'Permisionario',
  admin: 'Administración Municipal',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  conductor: 'Pago digital, historial y emergencias',
  portal: 'Pago sin cuenta y consulta de deudas',
  permisionario: 'Gestión de cuadra y registro de pagos',
  admin: 'Dashboard, reportes y configuración',
};
