import MercadoPagoConfig, { Payment } from 'mercadopago';
import { NextRequest } from 'next/server';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('payment_id');

  if (!paymentId) {
    return Response.json({ error: 'payment_id requerido' }, { status: 400 });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return Response.json({ status: 'unknown' }, { status: 503 });
  }

  try {
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: Number(paymentId) });

    return Response.json({
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentId: payment.id,
      externalReference: payment.external_reference,
    });
  } catch (err: unknown) {
    console.error('[MP] Error consultando estado:', err);
    const detail = err && typeof err === 'object' && 'message' in err
      ? (err as { message: string }).message
      : 'Error desconocido';
    return Response.json({ error: detail }, { status: 500 });
  }
}