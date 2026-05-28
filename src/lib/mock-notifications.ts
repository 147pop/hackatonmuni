import { storageGet, storageSet } from './storage';

export interface AppNotification {
  id: string;
  tipo: 'pago' | 'vencimiento' | 'emergencia' | 'info';
  titulo: string;
  mensaje: string;
  leida: boolean;
  timestamp: string;
  ticketId?: string;
}

const KEY = 'sem_notifications';

function getId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

/** [SIMULACION] In-app notification queue (no real Web Push / SMS). */
export const notificationStore = {
  getAll: (): AppNotification[] => storageGet<AppNotification[]>(KEY, []),

  getUnread: (): AppNotification[] =>
    notificationStore.getAll().filter((n) => !n.leida),

  add: (n: Omit<AppNotification, 'id' | 'timestamp' | 'leida'>): AppNotification => {
    const list = notificationStore.getAll();
    const notification: AppNotification = {
      ...n,
      id: getId(),
      timestamp: new Date().toISOString(),
      leida: false,
    };
    list.unshift(notification);
    // Keep last 50
    if (list.length > 50) list.splice(50);
    storageSet(KEY, list);
    return notification;
  },

  markRead: (id: string) => {
    const list = notificationStore.getAll();
    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], leida: true };
      storageSet(KEY, list);
    }
  },

  markAllRead: () => {
    const list = notificationStore.getAll().map((n) => ({ ...n, leida: true }));
    storageSet(KEY, list);
  },

  clear: () => {
    storageSet(KEY, []);
  },
};

export function notifyPagoEntrante(dominio: string, monto: number): void {
  notificationStore.add({
    tipo: 'pago',
    titulo: 'Pago digital recibido',
    mensaje: `${dominio} — $${monto.toLocaleString('es-AR')}`,
  });
}

export function notifyVencimientoProximo(dominio: string, minutosRestantes: number, ticketId: string): void {
  notificationStore.add({
    tipo: 'vencimiento',
    titulo: 'Ticket por vencer',
    mensaje: `${dominio} vence en ${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''}`,
    ticketId,
  });
}
