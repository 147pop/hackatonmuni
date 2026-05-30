'use client';

import { useState, useEffect } from 'react';
import { 
  Car, Map as MapIcon, FileText, User, AlertCircle, 
  ArrowLeft, CreditCard, Clock, CheckCircle2, ChevronRight 
} from 'lucide-react';
import dynamic from 'next/dynamic';

const AvailabilityMap = dynamic(() => import('@/components/conductor/availability-map'), { ssr: false });

type ViewType = 'dashboard' | 'vehiculos' | 'mapa' | 'comprobantes' | 'cuenta' | 'reclamos';

// --- MOCK DATA ---
const mockVehiculos = [
  { dominio: 'AB 123 CD', marca: 'Toyota Corolla', default: true },
  { dominio: 'EF 456 GH', marca: 'Ford Fiesta', default: false }
];
const mockDeuda = 1500;
const mockTicketActivo = { cuadra: 'Independencia 700', restante: 45 };

// --- SUB-VIEWS ---

function VehiculosView() {
  return (
    <div className="p-5 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Mis Vehículos</h2>
        <p className="text-sm text-slate-500">Gestioná tus autos registrados</p>
      </div>
      
      <div className="space-y-3">
        {mockVehiculos.map(v => (
          <div key={v.dominio} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Car size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800">{v.dominio}</p>
                <p className="text-xs text-slate-500">{v.marca}</p>
              </div>
            </div>
            {v.default && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Predeterminado</span>}
          </div>
        ))}
      </div>

      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
        <span>+ Agregar Vehículo</span>
      </button>

      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <h3 className="font-bold text-blue-900 mb-1">Acciones Rápidas</h3>
        <button className="w-full py-3 mt-2 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-200 flex items-center justify-center gap-2">
          <CreditCard size={18} /> Pagar Estacionamiento
        </button>
      </div>
    </div>
  );
}

function MapaView() {
  return (
    <div className="h-full flex flex-col relative bg-slate-900">
      <div className="absolute top-0 inset-x-0 z-[1000] p-4 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg pointer-events-auto border border-white/20">
          <h2 className="font-bold text-slate-800 text-sm">Disponibilidad en Vivo</h2>
          <p className="text-xs text-slate-500">Basado en sensores y previsores</p>
        </div>
      </div>
      <div className="flex-1">
        <AvailabilityMap />
      </div>
    </div>
  );
}

function ComprobantesView() {
  return (
    <div className="p-5 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Comprobantes</h2>
        <p className="text-sm text-slate-500">Tu historial de pagos</p>
      </div>
      
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-slate-800 text-sm">Estacionamiento - Independencia 700</p>
                <p className="text-xs text-slate-500">28 May 2026 • 14:30 hs</p>
              </div>
              <span className="font-bold text-emerald-600">$450</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
              <CheckCircle2 size={14} /> Pagado
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CuentaView() {
  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
          JD
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Juan Doe</h2>
          <p className="text-sm text-slate-500">juan.doe@ejemplo.com</p>
        </div>
      </div>

      <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle size={24} />
          <div>
            <p className="font-bold">Deuda Pendiente</p>
            <p className="text-xs text-red-500/80">Por Infracción #4829</p>
          </div>
        </div>
        <p className="font-black text-xl text-red-700">${mockDeuda}</p>
      </div>

      <div className="space-y-2">
        <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-200 hover:bg-slate-50">
          <span className="font-medium text-slate-700">Datos Personales</span>
          <ChevronRight className="text-slate-400" />
        </button>
        <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-200 hover:bg-slate-50">
          <span className="font-medium text-slate-700">Métodos de Pago</span>
          <ChevronRight className="text-slate-400" />
        </button>
        <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-200 hover:bg-slate-50">
          <span className="font-medium text-red-600">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

function ReclamosView() {
  return (
    <div className="p-5 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Reclamos</h2>
        <p className="text-sm text-slate-500">Iniciá un trámite o consulta</p>
      </div>
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Motivo</label>
          <select className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500">
            <option>Ticket cobrado erróneamente</option>
            <option>Vehículo mal estacionado</option>
            <option>Consulta general</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Mensaje</label>
          <textarea rows={4} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500" placeholder="Escribí tu reclamo..."></textarea>
        </div>
        <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-200">
          Enviar Reclamo
        </button>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

export default function ConductorPage() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 relative">
      
      {/* ── NAVEGACIÓN SUPERIOR ── */}
      {activeView !== 'dashboard' && (
        <div className="flex-shrink-0 h-14 bg-white border-b border-slate-200 flex items-center px-4 relative z-50">
          <button 
            onClick={() => setActiveView('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-2 font-bold text-lg text-slate-800 capitalize">
            {activeView === 'vehiculos' ? 'Mis Vehículos' : activeView}
          </h1>
        </div>
      )}

      {/* ── ÁREA DE CONTENIDO (Scrollable) ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        
        {/* --- VIEW: DASHBOARD --- */}
        {activeView === 'dashboard' && (
          <div className="p-5 space-y-6 pb-10">
            
            {/* Header Perfil */}
            <div className="bg-blue-600 rounded-3xl p-6 shadow-lg shadow-blue-600/30 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Car size={100} />
              </div>
              <div className="relative z-10">
                <p className="text-blue-100 font-medium text-sm">Hola, Juan</p>
                <h1 className="text-2xl font-black tracking-tight mt-1">AB 123 CD</h1>
                <p className="text-xs text-blue-200 mt-1 uppercase tracking-wider font-bold">Vehículo Activo</p>
              </div>
            </div>

            {/* Alertas / Status */}
            <div className="grid gap-3">
              {mockTicketActivo && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">Estacionado</p>
                      <p className="text-xs text-emerald-700">{mockTicketActivo.cuadra}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-emerald-600">{mockTicketActivo.restante}m</p>
                    <p className="text-[10px] text-emerald-600/80 font-bold uppercase">Restantes</p>
                  </div>
                </div>
              )}

              {mockDeuda > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between shadow-sm" onClick={() => setActiveView('cuenta')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-red-900 text-sm">Deuda Pendiente</p>
                      <p className="text-xs text-red-700">Multas impagas</p>
                    </div>
                  </div>
                  <ChevronRight className="text-red-400" />
                </div>
              )}
            </div>

            {/* Grilla de Accesos Módulos */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Módulos</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveView('vehiculos')} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 items-start hover:border-blue-400 transition-colors">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Car size={24} /></div>
                  <span className="font-bold text-sm text-slate-700">Vehículos</span>
                </button>
                
                <button onClick={() => setActiveView('mapa')} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 items-start hover:border-emerald-400 transition-colors">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><MapIcon size={24} /></div>
                  <span className="font-bold text-sm text-slate-700">Disponibilidad</span>
                </button>
                
                <button onClick={() => setActiveView('comprobantes')} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 items-start hover:border-amber-400 transition-colors">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileText size={24} /></div>
                  <span className="font-bold text-sm text-slate-700">Comprobantes</span>
                </button>
                
                <button onClick={() => setActiveView('cuenta')} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 items-start hover:border-purple-400 transition-colors">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><User size={24} /></div>
                  <span className="font-bold text-sm text-slate-700">Mi Cuenta</span>
                </button>
              </div>
              
              <button onClick={() => setActiveView('reclamos')} className="w-full mt-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-400 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-xl"><AlertCircle size={20} /></div>
                  <span className="font-bold text-sm text-slate-700">Centro de Reclamos</span>
                </div>
                <ChevronRight className="text-slate-400" />
              </button>
            </div>

          </div>
        )}

        {/* --- OTHER VIEWS --- */}
        {activeView === 'vehiculos' && <VehiculosView />}
        {activeView === 'mapa' && <MapaView />}
        {activeView === 'comprobantes' && <ComprobantesView />}
        {activeView === 'cuenta' && <CuentaView />}
        {activeView === 'reclamos' && <ReclamosView />}
        
      </div>
    </div>
  );
}
