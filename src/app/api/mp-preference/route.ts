// Simple MP preference endpoint — chamado pelo cosiararas (CORS habilitado)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const ALLOWED_ORIGINS = [
  'https://cosiararas.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();
    const {
      order_id,
      amount,
      description,
      customer_name,
      success_url,
      failure_url,
      pending_url,
    } = body;

    if (!order_id || !amount || !success_url) {
      return NextResponse.json(
        { error: 'order_id, amount e success_url são obrigatórios' },
        { status: 400, headers }
      );
    }

    const mpToken = process.env.MP_ACCESS_TOKEN;
    if (!mpToken || mpToken === 'SEU_TOKEN_DO_MERCADO_PAGO_AQUI') {
      return NextResponse.json(
        { error: 'Mercado Pago não configurado no servidor' },
        { status: 503, headers }
      );
    }

    const mpClient = new MercadoPagoConfig({ accessToken: mpToken });
    const preferenceClient = new Preference(mpClient);

    const mpResponse = await preferenceClient.create({
      body: {
        items: [
          {
            id: order_id,
            title:
              description ||
              `Pedido Cosí — ${customer_name || 'Cliente'}`,
            quantity: 1,
            unit_price: Number(Number(amount).toFixed(2)),
            currency_id: 'BRL',
          },
        ],
        ...(customer_name ? { payer: { name: customer_name } } : {}),
        back_urls: {
          success: success_url,
          failure: failure_url || success_url,
          pending: pending_url || success_url,
        },
        ...(success_url.startsWith('https://')
          ? { auto_return: 'approved' as const }
          : {}),
        external_reference: order_id,
      },
    });

    return NextResponse.json(
      {
        init_point: mpResponse.init_point,
        preference_id: mpResponse.id,
      },
      { status: 200, headers }
    );
  } catch (err: any) {
    console.error('[MP-PREFERENCE]', err);
    return NextResponse.json(
      { error: 'Erro ao criar preferência de pagamento' },
      { status: 500, headers }
    );
  }
}
