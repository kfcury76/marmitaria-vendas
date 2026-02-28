export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cart, customerInfo } = body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ success: false, error: 'Carrinho vazio' }, { status: 400 });
    }
    if (!customerInfo?.nome?.trim() || !customerInfo?.telefone?.trim()) {
      return NextResponse.json({ success: false, error: 'Nome e telefone sao obrigatorios' }, { status: 400 });
    }

    const menuItemIds: string[] = [...new Set(cart.map((c: any) => c.menuItem?.id).filter(Boolean))];
    const additionIds: string[] = [
      ...new Set(
        cart.flatMap((c: any) => Object.values(c.selectedAdditions ?? {}).flat().map((a: any) => a.id)).filter(Boolean)
      ),
    ];

    const [itemsRes, additionsRes] = await Promise.all([
      menuItemIds.length > 0 ? supabase.from('menu_items').select('id, base_price').in('id', menuItemIds) : Promise.resolve({ data: [] }),
      additionIds.length > 0 ? supabase.from('menu_additions').select('id, price').in('id', additionIds) : Promise.resolve({ data: [] }),
    ]);

    const itemPriceMap = new Map<string, number>((itemsRes.data ?? []).map((i: any) => [i.id, Number(i.base_price)]));
    const additionPriceMap = new Map<string, number>((additionsRes.data ?? []).map((a: any) => [a.id, Number(a.price)]));

    let serverTotal = 0;
    for (const cartItem of cart) {
      const basePrice = itemPriceMap.get(cartItem.menuItem?.id) ?? 0;
      const additionsTotal = Object.values(cartItem.selectedAdditions ?? {}).flat()
        .reduce((sum: number, a: any) => sum + (additionPriceMap.get(a.id) ?? 0), 0);
      serverTotal += (basePrice + additionsTotal) * (Number(cartItem.quantity) || 1);
    }
    serverTotal = Number(serverTotal.toFixed(2));

    if (serverTotal <= 0) {
      return NextResponse.json({ success: false, error: 'Total invalido' }, { status: 400 });
    }

    const { data: orderData, error: orderError } = await supabase
      .from('marmita_orders')
      .insert({
        customer_name: customerInfo.nome.trim(),
        customer_phone: customerInfo.telefone.trim(),
        customer_address: customerInfo.endereco?.trim() || '',
        observations: customerInfo.observacoes?.trim() || null,
        items: cart,
        meal_size: 'P',
        meal_size_name: cart[0]?.menuItem?.name ?? 'Pedido',
        protein: '',
        carb: '',
        base_price: serverTotal,
        extras_price: 0,
        delivery_fee: 0,
        delivery_type: 'balcao',
        total_price: serverTotal,
        payment_method: 'mercado_pago',
        payment_status: 'pending',
        order_status: 'pending',
        source: 'marmitaria_araras',
      })
      .select('id')
      .single();

    if (orderError) console.error("Erro ao salvar pedido:", orderError);
    const orderId = orderData?.id ?? null;

    if (orderId) {
      supabase.from('print_queue').insert({
        order_id: orderId, order_type: 'marmitaria_interna', target: 'marmitaria',
        business_unit: 'marmitaria', customer_name: customerInfo.nome.trim(),
        customer_phone: customerInfo.telefone.trim(),
        order_summary: { customer: customerInfo, items: cart, total: serverTotal },
        print_status: 'pending',
      }).then(({ error }) => { if (error) console.error("Erro print_queue:", error); });

      supabase.from('financial_entries').insert({
        order_id: orderId, order_table: 'marmita_orders', business_unit: 'marmitaria',
        customer_name: customerInfo.nome.trim(), total_amount: serverTotal,
        payment_method: 'mercado_pago', payment_status: 'pendente',
      }).then(({ error }) => { if (error) console.error("Erro financial_entries:", error); });
    }

    const mpToken = process.env.MP_ACCESS_TOKEN;
    let checkoutUrl: string | null = null;

    if (mpToken && mpToken !== 'SEU_TOKEN_DO_MERCADO_PAGO_AQUI') {
      try {
        const mpClient = new MercadoPagoConfig({ accessToken: mpToken });
        const preferenceClient = new Preference(mpClient);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const mpResponse = await preferenceClient.create({
          body: {
            items: cart.map((item: any) => ({
              id: item.cartId ?? item.id ?? 'item',
              title: item.menuItem?.name ?? 'Item',
              quantity: Number(item.quantity) || 1,
              unit_price: Number(((itemPriceMap.get(item.menuItem?.id) ?? 0) + Object.values(item.selectedAdditions ?? {}).flat().reduce((s: number, a: any) => s + (additionPriceMap.get(a.id) ?? 0), 0)).toFixed(2)),
              currency_id: 'BRL',
            })),
            payer: { name: customerInfo.nome.trim(), phone: { area_code: '', number: customerInfo.telefone.trim() } },
            back_urls: {
              success: `${appUrl}/pedido/sucesso?order_id=${orderId}`,
              failure: `${appUrl}/pedido/falha?order_id=${orderId}`,
              pending: `${appUrl}/pedido/pendente?order_id=${orderId}`,
            },
            ...(appUrl.startsWith('https://') ? { auto_return: 'approved' as const } : {}),
            external_reference: orderId ? String(orderId) : undefined,
          },
        });
        checkoutUrl = mpResponse.init_point ?? null;
        if (orderId && mpResponse.id) {
          await supabase.from('marmita_orders').update({ mp_preference_id: String(mpResponse.id) }).eq('id', orderId);
        }
      } catch (mpErr: any) {
        console.error("Erro ao criar preferencia MP:", mpErr);
      }
    }

    const n8nUrl = process.env.N8N_MARMITARIA_WEBHOOK_URL;
    if (n8nUrl) {
      fetch(n8nUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'new_order_marmitaria', order_id: orderId, items: cart, customer: customerInfo, total: serverTotal, checkoutUrl }),
      }).catch(err => console.error("Erro silencioso N8N:", err));
    }

    return NextResponse.json({ success: true, order_id: orderId, checkoutUrl });
  } catch (error: any) {
    console.error("Erro no checkout:", error);
    return NextResponse.json({ success: false, error: 'Erro interno ao processar pedido' }, { status: 500 });
  }
}
