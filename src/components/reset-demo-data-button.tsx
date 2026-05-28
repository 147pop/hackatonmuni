'use client';

import { RotateCcw } from 'lucide-react';
import { resetToDemo } from '@/lib/sem-store';
import { useRouter } from 'next/navigation';

export function ResetDemoDataButton() {
  const router = useRouter();

  function handleReset() {
    if (!window.confirm('¿Restaurar todos los datos de demostración? Se perderán los cambios actuales.')) return;
    resetToDemo();
    router.refresh();
  }

  return (
    <button
      onClick={handleReset}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <RotateCcw className="w-4 h-4" />
      Restaurar datos de demo
    </button>
  );
}
