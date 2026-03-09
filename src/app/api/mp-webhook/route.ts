export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
