import MercadoPagoConfig, { Payment, MerchantOrder } from 'mercadopago';
import { NextRequest } from 'next/server';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');

  if (!ref) {
    return Response.json({ error: 'Referencia requerida (ref)' }, { status: 400 });
  }

  // Si estamos en entorno de mock (sin token real o forzado por env var), respondemos simulado
  const mockMode = process.env.MP_MOCK_MODE === 'true' || !process.env.MP_ACCESS_TOKEN;
  if (mockMode) {
    // In mock mode, we won't auto-approve unless there is a specific trigger,
    // but the API logic remains intact. If the frontend wants to simulate payment,
    // they can just skip polling and show success directly via the button.
    return Response.json({
      status: 'pending',
      statusDetail: 'mock_pending',
      mock: true
    });
  }

  try {
    // Primero buscamos en pagos directos
    const paymentClient = new Payment(client);
    const paymentSearch = await paymentClient.search({
      options: { external_reference: ref }
    });

    const payments = paymentSearch.results || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const approvedPayment = payments.find((p: any) => p.status === 'approved');
    
    if (approvedPayment) {
      return Response.json({
        status: 'approved',
        statusDetail: approvedPayment.status_detail,
        paymentId: approvedPayment.id,
        externalReference: approvedPayment.external_reference,
      });
    }

    // Si no hay pago aprobado, buscamos en Merchant Orders (Instore Orders)
    const moClient = new MerchantOrder(client);
    const moSearch = await moClient.search({
      options: { external_reference: ref }
    });

    const orders = moSearch.elements || [];
    if (orders.length === 0) {
      return Response.json({ status: 'pending', statusDetail: 'not_found' });
    }

    // Un Merchant Order está pagado si status = 'closed' o si tiene payments aprobados
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = orders[0] as any;
    if (order.status === 'closed' || (order.order_status === 'paid')) {
      return Response.json({
        status: 'approved',
        statusDetail: 'closed',
        paymentId: order.id,
        externalReference: order.external_reference,
      });
    }

    return Response.json({
      status: 'pending',
      statusDetail: order.status,
    });
  } catch (err: unknown) {
    console.error('[MP] Error consultando estado por referencia:', err);
    const detail = err && typeof err === 'object' && 'message' in err
      ? (err as { message: string }).message
      : 'Error desconocido';
    return Response.json({ error: detail }, { status: 500 });
  }
}
