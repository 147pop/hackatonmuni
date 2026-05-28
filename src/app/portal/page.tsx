import { Globe } from 'lucide-react';

export default function PortalPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-7 h-7 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-900">Portal Público</h1>
      </div>
      <p className="text-gray-500">Pago sin cuenta — Sprint 3.</p>
    </div>
  );
}
