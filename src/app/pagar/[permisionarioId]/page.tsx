import { permisionarioStore } from '@/lib/sem-store';
import { QRPaymentPageClient } from './client';


export default async function PagarQRPage({ params }: { params: Promise<{ permisionarioId: string }> }) {
  const { permisionarioId } = await params;
  const permisionario = permisionarioStore.getById(permisionarioId);

  if (!permisionario || !permisionario.activo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--hueso)' }}>
        <div className="card-sem text-center max-w-sm w-full space-y-4">
          <p className="text-lg font-bold text-gray-900">Permisionario no encontrado</p>
          <p className="text-gray-500 text-sm">El QR escaneado no es válido o el permisionario ya no está activo.</p>
        </div>
      </div>
    );
  }

  return <QRPaymentPageClient permisionario={permisionario} />;
}