import MercadoPagoConfig, { Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  if (!process.env.MP_ACCESS_TOKEN) {
    return Response.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 503 });
  }

  const { monto, dominio, cuadra, duracion } = await request.json();

  const preference = new Preference(client);

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: `SEM-${dominio}-${Date.now()}`,
            title: `Estacionamiento ${cuadra}`,
            description: `${dominio} · ${duracion} min`,
            quantity: 1,
            unit_price: monto,
            currency_id: 'ARS',
          },
        ],
        external_reference: `SEM-${dominio}-${Date.now()}`,
        notification_url: process.env.APP_URL
          ? `${process.env.APP_URL}/api/webhooks/mercadopago`
          : undefined,
        back_urls: process.env.APP_URL
          ? {
              success: `${process.env.APP_URL}/conductor/pagar?estado=ok`,
              failure: `${process.env.APP_URL}/conductor/pagar?estado=error`,
              pending: `${process.env.APP_URL}/conductor/pagar?estado=pendiente`,
            }
          : undefined,
      },
    });

    return Response.json({ preferenceId: result.id });
  } catch (err: unknown) {
    console.error('[MP] Error creando preferencia:', JSON.stringify(err, null, 2));
    const detail = err && typeof err === 'object' && 'message' in err
      ? (err as { message: string }).message
      : JSON.stringify(err);
    return Response.json({ error: detail }, { status: 500 });
  }
}
