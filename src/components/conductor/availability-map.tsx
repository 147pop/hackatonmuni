'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, Polyline, useMap } from 'react-leaflet';
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
  while (i < streetNodes.length - 1 && lon > streetNodes[i + 1].lon) {
    i++;
  }
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

// Colores de ocupación
const colorMap = {
  alta: '#34c759',    // Verde (Alta disponibilidad)
  media: '#ffcc00',   // Amarillo (Media disponibilidad)
  baja: '#ff9500',    // Naranja (Baja disponibilidad)
  saturada: '#ff3b30' // Rojo (Saturada)
};

// Genera un estado random simulado cada X segundos
function getEstadoRandom() {
  const r = Math.random();
  if (r < 0.25) return 'alta';
  if (r < 0.5) return 'media';
  if (r < 0.75) return 'baja';
  return 'saturada';
}

function CuadrasLayer() {
  const map = useMap();
  const [blocks, setBlocks] = useState(() => 
    cuadras.flatMap(c => [
      { id: `${c.num}-norte`, cuadra: c.num, lado: 'Norte', startLon: c.startLon, endLon: c.endLon, latOffset: -9, estado: getEstadoRandom() },
      { id: `${c.num}-sur`, cuadra: c.num, lado: 'Sur', startLon: c.startLon, endLon: c.endLon, latOffset: 9, estado: getEstadoRandom() }
    ])
  );

  // Simulación en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setBlocks(prev => prev.map(b => ({
        ...b,
        // Pequeña probabilidad de cambiar de estado
        estado: Math.random() > 0.8 ? getEstadoRandom() : b.estado 
      })));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {blocks.map((block) => {
        // Convert to latlngs using the curve function and map projection
        let latCentro1 = getCentroLat(block.startLon);
        let latCentro2 = getCentroLat(block.endLon);
        
        let p1 = map.project([latCentro1, block.startLon]);
        let p2 = map.project([latCentro2, block.endLon]);

        p1.y += block.latOffset;
        p2.y += block.latOffset;

        let ll1 = map.unproject(p1);
        let ll2 = map.unproject(p2);

        return (
          <Polyline
            key={block.id}
            positions={[[ll1.lat, ll1.lng], [ll2.lat, ll2.lng]]}
            color={colorMap[block.estado as keyof typeof colorMap]}
            weight={7}
            opacity={0.8}
            pathOptions={{ lineCap: 'round' }}
          />
        );
      })}
    </>
  );
}

export default function ConductorAvailabilityMap() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#f1f5f9] relative">
      <MapContainer
        center={[-24.80825, -65.4056]}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Mapa base oscuro para alto contraste como en index.html */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        <ZoomControl position="bottomright" />
        <CuadrasLayer />
      </MapContainer>

      {/* Referencias flotantes */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/90 backdrop-blur-md rounded-2xl p-3 flex flex-col gap-2 w-[90%] max-w-[340px] border border-white/10 shadow-2xl">
        <p className="text-white text-xs font-bold uppercase tracking-wider text-center mb-1">Disponibilidad</p>
        <div className="flex justify-between px-2 text-[10px] text-gray-300 font-medium">
          <div className="flex flex-col items-center gap-1">
            <span className="w-8 h-2.5 rounded-full" style={{ background: colorMap.alta }} />
            <span>Alta</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="w-8 h-2.5 rounded-full" style={{ background: colorMap.media }} />
            <span>Media</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="w-8 h-2.5 rounded-full" style={{ background: colorMap.baja }} />
            <span>Baja</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="w-8 h-2.5 rounded-full" style={{ background: colorMap.saturada }} />
            <span>Saturada</span>
          </div>
        </div>
      </div>
    </div>
  );
}
