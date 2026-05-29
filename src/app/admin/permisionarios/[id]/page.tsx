'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { permisionarioStore, configStore } from '@/lib/sem-store';
import { useAdminRole, canEdit, ReadOnlyBanner } from '@/components/admin/role-guard';
import type { Permisionario } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

const EMPTY: Omit<Permisionario, 'id' | 'createdAt'> = {
  nombre: '', apellido: '', legajo: '',
  foto: '/avatars/perm1.svg',
  cuadraAsignada: '', zonaId: '',
  activo: true,
  horariosAutorizados: { diurno: true, nocturno: false },
};

export default function PermisionarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const adminRole = useAdminRole();
  const editable = canEdit(adminRole);
  const isNew = id === 'nuevo';

  const [form, setForm] = useState<Omit<Permisionario, 'id' | 'createdAt'>>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const zonas = configStore.getZonas();

  useEffect(() => {
    if (!isNew) {
      const p = permisionarioStore.getById(id);
      if (p) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _c, ...rest } = p;
        setForm(rest);
      }
    }
  }, [id, isNew]);

  function handleChange(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleHorario(turno: 'diurno' | 'nocturno', value: boolean) {
    setForm((prev) => ({ ...prev, horariosAutorizados: { ...prev.horariosAutorizados, [turno]: value } }));
  }

  function handleSave() {
    setError('');
    if (!form.nombre.trim() || !form.apellido.trim() || !form.legajo.trim() || !form.cuadraAsignada.trim() || !form.zonaId) {
      setError('Todos los campos marcados son requeridos.'); return;
    }
    if (isNew) {
      permisionarioStore.create(form);
    } else {
      permisionarioStore.update(id, form);
    }
    setSaved(true);
    setTimeout(() => { router.push(ROUTES.admin.permisionarios); }, 800);
  }

  function handleDelete() {
    if (!confirm(`¿Dar de baja a ${form.nombre} ${form.apellido}? Esta acción es reversible.`)) return;
    permisionarioStore.update(id, { activo: false });
    router.push(ROUTES.admin.permisionarios);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.permisionarios} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Nuevo permisionario' : `${form.nombre} ${form.apellido}`}</h1>
          <p className="text-sm text-gray-500">{isNew ? 'RF-ADM-03' : `RF-ADM-03 / RF-PER-10 · Legajo ${form.legajo}`}</p>
        </div>
      </div>

      {!editable && <ReadOnlyBanner />}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre *" value={form.nombre} onChange={(v) => handleChange('nombre', v)} disabled={!editable} />
          <Field label="Apellido *" value={form.apellido} onChange={(v) => handleChange('apellido', v)} disabled={!editable} />
        </div>
        <Field label="Legajo *" value={form.legajo} placeholder="P-0000" onChange={(v) => handleChange('legajo', v)} disabled={!editable} />
        <Field label="Cuadra asignada *" value={form.cuadraAsignada} placeholder="Ej: Balcarce 400" onChange={(v) => handleChange('cuadraAsignada', v)} disabled={!editable} />

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">Zona *</label>
          <select
            value={form.zonaId}
            onChange={(e) => handleChange('zonaId', e.target.value)}
            disabled={!editable}
            className="w-full border-2 border-gray-200 focus:border-municipal-400 rounded-xl px-3 py-2.5 text-sm outline-none disabled:bg-gray-50"
          >
            <option value="">Seleccionar zona…</option>
            {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Turnos autorizados</label>
          <div className="flex gap-3">
            {(['diurno', 'nocturno'] as const).map((turno) => (
              <label key={turno} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.horariosAutorizados[turno]}
                  onChange={(e) => handleHorario(turno, e.target.checked)} disabled={!editable}
                  className="w-4 h-4 rounded accent-municipal-600" />
                <span className="capitalize">{turno}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.activo}
            onChange={(e) => handleChange('activo', e.target.checked)} disabled={!editable}
            className="w-4 h-4 rounded accent-municipal-600" />
          <span className="font-medium">Activo</span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}
      {saved && <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">Guardado correctamente.</p>}

      {editable && (
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave}
            className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white flex items-center gap-2 flex-1 justify-center">
            <Save className="w-4 h-4" /> Guardar
          </button>
          {!isNew && (
            <button onClick={handleDelete}
              className="btn-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center gap-2 px-4">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="w-full border-2 border-gray-200 focus:border-municipal-400 rounded-xl px-3 py-2.5 text-sm outline-none disabled:bg-gray-50 transition-colors" />
    </div>
  );
}
