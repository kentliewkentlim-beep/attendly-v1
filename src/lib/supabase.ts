import { createClient } from "@supabase/supabase-js";

export function getSupabaseServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase service client must not be created in the browser");
  }
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey);
}
