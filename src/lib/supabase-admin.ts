import { createClient } from '@supabase/supabase-js';

// Cliente server-side com service_role - bypassa RLS
// Usar apenas em API routes (Node.js), nunca expor no client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
