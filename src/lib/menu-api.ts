import { supabase } from '@/lib/supabase';
import { MenuItem, MenuGroup, MenuAddition } from '@/data/menu';

/**
 * Busca o cardapio inteiro do Supabase e formata exatamente como o App espera
 */
export async function getRealMenu(): Promise<MenuItem[]> {
    try {
        const { data: items, error } = await supabase
            .from('menu_items')
            .select(`
        id, name, description, base_price, image_url, sort_order,
        category:category_id(name),
        groups:menu_groups(
          id, title, min_options, max_options, sort_order,
          options:menu_additions(id, name, price, sort_order)
        )
      `)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        if (!items) return [];

        const formattedMenu: MenuItem[] = items.map((item: any) => {
            const formattedGroups: MenuGroup[] = (item.groups || [])
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((g: any) => {
                    const formattedOptions: MenuAddition[] = (g.options || [])
                        .sort((a: any, b: any) => a.sort_order - b.sort_order)
                        .map((opt: any) => ({
                            id: opt.id,
                            name: opt.name,
                            price: Number(opt.price)
                        }));
                    return {
                        id: g.id,
                        title: g.title,
                        min: g.min_options,
                        max: g.max_options,
                        options: formattedOptions
                    };
                });
            return {
                id: item.id,
                name: item.name,
                description: item.description || "",
                basePrice: Number(item.base_price),
                image: item.image_url || "/placeholder.svg",
                category: item.category?.name || "Sem Categoria",
                groups: formattedGroups
            };
        });
        return formattedMenu;
    } catch (err) {
        console.error("Erro ao puxar dados do Supabase:", err);
        return [];
    }
}
