import { supabase } from '@/lib/supabase';
import { MenuItem, MenuGroup } from '@/data/menu';

/**
 * Busca o cardápio completo da Marmitaria Araras (Pratos e Bebidas)
 */
export async function getRealMenu(): Promise<MenuItem[]> {
    try {
        // Buscar Itens do Menu do Novo Sistema Sync
        const { data: dishes, error: dishError } = await supabase
            .from('menu_items')
            .select(`
                id, 
                name, 
                description, 
                base_price, 
                image_url, 
                category:category_id (name),
                groups:menu_groups (
                    id,
                    title,
                    min_options,
                    max_options,
                    additions:menu_additions (
                        id,
                        name,
                        price,
                        is_active
                    )
                )
            `)
            .eq('business_unit', 'marmitaria')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (dishError) throw dishError;

        const formattedMenu: MenuItem[] = [];

        if (dishes) {
            dishes.forEach((item: any) => {
                const groups: MenuGroup[] = (item.groups || []).map((g: any) => ({
                    id: g.id,
                    title: g.title || "Opções",
                    min: g.min_options || 0,
                    max: g.max_options || 10,
                    options: (g.additions || [])
                        .filter((a: any) => a.is_active)
                        .map((a: any) => ({
                            id: a.id,
                            name: a.name,
                            price: Number(a.price)
                        }))
                }));

                formattedMenu.push({
                    id: item.id,
                    name: item.name,
                    description: item.description || "",
                    basePrice: Number(item.base_price || 0),
                    price: Number(item.base_price || 0),
                    image: item.image_url || "",
                    category: item.category?.name || "Geral",
                    groups
                });
            });
        }

        return formattedMenu;
    } catch (error) {
        console.error("Erro ao buscar cardápio:", error);
        return [];
    }
}
