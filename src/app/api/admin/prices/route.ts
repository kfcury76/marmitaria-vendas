export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function checkAuth(request: Request): boolean {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || adminPassword === 'trocar-antes-de-publicar') return false;
    const auth = request.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    return token === adminPassword;
}

export async function GET(request: Request) {
    if (!checkAuth(request)) {
        return NextResponse.json({ error: 'Senha invalida' }, { status: 401 });
    }
    const [itemsRes, deliveryRes] = await Promise.all([
        supabaseAdmin.from('menu_items').select(`id, name, base_price, sort_order, category:category_id(name), groups:menu_groups(id, title, sort_order, options:menu_additions(id, name, price, sort_order))`).eq('is_active', true).order('sort_order', { ascending: true }),
        supabaseAdmin.from('delivery_config').select('*').order('id'),
    ]);
    if (itemsRes.error) {
        console.error('Erro ao buscar menu_items:', itemsRes.error);
        return NextResponse.json({ error: itemsRes.error.message }, { status: 500 });
    }
    return NextResponse.json({ items: itemsRes.data ?? [], delivery: deliveryRes.data ?? [] });
}

export async function PATCH(request: Request) {
    if (!checkAuth(request)) {
        return NextResponse.json({ error: 'Senha invalida' }, { status: 401 });
    }
    const body = await request.json();
    const { table, id, price } = body as { table: string; id: string | number; price: number };
    if (!table || id === undefined || price === undefined) {
        return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 });
    }
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
        return NextResponse.json({ error: 'Preco invalido' }, { status: 400 });
    }
    let error: any = null;
    if (table === 'menu_items') {
        ({ error } = await supabaseAdmin.from('menu_items').update({ base_price: numericPrice }).eq('id', id));
    } else if (table === 'menu_additions') {
        ({ error } = await supabaseAdmin.from('menu_additions').update({ price: numericPrice }).eq('id', id));
    } else if (table === 'delivery_config') {
        ({ error } = await supabaseAdmin.from('delivery_config').update({ fee: numericPrice }).eq('id', id));
    } else {
        return NextResponse.json({ error: 'Tabela desconhecida' }, { status: 400 });
    }
    if (error) {
        console.error(`Erro ao atualizar ${table}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
