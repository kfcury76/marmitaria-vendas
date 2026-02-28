"use client";
import Link from "next/link";
export default function PedidoFalha() {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center space-y-4">
        <div className="text-5xl">&#10060;</div>
        <h1 className="text-2xl font-bold text-red-600">Pagamento nao realizado</h1>
        <p className="text-neutral-600">Houve um problema ao processar o pagamento. Seu pedido foi salvo - tente novamente ou escolha outra forma de pagamento.</p>
        <Link href="/" className="block mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">Voltar ao cardapio</Link>
      </div>
    </div>
  );
}
