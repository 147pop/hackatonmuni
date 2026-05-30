import MercadoPagoConfig, { Payment, MerchantOrder } from 'mercadopago';
import crypto from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

function verifySignature(request: Request): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Skip validation in dev

  const xSignature = request.headers.get('x-signature') ?? '';
  const xRequestId = request.headers.get('x-request-id') ?? '';
  const url = new URL(request.url);
  const dataId = url.searchParams.get('data.id') ?? '';

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1] ?? ''};`;
  const parts = xSignature.split(',');
  const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  if (!v1) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const computed = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifySignature(request)) {
    return Response.json({ error: 'Firma inválida' }, { status: 401 });
  }

  let data: { type?: string; data?: { id?: string } };
  try {
    data = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (data.type === 'payment' && data.data?.id) {
    try {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: Number(data.data.id) });
      console.info('[MP Webhook] Pago recibido', {
        id: payment.id,
        status: payment.status,
        monto: payment.transaction_amount,
        externalRef: payment.external_reference,
      });
    } catch (err) {
      console.error('[MP Webhook] Error consultando pago:', err);
    }
  }

  if (data.type === 'merchant_order' && data.data?.id) {
    try {
      const moClient = new MerchantOrder(client);
      const order = await moClient.get({ merchantOrderId: Number(data.data.id) });
      console.info('[MP Webhook] Merchant order recibida', {
        id: order.id,
        status: order.status,
        externalRef: order.external_reference,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderStatus: (order as any).order_status,
      });
    } catch (err) {
      console.error('[MP Webhook] Error consultando merchant order:', err);
    }
  }

  return Response.json({ received: true });
}
