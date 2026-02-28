"use client";

import { useState, useEffect } from "react";
import { MENU_DATA, MenuItem, MenuAddition, MenuGroup } from "@/data/menu";
import { getRealMenu } from "@/lib/menu-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ShoppingBag } from "lucide-react";

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
  endereco?: string;
  observacoes: string;
};

export default function Home() {
  const [menuData, setMenuData] = useState<MenuItem[]>(MENU_DATA);
  const [menuLoading, setMenuLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSelections, setCurrentSelections] = useState<Record<string, MenuAddition[]>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ nome: "", telefone: "", observacoes: "" });
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form">("cart");

  useEffect(() => {
    getRealMenu().then(data => {
      if (data.length > 0) setMenuData(data);
    }).finally(() => setMenuLoading(false));
  }, []);

  const categories = Array.from(new Set(menuData.map(item => item.category)))
    .sort((a, b) => {
      if (a === "Bebidas") return 1;
      if (b === "Bebidas") return -1;
      return a.localeCompare(b);
    });

  const handleOpenModal = (item: MenuItem) => {
    setSelectedItem(item);
    setCurrentSelections({});
    setModalOpen(true);
  };

  const handleToggleAddition = (group: MenuGroup, option: MenuAddition) => {
    setCurrentSelections(prev => {
      const currentGroupSelections = prev[group.id] || [];
      const isSelected = currentGroupSelections.some(opt => opt.id === option.id);
      let nextGroupSelections = [...currentGroupSelections];
      if (isSelected) {
        nextGroupSelections = nextGroupSelections.filter(opt => opt.id !== option.id);
      } else {
        if (nextGroupSelections.length < group.max) {
          nextGroupSelections.push(option);
        } else if (group.max === 1) {
          nextGroupSelections = [option];
        }
      }
      return { ...prev, [group.id]: nextGroupSelections };
    });
  };

  const calculateItemTotal = (item: MenuItem, selections: Record<string, MenuAddition[]>) => {
    const additionsTotal = Object.values(selections).flat().reduce((sum, opt) => sum + opt.price, 0);
    return item.basePrice + additionsTotal;
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    const newItem: CartItem = {
      cartId: Math.random().toString(36).substr(2, 9),
      menuItem: selectedItem,
      selectedAdditions: currentSelections,
      quantity: 1,
      totalPrice: calculateItemTotal(selectedItem, currentSelections)
    };
    setCart(prev => [...prev, newItem]);
    setModalOpen(false);
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);

  return (
    <div className="min-h-screen bg-background pb-24 font-sans text-foreground">
      <header className="sticky top-0 z-50 glass shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="animate-reveal flex items-center gap-4">
            <img src="/brand/logo.png" alt="Marmitaria Araras Logo" className="h-20 w-auto drop-shadow-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div className="flex flex-col">
              <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">Marmitaria <span className="text-primary">Araras</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">Gastronomia Caseira Premium</p>
            </div>
          </div>
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="relative group hover:bg-primary/10 rounded-full px-6 transition-all duration-300 border border-primary/20 bg-white/50">
                <ShoppingBag className="h-5 w-5 mr-3 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-bold tracking-tighter text-base text-foreground">R$ {cartTotal.toFixed(2)}</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-primary/30 animate-bounce">{cart.length}</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md glass border-l-black/5">
              <SheetHeader className="border-b border-black/5 pb-4">
                <SheetTitle className="font-serif text-2xl text-foreground">Seu Pedido <span className="text-primary">Gourmet</span></SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 -mx-6 px-6 py-4">
                {cart.length === 0 ? (
                  <div className="text-center text-neutral-500 mt-10">Seu carrinho esta vazio.</div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.cartId} className="flex justify-between items-start pt-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{item.quantity}x {item.menuItem.name}</h4>
                          {Object.entries(item.selectedAdditions).map(([groupId, additions]) =>
                            additions.map(opt => (
                              <p key={opt.id} className="text-xs text-neutral-500 ml-4">+ {opt.name}</p>
                            ))
                          )}
                          <button onClick={() => handleRemoveFromCart(item.cartId)} className="text-xs text-red-500 mt-1 hover:underline">Remover</button>
                        </div>
                        <span className="font-medium text-sm">R$ {(item.totalPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="pt-6 border-t border-primary/10">
                <div className="flex justify-between font-serif font-bold text-2xl mb-6 text-primary">
                  <span>Total</span>
                  <span>R$ {cartTotal.toFixed(2)}</span>
                </div>
                {checkoutStep === "cart" && (
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20" disabled={cart.length === 0} onClick={() => setCheckoutStep("form")}>
                    Prosseguir para Entrega
                  </Button>
                )}
                {checkoutStep === "form" && (
                  <div className="space-y-3">
                    <input type="text" placeholder="Seu nome *" value={customerInfo.nome} onChange={e => setCustomerInfo(p => ({ ...p, nome: e.target.value }))} className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    <input type="tel" placeholder="WhatsApp / Telefone *" value={customerInfo.telefone} onChange={e => setCustomerInfo(p => ({ ...p, telefone: e.target.value }))} className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    <textarea placeholder="Observacoes (opcional)" value={customerInfo.observacoes} onChange={e => setCustomerInfo(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                    <div className="flex gap-3">
                      <Button variant="ghost" className="flex-1 h-12 text-sm font-bold border border-primary/20 rounded-xl" onClick={() => setCheckoutStep("cart")}>Voltar</Button>
                      <Button className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-sm rounded-xl transition-all duration-300 shadow-lg shadow-primary/10"
                        disabled={!customerInfo.nome || !customerInfo.telefone}
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart, total: cartTotal, customerInfo }) });
                            const data = await res.json();
                            if (data.checkoutUrl) { window.location.href = data.checkoutUrl; }
                            else { alert('Pedido registrado!'); }
                          } catch (e) { console.error("Erro", e); alert("Erro ao finalizar pedido."); }
                        }}>
                        Confirmar Pedido
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {menuLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-primary/60 font-medium italic">Preparando seu cardapio...</p>
          </div>
        )}
        {!menuLoading && categories.map((category, idx) => (
          <div key={category} className="mb-16 animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-serif font-bold text-foreground whitespace-nowrap">{category}</h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {menuData.filter(item => item.category === category).sort((a, b) => a.basePrice - b.basePrice).map(item => (
                <Card key={item.id} className="group overflow-hidden rounded-2xl border-none premium-shadow hover:scale-[1.02] transition-all duration-500 cursor-pointer bg-card/50 backdrop-blur-sm" onClick={() => handleOpenModal(item)}>
                  <div className="flex h-40">
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-tighter font-bold opacity-40">A partir de</span>
                          <span className="font-serif text-lg font-bold text-primary">R$ {item.basePrice.toFixed(2)}</span>
                        </div>
                        <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                    <div className="w-32 h-full bg-muted overflow-hidden relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-full max-h-[90vh] p-0 overflow-hidden flex flex-col rounded-t-[2rem] sm:rounded-[2rem] border-none shadow-2xl animate-reveal bg-card">
          {selectedItem && (
            <div className="flex flex-col h-[90vh] overflow-hidden bg-transparent">
              <div className="h-64 w-full relative shrink-0">
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <DialogTitle className="absolute bottom-6 left-6 text-white text-2xl font-serif font-bold drop-shadow-md pr-6">{selectedItem.name}</DialogTitle>
                <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white p-2 rounded-full transition-colors z-50 sm:hidden">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-6 py-6 space-y-8 pb-32">
                  <p className="text-stone-500 text-sm leading-relaxed px-1">{selectedItem.description}</p>
                  {selectedItem.groups.map((group) => {
                    const isRequired = group.min > 0;
                    return (
                      <div key={group.id} className="animate-reveal">
                        <div className="bg-secondary/50 p-4 rounded-2xl mb-4 flex justify-between items-center border border-black/5">
                          <div>
                            <h4 className="font-serif text-base font-bold text-foreground">{group.title}</h4>
                            <span className="text-[10px] uppercase tracking-wider font-bold opacity-40 text-foreground">Escolha ate {group.max}</span>
                          </div>
                          {isRequired && <span className="text-[10px] uppercase tracking-widest font-black text-primary">Obrigatorio</span>}
                        </div>
                        <div className="grid gap-2">
                          {group.options.map((option) => {
                            const isSelected = (currentSelections[group.id] || []).some((opt) => opt.id === option.id);
                            return (
                              <button key={option.id} onClick={() => handleToggleAddition(group, option)}
                                className={`w-full flex justify-between items-center p-4 rounded-xl transition-all duration-300 text-left border ${isSelected ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white/50 border-black/5 hover:bg-black/5'}`}>
                                <div className="flex items-center gap-4">
                                  <div className={`w-6 h-6 border-2 flex items-center justify-center transition-all duration-300 ${group.max === 1 ? 'rounded-full' : 'rounded-lg'} ${isSelected ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-black/10 bg-black/5'}`}>
                                    {isSelected && <div className={`bg-primary-foreground ${group.max === 1 ? 'w-2.5 h-2.5 rounded-full' : 'w-3 h-3'}`} />}
                                  </div>
                                  <span className="text-sm font-medium block text-foreground">{option.name}</span>
                                </div>
                                <span className="text-sm font-serif text-primary font-bold">+ R$ {option.price.toFixed(2)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-black/5 z-50">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-2xl flex justify-between px-8 text-lg transition-all duration-300 active:scale-95 shadow-lg shadow-primary/30" onClick={handleAddToCart}>
                  <span className="tracking-tight">Adicionar ao Pedido</span>
                  <span className="font-serif">R$ {calculateItemTotal(selectedItem, currentSelections).toFixed(2)}</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
