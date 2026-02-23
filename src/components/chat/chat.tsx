import React, { useEffect, useMemo, useRef, useState } from "react";
import curiosLogoWhiteUrl from "../../images/curios-logo-white.png";
import curiosLogoDarkUrl from "../../images/curios-logo-dark.png";
import SidebarHeader from "./SidebarHeader";
import ContextList from "./ContextList";
import MessageBubble from "./MessageBubble";
import CuriosIntroBubble from "./CuriosIntroBubble";
import { getProviderLabel, getSessionStateLabel, uid } from "./utils";
import { CONTEXTS } from "./contexts";
import type { Msg, ChatResponse, ContextId, MessagesResponse, ServerMessage, SessionResponse, Ui } from "./types";
import { useAuth } from "../../auth/useAuth";

// Allow vendor-specific WebKit property in inline styles
interface CSSPropertiesWithWebkit extends React.CSSProperties {
  WebkitTextSecurity?: string;
}

export default function CuriosChat() {
  const API_BASE = (process.env.REACT_APP_API_BASE as string) || "http://localhost:8787";

  const SYSTEM_CONTEXT_HELP =
    "System context is the default assistant mode for onboarding and account setup.\n\n" +
    "Use it to sign up/sign in, manage your session, and configure/select an AI provider.\n\n" +
    "It does not read your current page or workspace files.";

  const { loading: authLoading, user, session, supabaseAvailable, signOut } = useAuth();

  const [activeContext, setActiveContext] = useState<ContextId>("system");
  const activeContextMeta = CONTEXTS.find((c) => c.id === activeContext)!;
  const ActiveContextIcon = activeContextMeta.icon;
  const [theme, setTheme] = useState<"dark" | "light">(
    (localStorage.getItem("curios.theme") as "dark" | "light") || "dark"
  );
  const isLight = theme === "light";
  const [ curiosLogo, setCuriosLogo ] = useState<string>(isLight ? curiosLogoWhiteUrl : curiosLogoDarkUrl);
  const [ maskInput, setMaskInput ] = useState<boolean>(false);

  useEffect(() => {
    setCuriosLogo(isLight ? curiosLogoWhiteUrl : curiosLogoDarkUrl);
  }, [isLight]);

  // Keep a stable id for the logo message
  const logoMsgIdRef = useRef<string>(uid());
  // Keep a stable id for the initial assistant greeting message
  const greetingMsgIdRef = useRef<string>(uid());

  function renderHero() {
    return (
      <div className="flex flex-col items-center">
        <div className="h-48 w-48 rounded-xl overflow-hidden">
          <img src={curiosLogo} className="h-full w-full object-cover" alt="CuriOS" />
        </div>
        <div className="text-center text-lg font-semibold -mt-12 px-4">
          <CuriosIntroBubble isLight={isLight} />
        </div>
      </div>
    );
  }

  function renderGreeting(opts: { loggedIn: boolean; userLabel?: string }) {
    if (opts.loggedIn) {
      return (
        <>
          You are signed in{opts.userLabel ? <> as <strong>{opts.userLabel}</strong></> : null}. What can I do for you?
        </>
      );
    }

    return (
      <>
        Welcome to CuriOS. Do you want to <strong>Signup, Signin in or continue as a guest?</strong>
      </>
    );
  }

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: logoMsgIdRef.current,
      role: "user",
      text: renderHero(),
      position: "center"
    },
    {
      id: greetingMsgIdRef.current,
      role: "assistant",
      text: supabaseAvailable && authLoading
        ? "Checking your session…"
        : renderGreeting({ loggedIn: Boolean(user), userLabel: user?.email ?? user?.id }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const ui: Ui = {
    app: isLight ? "bg-white text-neutral-900" : "bg-neutral-950 text-neutral-100",
    border: isLight ? "border-neutral-200" : "border-neutral-800",
    panel: isLight ? "bg-white" : "bg-neutral-950",
    card: isLight ? "bg-neutral-100" : "bg-neutral-900",
    hoverPanel: isLight ? "hover:bg-neutral-100" : "hover:bg-neutral-900",
    hoverSoft: isLight ? "hover:bg-neutral-100" : "hover:bg-neutral-900/60",
    topbarBg: isLight ? "bg-white/80" : "bg-neutral-950/80",
    assistantBubble:
      isLight
        ? "border border-neutral-200 bg-neutral-100 text-neutral-900"
        : "border border-neutral-800 bg-neutral-900 text-neutral-100",
    userBubble: "bg-neutral-100 text-neutral-950",
    badgeEnabled:
      isLight ? "bg-neutral-200 text-neutral-800" : "bg-neutral-800 text-neutral-200",
    badgeDisabled:
      isLight
        ? "bg-neutral-100 text-neutral-500 border border-neutral-200"
        : "bg-neutral-900 text-neutral-500 border border-neutral-800",
    sendBtn:
      isLight ? "bg-neutral-900 text-neutral-100" : "bg-neutral-100 text-neutral-900",
  };

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerHeight, setComposerHeight] = useState(0);

  const [sessionId, setSessionId] = useState<string>(() => {
    const key = "curios.sessionId";
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `web-${uid()}`;

    localStorage.setItem(key, next);
    return next;
  });

  // Keep the latest session id available to effects without forcing them to
  // depend on (and re-run on) sessionId changes.
  const sessionIdRef = useRef<string>(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const [serverState, setServerState] = useState<string | null>(null);
  const [serverUser, setServerUser] = useState<SessionResponse["user"]>(null);
  const [providerConfigured, setProviderConfigured] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  function normalizeSessionResponse(raw: any): SessionResponse {
    const ok = Boolean(raw?.ok);
    const sessionId = raw?.sessionId ?? raw?.session_id;
    const state = raw?.state ?? raw?.sessionState ?? raw?.session_state;
    const chatType = raw?.chatType ?? raw?.chat_type;
    const user = raw?.user ?? null;

    const providerConfiguredVal = raw?.providerConfigured ?? raw?.provider_configured;
    const providerConfigured =
      providerConfiguredVal === true ||
      providerConfiguredVal === 1 ||
      providerConfiguredVal === "true" ||
      providerConfiguredVal === "1";

    const selectedProvider =
      raw?.selectedProvider ??
      raw?.selected_provider ??
      raw?.provider ??
      raw?.aiProvider ??
      raw?.ai_provider ??
      raw?.user?.selectedProvider ??
      raw?.user?.selected_provider ??
      raw?.user?.provider ??
      raw?.user?.aiProvider ??
      raw?.user?.ai_provider ??
      null;

    const selectedProviderNormalized = typeof selectedProvider === "string" ? selectedProvider : null;
    const providerConfiguredNormalized = providerConfigured || Boolean(selectedProviderNormalized);

    return {
      ok,
      sessionId: typeof sessionId === "string" ? sessionId : "",
      state: typeof state === "string" ? state : "",
      chatType: chatType === "secret" ? "secret" : "text",
      user: user && typeof user === "object" ? user : null,
      providerConfigured: providerConfiguredNormalized,
      selectedProvider: selectedProviderNormalized,
    };
  }

  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);
  const [newestCursor, setNewestCursor] = useState<string | null>(null);
  const [hasMoreBefore, setHasMoreBefore] = useState<boolean>(false);
  const [loadingOlder, setLoadingOlder] = useState<boolean>(false);

  const oldestCursorRef = useRef<string | null>(null);
  const newestCursorRef = useRef<string | null>(null);
  const hasMoreBeforeRef = useRef<boolean>(false);

  useEffect(() => {
    oldestCursorRef.current = oldestCursor;
  }, [oldestCursor]);
  useEffect(() => {
    newestCursorRef.current = newestCursor;
  }, [newestCursor]);
  useEffect(() => {
    hasMoreBeforeRef.current = hasMoreBefore;
  }, [hasMoreBefore]);

  const serverStateRef = useRef<string | null>(serverState);
  useEffect(() => {
    serverStateRef.current = serverState;
  }, [serverState]);

  // Re-fetch /session when the Supabase auth session changes.
  // This keeps the backend identity (serverUser) in sync without requiring a full refresh.
  const lastSeenAccessTokenRef = useRef<string | null>(null);

  const sessionSyncTimeoutRef = useRef<number | null>(null);
  function clearSessionSyncTimeout() {
    if (sessionSyncTimeoutRef.current !== null) {
      window.clearTimeout(sessionSyncTimeoutRef.current);
      sessionSyncTimeoutRef.current = null;
    }
  }

  async function refreshServerSession(opts?: { reason?: string; setBusy?: boolean }): Promise<SessionResponse | null> {
    const setBusy = opts?.setBusy !== false;
    if (setBusy) setSessionLoading(true);
    if (setBusy) setSessionError(null);

    try {
      const headers: Record<string, string> = buildApiHeaders({ contentType: true });

      const res = await fetch(`${API_BASE}/session`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const raw = await res.json();
      const data = normalizeSessionResponse(raw);
      if (!data.ok || !data.sessionId) {
        throw new Error("Invalid /session response");
      }

      setServerState(data.state);
      setServerUser(data.user);
      setProviderConfigured(Boolean(data.providerConfigured));
      setSelectedProvider(data.selectedProvider ?? null);
      setMaskInput(data.chatType === "secret");

      // Keep localStorage and headers aligned with server session id.
      if (data.sessionId !== sessionIdRef.current) {
        sessionIdRef.current = data.sessionId;
        setSessionId(data.sessionId);
        localStorage.setItem("curios.sessionId", data.sessionId);
      }

      return data;
    } catch (e: any) {
      console.log("Failed to load session:", e, opts?.reason ? { reason: opts.reason } : undefined);
      setSessionError(e?.message || "Failed to load session");
      setServerState(null);
      setServerUser(null);
      setProviderConfigured(false);
      setSelectedProvider(null);
      return null;
    } finally {
      if (setBusy) setSessionLoading(false);
    }
  }

  function buildApiHeaders(opts?: { contentType?: boolean; extra?: Record<string, string> }) {
    const headers: Record<string, string> = {};
    if (opts?.contentType) headers["content-type"] = "application/json";
    headers["X-Session-Id"] = sessionIdRef.current;

    // Optional identity hints.
    if (effectiveUserLabel) headers["x-curios-user"] = effectiveUserLabel;
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    if (opts?.extra) {
      for (const [k, v] of Object.entries(opts.extra)) headers[k] = v;
    }
    return headers;
  }

  function splitStaticTop(prev: Msg[]) {
    let i = 0;
    while (i < prev.length) {
      const id = prev[i].id;
      if (id === logoMsgIdRef.current || id === greetingMsgIdRef.current) {
        i += 1;
        continue;
      }
      break;
    }
    return { top: prev.slice(0, i), rest: prev.slice(i) };
  }

  function mapServerMessageToUi(m: ServerMessage, index: number): Msg {
    const isSecret = m.dataInputType === "secret";
    return {
      id: `${m.created_at}:${m.role}:${index}`,
      role: m.role,
      createdAt: m.created_at,
      rawText: m.content,
      text: isSecret ? "Hidden" : m.content,
      messageType: m.dataInputType,
      position: m.role === "system" ? "center" : undefined,
    };
  }

  async function fetchMessages(params: { limit?: number; before?: string | null; after?: string | null }) {
    const url = new URL(`${API_BASE}/messages`);
    if (params.limit) url.searchParams.set("limit", String(params.limit));
    if (params.before) url.searchParams.set("before", params.before);
    if (params.after) url.searchParams.set("after", params.after);

    const headers = buildApiHeaders({ contentType: false });
    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as MessagesResponse;
    if (!data || !Array.isArray((data as any).messages) || !(data as any).pageInfo) {
      throw new Error("Invalid /messages response");
    }
    return data;
  }

  function messageFingerprint(m: Msg): string | null {
    if (m.id === logoMsgIdRef.current || m.id === greetingMsgIdRef.current) return null;
    const raw = m.rawText ?? (typeof m.text === "string" ? m.text : null);
    if (!raw) return null;
    const createdAt = m.createdAt ?? "";
    return `${createdAt}:${m.role}:${m.messageType ?? "text"}:${raw}`;
  }

  async function loadInitialHistory() {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await fetchMessages({ limit: 50 });
      const mapped = data.messages.map(mapServerMessageToUi);

      setOldestCursor(data.pageInfo.oldestCursor ?? null);
      setNewestCursor(data.pageInfo.newestCursor ?? null);
      setHasMoreBefore(Boolean(data.pageInfo.hasMoreBefore));

      setMessages((prev) => {
        // Keep logo at the top; keep greeting only when there is no history.
        const logo = prev.find((m) => m.id === logoMsgIdRef.current);
        const greeting = prev.find((m) => m.id === greetingMsgIdRef.current);
        const next: Msg[] = [];
        if (logo) next.push(logo);
        if (mapped.length === 0 && greeting) next.push(greeting);
        return [...next, ...mapped];
      });
    } catch (e: any) {
      console.log("Failed to load message history:", e);
      setHistoryError(e?.message || "Failed to load message history");
      // Keep initial greeting/logo on failure.
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadOlderHistory() {
    const before = oldestCursorRef.current;
    if (!before) return;
    if (!hasMoreBeforeRef.current) return;
    if (loadingOlder) return;

    setLoadingOlder(true);
    try {
      const scroller = scrollerRef.current;
      const prevScrollHeight = scroller?.scrollHeight ?? 0;
      const prevScrollTop = scroller?.scrollTop ?? 0;

      const data = await fetchMessages({ limit: 50, before });
      const mapped = data.messages.map(mapServerMessageToUi);

      setOldestCursor(data.pageInfo.oldestCursor ?? null);
      setHasMoreBefore(Boolean(data.pageInfo.hasMoreBefore));

      setMessages((prev) => {
        const { top, rest } = splitStaticTop(prev);
        return [...top, ...mapped, ...rest];
      });

      // Keep scroll position stable after prepending.
      requestAnimationFrame(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const nextScrollHeight = el.scrollHeight;
        el.scrollTop = nextScrollHeight - prevScrollHeight + prevScrollTop;
      });
    } catch (e: any) {
      console.log("Failed to load older messages:", e);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function refreshNewMessagesAfterCursor() {
    const after = newestCursorRef.current;
    if (!after) return;

    try {
      const data = await fetchMessages({ after });
      if (!data.messages.length) {
        setNewestCursor(data.pageInfo.newestCursor ?? newestCursorRef.current);
        return;
      }

      setNewestCursor(data.pageInfo.newestCursor ?? null);

      setMessages((prev) => {
        const fingerprints = new Set<string>();
        for (const m of prev) {
          const fp = messageFingerprint(m);
          if (fp) fingerprints.add(fp);
        }

        const additions: Msg[] = [];
        for (let i = 0; i < data.messages.length; i++) {
          const uiMsg = mapServerMessageToUi(data.messages[i], i);
          const fp = messageFingerprint(uiMsg);
          if (fp && fingerprints.has(fp)) continue;
          if (fp) fingerprints.add(fp);
          additions.push(uiMsg);
        }

        return additions.length ? [...prev, ...additions] : prev;
      });
    } catch (e) {
      // Best-effort; ignore.
    }
  }

  async function syncServerSession(opts: { reason: string; attempts?: number; delayMs?: number }) {
    clearSessionSyncTimeout();

    const attempts = opts.attempts ?? 5;
    const delayMs = opts.delayMs ?? 350;

    const data = await refreshServerSession({ reason: opts.reason, setBusy: false });

    const hasAuth = Boolean(session?.access_token || user);
    const serverHasUser = Boolean(data?.user);

    // If the user is authenticated client-side but the server hasn't attached the user
    // to the session yet, retry a few times (eventual consistency / async linkage).
    if (hasAuth && !serverHasUser && attempts > 1) {
      sessionSyncTimeoutRef.current = window.setTimeout(() => {
        syncServerSession({
          reason: `${opts.reason}:retry`,
          attempts: attempts - 1,
          delayMs: Math.min(Math.round(delayMs * 1.5), 2000),
        });
      }, delayMs);
    }
  }

  useEffect(() => {
    return () => {
      clearSessionSyncTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single source of truth for identity in the UI.
  // Prefer the backend-provided user (validated on /session) when available.
  const effectiveUser = useMemo(() => {
    // Once the backend session has loaded, it becomes the authority.
    // This prevents a stale Supabase session from making the UI look signed-in
    // when the backend considers the session a guest.
    if (!sessionLoading) {
      if (!serverUser) return null;
      return {
        id: serverUser.userId,
        email: serverUser.email,
        source: "server" as const,
      };
    }

    // While the backend session is still loading, fall back to Supabase.
    if (user) {
      return {
        id: user.id,
        email: user.email ?? undefined,
        source: "supabase" as const,
      };
    }
    return null;
  }, [serverUser, user, sessionLoading]);

  const effectiveUserLabel = effectiveUser?.email ?? effectiveUser?.id;

  // Bootstrap session/state from the server on first load.
  // Note: React 18 StrictMode re-runs effects in development.
  useEffect(() => {
    (async () => {
      await refreshServerSession({ reason: "mount", setBusy: true });
      await loadInitialHistory();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  // When a user signs in (or the access token changes), re-fetch /session so the
  // backend can associate the current sessionId with the authenticated user.
  useEffect(() => {
    if (!supabaseAvailable) return;
    if (authLoading) return;

    const token = session?.access_token ?? null;
    // Only refresh when the token actually changes; avoid extra calls.
    if (token === lastSeenAccessTokenRef.current) return;
    lastSeenAccessTokenRef.current = token;

    // If token is null (signed out), still refresh once so the UI becomes guest.
    if (!token) {
      refreshServerSession({ reason: "signed-out", setBusy: false });
      return;
    }

    syncServerSession({ reason: "auth-token-changed" });
  }, [supabaseAvailable, authLoading, session?.access_token, syncServerSession, refreshServerSession]);

  useEffect(() => {
    const el = bottomRef.current as unknown as { scrollIntoView?: (opts?: any) => void } | null;
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isSending]);

  useEffect(() => {
    function measure() {
      const h = composerRef.current?.offsetHeight || 0;
      setComposerHeight(h);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    localStorage.setItem("curios.theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("curios.sessionId", sessionId);
  }, [sessionId]);

  // When auth resolves, ensure the first assistant message + state reflect the login status.
  useEffect(() => {
    // If Supabase exists, wait until it finishes resolving.
    // If it doesn't, rely purely on the backend session user.
    if (supabaseAvailable && authLoading) return;
    const loggedIn = Boolean(effectiveUser);
    const userLabel = effectiveUserLabel;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === greetingMsgIdRef.current
          ? { ...m, text: renderGreeting({ loggedIn, userLabel }) }
          : m
      )
    );
  }, [supabaseAvailable, authLoading, effectiveUser, effectiveUserLabel]);

  async function send() {
    const text = input.trim();
    if (!text || isSending || sessionLoading) return;

    setInput("");
    setIsSending(true);

    const userMsg: Msg = {
      id: uid(),
      role: "user",
      rawText: text,
      text: maskInput ? "Hidden" : text,
      messageType: maskInput ? "secret" : "text",
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const headers: Record<string, string> = buildApiHeaders({
        contentType: true,
        extra: {
          // (future) you can send the context to the backend:
          "x-curios-context": activeContext,
        },
      });

      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text }),
        credentials: "include",
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as ChatResponse;
      data.chatType === "secret" ? setMaskInput(true) : setMaskInput(false);

      // If backend rotates session IDs, keep us in sync.
      if (data.sessionId && data.sessionId !== sessionId) {
        sessionIdRef.current = data.sessionId;
        setSessionId(data.sessionId);
        localStorage.setItem("curios.sessionId", data.sessionId);
      }

      const prevState = serverStateRef.current;
      if (data.state) setServerState(data.state);

      // If the backend state machine advanced (e.g. successful signin/signup),
      // immediately re-fetch /session so serverUser/providerConfigured update without reload.
      if (data.state && data.state !== prevState) {
        syncServerSession({ reason: `post-chat-state-change:${data.state}` });
      }

      const botMsg: Msg = { id: uid(), role: "assistant", text: data.reply };
      setMessages((prev) => [...prev, botMsg]);

      // Recommended: reconcile with server history (multi-tab/race conditions).
      await refreshNewMessagesAfterCursor();
    } catch (e: any) {
      const botMsg: Msg = {
        id: uid(),
        role: "assistant",
        text:
          "There was an error communicating with the backend. Make sure it is running and the address is correct.\n\n" +
          (e?.message ? `Details: ${e.message}` : ""),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSending(false);
    }
  }

  async function resetSession() {
    try {
      const headers = buildApiHeaders({ contentType: false });
      await fetch(`${API_BASE}/session`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
    } catch {
      // Best-effort.
    }

    // Rotate to a brand new session id.
    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `web-${uid()}`;
    localStorage.setItem("curios.sessionId", next);
    sessionIdRef.current = next;
    setSessionId(next);

    setOldestCursor(null);
    setNewestCursor(null);
    setHasMoreBefore(false);

    setMessages((prev) => {
      const logo = prev.find((m) => m.id === logoMsgIdRef.current);
      const greeting = prev.find((m) => m.id === greetingMsgIdRef.current);
      const nextMsgs: Msg[] = [];
      if (logo) nextMsgs.push(logo);
      if (greeting) nextMsgs.push(greeting);
      return nextMsgs;
    });

    await refreshServerSession({ reason: "reset", setBusy: true });
    await loadInitialHistory();
  }

  function onSignOut() {
    signOut();
    // Optionally, you can also reset the session on the server or perform other cleanup here.
    resetSession();
  }

  // Update the logo message when the theme/logo source changes
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === logoMsgIdRef.current ? { ...m, text: renderHero() } : m
      )
    );
  }, [curiosLogo, isLight, renderHero]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={`h-screen overflow-hidden ${ui.app}`}>
      <div className="flex h-full">
        {/* Sidebar desktop */}
        <aside className={`hidden w-80 flex-col overflow-hidden border-r ${ui.border} ${ui.panel} md:flex`}>
          <SidebarHeader onReset={resetSession} activeContext={activeContextMeta} isLight={isLight} />
          <div className="flex-1 overflow-y-auto">
            <ContextList
              activeContext={activeContext}
              onSelect={(id) => setActiveContext(id)}
              ui={ui}
            />
          </div>
          <div className={`mt-auto border-t ${ui.border} p-4 text-xs text-neutral-500`}>
            Session: <span className="font-mono">{sessionId}</span>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className={`sticky top-0 z-10 border-b ${ui.border} ${ui.topbarBg} backdrop-blur`}>
            <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
              {/* Mobile: open sidebar */}
              <button
                className={`md:hidden rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel}`}
                onClick={() => setMobileSidebarOpen(true)}
              >
                Menu
              </button>

              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    isLight ? "bg-neutral-200" : "bg-neutral-800",
                  ].join(" ")}
                  aria-hidden
                >
                  <ActiveContextIcon className={"h-5 w-5"} aria-hidden />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="flex min-w-0 items-center gap-1">
                    <div className="truncate text-sm font-semibold">{activeContextMeta.label}</div>
                    {activeContext === "system" && (
                      <button
                        type="button"
                        className={`shrink-0 rounded-full border ${ui.border} px-2 py-0.5 text-[11px] leading-none text-neutral-500 ${ui.hoverPanel}`}
                        title={SYSTEM_CONTEXT_HELP}
                        aria-label="What is the System context?"
                      >
                        ?
                      </button>
                    )}
                  </div>
                  <div className="truncate text-xs text-neutral-400">
                    state: {getSessionStateLabel(serverState)}
                    {selectedProvider ? <><br />provider: {getProviderLabel(selectedProvider)}</> : null}
                    {!providerConfigured ? <><br />provider configured: no</> : null}
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {supabaseAvailable && (
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="text-xs text-neutral-500">
                      {authLoading
                        ? "auth…"
                        : effectiveUser
                        ? `Signed in: ${effectiveUser.email ?? effectiveUser.id}`
                        : "Guest"}
                    </span>
                    {effectiveUser && (
                      <button
                        className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel}`}
                        onClick={onSignOut}
                        title="Sign out"
                      >
                        Sign out
                      </button>
                    )}
                  </div>
                )}

                <button
                  className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel}`}
                  onClick={() => setTheme(isLight ? "dark" : "light")}
                  title="Toggle light/dark mode"
                  aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {isLight ? (
                  // Moon icon (switch to dark)
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.75 9.75 0 0112 2.25c.64 0 1.27.06 1.882.178a.75.75 0 01.102 1.458 7.5 7.5 0 108.13 10.7.75.75 0 01-.362 1.416z" />
                  </svg>
                  ) : (
                  // Sun icon (switch to light)
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v2.25M12 18.75V21M20.25 12H21M3 12h2.25M17.303 6.697l1.591-1.591M5.106 18.894l1.591-1.591M17.303 17.303l1.591 1.591M5.106 5.106l1.591 1.591" />
                    <circle cx="12" cy="12" r="3.75" />
                  </svg>
                  )}
                </button>
                <button
                  className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel}`}
                  onClick={resetSession}
                  title="Restart local session"
                >
                  Reset
                </button>
              </div>
            </div>
          </header>

          {/* Messages */}
          <main
            className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 pt-6"
            style={{ paddingBottom: composerHeight + 16 }}
            ref={scrollerRef}
            onScroll={() => {
              const el = scrollerRef.current;
              if (!el) return;
              if (el.scrollTop > 120) return;
              if (!hasMoreBeforeRef.current) return;
              if (loadingOlder) return;
              // Load older messages when user scrolls near the top.
              loadOlderHistory();
            }}
          >
            <div className="space-y-4">
              {sessionError && (
                <MessageBubble
                  role="assistant"
                  text={
                    "Failed to load session from the server. You can still try chatting, but state may be inconsistent.\n\n" +
                    `Details: ${sessionError}`
                  }
                  ui={ui}
                />
              )}

              {historyError && (
                <MessageBubble
                  role="assistant"
                  text={
                    "Failed to load message history. You can still chat, but previous messages may be missing.\n\n" +
                    `Details: ${historyError}`
                  }
                  ui={ui}
                />
              )}

              {hasMoreBefore && (
                <div className="flex justify-center">
                  <button
                    className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel} disabled:opacity-50`}
                    onClick={loadOlderHistory}
                    disabled={loadingOlder}
                    title="Load older messages"
                  >
                    {loadingOlder ? "Loading…" : "Load older"}
                  </button>
                </div>
              )}

              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} text={m.text} ui={ui} position={m.position} messageType={m.messageType} />
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className={`max-w-[85%] rounded-2xl border ${ui.border} ${ui.card} px-4 py-3 text-sm ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
                      thinking…
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} style={{ scrollMarginBottom: composerHeight + 16 }} />
            </div>
          </main>

          {/* Composer */}
          <div
            ref={composerRef}
            className={`fixed inset-x-0 bottom-0 border-t ${ui.border} ${ui.topbarBg} backdrop-blur md:left-80`}
          >
            <div className="mx-auto w-full max-w-4xl px-4 py-4">
              <div className={`rounded-2xl border ${ui.border} ${ui.card} p-2`}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={sessionLoading || historyLoading ? "Loading your session…" : "Type in natural language…"}
                  className="max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-500"
                  rows={2}
                  disabled={sessionLoading || historyLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  style={maskInput ? ({ WebkitTextSecurity: "disc" } as CSSPropertiesWithWebkit) : undefined}
                />
                <div className="flex items-center justify-between px-3 pb-1 pt-2">
                  <div className="text-[11px] text-neutral-500">
                    Enter to send · Shift+Enter for new line
                  </div>
                  <button
                    onClick={send}
                    disabled={sessionLoading || historyLoading || isSending || !input.trim()}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold ${ui.sendBtn} disabled:opacity-40`}
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="mt-2 text-center text-[11px] text-neutral-600 md:hidden">
                Session: <span className="font-mono">{sessionId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className={`absolute left-0 top-0 h-full w-80 border-r ${ui.border} ${ui.panel}`}>
            <SidebarHeader
              onReset={resetSession}
              onClose={() => setMobileSidebarOpen(false)}
              activeContext={activeContextMeta}
              isLight={isLight}
            />
            <ContextList
              activeContext={activeContext}
              onSelect={(id) => {
                setActiveContext(id);
                setMobileSidebarOpen(false);
              }}
              ui={ui}
            />
            <div className={`mt-auto border-t ${ui.border} p-4 text-xs text-neutral-500`}>
              Session: <span className="font-mono">{sessionId}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
