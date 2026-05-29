'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificationStore, type AppNotification } from '@/lib/mock-notifications';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => setNotifications(notificationStore.getAll().slice(0, 8));
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = notifications.filter((n) => !n.leida).length;

  function handleOpen() {
    setOpen((o) => !o);
    if (!open) {
      setTimeout(() => {
        notificationStore.markAllRead();
        setNotifications(notificationStore.getAll().slice(0, 8));
      }, 1500);
    }
  }

  const TIPO_ICON: Record<AppNotification['tipo'], string> = {
    pago:        '💰',
    vencimiento: '⏰',
    emergencia:  '🚨',
    info:        'ℹ️',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notificaciones"
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: 'rgba(255,255,255,0.8)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full text-xs font-bold flex items-center justify-center px-0.5 leading-none"
            style={{ background: 'var(--azul-vivo)', color: '#fff', fontFamily: 'var(--font-display)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 overflow-hidden"
          style={{
            width: '18rem',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(21,50,111,0.18)',
            border: '1px solid var(--linea)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--linea)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--tinta)' }}>
                Notificaciones
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--gris)' }}>
                [SIMULACIÓN] — solo in-app
              </p>
            </div>
            {unread > 0 && (
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                background: 'rgba(1,92,180,0.1)', color: 'var(--azul-vivo)',
                padding: '2px 8px', borderRadius: 999,
              }}>
                {unread} nueva{unread !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Body */}
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--linea)' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--gris)' }}>
                Sin notificaciones
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--linea)',
                    background: !n.leida ? 'rgba(1,92,180,0.04)' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{TIPO_ICON[n.tipo]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--tinta)' }}>
                        {n.titulo}
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gris)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.mensaje}
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(104,104,104,0.6)', marginTop: 2 }}>
                        {new Date(n.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.leida && (
                      <span style={{ width: 8, height: 8, background: 'var(--azul-vivo)', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
