import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";

let didAttemptHandleRedirect = false;

type AuthContextValue = {
  loading: boolean;
  user: User | null;
  session: Session | null;
  supabaseAvailable: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readHashParams(hash: string): URLSearchParams {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

function clearAuthParamsFromUrl(opts: { clearHash: boolean; removeSearchKeys: string[] }) {
  const url = new URL(window.location.href);

  for (const key of opts.removeSearchKeys) {
    url.searchParams.delete(key);
  }

  if (opts.clearHash) {
    url.hash = "";
  }

  const newUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, document.title, newUrl);
}

async function tryHandleAuthRedirect(supabase: ReturnType<typeof getSupabaseClient>): Promise<boolean> {
  if (!supabase) return false;

  // 1) Legacy implicit flow / magic-link: hash fragment tokens
  // Example callback:
  // http://localhost:3000/#access_token=...&refresh_token=...&type=signup
  const hashParams = readHashParams(window.location.hash);
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      return true;
    } finally {
      // Avoid leaving tokens in the address bar.
      clearAuthParamsFromUrl({ clearHash: true, removeSearchKeys: [] });
    }
  }

  // 2) PKCE flow (default in supabase-js v2 for OAuth/magic links): `?code=...`
  // Example callback:
  // http://localhost:3000/?code=...&type=signup
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get("code");

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return true;
    } finally {
      // Avoid leaving auth params in the address bar.
      clearAuthParamsFromUrl({
        clearHash: true,
        removeSearchKeys: [
          "code",
          "type",
          "provider",
          "error",
          "error_code",
          "error_description",
        ],
      });
    }
  }

  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (!supabase) {
          if (mounted) setLoading(false);
          return;
        }

        // Handles the auth callback URL (hash tokens or PKCE ?code).
        // React.StrictMode runs effects twice in dev; this guard keeps the exchange idempotent.
        if (!didAttemptHandleRedirect) {
          didAttemptHandleRedirect = true;
          await tryHandleAuthRedirect(supabase);
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      } catch (e) {
        if (process.env.NODE_ENV !== "test") {
          // eslint-disable-next-line no-console
          console.warn("Supabase auth initialization failed", e);
        }
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    }

    init();

    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const value: AuthContextValue = {
    loading,
    user,
    session,
    supabaseAvailable: Boolean(supabase),
    signOut: async () => {
      if (!supabase) return;
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
