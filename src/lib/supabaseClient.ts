import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

function normalizeEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function warnIfNotTest(message: string) {
  if (process.env.NODE_ENV === "test") return;
  // eslint-disable-next-line no-console
  console.warn(message);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const supabaseUrl = normalizeEnvValue(process.env.REACT_APP_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnvValue(process.env.REACT_APP_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    warnIfNotTest(
      "Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY."
    );
    cachedClient = null;
    return cachedClient;
  }

  if (!isValidHttpUrl(supabaseUrl)) {
    warnIfNotTest(
      `Supabase is not configured: invalid REACT_APP_SUPABASE_URL (${JSON.stringify(
        supabaseUrl
      )}). It must be a valid http(s) URL, e.g. https://<project-ref>.supabase.co.`
    );
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedClient;
}
