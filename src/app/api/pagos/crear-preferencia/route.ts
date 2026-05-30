import MercadoPagoConfig, { Preference } from 'mercadopago';
import { NextRequest } from 'next/server';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  const { monto, dominio, cuadra, duracion, permisionarioId, vehiculoTipo } = await request.json();

  if (!monto || !dominio || !cuadra || !duracion || !permisionarioId) {
    return Response.json({ error: 'Faltan datos requeridos' }, { status: 400 });
  }

  const origin = request.headers.get('origin')
    || process.env.APP_URL
    || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const externalReference = JSON.stringify({
    permisionarioId,
    dominio,
    duracion,
    cuadra,
    vehiculoTipo,
    monto,
    timestamp: Date.now(),
  });

  const mockMode = process.env.MP_MOCK_MODE === 'true' || !process.env.MP_ACCESS_TOKEN;

  if (mockMode) {
    const mockPreferenceId = `MOCK-${Date.now()}`;
    const mockInitPoint = `${origin}/pagar/${permisionarioId}/resultado?status=approved&payment_id=${mockPreferenceId}&external_reference=${encodeURIComponent(externalReference)}`;

    return Response.json({
      init_point: mockInitPoint,
      sandbox_init_point: mockInitPoint,
      preferenceId: mockPreferenceId,
      externalReference,
      mock: true,
    });
  }

  const preference = new Preference(client);

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: `SEM-${dominio}-${Date.now()}`,
            title: `Estacionamiento SEM — ${cuadra}`,
            description: `Patente ${dominio} · ${duracion} min · Descuento digital 20%`,
            quantity: 1,
            unit_price: monto,
            currency_id: 'ARS',
          },
        ],
        external_reference: externalReference,
        notification_url: process.env.APP_URL
          ? `${process.env.APP_URL}/api/webhooks/mercadopago`
          : undefined,
        statement_descriptor: 'SEM SALTA',
        binary_mode: true,
      },
    });

    return Response.json({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      preferenceId: result.id,
      externalReference,
      mock: false,
    });
  } catch (err: unknown) {
    console.error('[MP] Error creando preferencia:', JSON.stringify(err, null, 2));
    const detail = err && typeof err === 'object' && 'message' in err
      ? (err as { message: string }).message
      : JSON.stringify(err);
    return Response.json({ error: detail }, { status: 500 });
  }
}