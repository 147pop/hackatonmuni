'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import { configStore } from '@/lib/sem-store';
import { calcularMonto } from '@/domain/calculations';
import { useAdminRole, canEdit, ReadOnlyBanner } from '@/components/admin/role-guard';
import type { Tarifa } from '@/domain/types';
import { ROUTES } from '@/lib/routes';

export default function TarifasPage() {
  const adminRole = useAdminRole();
  const editable = canEdit(adminRole);
  const [form, setForm] = useState<Tarifa | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(configStore.getTarifa()); }, []);

  if (!form) return null;

  function set(field: keyof Tarifa, value: number | string) {
    setForm((prev) => prev ? { ...prev, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value } : prev);
  }

  function handleSave() {
    if (!form) return;
    configStore.setTarifa(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Live preview calculations
  const preview60 = calcularMonto({ tipo: 'auto', duracionMinutos: 60, metodoPago: 'efectivo', tarifa: form });
  const preview60d = calcularMonto({ tipo: 'auto', duracionMinutos: 60, metodoPago: 'digital', tarifa: form });
  const preview135 = calcularMonto({ tipo: 'auto', duracionMinutos: 135, metodoPago: 'efectivo', tarifa: form });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.admin.root} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarifas</h1>
          <p className="text-sm text-gray-500">RF-ADM-04 / RF-NOR-08 — sin redespliegue</p>
        </div>
      </div>

      {!editable && <ReadOnlyBanner />}

      {/* Precios */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Precios por hora
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="Auto ($/hora)" value={form.autoHora} onChange={(v) => set('autoHora', v)} disabled={!editable} min={0} />
          <NumField label="Moto ($/hora)" value={form.motoHora} onChange={(v) => set('motoHora', v)} disabled={!editable} min={0} />
        </div>
        <NumField label="Descuento digital (%)" value={Math.round(form.descuentoDigital * 100)}
          onChange={(v) => set('descuentoDigital', parseFloat(v) / 100)} disabled={!editable} min={0} max={100} />
      </section>

      {/* Fraccionamiento */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fraccionamiento (RF-EST-04)</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="Tolerancia (min)" value={form.toleranciaMinutos} onChange={(v) => set('toleranciaMinutos', v)} disabled={!editable} min={0} max={30} />
          <NumField label="Fracción (min)" value={form.fraccionamientoMinutos} onChange={(v) => set('fraccionamientoMinutos', v)} disabled={!editable} min={5} max={60} />
        </div>
        <NumField label="Fraccionamiento desde hora N°" value={form.fraccionamientoDesdeHora}
          onChange={(v) => set('fraccionamientoDesdeHora', v)} disabled={!editable} min={1} max={6} />
      </section>

      {/* Live preview */}
      <section className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vista previa — Auto efectivo</p>
        <PreviewRow label="1h exacta efectivo" value={preview60} />
        <PreviewRow label="1h exacta digital (−{Math.round(form.descuentoDigital*100)}%)" value={preview60d} highlight />
        <PreviewRow label="2h 15min efectivo (con fraccionamiento)" value={preview135} />
      </section>

      {saved && <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">Tarifas actualizadas. Próximo pago usará estos valores.</p>}

      {editable && (
        <button onClick={handleSave}
          className="btn-xl bg-municipal-600 hover:bg-municipal-700 text-white w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Guardar tarifas
        </button>
      )}
    </div>
  );
}

function NumField({ label, value, onChange, disabled, min, max }: {
  label: string; value: number; onChange: (v: string) => void;
  disabled?: boolean; min?: number; max?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full border-2 border-gray-200 focus:border-municipal-400 rounded-xl px-3 py-2.5 text-sm outline-none disabled:bg-gray-50 transition-colors" />
    </div>
  );
}

function PreviewRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>${value.toLocaleString('es-AR')}</span>
    </div>
  );
}
