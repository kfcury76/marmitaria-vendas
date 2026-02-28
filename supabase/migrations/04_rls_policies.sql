-- ============================================================
-- Migration 04: RLS policies para tabelas sem proteção
-- Executar no Supabase Studio → SQL Editor
-- service_role bypassa RLS automaticamente (daemon + server-side)
-- anon: INSERT apenas (sem SELECT/UPDATE/DELETE)
-- ============================================================

-- print_queue
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON public.print_queue
  FOR INSERT TO anon WITH CHECK (true);

-- financial_entries
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON public.financial_entries
  FOR INSERT TO anon WITH CHECK (true);

-- corporate_orders
ALTER TABLE public.corporate_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON public.corporate_orders
  FOR INSERT TO anon WITH CHECK (true);

-- encomendas_pedidos
ALTER TABLE public.encomendas_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON public.encomendas_pedidos
  FOR INSERT TO anon WITH CHECK (true);
