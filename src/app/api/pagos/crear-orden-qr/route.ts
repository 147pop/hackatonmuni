import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { monto, dominio, cuadra, duracion, permisionarioId, vehiculoTipo } = await request.json();

  if (!monto || !dominio || !cuadra || !duracion || !permisionarioId) {
    return Response.json({ error: 'Faltan datos requeridos' }, { status: 400 });
  }

  const userId = process.env.MP_USER_ID;
  const externalPosId = process.env.MP_EXTERNAL_POS_ID || 'CAJA_PERM_01';
  const token = process.env.MP_ACCESS_TOKEN;

  if (!userId || !token) {
    return Response.json({ error: 'Credenciales de MP no configuradas' }, { status: 500 });
  }

  const externalReference = JSON.stringify({
    permisionarioId,
    dominio,
    duracion,
    cuadra,
    vehiculoTipo,
    monto,
    timestamp: Date.now(),
  });

  const body = {
    external_reference: externalReference,
    title: `Estacionamiento SEM — ${cuadra}`,
    description: `Patente ${dominio} · ${duracion} min`,
    total_amount: monto,
    items: [
      {
        sku_number: `SEM-${dominio}`,
        category: 'parking',
        title: `Estacionamiento SEM — ${cuadra}`,
        description: `Patente ${dominio} · ${duracion} min`,
        unit_price: monto,
        quantity: 1,
        unit_measure: 'unit',
        total_amount: monto
      }
    ]
  };

  try {
    const url = `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${userId}/pos/${externalPosId}/qrs`;
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('[MP] Error creando orden QR:', errData);
      return Response.json({ error: 'Error creando la orden en MercadoPago', detail: errData }, { status: res.status });
    }

    const data = await res.json();

    return Response.json({
      qr_data: data.qr_data, // El string EMVCo nativo (000201...)
      externalReference,
    });
  } catch (err: unknown) {
    console.error('[MP] Error de red:', err);
    const detail = err && typeof err === 'object' && 'message' in err
      ? (err as { message: string }).message
      : 'Error desconocido';
    return Response.json({ error: detail }, { status: 500 });
  }
}
