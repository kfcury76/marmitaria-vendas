export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { rateLimit, rateLimitResponse } from '@/lib/ratelimit';

function validateMPSignature(request: Request, body: any): boolean {
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');

  if (!xSignature || !xRequestId) return false;

  const parts = xSignature.split(',');
  const ts = parts.find(p => p.trimStart().startsWith('ts='))?.split('=')[1];
  const hash = parts.find(p => p.trimStart().startsWith('v1='))?.split('=')[1];

  if (!ts || !hash) return false;

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[MP-WEBHOOK] MP_WEBHOOK_SECRET not configured, skipping signature validation');
    return true;
  }

  const manifest = `id:${body?.data?.id};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  return hmac === hash;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = rateLimit(`mp-webhook:${ip}`, 30, 60 * 1000);
    if (!success) return rateLimitResponse();

    const body = await request.json();

    if (!validateMPSignature(request, body)) {
      console.warn('[MP-WEBHOOK] Invalid signature - possible attack');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // MP sends: { action: "payment.created"|"payment.updated", data: { id: "payment_id" } }
    const paymentId = body?.data?.id;
    if (!paymentId) return NextResponse.json({ received: true });

    const mpToken = process.env.MP_ACCESS_TOKEN;
    if (!mpToken) return NextResponse.json({ received: true });

    // Fetch payment details from MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    if (!mpRes.ok) return NextResponse.json({ received: true });

    const payment = await mpRes.json();
    const { status, external_reference, transaction_amount } = payment;

    if (!external_reference) return NextResponse.json({ received: true });

    if (status === 'approved') {
      await Promise.all([
        supabase.from('marmita_orders').update({
          payment_status: 'approved',
          order_status: 'confirmed',
          mp_payment_id: String(paymentId),
        }).eq('id', external_reference),

        supabase.from('financial_entries').update({
          payment_status: 'aprovado',
        }).eq('order_id', external_reference),
      ]);
    } else if (status === 'rejected' || status === 'cancelled') {
      await supabase.from('marmita_orders').update({
        payment_status: status,
        order_status: 'cancelled',
      }).eq('id', external_reference);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[MP-WEBHOOK]', err);
    return NextResponse.json({ received: true }); // always 200 to MP
  }
}

// MP also sends GET to validate the endpoint
export async function GET() {
  return NextResponse.json({ ok: true });
}
