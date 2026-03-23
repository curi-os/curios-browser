import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type {
  ChatResponse,
  ContextId,
  MessagesResponse,
  Msg,
  ServerMessage,
  SessionResponse,
} from "../../components/chat/shared/types";
import { uid } from "../../utils/uid";

type HttpError = Error & { status: number; url: string; bodyText?: string };

function makeHttpError(status: number, url: string, bodyText?: string): HttpError {
  const err = new Error(`HTTP ${status}`) as HttpError;
  err.status = status;
  err.url = url;
  err.bodyText = bodyText;
  return err;
}

function isHttpError(e: any): e is HttpError {
  return Boolean(e) && typeof e === "object" && typeof e.status === "number" && typeof e.url === "string";
}

function formatHttpStatusMessage(apiBase: string, e: unknown, opts?: { action?: string; hintBase?: string }) {
  const action = opts?.action ?? "reach the backend";
  const hintBase = opts?.hintBase ?? apiBase;

  if (isHttpError(e)) {
    const path = (() => {
      try {
        return new URL(e.url).pathname;
      } catch {
        return e.url;
      }
    })();

    if (e.status === 404) {
      return (
        `Status: 404 Not Found.\n\n` +
        `I couldn't ${action} because the endpoint ${JSON.stringify(path)} was not found on the server.\n\n` +
        `Check that your backend is running and that REACT_APP_API_BASE points to the correct server (currently: ${hintBase}).`
      );
    }

    const body = e.bodyText?.trim();
    return (
      `Status: HTTP ${e.status}.\n\n` +
      `The server responded with an error while trying to ${action} (${path}).` +
      (body ? `\n\nDetails: ${body}` : "")
    );
  }

  const msg = (e as any)?.message;
  return `There was an error while trying to ${action}.\n\n` + (typeof msg === "string" && msg.trim() ? `Details: ${msg}` : "");
}

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
    ctxName: typeof raw?.ctxName === "string" ? raw.ctxName : typeof raw?.ctx_name === "string" ? raw.ctx_name : "system",
  };
}

function splitStaticTop(prev: Msg[], staticIds: { logo: string; greeting: string }) {
  let i = 0;
  while (i < prev.length) {
    const id = prev[i].id;
    if (id === staticIds.logo || id === staticIds.greeting) {
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

function messageFingerprint(m: Msg, staticIds: { logo: string; greeting: string }): string | null {
  if (m.id === staticIds.logo || m.id === staticIds.greeting) return null;
  const raw = m.rawText ?? (typeof m.text === "string" ? m.text : null);
  if (!raw) return null;
  const createdAt = m.createdAt ?? "";
  return `${createdAt}:${m.role}:${m.messageType ?? "text"}:${raw}`;
}

export function useCuriosChatController(args: {
  apiBase: string;
  activeContext: ContextId;
  setActiveContext: (id: ContextId) => void;
  supabaseAvailable: boolean;
  authLoading: boolean;
  user: { id: string; email?: string | null } | null;
  session: { access_token?: string | null } | null;
  setMessages: Dispatch<SetStateAction<Msg[]>>;
  staticIds: { logo: string; greeting: string };
  scrollerRef: RefObject<HTMLDivElement | null>;
}) {
  const { apiBase, activeContext, supabaseAvailable, authLoading, user, session, setMessages, staticIds, scrollerRef, setActiveContext } = args;

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [maskInput, setMaskInput] = useState<boolean>(false);

  const [sessionId, setSessionId] = useState<string>(() => {
    const key = "curios.sessionId";
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `web-${uid()}`;

    localStorage.setItem(key, next);
    return next;
  });

  const sessionIdRef = useRef<string>(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const activeContextRef = useRef<ContextId>(activeContext);
  useEffect(() => {
    activeContextRef.current = activeContext;
  }, [activeContext]);

  const [serverState, setServerState] = useState<string | null>(null);
  const serverStateRef = useRef<string | null>(serverState);
  useEffect(() => {
    serverStateRef.current = serverState;
  }, [serverState]);

  const [serverUser, setServerUser] = useState<SessionResponse["user"]>(null);
  const [providerConfigured, setProviderConfigured] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
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

  const sessionSyncTimeoutRef = useRef<number | null>(null);
  const lastSeenAccessTokenRef = useRef<string | null>(null);
  const didRunInitialLoadRef = useRef<boolean>(false);
  const latestSessionRequestIdRef = useRef<number>(0);

  function clearSessionSyncTimeout() {
    if (sessionSyncTimeoutRef.current !== null) {
      window.clearTimeout(sessionSyncTimeoutRef.current);
      sessionSyncTimeoutRef.current = null;
    }
  }

  const effectiveUser = useMemo(() => {
    if (!sessionLoading) {
      if (!serverUser) return null;
      return {
        id: serverUser.userId,
        email: serverUser.email,
        source: "server" as const,
      };
    }

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

  function buildApiHeaders(opts?: {
    contentType?: boolean;
    extra?: Record<string, string>;
    contextOverride?: ContextId;
  }) {
    const headers: Record<string, string> = {};
    if (opts?.contentType) headers["content-type"] = "application/json";
    headers["X-Session-Id"] = sessionIdRef.current;
    headers["x-curios-context"] = opts?.contextOverride ?? activeContextRef.current;

    if (effectiveUserLabel) headers["x-curios-user"] = effectiveUserLabel;
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    if (opts?.extra) {
      for (const [k, v] of Object.entries(opts.extra)) headers[k] = v;
    }

    return headers;
  }

  async function refreshServerSession(opts?: {
    reason?: string;
    setBusy?: boolean;
    contextOverride?: ContextId;
  }): Promise<SessionResponse | null> {
    const setBusy = opts?.setBusy !== false;
    if (setBusy) setSessionLoading(true);
    if (setBusy) setSessionError(null);
    const requestId = latestSessionRequestIdRef.current + 1;
    latestSessionRequestIdRef.current = requestId;

    try {
      const headers: Record<string, string> = buildApiHeaders({
        contentType: true,
        contextOverride: opts?.contextOverride,
      });

      const sessionUrl = `${apiBase}/session`;
      const res = await fetch(sessionUrl, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw makeHttpError(res.status, sessionUrl, errText);
      }

      const raw = await res.json();
      const data = normalizeSessionResponse(raw);
      if (!data.ok || !data.sessionId) {
        throw new Error("Invalid /session response");
      }

      if (requestId !== latestSessionRequestIdRef.current) {
        return data;
      }

      setServerState(data.state);
      setServerUser(data.user);
      setProviderConfigured(Boolean(data.providerConfigured));
      setSelectedProvider(data.selectedProvider ?? null);
      setMaskInput(data.chatType === "secret");
      setActiveContext(data.ctxName ?? "system");

      if (data.sessionId !== sessionIdRef.current) {
        sessionIdRef.current = data.sessionId;
        setSessionId(data.sessionId);
        localStorage.setItem("curios.sessionId", data.sessionId);
      }

      return data;
    } catch (e: any) {
      if (requestId !== latestSessionRequestIdRef.current) {
        return null;
      }

      console.log("Failed to load session:", e, opts?.reason ? { reason: opts.reason } : undefined);
      setSessionError(formatHttpStatusMessage(apiBase, e, { action: "load your session" }));
      setServerState(null);
      setServerUser(null);
      setProviderConfigured(false);
      setSelectedProvider(null);
      return null;
    } finally {
      if (setBusy) setSessionLoading(false);
    }
  }

  async function fetchMessages(params: { limit?: number; before?: string | null; after?: string | null }) {
    const url = new URL(`${apiBase}/messages`);
    if (params.limit) url.searchParams.set("limit", String(params.limit));
    if (params.before) url.searchParams.set("before", params.before);
    if (params.after) url.searchParams.set("after", params.after);

    const headers = buildApiHeaders({ contentType: false });
    const messagesUrl = url.toString();
    const res = await fetch(messagesUrl, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw makeHttpError(res.status, messagesUrl, errText);
    }

    const data = (await res.json()) as MessagesResponse;
    if (!data || !Array.isArray((data as any).messages) || !(data as any).pageInfo) {
      throw new Error("Invalid /messages response");
    }

    return data;
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
        const logo = prev.find((m) => m.id === staticIds.logo);
        const greeting = prev.find((m) => m.id === staticIds.greeting);

        const top: Msg[] = [];
        if (logo) top.push(logo);
        if (mapped.length === 0 && greeting) top.push(greeting);

        const mappedFingerprints = new Set<string>();
        for (const m of mapped) {
          const fp = messageFingerprint(m, staticIds);
          if (fp) mappedFingerprints.add(fp);
        }

        const preserved: Msg[] = [];
        for (const m of prev) {
          if (m.id === staticIds.logo) continue;
          if (m.id === staticIds.greeting) continue;

          const fp = messageFingerprint(m, staticIds);
          if (fp && mappedFingerprints.has(fp)) continue;
          preserved.push(m);
        }

        return [...top, ...mapped, ...preserved];
      });
    } catch (e: any) {
      console.log("Failed to load message history:", e);
      setHistoryError(formatHttpStatusMessage(apiBase, e, { action: "load message history" }));
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
        const { top, rest } = splitStaticTop(prev, staticIds);
        return [...top, ...mapped, ...rest];
      });

      requestAnimationFrame(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const nextScrollHeight = el.scrollHeight;
        el.scrollTop = nextScrollHeight - prevScrollHeight + prevScrollTop;
      });
    } catch (e: any) {
      console.log("Failed to load older messages:", e);
      if (isHttpError(e) && e.status === 404) {
        setHistoryError(formatHttpStatusMessage(apiBase, e, { action: "load older messages" }));
      }
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
          const fp = messageFingerprint(m, staticIds);
          if (fp) fingerprints.add(fp);
        }

        const additions: Msg[] = [];
        for (let i = 0; i < data.messages.length; i++) {
          const uiMsg = mapServerMessageToUi(data.messages[i], i);
          const fp = messageFingerprint(uiMsg, staticIds);
          if (fp && fingerprints.has(fp)) continue;
          if (fp) fingerprints.add(fp);
          additions.push(uiMsg);
        }

        return additions.length ? [...prev, ...additions] : prev;
      });
    } catch (e) {
      if (isHttpError(e) && e.status === 404) {
        setHistoryError(formatHttpStatusMessage(apiBase, e, { action: "refresh messages" }));
      }
    }
  }

  async function syncServerSession(opts: { reason: string; attempts?: number; delayMs?: number }) {
    clearSessionSyncTimeout();

    const attempts = opts.attempts ?? 5;
    const delayMs = opts.delayMs ?? 350;

    const data = await refreshServerSession({ reason: opts.reason, setBusy: false });

    const hasAuth = Boolean(session?.access_token || user);
    const serverHasUser = Boolean(data?.user);

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

  function applyLocalContext(nextContext: ContextId) {
    clearSessionSyncTimeout();
    latestSessionRequestIdRef.current += 1;
    setActiveContext(nextContext);
  }

  function persistContextSelection(nextContext: ContextId) {
    applyLocalContext(nextContext);
  }

  useEffect(() => {
    return () => {
      clearSessionSyncTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (didRunInitialLoadRef.current) return;
    if (supabaseAvailable && authLoading) return;

    didRunInitialLoadRef.current = true;
    (async () => {
      try {
        await refreshServerSession({ reason: "mount", setBusy: true });
        await loadInitialHistory();
      } finally {
        setInitialLoadComplete(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, supabaseAvailable, authLoading]);

  useEffect(() => {
    if (!supabaseAvailable) return;
    if (authLoading) return;

    const token = session?.access_token ?? null;
    if (token === lastSeenAccessTokenRef.current) return;
    lastSeenAccessTokenRef.current = token;

    if (!token) {
      refreshServerSession({ reason: "signed-out", setBusy: false });
      return;
    }

    syncServerSession({ reason: "auth-token-changed" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseAvailable, authLoading, session?.access_token]);

  useEffect(() => {
    localStorage.setItem("curios.sessionId", sessionId);
  }, [sessionId]);

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
      });

      const chatUrl = `${apiBase}/chat`;
      const res = await fetch(chatUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text }),
        credentials: "include",
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw makeHttpError(res.status, chatUrl, errText);
      }

      const data = (await res.json()) as ChatResponse;
      // Invalidate any in-flight /session response so an older refresh cannot
      // overwrite a newer /chat context switch (for example system -> browser).
      clearSessionSyncTimeout();
      latestSessionRequestIdRef.current += 1;
      setMaskInput(data.chatType === "secret");
      setActiveContext(data.ctxName ?? "system");

      if (data.sessionId && data.sessionId !== sessionId) {
        sessionIdRef.current = data.sessionId;
        setSessionId(data.sessionId);
        localStorage.setItem("curios.sessionId", data.sessionId);
      }

      const prevState = serverStateRef.current;
      if (data.state) setServerState(data.state);

      const switchedIntoBrowser = data.ctxName === "browser" || data.state === "BROWSING";
      if (data.state && data.state !== prevState && !switchedIntoBrowser) {
        syncServerSession({ reason: `post-chat-state-change:${data.state}` });
      }

      const botMsg: Msg = { id: uid(), role: "assistant", text: data.reply };
      setMessages((prev) => [...prev, botMsg]);

      await refreshNewMessagesAfterCursor();
    } catch (e: any) {
      const botMsg: Msg = {
        id: uid(),
        role: "assistant",
        text: formatHttpStatusMessage(apiBase, e, { action: "send your message" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSending(false);
    }
  }

  async function resetSession() {
    try {
      const headers = buildApiHeaders({ contentType: false });
      await fetch(`${apiBase}/session`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
    } catch {
      // Best-effort.
    }

    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `web-${uid()}`;

    localStorage.setItem("curios.sessionId", next);
    sessionIdRef.current = next;
    setSessionId(next);

    setOldestCursor(null);
    setNewestCursor(null);
    setHasMoreBefore(false);

    setMessages((prev) => {
      const logo = prev.find((m) => m.id === staticIds.logo);
      const greeting = prev.find((m) => m.id === staticIds.greeting);
      const nextMsgs: Msg[] = [];
      if (logo) nextMsgs.push(logo);
      if (greeting) nextMsgs.push(greeting);
      return nextMsgs;
    });

    await refreshServerSession({ reason: "reset", setBusy: true });
    await loadInitialHistory();
  }

  return {
    input,
    setInput,
    applyLocalContext,
    persistContextSelection,
    isSending,
    send,
    maskInput,
    setMaskInput,
    sessionId,
    sessionLoading,
    sessionError,
    serverState,
    serverUser,
    providerConfigured,
    selectedProvider,
    historyLoading,
    historyError,
    initialLoadComplete,
    hasMoreBefore,
    loadingOlder,
    loadOlderHistory,
    oldestCursor,
    newestCursor,
    resetSession,
    effectiveUser,
    effectiveUserLabel,
  };
}
