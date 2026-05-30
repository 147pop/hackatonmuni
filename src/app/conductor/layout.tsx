import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Conductor | SEM Digital Salta',
  description: 'Panel de autogestión para conductores',
};

export default function ConductorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f1f5f9] flex flex-col justify-center items-center">
      {/* Contenedor estricto móvil (iPhone width) centrado en desktop */}
      <div className="w-full max-w-[430px] h-[100dvh] bg-[#f8fafc] shadow-2xl relative overflow-hidden flex flex-col sm:h-[850px] sm:rounded-[40px] sm:border-[8px] sm:border-gray-900">
        <Suspense fallback={<div className="p-6 text-center text-gray-500">Cargando aplicación...</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
