-- ============================================
-- MARMITARIA-VENDAS - Security Migrations
-- Run in: Supabase SQL Editor
-- Date: 2026-03-14
-- From: SECURITY_AUDIT_2026.md
-- ============================================

-- 1. Enable RLS on all tables
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marmita_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

-- 2. Public read policies for menu
CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "menu_additions_public_read" ON menu_additions
  FOR SELECT USING (is_active = true);

-- 3. Orders: insert only for anon
CREATE POLICY "orders_insert_only" ON marmita_orders
  FOR INSERT WITH CHECK (true);

-- 4. Security Audit Log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_type TEXT NOT NULL,
  user_identifier TEXT,
  resource_type TEXT,
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON security_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_log(user_identifier);

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_service_only" ON security_audit_log
  FOR ALL USING (auth.role() = 'service_role');
