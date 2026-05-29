import MercadoPagoConfig, { Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  if (!process.env.MP_ACCESS_TOKEN) {
    return Response.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 503 });
  }

  const { formData, monto, concepto } = await request.json();

  try {
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: monto,
        token: formData.token,
        description: concepto,
        installments: formData.installments ?? 1,
        payment_method_id: formData.payment_method_id,
        payer: formData.payer,
      },
      requestOptions: {
        idempotencyKey: `SEM-${crypto.randomUUID()}`,
      },
    });

    return Response.json({
      status: result.status,
      statusDetail: result.status_detail,
      transactionId: `MP-${result.id}`,
    });
  } catch (err) {
    console.error('[MP] Error procesando pago:', err);
    return Response.json(
      { status: 'error', statusDetail: 'processing_error' },
      { status: 500 },
    );
  }
}
