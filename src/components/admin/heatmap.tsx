'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Rectangle, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Generar una grilla de "cuadras" para que parezca un mapa de calor real
function generateHeatmapGrid() {
  const centerLat = -24.789;
  const centerLng = -65.410;
  const latStep = 0.0015; // Aprox 150m
  const lngStep = 0.0015; // Aprox 150m
  
  const blocks = [];
  let id = 1;

  for (let i = -3; i <= 3; i++) {
    for (let j = -4; j <= 4; j++) {
      // Evitar algunas esquinas para darle forma orgánica
      if (Math.abs(i) === 3 && Math.abs(j) === 4) continue;
      if (Math.abs(i) === 3 && Math.abs(j) === 3 && Math.random() > 0.5) continue;

      const lat = centerLat + i * latStep;
      const lng = centerLng + j * lngStep;
      
      const capacity = Math.floor(Math.random() * 30) + 10; // 10 a 40
      // Tendencia: el centro (i=0, j=0) tiene más ocupación
      const distance = Math.sqrt(i*i + j*j);
      const occupancyFactor = Math.max(0, 1 - (distance / 5)); 
      const occupied = Math.floor(capacity * (occupancyFactor * 0.7 + Math.random() * 0.3));

      blocks.push({
        id: id++,
        name: `Cuadra ${Math.abs(i)}${Math.abs(j)} - Zona Centro`,
        bounds: [
          [lat - latStep/2.2, lng - lngStep/2.2], // Dejar un pequeño gap para simular calles
          [lat + latStep/2.2, lng + lngStep/2.2]
        ] as [[number, number], [number, number]],
        capacity,
        occupied,
        collection: occupied * 150,
        attendants: Math.random() > 0.5 ? 1 : 0
      });
    }
  }
  return blocks;
}

export default function Heatmap() {
  const [zones, setZones] = useState([]);
  
  useEffect(() => {
    // Solo generamos en el cliente para evitar hidratación mismatch
    setZones(generateHeatmapGrid() as any);
  }, []);

  // Simulated realtime update
  useEffect(() => {
    if (zones.length === 0) return;
    const interval = setInterval(() => {
      setZones(prev => prev.map((z: any) => ({
        ...z,
        occupied: Math.min(z.capacity, Math.max(0, z.occupied + Math.floor(Math.random() * 3) - 1))
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, [zones.length]);

  const getColor = (occupied: number, capacity: number) => {
    const ratio = occupied / capacity;
    if (ratio >= 0.85) return '#D93025'; // Rojo (Muy baja disp)
    if (ratio >= 0.60) return '#D97706'; // Naranja (Baja disp)
    if (ratio >= 0.30) return '#F59E0B'; // Amarillo (Media)
    return '#1A7A4A'; // Verde (Alta)
  };

  if (zones.length === 0) return null;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      <MapContainer 
        center={[-24.789, -65.410]} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        <ZoomControl position="bottomright" />
        
        {zones.map((zone: any) => {
          const color = getColor(zone.occupied, zone.capacity);
          const ratio = Math.round((zone.occupied / zone.capacity) * 100);
          
          return (
            <Rectangle 
              key={zone.id} 
              bounds={zone.bounds} 
              pathOptions={{ 
                color: color,
                stroke: false, // Sin bordes!
                fillColor: color, 
                fillOpacity: 0.55 // Translúcido para parecer heatmap
              }}
            >
              <Tooltip sticky className="custom-tooltip">
                <div className="p-2 font-body text-sm min-w-[200px]">
                  <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">{zone.name}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-gray-500">Ocupación:</span>
                    <span className="font-bold text-right" style={{ color }}>{ratio}%</span>
                    
                    <span className="text-gray-500">Ocupadas:</span>
                    <span className="font-medium text-right">{zone.occupied} / {zone.capacity}</span>
                    
                    <span className="text-gray-500">Recaudación:</span>
                    <span className="font-medium text-right text-green-600">${zone.collection.toLocaleString('es-AR')}</span>
                    
                    <span className="text-gray-500">Previsores:</span>
                    <span className="font-medium text-right">{zone.attendants}</span>
                  </div>
                </div>
              </Tooltip>
            </Rectangle>
          );
        })}
      </MapContainer>
    </div>
  );
}
