'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car, Clock, TrendingUp, CheckCircle,
  AlertCircle, AlertTriangle, MapPin, Smartphone, Banknote,
  LayoutGrid, DollarSign, BarChart3, MoreHorizontal, User, Menu
} from 'lucide-react';
import { db } from '@/lib/db';
import type { Permisionario, Ticket, Pago, VehiculoObservado } from '@/domain/types';
import { calcularTiempoRestanteMinutos } from '@/domain/calculations';
import { ROUTES } from '@/lib/routes';

import React from 'react';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: unknown}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <div style={{padding: 20, color: 'red'}}><h1>Something went wrong.</h1><pre>{(this.state.error as Error)?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

export default function ResumenPage() {
  const [perm, setPerm] = useState<Permisionario | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const id = db.role.getActivePermisionarioId();
        if (id) {
          const p = await db.permisionarios.getById(id);
          setPerm(p ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  if (!loaded) return <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>;
  if (!perm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-gray-500 mb-4">No hay permisionario activo.</p>
        <Link href={ROUTES.permisionario.root} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Volver</Link>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardResumen perm={perm} />
    </ErrorBoundary>
  );
}

function DashboardResumen({ perm }: { perm: Permisionario }) {
  const cuadra = perm.cuadraAsignada;
  const hoyStr = new Date().toISOString().split('T')[0];

  const [data, setData] = useState<{
    todosTickets: Ticket[];
    pagosHoy: Pago[];
    observados: VehiculoObservado[];
  }>({ todosTickets: [], pagosHoy: [], observados: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allTickets, allPagos, obs] = await Promise.all([
          db.tickets.getAll(),
          db.pagos.getByPermisionario(perm.id),
          db.observados.getByPermisionarioCuadra(perm.id, cuadra),
        ]);
        
        const ticketsHoy = allTickets.filter(t => t.permisionarioId === perm.id && t.inicio.startsWith(hoyStr));
        const pagosSuccessHoy = allPagos.filter(p => p.createdAt.startsWith(hoyStr) && p.estado === 'success');
        
        setData({ todosTickets: ticketsHoy, pagosHoy: pagosSuccessHoy, observados: obs });
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [perm.id, cuadra, hoyStr]);

  if (loading) return <div className="p-6 text-center text-gray-500 text-sm">Cargando datos...</div>;

  const { todosTickets, pagosHoy, observados } = data;

  // Status computation for currently in street vs total today
  const ticketsActivos = todosTickets.filter(t => t.activo && calcularTiempoRestanteMinutos(t.vencimiento) > 0);
  const ticketsVencidos = todosTickets.filter(t => t.activo && calcularTiempoRestanteMinutos(t.vencimiento) <= 0);
  const impagosActuales = observados.filter(
    (obs) =>
      !ticketsActivos.some((t) => t.dominio.toUpperCase() === obs.dominio.toUpperCase()) &&
      !ticketsVencidos.some((t) => t.dominio.toUpperCase() === obs.dominio.toUpperCase())
  );

  // Metrics
  const totalRecaudado = pagosHoy.reduce((s, p) => s + p.monto, 0);
  
  // Rendimiento
  const autosRegistrados = todosTickets.length;
  const pagosRealizados = pagosHoy.length;
  const impagosTotal = ticketsVencidos.length + impagosActuales.length;
  const enCalleAhora = ticketsActivos.length + ticketsVencidos.length + impagosActuales.length;

  const promPorVehiculo = autosRegistrados > 0 ? Math.round(totalRecaudado / autosRegistrados) : 0;
  const tiempoPromedio = autosRegistrados > 0 ? Math.round(todosTickets.reduce((s, t) => s + t.duracionMinutos, 0) / autosRegistrados) : 0;
  
  const totalPagosImpagos = pagosRealizados + impagosTotal;
  const tasaPago = totalPagosImpagos > 0 ? Math.round((pagosRealizados / totalPagosImpagos) * 100) : 0;
  const tasaImpago = totalPagosImpagos > 0 ? Math.round((impagosTotal / totalPagosImpagos) * 100) : 0;

  const proximosAVencer = todosTickets.filter(t => {
    const min = calcularTiempoRestanteMinutos(t.vencimiento);
    return t.activo && min > 0 && min <= 10;
  }).length;

  // Jornada (Simulated fixed based on zone or config)
  // Let's use a dynamic one if possible, otherwise fixed 19:00 to 23:00 to match design (assuming nocturno)
  const isNocturno = new Date().getHours() >= 19 || new Date().getHours() < 5;
  const startHourStr = isNocturno ? "19:00" : "07:00";
  const endHourStr = isNocturno ? "23:00" : "21:00";
  
  const now = new Date();
  const currentHourStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  
  const startH = parseInt(startHourStr.split(':')[0]);
  let endH = parseInt(endHourStr.split(':')[0]);
  if (endH < startH) endH += 24; // overnight
  let currH = now.getHours();
  if (currH < startH && isNocturno) currH += 24; // handles 1 AM etc.

  let progress = 0;
  const totalMinutes = (endH - startH) * 60;
  const currentMinutes = ((currH - startH) * 60) + now.getMinutes();
  
  if (currentMinutes > 0 && totalMinutes > 0) {
    progress = Math.min(100, Math.max(0, Math.round((currentMinutes / totalMinutes) * 100)));
  }

  const horasTranscurridas = currentMinutes > 0 ? currentMinutes / 60 : 1;
  const recaudacionPorHora = horasTranscurridas > 0 ? Math.round(totalRecaudado / horasTranscurridas) : 0;

  // Cobros
  const recaudadoEfectivo = pagosHoy.filter(p => p.metodoPago === 'efectivo').reduce((s, p) => s + p.monto, 0);
  const recaudadoDigital = pagosHoy.filter(p => p.metodoPago === 'digital').reduce((s, p) => s + p.monto, 0);

  // Recaudacion por hora (mocked for visual fidelity or real)
  const barData = [
    { label: '19:00', value: 40 },
    { label: '20:00', value: 65 },
    { label: '21:00', value: 100 }, // highest
    { label: '22:00', value: 55 },
    { label: '23:00', value: 30 },
  ];

  const pieDeg = Math.round((tasaPago / 100) * 360);

  return (
    <div className="lc-app">
      <style>{STYLES}</style>

      {/* ── Header ── */}
      <header className="lc-header">
        <img src="/logomain.png" alt="La Cuadra" className="lc-logo" />
      </header>

      <div className="lc-body">
        
        {/* Greeting */}
        <div className="lc-greeting-card">
          <div className="lc-avatar">
            <User className="w-7 h-7" style={{ color: '#fff' }} />
          </div>
          <div className="lc-greeting-info">
            <p className="lc-greeting-name">
              Hola, <span className="lc-greeting-highlight">{perm.nombre}</span>
            </p>
            <Link href={ROUTES.permisionario.credencial} className="lc-ver-perfil">
              Ver perfil &rsaquo;
            </Link>
          </div>
          <button
            className="lc-hamburger"
            onClick={() => { db.role.setActivePermisionarioId(null); window.location.reload(); }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Top grid (Recaudado & Jornada) */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          
          {/* Recaudado hoy (Blue card) */}
          <div className="res-blue-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white tracking-tight leading-none">${totalRecaudado.toLocaleString('es-AR')}</span>
                  <span className="text-xs text-blue-100 font-medium mt-0.5">Recaudado hoy</span>
                </div>
              </div>
            </div>
            {/* Mock Line chart using SVG */}
            <div className="mt-4">
              <svg viewBox="0 0 100 30" className="w-full h-10 overflow-visible">
                <path d="M0,25 Q10,20 20,22 T40,15 T60,18 T80,5 T100,2" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                <path d="M0,25 Q10,20 20,22 T40,15 T60,18 T80,5 T100,2 L100,35 L0,35 Z" fill="url(#grad)" />
                <circle cx="100" cy="2" r="2" fill="white" />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Jornada de hoy */}
          <div className="res-card flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-gray-700 font-bold text-sm mb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              Jornada de hoy
            </div>
            
            <div className="flex justify-between items-end mb-3">
              <div className="flex flex-col text-center">
                <span className="text-[10px] text-gray-400 font-medium">Inicio</span>
                <span className="text-sm font-bold text-gray-800">{startHourStr}</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-[10px] text-gray-400 font-medium">Hora actual</span>
                <span className="text-lg font-bold text-blue-600 leading-none">{currentHourStr}</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-[10px] text-gray-400 font-medium">Fin</span>
                <span className="text-sm font-bold text-gray-800">{endHourStr}</span>
              </div>
            </div>

            <div className="relative w-full h-2 bg-gray-100 rounded-full mb-1">
              <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[11px] text-gray-500 font-medium">Avance de jornada</span>
              <span className="text-[12px] font-bold text-blue-600">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Estadísticas de autos y Rendimiento Grid */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          
          {/* Estadisticas de autos */}
          <div className="res-card">
            <div className="flex items-center gap-1.5 text-gray-800 font-bold text-[13px] mb-3">
              <Car className="w-4 h-4 text-blue-600" />
              Estadísticas de autos
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col justify-center items-center p-2 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-1 mb-1">
                  <Car className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] text-gray-500 leading-none">Autos<br/>registrados</span>
                </div>
                <span className="text-xl font-bold text-blue-600 leading-none mt-1">{autosRegistrados}</span>
              </div>
              
              <div className="flex flex-col justify-center items-center p-2 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] text-gray-500 leading-none">Pagos<br/>realizados</span>
                </div>
                <span className="text-xl font-bold text-green-600 leading-none mt-1">{pagosRealizados}</span>
              </div>

              <div className="flex flex-col justify-center items-center p-2 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-1 mb-1">
                  <div className="bg-orange-100 p-0.5 rounded-full"><AlertCircle className="w-2.5 h-2.5 text-orange-500" /></div>
                  <span className="text-[10px] text-gray-500 leading-none">Impagos</span>
                </div>
                <span className="text-xl font-bold text-orange-500 leading-none mt-1">{impagosTotal}</span>
              </div>

              <div className="flex flex-col justify-center items-center p-2 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-1 mb-1">
                  <Car className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] text-gray-500 leading-none">En calle<br/>ahora</span>
                </div>
                <span className="text-xl font-bold text-blue-600 leading-none mt-1">{enCalleAhora}</span>
              </div>
            </div>
          </div>

          {/* Rendimiento */}
          <div className="res-card flex flex-col">
            <div className="flex items-center gap-1.5 text-gray-800 font-bold text-[13px] mb-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Rendimiento
            </div>
            
            <div className="flex flex-col gap-3 flex-1 justify-center">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-[11px] text-gray-500 font-medium leading-tight w-20">Promedio por vehículo</span>
                <span className="text-[15px] font-bold text-blue-600">${promPorVehiculo}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-[11px] text-gray-500 font-medium leading-tight w-20">Tiempo promedio por estadía</span>
                <span className="text-[15px] font-bold text-blue-600">{tiempoPromedio} min</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-gray-500 font-medium leading-tight">Tasa de pago</span>
                <span className="text-[15px] font-bold text-green-500">{tasaPago}%</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          
          {/* Pagos vs Impagos (Pie) */}
          <div className="res-card flex flex-col items-center">
            <h3 className="text-[13px] font-bold text-gray-800 self-start w-full mb-3">Pagos vs impagos</h3>
            
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="flex items-center justify-center gap-4 w-full">
                
                {/* Donut Chart via conic-gradient */}
                <div 
                  className="res-donut" 
                  style={{ 
                    background: `conic-gradient(#22c55e ${pieDeg}deg, #f97316 ${pieDeg}deg 360deg)` 
                  }}
                >
                  <div className="res-donut-inner"></div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-[11px] text-gray-600 font-medium">Pagos</span>
                    </div>
                    <span className="text-[12px] font-bold text-gray-800 ml-3.5">
                      {tasaPago}% <span className="text-gray-400 font-medium">({pagosRealizados})</span>
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span className="text-[11px] text-gray-600 font-medium">Impagos</span>
                    </div>
                    <span className="text-[12px] font-bold text-gray-800 ml-3.5">
                      {tasaImpago}% <span className="text-gray-400 font-medium">({impagosTotal})</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recaudacion por hora (Bar) */}
          <div className="res-card flex flex-col">
            <h3 className="text-[13px] font-bold text-gray-800 w-full mb-3">Recaudación por hora</h3>
            
            <div className="flex-1 flex items-end justify-between gap-1.5 h-20 pt-2">
              {barData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full bg-blue-100 rounded-t-sm rounded-b-sm relative" style={{ height: '60px' }}>
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-t-sm rounded-b-sm transition-all" 
                      style={{ height: `${d.value}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Bottom Alerts & Methods Grid */}
        <div className="grid grid-cols-2 gap-3 mt-3 mb-6">
          
          {/* Atención & Rendimiento */}
          <div className="res-card">
            <div className="flex items-center gap-1.5 text-gray-800 font-bold text-[13px] mb-3">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Atención & Rendimiento
            </div>
            
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-50 p-1.5 rounded-full"><Clock className="w-3.5 h-3.5 text-orange-500" /></div>
                  <span className="text-[11px] text-gray-600 font-medium leading-tight">Por vencer (&lt;10 min)</span>
                </div>
                <span className={`text-[13px] font-bold ${proximosAVencer > 0 ? 'text-orange-500' : 'text-green-500'}`}>{proximosAVencer > 0 ? proximosAVencer : '✓'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-red-50 p-1.5 rounded-full"><AlertCircle className="w-3.5 h-3.5 text-red-500" /></div>
                  <span className="text-[11px] text-gray-600 font-medium leading-tight">Vencidos en calle</span>
                </div>
                <span className={`text-[13px] font-bold ${ticketsVencidos.length > 0 ? 'text-red-500' : 'text-green-500'}`}>{ticketsVencidos.length > 0 ? ticketsVencidos.length : '✓'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-50 p-1.5 rounded-full"><AlertTriangle className="w-3.5 h-3.5 text-orange-500" /></div>
                  <span className="text-[11px] text-gray-600 font-medium leading-tight">Sin ticket</span>
                </div>
                <span className={`text-[13px] font-bold ${impagosActuales.length > 0 ? 'text-orange-500' : 'text-green-500'}`}>{impagosActuales.length > 0 ? impagosActuales.length : '✓'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 p-1.5 rounded-full"><TrendingUp className="w-3.5 h-3.5 text-blue-600" /></div>
                  <span className="text-[11px] text-gray-600 font-medium leading-tight">Recaudación por hora</span>
                </div>
                <span className="text-[13px] font-bold text-blue-600">${recaudacionPorHora.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 p-1.5 rounded-full"><MapPin className="w-3.5 h-3.5 text-blue-600" /></div>
                  <span className="text-[11px] text-gray-600 font-medium leading-tight">En calle ahora</span>
                </div>
                <span className="text-[13px] font-bold text-blue-600">{enCalleAhora}</span>
              </div>
            </div>
          </div>

          {/* Cobros del día */}
          <div className="res-card flex flex-col">
            <div className="flex items-center gap-1.5 text-gray-800 font-bold text-[13px] mb-3">
              <Banknote className="w-4 h-4 text-blue-600" />
              Cobros del día
            </div>
            
            <div className="flex flex-col gap-3 justify-center flex-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="text-[12px] text-gray-600 font-medium">QR / Digital</span>
                </div>
                <span className="text-[16px] font-bold text-blue-600">${recaudadoDigital.toLocaleString('es-AR')}</span>
              </div>
              
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-green-600" />
                  <span className="text-[12px] text-gray-600 font-medium">Efectivo</span>
                </div>
                <span className="text-[16px] font-bold text-green-600">${recaudadoEfectivo.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
          
        </div>

      </div>

      {/* ── Bottom Nav ── */}
      <nav className="lc-bottom-nav">
        {([
          { id: 'inicio',    label: 'Inicio',    icon: LayoutGrid,     href: ROUTES.permisionario.root },
          { id: 'vehiculos', label: 'Vehículos', icon: Car,            href: ROUTES.permisionario.vehiculos },
          { id: 'cobros',    label: 'Cobros',    icon: DollarSign,     href: ROUTES.permisionario.cobrarQr },
          { id: 'resumen',   label: 'Resumen',   icon: BarChart3,      href: ROUTES.permisionario.actividad },
          { id: 'mas',       label: 'Más',       icon: MoreHorizontal, href: ROUTES.permisionario.credencial },
        ] as const).map(({ id, label, icon: Icon, href }) => {
          const isActive = id === 'resumen';
          return (
            <Link
              key={id}
              href={href}
              className={`lc-nav-item ${isActive ? 'lc-nav-item--active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

const STYLES = `
  /* ── App shell ── */
  .lc-app {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: #F5F7FA;
    max-width: 480px;
    margin: 0 auto;
    font-family: var(--font-body);
  }

  /* ── Header ── */
  .lc-header {
    background: #2557C7;
    padding-top: env(safe-area-inset-top, 0px);
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(21,50,111,0.3);
  }
  .lc-logo {
    height: 63px;
    width: auto;
    display: block;
    object-fit: contain;
    margin: 12px 0;
  }

  /* ── Body ── */
  .lc-body {
    flex: 1;
    padding: 12px 12px 80px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }

  /* ── Greeting card ── */
  .lc-greeting-card {
    background: #fff;
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 4px rgba(21,50,111,0.07);
  }
  .lc-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #64748B;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .lc-greeting-info { flex: 1; }
  .lc-greeting-name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 20px;
    color: #15181F;
    margin: 0;
  }
  .lc-greeting-highlight { color: #2563EB; }
  .lc-ver-perfil {
    font-family: var(--font-body);
    font-size: 13px;
    color: #2563EB;
    text-decoration: none;
    display: block;
    margin-top: 2px;
  }
  .lc-hamburger {
    background: none;
    border: none;
    color: #15181F;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
  }
  
  .res-card {
    background: #fff;
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.02);
  }
  
  .res-blue-card {
    background: linear-gradient(135deg, #1e40af, #2563eb);
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 4px 12px rgba(37,99,235,0.2);
  }
  
  .res-location-badge {
    background: #eff6ff;
    border-radius: 12px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .res-donut {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .res-donut-inner {
    width: 36px;
    height: 36px;
    background: #fff;
    border-radius: 50%;
  }

  /* Shared Navigation Styles with main app */
  .lc-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: #ffffff;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 10px 10px 24px;
    box-shadow: 0 -4px 20px rgba(21, 50, 111, 0.08);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    z-index: 50;
  }
  
  .lc-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #94A3B8;
    text-decoration: none;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.2s;
  }
  
  .lc-nav-item:hover { color: #2563EB; }
  
  .lc-nav-item--active {
    color: #2563EB;
  }
`;
