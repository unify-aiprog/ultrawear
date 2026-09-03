import { createClient } from '@supabase/supabase-js';

function client(key?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getSupabaseServerClient() {
  return client(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseAdminClient() {
  return client(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
