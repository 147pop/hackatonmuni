import { Building2 } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-7 h-7 text-municipal-700" />
        <h1 className="text-2xl font-bold text-gray-900">Administración Municipal</h1>
      </div>
      <p className="text-gray-500">Dashboard y reportes — Sprint 5.</p>
    </div>
  );
}
