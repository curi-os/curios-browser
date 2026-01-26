import React, { useEffect, useMemo, useRef, useState } from "react";
import curiosLogoWhiteUrl from "../../images/curios-logo-white.png";
import curiosLogoDarkUrl from "../../images/curios-logo-dark.png";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: React.ReactNode | string;
  position?: "center" | "left" | "right";
};

type ChatResponse = {
  sessionId: string;
  state: string;
  reply: string;
};

type ContextId = "system" | "browser" | "files" | "notes";

type ContextItem = {
  id: ContextId;
  label: string;
  description: string;
  enabled: boolean;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const CONTEXTS: ContextItem[] = [
  {
    id: "system",
    label: "System",
    description: "Onboarding, account and AI providers",
    enabled: true,
  },
  {
    id: "browser",
    label: "Browser",
    description: "Current page: read, summarize, save",
    enabled: false,
  },
  {
    id: "files",
    label: "Files",
    description: "Workspace and files",
    enabled: false,
  },
  {
    id: "notes",
    label: "Notes",
    description: "Knowledge base",
    enabled: false,
  },
];

export default function CuriosChat() {
  const API_BASE = "http://localhost:8787";

  const [activeContext, setActiveContext] = useState<ContextId>("system");
  const activeContextMeta = CONTEXTS.find((c) => c.id === activeContext)!;
  const [theme, setTheme] = useState<"dark" | "light">(
    (localStorage.getItem("curios.theme") as "dark" | "light") || "dark"
  );
  const isLight = theme === "light";
  const [ curiosLogo, setCuriosLogo ] = useState<string>(isLight ? curiosLogoWhiteUrl : curiosLogoDarkUrl);

  useEffect(() => {
    setCuriosLogo(isLight ? curiosLogoWhiteUrl : curiosLogoDarkUrl);
  }, [isLight]);

  // Keep a stable id for the logo message
  const logoMsgIdRef = useRef<string>(uid());

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: logoMsgIdRef.current,
      role: "user",
      text: <img src={curiosLogo} className="h-52 w-52 center rounded-xl" />,
      position: "center"
    },
    {
      id: uid(),
      role: "assistant",
      text: <>Welcome to CuriOS. Do you want to <strong>create an account, sign in or continue as a guest?</strong></>,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [state, setState] = useState<string>("WELCOME");

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const ui = {
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

  const sessionId = useMemo(() => {
    const key = "curios.sessionId";
    let s = localStorage.getItem(key);
    if (!s) {
      s = `web-${uid()}`;
      localStorage.setItem(key, s);
    }
    return s;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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

  async function send() {
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    setIsSending(true);

    const userMsg: Msg = { id: uid(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-session-id": sessionId,
          // (future) you can send the context to the backend:
          "x-curios-context": activeContext,
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as ChatResponse;
      setState(data.state);

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
                    state: {state}
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-xs text-neutral-500 sm:inline">
                  {activeContextMeta.description}
                </span>
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
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} text={m.text} ui={ui} position={m.position} />
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
                  placeholder="Type in natural language…"
                  className="max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-500"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <div className="flex items-center justify-between px-3 pb-1 pt-2">
                  <div className="text-[11px] text-neutral-500">
                    Enter to send · Shift+Enter for new line
                  </div>
                  <button
                    onClick={send}
                    disabled={isSending || !input.trim()}
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

function SidebarHeader({
  onReset,
  onClose,
}: {
  onReset: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <img className="h-10 w-10 rounded-2xl bg-neutral-200 dark:bg-neutral-800" src={curiosLogoWhiteUrl} alt="CuriOS logo" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">CuriOS</div>
            <div className="text-xs text-neutral-400">contexts</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              Close
            </button>
          )}
          <button
            onClick={onReset}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
            title="Restart local session"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-neutral-300">
        Context: You are now on <span className="text-neutral-500 dark:text-neutral-300">System</span>.
      </div>
    </div>
  );
}

function ContextList({
  activeContext,
  onSelect,
  ui,
}: {
  activeContext: ContextId;
  onSelect: (id: ContextId) => void;
  ui: ReturnType<typeof buildUiStub>;
}) {
  return (
    <nav className="p-2">
      <div className="px-2 pb-2 pt-3 text-[11px] uppercase tracking-wider text-neutral-500">
        Contexts
      </div>
      <div className="space-y-1">
        {CONTEXTS.map((c) => {
          const active = c.id === activeContext;
          return (
            <button
              key={c.id}
              onClick={() => c.enabled && onSelect(c.id)}
              disabled={!c.enabled}
              className={[
                "w-full rounded-xl px-3 py-3 text-left transition",
                active ? `border ${ui.border} ${ui.card}` : `border border-transparent ${ui.hoverSoft}`,
                !c.enabled ? "opacity-40 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{c.label}</div>
                <span className={["rounded-full px-2 py-0.5 text-[10px]", c.enabled ? ui.badgeEnabled : ui.badgeDisabled].join(" ")}>
                  {c.enabled ? (active ? "Active" : "Available") : "Coming soon"}
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-500">{c.description}</div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Helper to satisfy TS prop typing without exporting ui creator
function buildUiStub() {
  return {
    app: "",
    border: "",
    panel: "",
    card: "",
    hoverPanel: "",
    hoverSoft: "",
    topbarBg: "",
    assistantBubble: "",
    userBubble: "",
    badgeEnabled: "",
    badgeDisabled: "",
    sendBtn: "",
  };
}

function MessageBubble({
  role,
  text,
  ui,
  position,
}: {
  role: "user" | "assistant";
  text: React.ReactNode | string;
  ui: ReturnType<typeof buildUiStub>;
  position?: "center" | "left" | "right";
}) {
  const isUser = role === "user";
  if (position === "center") {
    return (
      <div className="flex justify-center">
        <div>
          {typeof text === "string" ? <div dangerouslySetInnerHTML={{ __html: text }} /> : text}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser ? ui.userBubble : ui.assistantBubble,
        ].join(" ")}
      >
        {typeof text === "string" ? <div dangerouslySetInnerHTML={{ __html: text }} /> : text}
      </div>
    </div>
  );
}
