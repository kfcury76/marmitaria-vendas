"use client";

import { useState, useCallback } from "react";

type Addition = { id: string; name: string; price: number; sort_order: number };
type Group = { id: string; title: string; sort_order: number; options: Addition[] };
type MenuItem = { id: string; name: string; base_price: number; sort_order: number; category: { name: string } | null; groups: Group[] };
type DeliveryRow = { id: string; label: string; fee: number };
type AdminData = { items: MenuItem[]; delivery: DeliveryRow[] };

function fmt(v: number) { return v.toFixed(2).replace(".", ","); }

async function apiGet(password: string): Promise<AdminData> {
    const res = await fetch("/api/admin/prices", { headers: { Authorization: `Bearer ${password}` } });
    if (res.status === 401) throw new Error("Senha incorreta");
    if (!res.ok) throw new Error("Erro ao carregar dados");
    return res.json();
}

async function apiPatch(password: string, table: string, id: string | number, price: number) {
    const res = await fetch("/api/admin/prices", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` }, body: JSON.stringify({ table, id, price }) });
    if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error ?? "Erro ao salvar"); }
}

function PriceRow({ label, sublabel, currentPrice, table, id, password, onSaved }: { label: string; sublabel?: string; currentPrice: number; table: string; id: string | number; password: string; onSaved: (table: string, id: string | number, newPrice: number) => void }) {
    const [draft, setDraft] = useState(String(currentPrice.toFixed(2)));
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<"ok" | "err" | null>(null);
    const isDirty = Number(draft.replace(",", ".")) !== currentPrice;
    async function save() {
        const parsed = Number(draft.replace(",", "."));
        if (isNaN(parsed) || parsed < 0) { setFeedback("err"); setTimeout(() => setFeedback(null), 1500); return; }
        setSaving(true);
        try { await apiPatch(password, table, id, parsed); onSaved(table, id, parsed); setFeedback("ok"); }
        catch { setFeedback("err"); }
        finally { setSaving(false); setTimeout(() => setFeedback(null), 2000); }
    }
    return (
        <div className="flex items-center justify-between py-3 border-b border-amber-100 last:border-0 gap-4">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{label}</p>
                {sublabel && <p className="text-xs text-stone-400 mt-0.5 truncate">{sublabel}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-stone-400 font-mono">R$</span>
                <input type="number" step="0.01" min="0" value={draft} onChange={(e) => setDraft(e.target.value)} onFocus={(e) => e.target.select()} className="w-24 text-right text-sm font-mono border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                <button onClick={save} disabled={saving || !isDirty}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 min-w-[56px] ${feedback === "ok" ? "bg-green-500 text-white" : feedback === "err" ? "bg-red-500 text-white" : isDirty ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm" : "bg-stone-100 text-stone-300 cursor-not-allowed"}`}>
                    {saving ? "..." : feedback === "ok" ? "Salvo!" : feedback === "err" ? "Erro" : "Salvar"}
                </button>
            </div>
        </div>
    );
}

function AdditionsSection({ item, password, onSaved }: { item: MenuItem; password: string; onSaved: (table: string, id: string | number, newPrice: number) => void }) {
    const allOptions = item.groups.slice().sort((a, b) => a.sort_order - b.sort_order).flatMap((g) => g.options.slice().sort((a, b) => a.sort_order - b.sort_order).map((opt) => ({ ...opt, groupTitle: g.title })));
    if (allOptions.length === 0) return null;
    return (
        <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">{item.name}</h3>
            <div className="bg-white rounded-2xl px-4 shadow-sm border border-amber-100">
                {allOptions.map((opt) => <PriceRow key={opt.id} label={opt.name} sublabel={opt.groupTitle} currentPrice={opt.price} table="menu_additions" id={opt.id} password={password} onSaved={onSaved} />)}
            </div>
        </div>
    );
}

function ItemsTab({ items, category, password, onSaved }: { items: MenuItem[]; category: string; password: string; onSaved: (table: string, id: string | number, newPrice: number) => void }) {
    const filtered = items.filter((i) => i.category?.name?.toLowerCase() === category.toLowerCase());
    if (filtered.length === 0) return <p className="text-stone-400 text-sm mt-6 text-center">Nenhum item encontrado.</p>;
    return (
        <div className="bg-white rounded-2xl px-4 shadow-sm border border-amber-100">
            {filtered.map((item) => <PriceRow key={item.id} label={item.name} currentPrice={item.base_price} table="menu_items" id={item.id} password={password} onSaved={onSaved} />)}
        </div>
    );
}

function AdditionalsTab({ items, password, onSaved }: { items: MenuItem[]; password: string; onSaved: (table: string, id: string | number, newPrice: number) => void }) {
    const withGroups = items.filter((i) => i.groups.some((g) => g.options.length > 0));
    if (withGroups.length === 0) return <p className="text-stone-400 text-sm mt-6 text-center">Nenhum adicional encontrado.</p>;
    return <div>{withGroups.map((item) => <AdditionsSection key={item.id} item={item} password={password} onSaved={onSaved} />)}</div>;
}

function FreteTab({ delivery, password, onSaved }: { delivery: DeliveryRow[]; password: string; onSaved: (table: string, id: string | number, newPrice: number) => void }) {
    if (delivery.length === 0) return (
        <div className="text-center mt-6 space-y-2">
            <p className="text-stone-400 text-sm">Tabela delivery_config nao encontrada.</p>
            <p className="text-stone-400 text-xs">Execute a migration <code className="bg-amber-50 px-1 rounded">03_delivery_config.sql</code> no Supabase Studio.</p>
        </div>
    );
    return (
        <div className="bg-white rounded-2xl px-4 shadow-sm border border-amber-100">
            {delivery.map((row) => <PriceRow key={row.id} label={row.label} sublabel={`ID: ${row.id}`} currentPrice={row.fee} table="delivery_config" id={row.id} password={password} onSaved={onSaved} />)}
        </div>
    );
}

function LoginScreen({ onLogin }: { onLogin: (pw: string) => Promise<void> }) {
    const [pw, setPw] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); setLoading(true); setError("");
        try { await onLogin(pw); } catch (err: any) { setError(err.message ?? "Erro ao verificar senha"); } finally { setLoading(false); }
    }
    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-stone-800">Painel Admin</h1>
                    <p className="text-sm text-stone-400 mt-1">Marmitaria Araras</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="password" placeholder="Senha" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    <button type="submit" disabled={loading || !pw} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">{loading ? "Verificando..." : "Entrar"}</button>
                </form>
            </div>
        </div>
    );
}

type Tab = "marmitas" | "bebidas" | "adicionais" | "frete";

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [data, setData] = useState<AdminData | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("marmitas");

    const login = useCallback(async (pw: string) => {
        const result = await apiGet(pw);
        setPassword(pw);
        setData(result);
    }, []);

    const handleSaved = useCallback((table: string, id: string | number, newPrice: number) => {
        if (!data) return;
        if (table === "menu_items") {
            setData((prev) => prev ? { ...prev, items: prev.items.map((i) => i.id === id ? { ...i, base_price: newPrice } : i) } : prev);
        } else if (table === "menu_additions") {
            setData((prev) => prev ? { ...prev, items: prev.items.map((item) => ({ ...item, groups: item.groups.map((g) => ({ ...g, options: g.options.map((opt) => opt.id === id ? { ...opt, price: newPrice } : opt) })) })) } : prev);
        } else if (table === "delivery_config") {
            setData((prev) => prev ? { ...prev, delivery: prev.delivery.map((row) => row.id === id ? { ...row, fee: newPrice } : row) } : prev);
        }
    }, [data]);

    if (!data) return <LoginScreen onLogin={login} />;

    const tabs: { key: Tab; label: string }[] = [
        { key: "marmitas", label: "Marmitas" },
        { key: "bebidas", label: "Bebidas" },
        { key: "adicionais", label: "Adicionais" },
        { key: "frete", label: "Frete" },
    ];

    return (
        <div className="min-h-screen bg-amber-50">
            <header className="bg-white border-b border-amber-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-stone-800">Gestao de Precos</h1>
                    <p className="text-xs text-stone-400">Marmitaria Araras</p>
                </div>
                <button onClick={() => { setPassword(""); setData(null); }} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Sair</button>
            </header>
            <div className="bg-white border-b border-amber-100 px-4">
                <div className="flex gap-1 max-w-2xl mx-auto">
                    {tabs.map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === tab.key ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-600"}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <main className="max-w-2xl mx-auto px-4 py-6">
                {activeTab === "marmitas" && <ItemsTab items={data.items} category="Marmitas" password={password} onSaved={handleSaved} />}
                {activeTab === "bebidas" && <ItemsTab items={data.items} category="Bebidas" password={password} onSaved={handleSaved} />}
                {activeTab === "adicionais" && <AdditionalsTab items={data.items} password={password} onSaved={handleSaved} />}
                {activeTab === "frete" && <FreteTab delivery={data.delivery} password={password} onSaved={handleSaved} />}
            </main>
        </div>
    );
}
