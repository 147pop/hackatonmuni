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
      // Mark all read after viewing
      setTimeout(() => {
        notificationStore.markAllRead();
        setNotifications(notificationStore.getAll().slice(0, 8));
      }, 1500);
    }
  }

  const TIPO_ICON: Record<AppNotification['tipo'], string> = {
    pago:       '💰',
    vencimiento:'⏰',
    emergencia: '🚨',
    info:       'ℹ️',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notificaciones"
        className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[1rem] h-4 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-76 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ width: '18rem' }}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Notificaciones</p>
              <p className="text-xs text-gray-400">[SIMULACION] — solo in-app</p>
            </div>
            {unread > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{unread} nueva{unread !== 1 ? 's' : ''}</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 ${!n.leida ? 'bg-blue-50' : 'bg-white'}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0 mt-0.5">{TIPO_ICON[n.tipo]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{n.titulo}</p>
                      <p className="text-xs text-gray-500 truncate">{n.mensaje}</p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {new Date(n.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.leida && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
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
