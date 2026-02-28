export type MenuAddition = {
  id: string;
  name: string;
  price: number;
};

export type MenuGroup = {
  id: string;
  title: string;
  min: number;
  max: number;
  options: MenuAddition[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  category: string;
  groups: MenuGroup[];
};

export const MENU_DATA: MenuItem[] = [
  { id: "m-bife-cavalo", name: "Marmitex P - Bife a Cavalo", description: "Acompanha arroz, feijao, macarrao, batata frita e farofa.", basePrice: 27.90, image: "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/cardapio-fotos/bife-cavalo.png", category: "Marmitas", groups: getStandardGroups() },
  { id: "m-frango-empanado", name: "Marmitex P - Frango Empanado", description: "Acompanha arroz, feijao, macarrao, batata frita e farofa.", basePrice: 26.90, image: "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/cardapio-fotos/frango-empanado.png", category: "Marmitas", groups: getStandardGroups() },
  { id: "m-bife-acebolado", name: "Marmitex P - Bife Acebolado", description: "Acompanha arroz, feijao, macarrao, batata frita e farofa.", basePrice: 26.90, image: "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/cardapio-fotos/bife-acebolado.png", category: "Marmitas", groups: getStandardGroups() },
  { id: "m-bisteca-suina", name: "Marmitex P - Bisteca Suina", description: "Acompanha arroz, feijao, macarrao, batata frita e farofa.", basePrice: 24.90, image: "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/cardapio-fotos/bisteca.png", category: "Marmitas", groups: getStandardGroups() },
  { id: "m-maminha-assada", name: "Marmitex P - Maminha Assada", description: "Acompanha arroz, feijao, macarrao, batata frita e farofa.", basePrice: 28.90, image: "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/cardapio-fotos/maminha.png", category: "Marmitas", groups: getStandardGroups() },
  { id: "m-cupim-assado", name: "Marmitex P - Cupim Assado", description: "Acompanha arroz, feijao, macarrao, batata frita e farofa.", basePrice: 28.90, image: "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/cardapio-fotos/cupim.png", category: "Marmitas", groups: getStandardGroups() },
  { id: "m-coxa-sobrecoxa", name: "Marmitex P - Coxa e Sobrecoxa", description: "Acompanha arroz, feijao, macarrao, batata frita e farofa.", basePrice: 28.90, image: "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/cardapio-fotos/coxa-sobrecoxa.png", category: "Marmitas", groups: getStandardGroups() },
  { id: "me-maminha", name: "Marmitex P - Maminha", description: "Especial. Acompanha arroz, feijao, macarrao, batata frita e farofa.", basePrice: 28.90, image: "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/cardapio-fotos/maminha.png", category: "Marmitas Especiais", groups: getStandardGroups() },
  { id: "me-cupim", name: "Marmitex P - Cupim Assado", description: "Especial. Acompanha arroz, feijao, macarrao, batata frita e farofa.", basePrice: 28.90, image: "https://energetictriggerfish-supabase.cloudfy.live/storage/v1/object/public/cardapio-fotos/cupim.png", category: "Marmitas Especiais", groups: getStandardGroups() },
  { id: "beb-coca-lata", name: "Coca-Cola Lata 350ml", description: "Gelada", basePrice: 7.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-coca-zero-lata", name: "Coca-Cola Zero Lata 350ml", description: "Gelada", basePrice: 7.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-coca-600", name: "Coca-Cola 600ml", description: "Gelada", basePrice: 10.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-coca-zero-600", name: "Coca-Cola Zero 600ml", description: "Gelada", basePrice: 10.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-coca-2l", name: "Coca-Cola 2 Litros", description: "Gelada", basePrice: 16.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-guarana-lata", name: "Guarana Antarctica Lata 350ml", description: "Gelada", basePrice: 7.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-guarana-600", name: "Guarana Antarctica 600ml", description: "Gelada", basePrice: 10.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-guarana-2l", name: "Guarana Antarctica 2 Litros", description: "Gelada", basePrice: 15.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-h2oh", name: "H2oh Limao 500ml", description: "Gelada", basePrice: 7.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-agua-gas", name: "Agua Mineral Lindoya c/ Gas 500ml", description: "Gelada", basePrice: 7.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
  { id: "beb-coca-zero-220", name: "Coca-Cola Zero 220ml", description: "Gelada", basePrice: 5.00, image: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", category: "Bebidas", groups: [] },
];

function getStandardGroups(): MenuGroup[] {
  return [
    { id: "g1", title: "Deseja Uma Marmita Maior?", min: 0, max: 1, options: [
      { id: "opt-g1-m", name: "Marmita M - aprox. 750G", price: 6.90 },
      { id: "opt-g1-g", name: "Marmita G - aprox. 1KG", price: 10.90 },
    ]},
    { id: "g2", title: "Turbine a Sua Marmita / Adicionais", min: 0, max: 8, options: [
      { id: "opt-g2-salada", name: "Salada", price: 3.90 },
      { id: "opt-g2-ovo", name: "Ovo", price: 3.90 },
      { id: "opt-g2-batata", name: "Batata Frita 150g", price: 4.90 },
      { id: "opt-g2-frango", name: "File de Frango Grelhado", price: 7.90 },
      { id: "opt-g2-bisteca-s", name: "Bisteca Suina", price: 7.90 },
      { id: "opt-g2-bisteca-b", name: "Bisteca Bovina", price: 8.90 },
      { id: "opt-g2-bife-a", name: "Bife Acebolado", price: 8.90 },
      { id: "opt-g2-bife", name: "Bife", price: 8.90 },
    ]},
    { id: "g3", title: "Vai Um Docinho? / Sobremesas", min: 0, max: 5, options: [
      { id: "opt-g3-brigadeiro", name: "Brigadeiro Tradicional 30g", price: 6.00 },
      { id: "opt-g3-palha", name: "Palha Italiana Classica 120g", price: 7.00 },
      { id: "opt-g3-bomba", name: "Bomba de Chocolate 110g", price: 9.00 },
      { id: "opt-g3-gelatina", name: "Gelatina Colorida 100g", price: 9.00 },
      { id: "opt-g3-pudim", name: "Pudim de Leite Condensado 120g", price: 11.00 },
    ]},
  ];
}
