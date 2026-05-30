'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Componente que inyecta la capa de calor tipo "spray aerosol" ──
function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Importar leaflet.heat dinámicamente (solo en cliente)
    import('leaflet.heat').then(() => {
      // @ts-ignore — leaflet.heat extiende L con heatLayer
      const heat = (L as any).heatLayer(points, {
        radius: 35,       // Radio del "spray" de cada punto
        blur: 28,          // Difuminado para que se mezclen como aerosol
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.45,
        // Gradiente arcoíris tipo mapa de TV
        gradient: {
          0.0: '#0000FF',   // Azul frío
          0.15: '#0066FF',  // Azul medio
          0.30: '#00CCFF',  // Celeste
          0.40: '#00FF88',  // Verde agua
          0.50: '#00FF00',  // Verde
          0.60: '#AAFF00',  // Verde lima
          0.70: '#FFFF00',  // Amarillo
          0.80: '#FFAA00',  // Naranja
          0.90: '#FF4400',  // Rojo naranja
          1.0: '#FF0000',   // Rojo intenso
        }
      }).addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    });
  }, [map, points]);

  return null;
}

// ── Generador de puntos de calor distribuidos por la zona centro de Salta ──
function generateHeatPoints(): [number, number, number][] {
  const centerLat = -24.789;
  const centerLng = -65.410;
  const points: [number, number, number][] = [];

  // Cluster principal: zona de alta ocupación (centro comercial)
  for (let i = 0; i < 60; i++) {
    points.push([
      centerLat + (Math.random() - 0.5) * 0.008,
      centerLng + (Math.random() - 0.5) * 0.008,
      0.6 + Math.random() * 0.4 // Intensidad alta
    ]);
  }

  // Cluster secundario: zona media (alrededores)
  for (let i = 0; i < 40; i++) {
    points.push([
      centerLat + 0.005 + (Math.random() - 0.5) * 0.012,
      centerLng - 0.004 + (Math.random() - 0.5) * 0.012,
      0.3 + Math.random() * 0.4 // Intensidad media
    ]);
  }

  // Cluster terciario: zona baja (periferia)
  for (let i = 0; i < 25; i++) {
    points.push([
      centerLat - 0.006 + (Math.random() - 0.5) * 0.015,
      centerLng + 0.006 + (Math.random() - 0.5) * 0.015,
      0.1 + Math.random() * 0.3 // Intensidad baja
    ]);
  }

  // Hotspot puntual: una zona muy saturada
  for (let i = 0; i < 30; i++) {
    points.push([
      centerLat + 0.002 + (Math.random() - 0.5) * 0.003,
      centerLng - 0.001 + (Math.random() - 0.5) * 0.003,
      0.85 + Math.random() * 0.15 // Intensidad máxima
    ]);
  }

  return points;
}

export default function Heatmap() {
  const [points, setPoints] = useState<[number, number, number][]>([]);

  useEffect(() => {
    setPoints(generateHeatPoints());
  }, []);

  // Simulación de cambio en tiempo real
  useEffect(() => {
    if (points.length === 0) return;
    const interval = setInterval(() => {
      setPoints(prev =>
        prev.map(([lat, lng, intensity]) => [
          lat,
          lng,
          Math.max(0.05, Math.min(1, intensity + (Math.random() - 0.5) * 0.08))
        ])
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [points.length]);

  if (points.length === 0) return null;

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
        <HeatLayer points={points} />
      </MapContainer>
    </div>
  );
}
