'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const streetNodes = [
  { lon: -65.408328, lat: -24.8081528 },
  { lon: -65.406996, lat: -24.8081602 },
  { lon: -65.406892, lat: -24.8081598 },
  { lon: -65.406783, lat: -24.8081587 },
  { lon: -65.406164, lat: -24.8081555 },
  { lon: -65.405574, lat: -24.8081524 },
  { lon: -65.405469, lat: -24.8081524 },
  { lon: -65.405371, lat: -24.8081533 },
  { lon: -65.404400, lat: -24.8081598 }, 
  { lon: -65.403500, lat: -24.8081630 }, 
  { lon: -65.402200, lat: -24.8081550 }
];

function getCentroLat(lon: number) { 
  let i = 0;
  while (i < streetNodes.length - 1 && lon > streetNodes[i + 1].lon) { i++; }
  const n1 = streetNodes[i];
  const n2 = streetNodes[i + 1] || streetNodes[i];
  if (n1.lon === n2.lon) return n1.lat;
  const pct = (lon - n1.lon) / (n2.lon - n1.lon);
  return n1.lat + (n2.lat - n1.lat) * pct;
}

const cuadras = [
  { num: 900, startLon: -65.40681, endLon: -65.40555 },
  { num: 800, startLon: -65.40539, endLon: -65.40429 },
  { num: 700, startLon: -65.40413, endLon: -65.40295 }
];

const colores: Record<string, string> = {
  libre: '#34c759',
  ocupado: '#ff3b30',
  garaje: '#ff9500',
  discapacitado: '#007aff',
  especial: '#ffcc00'
};

function getTotalBoxes(cuadraNum: number, lado: string) {
  if (cuadraNum === 700 && lado === 'norte') return 18;
  if (cuadraNum === 700 && lado === 'sur') return 18;
  if (cuadraNum === 800 && lado === 'norte') return 19;
  if (cuadraNum === 800 && lado === 'sur') return 17;
  if (cuadraNum === 900 && lado === 'norte') return 18;
  if (cuadraNum === 900 && lado === 'sur') return 15;
  return 15; 
}

function asignarTipoFijo(index: number, lado: string, cuadraNum: number) {
  if (cuadraNum === 900 && lado === 'norte' && index === 9) return 'calle';
  if (cuadraNum === 800 && lado === 'norte' && index === 12) return 'calle';
  if (cuadraNum === 700 && lado === 'norte' && index === 5) return 'calle';
  if (cuadraNum === 700 && lado === 'norte') {
      if (index === 2 || index === 8 || index === 12) return 'garaje';
      if (index === 17) return 'discapacitado';
      if (index === 6 || index === 7 || index === 16) return 'especial';
  }
  if (cuadraNum === 700 && lado === 'sur') {
      if (index === 4 || index === 9 || index === 14) return 'garaje';
      if (index === 0) return 'discapacitado';
      if (index === 1) return 'especial';
  }
  if (cuadraNum === 800 && lado === 'norte') {
      if (index === 5 || index === 13 || index === 16) return 'garaje';
      if (index === 18) return 'discapacitado';
      if (index === 17) return 'especial';
  }
  if (cuadraNum === 800 && lado === 'sur') {
      if (index === 8) return 'garaje';
      if (index === 0 || index === 16) return 'discapacitado';
      if (index === 14 || index === 15 || index === 1 || index === 2) return 'especial';
  }
  if (cuadraNum === 900 && lado === 'sur' && (index === 12 || index === 13 || index === 14)) return 'garaje';
  return 'dinamico';
}

interface BoxData {
  id: string;
  cuadra: number;
  lado: string;
  lonBase: number;
  lonSize: number;
  estado: string;
  tipo: string;
  poly?: L.Polyline;
}

function LiveBoxesLayer() {
  const map = useMap();
  const boxesRef = useRef<BoxData[]>([]);

  useEffect(() => {
    if (!map) return;
    
    const allBoxes: BoxData[] = [];
    cuadras.forEach(cuadra => {
      ['norte', 'sur'].forEach(lado => {
        const totalBoxes = getTotalBoxes(cuadra.num, lado);
        const espacioTotal = cuadra.endLon - cuadra.startLon;
        const espacioPorBox = espacioTotal / totalBoxes;
        const lonSizeLocal = espacioPorBox * 0.95;
        const lonGapLocal = espacioPorBox * 0.05;
        let currentLon = cuadra.startLon;
        
        for (let i = 0; i < totalBoxes; i++) {
          const tipo = asignarTipoFijo(i, lado, cuadra.num);
          allBoxes.push({
            id: `box-${cuadra.num}-${lado}-${i}`,
            cuadra: cuadra.num,
            lado,
            lonBase: currentLon,
            lonSize: lonSizeLocal,
            estado: (tipo === 'dinamico') ? (Math.random() > 0.5 ? 'libre' : 'ocupado') : tipo,
            tipo
          });
          currentLon += (lonSizeLocal + lonGapLocal);
        }
      });
    });
    
    boxesRef.current = allBoxes;

    const renderizarBoxes = () => {
      boxesRef.current.forEach(box => {
        if (box.poly) map.removeLayer(box.poly);
      });

      boxesRef.current.forEach(box => {
        if (box.estado === 'calle') return;

        const latCentro1 = getCentroLat(box.lonBase);
        const latCentro2 = getCentroLat(box.lonBase + box.lonSize);
        
        const p1 = map.project([latCentro1, box.lonBase]);
        const p2 = map.project([latCentro2, box.lonBase + box.lonSize]);
        const pixelOffset = 6; 

        if (box.lado === 'norte') { p1.y -= pixelOffset; p2.y -= pixelOffset; } 
        else { p1.y += pixelOffset; p2.y += pixelOffset; }

        const ll1 = map.unproject(p1);
        const ll2 = map.unproject(p2);

        const color = colores[box.estado] || colores.libre;
        const weight = map.getZoom() >= 19 ? 5 : 4;

        const poly = L.polyline([[ll1.lat, ll1.lng], [ll2.lat, ll2.lng]], {
          color, weight, opacity: 1, interactive: false
        }).addTo(map);

        box.poly = poly;
      });
    };

    renderizarBoxes();
    map.on('zoomend', renderizarBoxes);

    const interval = setInterval(() => {
      const dinamicos = boxesRef.current.filter(b => b.tipo === 'dinamico');
      if (dinamicos.length > 0) {
        const cambios = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < cambios; i++) {
          const box = dinamicos[Math.floor(Math.random() * dinamicos.length)];
          box.estado = box.estado === 'libre' ? 'ocupado' : 'libre';
          if (box.poly) {
            box.poly.setStyle({ color: colores[box.estado] });
          }
        }
      }
    }, 2500);

    return () => {
      clearInterval(interval);
      map.off('zoomend', renderizarBoxes);
      boxesRef.current.forEach(b => { if (b.poly) map.removeLayer(b.poly); });
    };
  }, [map]);

  return null;
}

export default function ConductorAvailabilityMap() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#f1f5f9] relative">
      <MapContainer
        center={[-24.80825, -65.4056]}
        zoom={18}
        style={{ height: '100%', width: '100%', background: '#f1f5f9' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
          maxZoom={22}
        />
        <ZoomControl position="bottomright" />
        <LiveBoxesLayer />
      </MapContainer>

      {/* Panel Superior */}
      <div className="absolute top-5 left-5 z-[1000] bg-white/90 backdrop-blur-md rounded-xl p-4 border border-slate-200 shadow-xl w-[280px]">
        <h1 className="text-slate-900 font-bold text-base tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>SALTA STREET LIVE</h1>
        <p className="text-slate-500 text-[10px] uppercase mt-1 font-semibold">Monitor de Av. Independencia</p>
      </div>

      {/* Referencias */}
      <div className="absolute bottom-6 left-5 z-[1000] bg-white/90 backdrop-blur-md rounded-xl p-4 border border-slate-200 shadow-xl w-[280px]">
        <h2 className="text-slate-800 text-xs font-bold mb-3 border-b border-slate-200 pb-2">REFERENCIAS DE ESTADO</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center text-[10px] text-slate-700 font-medium"><div className="w-3 h-3 rounded mr-3 shadow-sm" style={{ background: colores.libre }}></div> Box Libre (6m) - Disponible</div>
          <div className="flex items-center text-[10px] text-slate-700 font-medium"><div className="w-3 h-3 rounded mr-3 shadow-sm" style={{ background: colores.ocupado }}></div> Box Ocupado (6m) - En uso</div>
          <div className="flex items-center text-[10px] text-slate-700 font-medium"><div className="w-3 h-3 rounded mr-3 shadow-sm" style={{ background: colores.garaje }}></div> Garaje / Prohibido Estacionar</div>
          <div className="flex items-center text-[10px] text-slate-700 font-medium"><div className="w-3 h-3 rounded mr-3 shadow-sm" style={{ background: colores.discapacitado }}></div> Reservado Discapacitados</div>
          <div className="flex items-center text-[10px] text-slate-700 font-medium"><div className="w-3 h-3 rounded mr-3 shadow-sm" style={{ background: colores.especial }}></div> Reservado Hoteles/Clínicas</div>
        </div>
      </div>
    </div>
  );
}
