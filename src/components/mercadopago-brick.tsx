'use client';

import { useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2, Lock } from 'lucide-react';

declare global {
  interface Window {
    MercadoPago: new (key: string, options?: { locale: string }) => MercadoPagoInstance;
  }
}

interface MercadoPagoInstance {
  createCardToken: (data: CardData) => Promise<{ id: string }>;
}

interface CardData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

interface MercadoPagoBrickProps {
  monto: number;
  concepto: string;
  onSuccess: (transactionId: string) => void;
  onFailed?: (detail?: string) => void;
}

type FormStep = 'form' | 'processing' | 'done';

const CARD_ERRORS: Record<string, string> = {
  'cc_rejected_bad_filled_card_number': 'Número de tarjeta incorrecto.',
  'cc_rejected_bad_filled_date': 'Fecha de vencimiento incorrecta.',
  'cc_rejected_bad_filled_security_code': 'Código de seguridad incorrecto.',
  'cc_rejected_insufficient_amount': 'Fondos insuficientes.',
  'cc_rejected_blacklist': 'Tarjeta rechazada.',
  'cc_rejected_call_for_authorize': 'Tarjeta requiere autorización. Llamar al banco.',
  'cc_rejected_high_risk': 'Pago rechazado por riesgo.',
  'cc_rejected_other_reason': 'Pago rechazado.',
};

export function MercadoPagoBrick({ monto, concepto, onSuccess, onFailed }: MercadoPagoBrickProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [step, setStep] = useState<FormStep>('form');
  const [error, setError] = useState('');
  const mpRef = useRef<MercadoPagoInstance | null>(null);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [docNumber, setDocNumber] = useState('');

  useEffect(() => {
    if (window.MercadoPago) {
      mpRef.current = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: 'es-AR' });
      setSdkReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      mpRef.current = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: 'es-AR' });
      setSdkReady(true);
    };
    document.head.appendChild(script);
  }, []);

  function detectPaymentMethod(num: string): string {
    const b = num.replace(/\s/g, '');
    if (/^4/.test(b)) return 'visa';
    if (/^5[1-5]|^2[2-7]/.test(b)) return 'master';
    if (/^3[47]/.test(b)) return 'amex';
    if (/^36/.test(b)) return 'diners';
    return 'visa';
  }

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!mpRef.current) { setError('SDK no listo. Recargá la página.'); return; }

    const rawCard = cardNumber.replace(/\s/g, '');
    const [month, year] = cardExpiry.split('/');

    if (rawCard.length < 13 || !month || !year || cardCvv.length < 3 || !cardName.trim() || !docNumber.trim()) {
      setError('Completá todos los campos correctamente.');
      return;
    }

    setStep('processing');

    try {
      const token = await mpRef.current.createCardToken({
        cardNumber: rawCard,
        cardholderName: cardName.trim().toUpperCase(),
        cardExpirationMonth: month.padStart(2, '0'),
        cardExpirationYear: `20${year}`,
        securityCode: cardCvv,
        identificationType: 'DNI',
        identificationNumber: docNumber.trim(),
      });

      const res = await fetch('/api/pagos/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto,
          concepto,
          formData: {
            token: token.id,
            payment_method_id: detectPaymentMethod(cardNumber),
            installments: 1,
            payer: { email: 'conductor@sem-digital.ar' },
          },
        }),
      });

      const data = await res.json();

      setStep('done');

      if (data.status === 'approved') {
        onSuccess(data.transactionId);
      } else {
        const msg = CARD_ERRORS[data.statusDetail ?? ''] ?? `Pago rechazado (${data.statusDetail ?? 'error'}).`;
        setError(msg);
        onFailed?.(data.statusDetail);
      }
    } catch (err) {
      console.error('[MP Card Form]', err);
      setError('Error procesando el pago. Intentá de nuevo.');
      setStep('form');
      onFailed?.();
    }
  }

  if (!sdkReady) {
    return <MercadoPagoBrickLoader />;
  }

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-base font-medium text-gray-700">Procesando pago…</p>
        <p className="text-xs text-gray-400">No cierres esta pantalla</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <Lock className="w-3.5 h-3.5" />
        <span>Pago seguro con MercadoPago</span>
        <CreditCard className="w-3.5 h-3.5 ml-auto" />
      </div>

      {/* Card number */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Número de tarjeta</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          maxLength={19}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-base font-mono focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Name */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Nombre en la tarjeta</label>
        <input
          type="text"
          placeholder="NOMBRE APELLIDO"
          value={cardName}
          onChange={(e) => setCardName(e.target.value.toUpperCase())}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-base uppercase focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Vencimiento</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/AA"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
            maxLength={5}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-base font-mono focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">CVV</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="123"
            value={cardCvv}
            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-base font-mono focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* DNI */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">DNI del titular</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="12345678"
          value={docNumber}
          onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
          maxLength={8}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-base font-mono focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
      )}

      <button
        type="submit"
        className="btn-xl bg-blue-500 hover:bg-blue-600 text-white w-full flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" />
        Pagar ${monto.toLocaleString('es-AR')}
      </button>
    </form>
  );
}

export function MercadoPagoBrickLoader() {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-sm text-gray-400">Cargando formulario de pago…</p>
    </div>
  );
}
