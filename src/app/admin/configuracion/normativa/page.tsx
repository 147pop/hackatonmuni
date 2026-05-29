'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Clock } from 'lucide-react';
import { configStore } from '@/lib/sem-store';
import { useAdminRole, canEdit, ReadOnlyBanner } from '@/components/admin/role-guard';
import type { ConfiguracionNormativa } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

const LABELS: Record<keyof ConfiguracionNormativa, string> = {
  horarioDiurnoInicio:     'Inicio turno diurno (L-V y Sab)',
  horarioDiurnoFinSemana:  'Fin turno diurno (Lunes a Viernes)',
  horarioDiurnoFinSabado:  'Fin turno diurno (Sábado)',
  horarioNocturnoInicio:   'Inicio turno nocturno',
  horarioNocturnoFin:      'Fin turno nocturno (madrugada)',
};

const HINTS: Partial<Record<keyof ConfiguracionNormativa, string>> = {
  horarioDiurnoInicio:    'RF-NOR-01: L-V 07:00–21:00, Sab 07:00–14:00',
  horarioNocturnoInicio:  'RF-NOR-03: Solo zonas habilitadas. Cruza medianoche.',
};

export default function NormativaPage() {
  const adminRole = useAdminRole();
  const editable = canEdit(adminRole);
  const [form, setForm] = useState<ConfiguracionNormativa | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(configStore.getConfig()); }, []);

  if (!form) return null;

  function set(field: keyof ConfiguracionNormativa, value: string) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function handleSave() {
    if (!form) return;
    configStore.setConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Normativa horaria</h1>
          <p className="text-sm text-gray-500">RF-NOR-07 / RF-NOR-08 — parámetros de horario</p>
        </div>
      </div>

      {!editable && <ReadOnlyBanner />}

      <div className="space-y-4">
        {(Object.keys(form) as (keyof ConfiguracionNormativa)[]).map((field) => (
          <div key={field} className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {LABELS[field]}
            </label>
            <input
              type="time"
              value={form[field]}
              onChange={(e) => set(field, e.target.value)}
              disabled={!editable}
              className="w-full border-2 border-gray-200 focus:border-municipal-400 rounded-xl px-3 py-2.5 text-sm outline-none disabled:bg-gray-50 font-mono transition-colors"
            />
            {HINTS[field] && (
              <p className="text-xs text-gray-400">{HINTS[field]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-semibold">Horario vigente</p>
        <p>Diurno L-V: {form.horarioDiurnoInicio} → {form.horarioDiurnoFinSemana}</p>
        <p>Diurno Sab: {form.horarioDiurnoInicio} → {form.horarioDiurnoFinSabado}</p>
        <p>Nocturno: {form.horarioNocturnoInicio} → {form.horarioNocturnoFin} (madrugada)</p>
      </div>

      {saved && <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">Normativa actualizada. Próximos pagos usarán estos horarios.</p>}

      {editable && (
        <button onClick={handleSave}
          className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Guardar normativa
        </button>
      )}
    </div>
  );
}
