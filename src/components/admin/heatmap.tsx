'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { configStore } from '@/lib/sem-store';

// Define the heatmap zones data (simulated for now, could come from Supabase Realtime)
const SECTORS = [
  {
    id: 1,
    name: 'Zona Centro - Sector A',
    coordinates: [
      [-24.789, -65.412],
      [-24.789, -65.408],
      [-24.793, -65.408],
      [-24.793, -65.412],
    ] as [number, number][],
    capacity: 120,
    occupied: 110,
    free: 10,
    collection: 45000,
    attendants: 4
  },
  {
    id: 2,
    name: 'Zona Macrocentro - Sector B',
    coordinates: [
      [-24.785, -65.415],
      [-24.785, -65.410],
      [-24.789, -65.410],
      [-24.789, -65.415],
    ] as [number, number][],
    capacity: 200,
    occupied: 80,
    free: 120,
    collection: 25000,
    attendants: 6
  },
  {
    id: 3,
    name: 'Zona Monumento - Sector C',
    coordinates: [
      [-24.793, -65.408],
      [-24.793, -65.402],
      [-24.797, -65.402],
      [-24.797, -65.408],
    ] as [number, number][],
    capacity: 80,
    occupied: 60,
    free: 20,
    collection: 30000,
    attendants: 3
  }
];

export default function Heatmap() {
  const [zones, setZones] = useState(SECTORS);

  // Here we would use supabase.channel('...').on('postgres_changes', ...).subscribe()
  // to update `zones` in real time.
  useEffect(() => {
    // Simulated realtime update every 10 seconds
    const interval = setInterval(() => {
      setZones(prev => prev.map(z => ({
        ...z,
        occupied: Math.min(z.capacity, Math.max(0, z.occupied + Math.floor(Math.random() * 5) - 2))
      })));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const getColor = (occupied: number, capacity: number) => {
    const ratio = occupied / capacity;
    if (ratio >= 0.9) return '#D93025'; // Rojo
    if (ratio >= 0.7) return '#D97706'; // Naranja
    if (ratio >= 0.4) return '#F59E0B'; // Amarillo
    return '#1A7A4A'; // Verde
  };

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ZoomControl position="bottomright" />
        
        {zones.map((zone) => {
          const color = getColor(zone.occupied, zone.capacity);
          const ratio = Math.round((zone.occupied / zone.capacity) * 100);
          
          return (
            <Polygon 
              key={zone.id} 
              positions={zone.coordinates} 
              pathOptions={{ 
                color: color,
                fillColor: color, 
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Tooltip sticky className="custom-tooltip">
                <div className="p-2 font-body text-sm">
                  <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">{zone.name}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-gray-500">Ocupación:</span>
                    <span className="font-bold text-right" style={{ color }}>{ratio}%</span>
                    
                    <span className="text-gray-500">Ocupadas/Total:</span>
                    <span className="font-medium text-right">{zone.occupied} / {zone.capacity}</span>
                    
                    <span className="text-gray-500">Recaudación:</span>
                    <span className="font-medium text-right text-green-600">${zone.collection.toLocaleString('es-AR')}</span>
                    
                    <span className="text-gray-500">Previsores:</span>
                    <span className="font-medium text-right">{zone.attendants}</span>
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
}
