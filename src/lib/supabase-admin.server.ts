import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function readEnv(name: string, aliases: string[] = []): string | undefined {
  for (const key of [name, ...aliases]) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

function createAdminClient() {
  const url = readEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]);
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    const missing = [
      ...(!url ? ["SUPABASE_URL or VITE_SUPABASE_URL"] : []),
      ...(!serviceRoleKey ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    throw new Error(`Missing backend environment variable(s): ${missing.join(", ")}`);
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let adminClient: ReturnType<typeof createAdminClient> | undefined;

export function getSupabaseAdmin() {
  if (!adminClient) adminClient = createAdminClient();
  return adminClient;
}