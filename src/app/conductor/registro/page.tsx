'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car } from 'lucide-react';
import { PlateInput } from '@/components/plate-input';
import { conductorStore, vehiculoStore, roleStore } from '@/lib/sem-store';
import { ROUTES } from '@/lib/routes';

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dominio, setDominio] = useState('');
  const [dominioValido, setDominioValido] = useState(false);
  const [vehiculoTipo, setVehiculoTipo] = useState<'auto' | 'moto'>('auto');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) { setError('El nombre es requerido.'); return; }
    if (!dominioValido) { setError('Ingresá un dominio válido.'); return; }

    const conductor = conductorStore.create({
      nombre: nombre.trim(),
      email: email.trim() || `${nombre.toLowerCase().replace(/\s/g, '')}@demo.sem`,
      telefono: telefono.trim() || '387-0000000',
      dominioDefault: dominio.toUpperCase(),
    });

    // Register vehicle if not already in store
    if (!vehiculoStore.getByDominio(dominio)) {
      vehiculoStore.create({ dominio: dominio.toUpperCase(), tipo: vehiculoTipo, conductorId: conductor.id });
    }

    roleStore.setActiveConductorId(conductor.id);
    router.push(ROUTES.conductor.root);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.conductor.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-base text-gray-500">RF-USR-01: Registro de conductor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="block text-base font-semibold text-gray-700">Nombre *</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full border-2 border-gray-200 focus:border-municipal-500 rounded-xl px-4 py-3 text-base outline-none transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-base font-semibold text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com (opcional)"
            className="w-full border-2 border-gray-200 focus:border-municipal-500 rounded-xl px-4 py-3 text-base outline-none transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-base font-semibold text-gray-700">Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="387-0000000 (opcional)"
            className="w-full border-2 border-gray-200 focus:border-municipal-500 rounded-xl px-4 py-3 text-base outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-semibold text-gray-700">Vehículo principal *</label>
          <div className="grid grid-cols-2 gap-3 mb-2">
            {(['auto', 'moto'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setVehiculoTipo(t)}
                className={`btn-xl flex items-center justify-center gap-2 border-2 transition-all ${vehiculoTipo === t ? 'bg-municipal-600 border-municipal-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}>
                <Car className="w-5 h-5" />
                {t === 'auto' ? 'Auto' : 'Moto'}
              </button>
            ))}
          </div>
          <PlateInput value={dominio} onChange={setDominio} onValidChange={setDominioValido} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

        <button type="submit"
          className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white w-full">
          Crear cuenta y continuar
        </button>
      </form>
    </div>
  );
}
