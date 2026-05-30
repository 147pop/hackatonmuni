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

    import('leaflet.heat').then(() => {
      // @ts-ignore
      const heat = (L as any).heatLayer(points, {
        radius: 35,
        blur: 28,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.1, // Reduced so it doesn't cover too much at low heat
        gradient: {
          0.0: '#0000FF',
          0.15: '#0066FF',
          0.30: '#00CCFF',
          0.40: '#00FF88',
          0.50: '#00FF00',
          0.60: '#AAFF00',
          0.70: '#FFFF00',
          0.80: '#FFAA00',
          0.90: '#FF4400',
          1.0: '#FF0000',
        }
      }).addTo(map);

      // Desvanecer el canvas para ver calles y nombres
      const canvas = heat._canvas;
      if (canvas) {
        canvas.style.opacity = '0.35'; // Aún más transparente a pedido del usuario
      }

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

  for (let i = 0; i < 60; i++) points.push([centerLat + (Math.random() - 0.5) * 0.008, centerLng + (Math.random() - 0.5) * 0.008, 0.6 + Math.random() * 0.4]);
  for (let i = 0; i < 40; i++) points.push([centerLat + 0.005 + (Math.random() - 0.5) * 0.012, centerLng - 0.004 + (Math.random() - 0.5) * 0.012, 0.3 + Math.random() * 0.4]);
  for (let i = 0; i < 25; i++) points.push([centerLat - 0.006 + (Math.random() - 0.5) * 0.015, centerLng + 0.006 + (Math.random() - 0.5) * 0.015, 0.1 + Math.random() * 0.3]);
  for (let i = 0; i < 30; i++) points.push([centerLat + 0.002 + (Math.random() - 0.5) * 0.003, centerLng - 0.001 + (Math.random() - 0.5) * 0.003, 0.85 + Math.random() * 0.15]);

  return points;
}

export default function Heatmap() {
  const [points, setPoints] = useState<[number, number, number][]>([]);

  useEffect(() => { setPoints(generateHeatPoints()); }, []);

  useEffect(() => {
    if (points.length === 0) return;
    const interval = setInterval(() => {
      setPoints(prev => prev.map(([lat, lng, intensity]) => [lat, lng, Math.max(0.05, Math.min(1, intensity + (Math.random() - 0.5) * 0.08))]));
    }, 6000);
    return () => clearInterval(interval);
  }, [points.length]);

  if (points.length === 0) return null;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
      <MapContainer
        center={[-24.789, -65.410]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
          zIndex={100}
        />
        <ZoomControl position="bottomright" />
        <HeatLayer points={points} />
        {/* Capa de etiquetas flotante por encima del calor (z-index alto) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          zIndex={500}
        />
      </MapContainer>
    </div>
  );
}
