"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function SucessoContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id");
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center space-y-4">
        <div className="text-5xl">&#9989;</div>
        <h1 className="text-2xl font-bold text-green-700">Pagamento confirmado!</h1>
        <p className="text-neutral-600">Seu pedido foi recebido e ja esta sendo preparado.</p>
        {orderId && <p className="text-xs text-neutral-400">Pedido: {orderId.slice(0, 8).toUpperCase()}</p>}
        <Link href="/" className="block mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">Fazer novo pedido</Link>
      </div>
    </div>
  );
}
export default function PedidoSucesso() {
  return <Suspense><SucessoContent /></Suspense>;
}
