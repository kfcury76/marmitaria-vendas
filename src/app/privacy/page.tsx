import React from "react";
export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-neutral-900">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
                <h1 className="text-3xl font-bold text-amber-600 mb-6">Politica de Privacidade</h1>
                <p className="text-sm text-neutral-500 mb-8">Ultima atualizacao: 27 de fevereiro de 2026</p>
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">1. Introducao</h2>
                    <p className="mb-4">A Marmitaria Araras valoriza a sua privacidade. Esta politica descreve como coletamos, usamos e protegemos suas informacoes ao interagir com nossas automacoes no Instagram e em nosso site.</p>
                </section>
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">2. Dados Coletados</h2>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Interacoes no Instagram: Armazenamos temporariamente o conteudo das suas mensagens via Direct para respostas sobre o cardapio.</li>
                        <li>Pedidos: Coletamos nome e dados de contato quando voce inicia um processo de compra.</li>
                    </ul>
                </section>
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">3. Uso da Automacao (Instagram)</h2>
                    <p className="mb-4">Nosso servico utiliza automacoes autorizadas pela Meta. Voce pode solicitar atendimento humano digitando "falar com atendente".</p>
                </section>
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">4. Seus Direitos (LGPD)</h2>
                    <p className="mb-4">Voce tem o direito de solicitar a exclusao de qualquer dado pessoal armazenado em nossos sistemas a qualquer momento.</p>
                </section>
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">5. Contato</h2>
                    <p className="mb-4">contato@marmitariaararas.com.br</p>
                </section>
                <div className="mt-12 pt-8 border-t border-neutral-100 text-center">
                    <p className="text-sm text-neutral-500">Marmitaria Araras - Qualidade e Sabor todos os dias.</p>
                </div>
            </div>
        </div>
    );
}
