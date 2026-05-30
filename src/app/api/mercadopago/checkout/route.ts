import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configurar SDK de Mercado Pago usando el token de Agustín
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, title, deudaId } = body;

    if (!amount || !title) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (amount, title)' }, { status: 400 });
    }

    const preference = new Preference(client);
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const result = await preference.create({
      body: {
        items: [
          {
            id: deudaId || 'deuda_municipal',
            title: title,
            quantity: 1,
            unit_price: amount,
            currency_id: 'ARS',
          },
        ],
        external_reference: deudaId || undefined,
        back_urls: {
          success: `${base}/conductor?pago=success`,
          failure: `${base}/conductor?pago=failure`,
          pending: `${base}/conductor?pago=pending`,
        },
        auto_return: 'approved',
      },
    });

    // Retorna la URL del checkout de Mercado Pago
    return NextResponse.json({
      id: result.id,
      init_point: result.init_point, // Link oficial para redirigir al usuario
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error: unknown) {
    console.error('Error generando preferencia de pago:', error);
    return NextResponse.json(
      { error: 'Error interno generando el link de pago', details: (error as Error).message },
      { status: 500 }
    );
  }
}
