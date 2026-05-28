import { Car } from 'lucide-react';

export default function ConductorPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Car className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Conductor</h1>
      </div>
      <p className="text-gray-500">Flujo de pago digital — Sprint 3.</p>
    </div>
  );
}
