import React, { useEffect, useMemo, useRef, useState } from "react";
import curiosLogoWhiteUrl from "../../images/curios-logo-white.png";
import curiosLogoDarkUrl from "../../images/curios-logo-dark.png";
import SidebarHeader from "./SidebarHeader";
import ContextList from "./ContextList";
import MessageBubble from "./MessageBubble";
import { uid } from "./utils";
import { CONTEXTS } from "./contexts";
import type { Msg, ChatResponse, ContextId, SessionResponse, Ui } from "./types";
import { useAuth } from "../../auth/useAuth";

// Allow vendor-specific WebKit property in inline styles
interface CSSPropertiesWithWebkit extends React.CSSProperties {
  WebkitTextSecurity?: string;
}

export default function CuriosChat() {
  const API_BASE = (process.env.REACT_APP_API_BASE as string) || "http://localhost:8787";

  const { loading: authLoading, user, session, supabaseAvailable, signOut } = useAuth();

  const [activeContext, setActiveContext] = useState<ContextId>("system");
  const activeContextMeta = CONTEXTS.find((c) => c.id === activeContext)!;
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
      text: <img src={curiosLogo} className="h-52 w-52 center rounded-xl" />,
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
    const s = localStorage.getItem(key);
    return s || `web-${uid()}`;
  });

  const [serverState, setServerState] = useState<string | null>(null);
  const [serverUser, setServerUser] = useState<SessionResponse["user"]>(null);
  const [providerConfigured, setProviderConfigured] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Bootstrap session/state from the server on first load.
  // Note: React 18 StrictMode re-runs effects in development; do not use a
  // one-shot ref guard here or the first (aborted) fetch would be the only one.
  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function bootstrap() {
      setSessionLoading(true);
      setSessionError(null);

      try {
        const headers: Record<string, string> = {
          "content-type": "application/json",
          "x-session-id": sessionId,
        };

        if (user) {
          headers["x-curios-user"] = user.email ?? user.id;
        }

        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`${API_BASE}/session`, {
          method: "GET",
          headers,
          // If your Fastify route sets a cookie on first hit, this is required.
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }

        const data = (await res.json()) as SessionResponse;
        if (!data.ok || !data.sessionId) {
          throw new Error("Invalid /session response");
        }
        setServerState(data.state);
        setServerUser(data.user);
        setProviderConfigured(Boolean(data.providerConfigured));
        setSelectedProvider(data.selectedProvider ?? null);
        setMaskInput(data.chatType === "secret");

        // Keep localStorage and headers aligned with server session id.
        setSessionId(data.sessionId);
        localStorage.setItem("curios.sessionId", data.sessionId);
      } catch (e: any) {
        // Abort is expected on unmount / StrictMode effect cleanup.
        if (e?.name === "AbortError") return;
        console.log("Failed to load session:", e);
        if (!isActive) return;
        setSessionError(e?.message || "Failed to load session");
        setServerState(null);
        setServerUser(null);
        setProviderConfigured(false);
        setSelectedProvider(null);
      } finally {
        if (isActive) setSessionLoading(false);
      }
    }

    bootstrap();
    return () => {
      isActive = false;
      controller.abort();
    };
    // Intentionally omit deps: we only want a bootstrap on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // When auth resolves, ensure the first assistant message + state reflect the login status.
  useEffect(() => {
    if (!supabaseAvailable) return;
    if (authLoading) return;

    const loggedIn = Boolean(user);
    const userLabel = user?.email ?? user?.id;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === greetingMsgIdRef.current
          ? { ...m, text: renderGreeting({ loggedIn, userLabel }) }
          : m
      )
    );
  }, [supabaseAvailable, authLoading, user?.id, user?.email]);

  async function send() {
    const text = input.trim();
    if (!text || isSending || sessionLoading) return;

    setInput("");
    setIsSending(true);

    const userMsg: Msg = { id: uid(), role: "user", text, messageType: maskInput ? "secret" : "text" };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-session-id": sessionId,
        // (future) you can send the context to the backend:
        "x-curios-context": activeContext,
        // Helps the backend start in the right state when logged in.
        //"x-curios-state": effectiveState,
      };

      if (user) {
        headers["x-curios-user"] = user.email ?? user.id;
      }

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

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
        setSessionId(data.sessionId);
        localStorage.setItem("curios.sessionId", data.sessionId);
      }
      if (data.state) setServerState(data.state);

      const botMsg: Msg = { id: uid(), role: "assistant", text: data.reply };
      setMessages((prev) => [...prev, botMsg]);
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

  function resetSession() {
    localStorage.removeItem("curios.sessionId");
    window.location.reload();
  }

  // Update the logo message when the theme/logo source changes
  useEffect(() => {
    setMessages(prev =>
      prev.map(m =>
        m.id === logoMsgIdRef.current
          ? { ...m, text: <img src={curiosLogo} className="h-52 w-52 center rounded-xl" /> }
          : m
      )
    );
  }, [curiosLogo]);

  return (
    <div className={`h-screen overflow-hidden ${ui.app}`}>
      <div className="flex h-full">
        {/* Sidebar desktop */}
        <aside className={`hidden w-80 flex-col overflow-hidden border-r ${ui.border} ${ui.panel} md:flex`}>
          <SidebarHeader onReset={resetSession} />
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
                <img src="https://avatars.githubusercontent.com/u/234488358?s=200&v=4" className={`h-10 w-10 shrink-0 rounded-xl ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-semibold">CuriOS</div>
                  <div className="truncate text-xs text-neutral-400">
                    context: {activeContextMeta.label} <br />
                    state: {serverState}
                    {selectedProvider ? <><br />provider: {selectedProvider}</> : null}
                    {!providerConfigured ? <><br />provider configured: no</> : null}
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-xs text-neutral-500 sm:inline">
                  {activeContextMeta.description}
                </span>

                {supabaseAvailable && (
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="text-xs text-neutral-500">
                      {authLoading
                        ? "auth…"
                        : user?.email
                        ? `Signed in: ${user.email}`
                        : "Guest"}
                    </span>
                    {user && (
                      <button
                        className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel}`}
                        onClick={() => signOut()}
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
                  placeholder={sessionLoading ? "Loading your session…" : "Type in natural language…"}
                  className="max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-500"
                  rows={2}
                  disabled={sessionLoading}
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
                    disabled={sessionLoading || isSending || !input.trim()}
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
