"use client";

import { useState, useEffect } from "react";
import { MENU_DATA, MenuItem, MenuAddition, MenuGroup } from "@/data/menu";
import { getRealMenu } from "@/lib/menu-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type CartItem = {
  cartId: string;
  menuItem: MenuItem;
  selectedAdditions: Record<string, MenuAddition[]>;
  quantity: number;
  totalPrice: number;
};

type CustomerInfo = {
  nome: string;
  telefone: string;
  observacoes: string;
};

type MarmitaGroup = {
  baseName: string;
  description: string;
  image: string;
  sizes: { label: string; item: MenuItem }[];
};

type ExtraSelection = { item: MenuItem; qty: number };

// ─── Grouping Logic ──────────────────────────────────────────────────────────

const SIZE_PREFIXES = [
  { prefix: 'Marmitex Mini - ', label: 'Mini' },
  { prefix: 'Marmitex Média - ', label: 'Média' },
  { prefix: 'Marmitex Grande - ', label: 'Grande' },
];
const SIZE_ORDER: Record<string, number> = { Mini: 0, Média: 1, Grande: 2 };
const ADICIONAL_PREFIXES = ['Extra - ', 'Proteína - ', 'Acompanhamento - '];

function groupMenuItems(items: MenuItem[]) {
  const marmitaMap = new Map<string, MarmitaGroup>();
  const adicionais: MenuItem[] = [];
  const outros: MenuItem[] = [];

  for (const item of items) {
    const sizeMatch = SIZE_PREFIXES.find(({ prefix }) => item.name.startsWith(prefix));
    if (sizeMatch) {
      const baseName = item.name.slice(sizeMatch.prefix.length);
      if (!marmitaMap.has(baseName)) {
        marmitaMap.set(baseName, { baseName, description: item.description, image: item.image, sizes: [] });
      }
      marmitaMap.get(baseName)!.sizes.push({ label: sizeMatch.label, item });
      continue;
    }
    if (ADICIONAL_PREFIXES.some(p => item.name.startsWith(p)) || item.name === 'Marmita Personalizada') {
      adicionais.push(item);
      continue;
    }
    outros.push(item);
  }

  return {
    marmitaGroups: Array.from(marmitaMap.values()).map(g => ({
      ...g,
      sizes: [...g.sizes].sort((a, b) => (SIZE_ORDER[a.label] ?? 9) - (SIZE_ORDER[b.label] ?? 9)),
    })),
    adicionais,
    outros,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [menuData, setMenuData] = useState<MenuItem[]>(MENU_DATA);
  const [menuLoading, setMenuLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSelections, setCurrentSelections] = useState<Record<string, MenuAddition[]>>({});
  const [extraSelections, setExtraSelections] = useState<ExtraSelection[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ nome: "", telefone: "", observacoes: "" });
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form">("cart");

  const storeOpen = (() => {
    const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const day = brt.getDay();
    const totalMin = brt.getHours() * 60 + brt.getMinutes();
    return day >= 1 && day <= 5 && totalMin >= 660 && totalMin <= 900;
  })();

  useEffect(() => {
    getRealMenu().then(data => {
      if (data.length > 0) setMenuData(data);
    }).finally(() => setMenuLoading(false));
  }, []);

  const { marmitaGroups, adicionais, outros } = groupMenuItems(menuData);

  const categorizedOthers = outros.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const bebidas = categorizedOthers['Bebidas'] || [];
  const sobremesas = categorizedOthers['Sobremesas'] || [];
  const otherCategories = Object.entries(categorizedOthers).filter(([cat]) => cat !== 'Bebidas' && cat !== 'Sobremesas');

  // ── Cart actions ──────────────────────────────────────────────────────────

  const addToCart = (item: MenuItem, selections: Record<string, MenuAddition[]> = {}) => {
    const addPrice = Object.values(selections).flat().reduce((s, a) => s + a.price, 0);
    setCart(prev => [...prev, {
      cartId: Math.random().toString(36).substring(2, 11),
      menuItem: item,
      selectedAdditions: selections,
      quantity: 1,
      totalPrice: item.basePrice + addPrice,
    }]);
  };

  const openMarmitaModal = (item: MenuItem) => {
    setSelectedItem(item);
    setCurrentSelections({});
    setExtraSelections([...bebidas, ...sobremesas].map(i => ({ item: i, qty: 0 })));
    setModalOpen(true);
  };

  const openSimpleModal = (item: MenuItem) => {
    if (item.groups.length === 0) { addToCart(item); return; }
    setSelectedItem(item);
    setCurrentSelections({});
    setExtraSelections([]);
    setModalOpen(true);
  };

  const handleToggleAddition = (group: MenuGroup, option: MenuAddition) => {
    setCurrentSelections(prev => {
      const cur = prev[group.id] || [];
      const selected = cur.some(o => o.id === option.id);
      let next = selected ? cur.filter(o => o.id !== option.id) : [...cur, option];
      if (!selected && next.length > group.max) next = group.max === 1 ? [option] : cur;
      return { ...prev, [group.id]: next };
    });
  };

  const updateExtraQty = (itemId: string, delta: number) => {
    setExtraSelections(prev => prev.map(e =>
      e.item.id === itemId ? { ...e, qty: Math.max(0, e.qty + delta) } : e
    ));
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    addToCart(selectedItem, currentSelections);
    extraSelections.filter(e => e.qty > 0).forEach(e => {
      for (let i = 0; i < e.qty; i++) addToCart(e.item, {});
    });
    setModalOpen(false);
  };

  const removeFromCart = (cartId: string) => setCart(prev => prev.filter(i => i.cartId !== cartId));
  const cartTotal = cart.reduce((s, i) => s + i.totalPrice * i.quantity, 0);

  const additionsTotal = Object.values(currentSelections).flat().reduce((s, a) => s + a.price, 0);
  const extrasTotal = extraSelections.reduce((s, e) => s + e.item.basePrice * e.qty, 0);
  const modalTotal = selectedItem ? selectedItem.basePrice + additionsTotal + extrasTotal : 0;

  const modalBebidas = extraSelections.filter(e => e.item.category === 'Bebidas');
  const modalSobremesas = extraSelections.filter(e => e.item.category === 'Sobremesas');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f7f7f3] pb-24">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo Marmitaria Araras" className="h-12 w-12 object-contain rounded-full" />
            <div>
              <h1 className="font-bold text-base text-gray-900 leading-tight">Marmitaria Araras</h1>
              <p className="text-[10px] text-gray-500 italic">Sabor de Casa, Preço Justo</p>
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5",
                storeOpen ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", storeOpen ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                {storeOpen ? "ABERTO" : "FECHADO"}
              </span>
            </div>
          </div>

          <Sheet open={isCartOpen} onOpenChange={v => { setIsCartOpen(v); if (!v) setCheckoutStep("cart"); }}>
            <SheetTrigger asChild>
              <Button className="relative bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 h-10 font-bold shadow">
                <ShoppingBag className="h-4 w-4 mr-2" />
                R$ {cartTotal.toFixed(2)}
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow">{cart.length}</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md">
              <SheetHeader className="border-b pb-3">
                <SheetTitle className="font-bold text-lg">Seu Pedido</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 min-h-0 -mx-6 px-6 py-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-400 mt-10 text-sm">Carrinho vazio</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.cartId} className="flex items-start justify-between gap-2 py-2 border-b border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.menuItem.name}</p>
                          {Object.values(item.selectedAdditions).flat().map(a => (
                            <p key={a.id} className="text-xs text-gray-500 ml-2">+ {a.name}</p>
                          ))}
                          <p className="text-xs font-bold text-primary mt-1">R$ {item.totalPrice.toFixed(2)}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
                </div>
                {checkoutStep === "cart" && (
                  <Button className="w-full h-12 font-bold rounded-xl bg-primary hover:bg-primary/90" disabled={cart.length === 0} onClick={() => setCheckoutStep("form")}>
                    Finalizar Pedido
                  </Button>
                )}
                {checkoutStep === "form" && (
                  <div className="space-y-2">
                    <input type="text" placeholder="Seu nome *" value={customerInfo.nome} onChange={e => setCustomerInfo(p => ({ ...p, nome: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <input type="tel" placeholder="WhatsApp *" value={customerInfo.telefone} onChange={e => setCustomerInfo(p => ({ ...p, telefone: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <textarea placeholder="Observações (opcional)" value={customerInfo.observacoes} onChange={e => setCustomerInfo(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm" onClick={() => setCheckoutStep("cart")}>Voltar</Button>
                      <Button className="flex-[2] h-10 font-bold rounded-xl bg-primary hover:bg-primary/90 text-sm"
                        disabled={!customerInfo.nome || !customerInfo.telefone}
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart, total: cartTotal, customerInfo }) });
                            const data = await res.json();
                            if (data.checkoutUrl) window.location.href = data.checkoutUrl;
                            else alert('Pedido registrado!');
                          } catch { alert("Erro ao finalizar pedido."); }
                        }}>
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* ── Banner loja fechada ── */}
      {!storeOpen && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <p className="text-2xl mb-1">🕐</p>
            <h2 className="font-bold text-amber-900 text-base">Pedidos Encerrados</h2>
            <p className="text-amber-700 text-sm mt-1">Aceitamos pedidos de <strong>seg–sex, 11h às 15h</strong>.<br />Fique à vontade para ver o cardápio!</p>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {menuLoading && (
          <div className="flex flex-col items-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-400 italic">Carregando cardápio...</p>
          </div>
        )}

        {/* ── Marmitas ── */}
        {!menuLoading && marmitaGroups.length > 0 && (
          <section>
            <SectionTitle emoji="🍱" title="Marmitas" />
            <div className="space-y-3">
              {marmitaGroups.map(group => (
                <MarmitaCard key={group.baseName} group={group} storeOpen={storeOpen} onSelectSize={openMarmitaModal} />
              ))}
            </div>
          </section>
        )}

        {/* ── Adicionais ── */}
        {!menuLoading && adicionais.length > 0 && (
          <section>
            <SectionTitle emoji="➕" title="Adicionais" />
            <div className="space-y-2">
              {adicionais.map(item => (
                <SimpleCard key={item.id} item={item} storeOpen={storeOpen} onAdd={() => openSimpleModal(item)} />
              ))}
            </div>
          </section>
        )}

        {/* ── Outras categorias (não Bebidas/Sobremesas — ficam no popup) ── */}
        {!menuLoading && otherCategories.map(([category, items]) => (
          <section key={category}>
            <SectionTitle emoji="🍽️" title={category} />
            <div className="space-y-2">
              {items.map(item => (
                <SimpleCard key={item.id} item={item} storeOpen={storeOpen} onAdd={() => openSimpleModal(item)} />
              ))}
            </div>
          </section>
        ))}

      </main>

      {/* ── Modal de personalização ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl border-none">
          {selectedItem && (
            <>
              {/* Imagem + título */}
              <div className="relative h-44 shrink-0">
                {selectedItem.image ? (
                  <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-6xl">🍱</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <DialogTitle className="absolute bottom-4 left-4 text-white text-xl font-bold drop-shadow">{selectedItem.name}</DialogTitle>
              </div>

              <ScrollArea className="flex-1 min-h-0 px-4 py-4">

                {/* ── Grupos / Complementos ── */}
                {selectedItem.groups.map(group => (
                  <div key={group.id} className="mb-6">
                    <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{group.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Escolha até {group.max}</p>
                      </div>
                      {group.min > 0 && <span className="text-[10px] font-black text-primary uppercase tracking-widest">Obrigatório</span>}
                    </div>
                    <div className="space-y-2">
                      {group.options.map(option => {
                        const selected = (currentSelections[group.id] || []).some(o => o.id === option.id);
                        return (
                          <button key={option.id} onClick={() => handleToggleAddition(group, option)}
                            className={cn("w-full flex justify-between items-center px-4 py-3 rounded-xl border-2 transition-all text-left",
                              selected ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                            )}>
                            <div className="flex items-center gap-3">
                              <div className={cn("w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-all",
                                group.max === 1 ? "rounded-full" : "rounded-md",
                                selected ? "border-primary bg-primary" : "border-gray-300"
                              )}>
                                {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{option.name}</span>
                            </div>
                            {option.price > 0 && <span className="text-sm font-bold text-primary">+ R$ {option.price.toFixed(2)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* ── Bebidas ── */}
                {modalBebidas.length > 0 && (
                  <div className="mb-6">
                    <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-3">
                      <p className="font-bold text-sm text-gray-900">🥤 Bebidas</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Adicionar ao pedido</p>
                    </div>
                    <div className="space-y-2">
                      {modalBebidas.map(({ item, qty }) => (
                        <ExtraItem key={item.id} item={item} qty={qty} onUpdate={delta => updateExtraQty(item.id, delta)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Sobremesas ── */}
                {modalSobremesas.length > 0 && (
                  <div className="mb-6">
                    <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-3">
                      <p className="font-bold text-sm text-gray-900">🍮 Sobremesas</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Adicionar ao pedido</p>
                    </div>
                    <div className="space-y-2">
                      {modalSobremesas.map(({ item, qty }) => (
                        <ExtraItem key={item.id} item={item} qty={qty} onUpdate={delta => updateExtraQty(item.id, delta)} />
                      ))}
                    </div>
                  </div>
                )}

              </ScrollArea>

              {/* Footer */}
              <div className="px-4 pb-4 pt-2 border-t">
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl text-base"
                  disabled={!storeOpen}
                  onClick={handleAddToCart}>
                  {storeOpen ? `Adicionar · R$ ${modalTotal.toFixed(2)}` : 'Loja Fechada'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xl">{emoji}</span>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function MarmitaCard({ group, storeOpen, onSelectSize }: {
  group: MarmitaGroup;
  storeOpen: boolean;
  onSelectSize: (item: MenuItem) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex p-4 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-gray-900">{group.baseName}</h3>
          {group.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{group.description}</p>
          )}
          <div className="flex gap-2 mt-3 flex-wrap">
            {group.sizes.map(({ label, item }) => (
              <button
                key={label}
                disabled={!storeOpen}
                onClick={() => onSelectSize(item)}
                className={cn(
                  "flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all",
                  storeOpen
                    ? "border-primary/40 text-primary hover:border-primary hover:bg-primary/5 active:scale-95"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
                <span className="text-sm font-bold">R$ {item.basePrice.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-3xl">
          {group.image
            ? <img src={group.image} alt={group.baseName} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : '🍱'}
        </div>
      </div>
    </div>
  );
}

function SimpleCard({ item, storeOpen, onAdd }: {
  item: MenuItem;
  storeOpen: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 p-3">
        <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-2xl">
          {item.image
            ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : item.category === 'Bebidas' ? '🥤' : item.category === 'Sobremesas' ? '🍮' : '🍽️'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 leading-snug">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
          )}
          <p className="text-primary font-bold text-sm mt-1">R$ {item.basePrice.toFixed(2)}</p>
        </div>
        <button
          disabled={!storeOpen}
          onClick={onAdd}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all",
            storeOpen
              ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ExtraItem({ item, qty, onUpdate }: {
  item: MenuItem;
  qty: number;
  onUpdate: (delta: number) => void;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
      qty > 0 ? "border-primary/40 bg-primary/5" : "border-gray-100 bg-white"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-lg">
          {item.image
            ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : item.category === 'Bebidas' ? '🥤' : '🍮'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-xs font-bold text-primary">R$ {item.basePrice.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onUpdate(-1)}
          disabled={qty === 0}
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
            qty > 0 ? "border-primary text-primary hover:bg-primary/10" : "border-gray-200 text-gray-300 cursor-not-allowed"
          )}
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-5 text-center text-sm font-bold text-gray-900">{qty}</span>
        <button
          onClick={() => onUpdate(1)}
          className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
