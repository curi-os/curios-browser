import React, { useEffect, useRef, useState } from "react";
import curiosLogoWhiteUrl from "../../../images/curios-logo-white.png";
import curiosLogoDarkUrl from "../../../images/curios-logo-dark.png";
import { uid } from "../../../utils/uid";
import { CONTEXTS } from "../shared/contexts";
import type { ContextId, Msg, Ui } from "../shared/types";
import { useAuth } from "../../../hooks/auth/useAuth";
import { APP_NAME } from "../../../branding";
import { useCuriosChatController } from "../../../hooks/chat/useCuriosChatController";
import { API_BASE, SYSTEM_CONTEXT_HELP } from "../../../config/curiosChat";
import { SUPPORTED_PROVIDER_LABELS } from "../../../utils/getProviderLabel";
import CuriosChatHero from "./CuriosChatHero";
import CuriosChatSidebar from "./CuriosChatSidebar";
import CuriosChatHeader from "./CuriosChatHeader";
import CuriosChatMain from "./CuriosChatMain";
import CuriosChatComposer from "./CuriosChatComposer";
import CuriosChatMobileSidebar from "./CuriosChatMobileSidebar";

function TypeInstruction({ text, isLight, delayMs = 0 }: { text: string; isLight: boolean; delayMs?: number }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setVisibleText(text);
      return;
    }

    setVisibleText("");

    let index = 0;
    let intervalId: number | null = null;

    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));

        if (index >= text.length && intervalId !== null) {
          window.clearInterval(intervalId);
        }
      }, 28);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [text, delayMs]);

  const complete = visibleText.length >= text.length;

  return (
    <div
      className={[
        "mt-2 inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 font-mono text-[12px]",
        isLight ? "border-neutral-300 bg-neutral-50 text-neutral-700" : "border-neutral-700 bg-neutral-900 text-neutral-200",
      ].join(" ")}
    >
      <span className={isLight ? "text-emerald-700" : "text-emerald-400"}>&gt;</span>
      <span className={["font-semibold uppercase tracking-[0.2em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
        Type
      </span>
      <span className="whitespace-nowrap">{visibleText || "\u00A0"}</span>
      <span aria-hidden="true" className={complete ? "opacity-40" : "animate-pulse"}>
        |
      </span>
    </div>
  );
}

export default function CuriosChat() {
  const { loading: authLoading, user, session, supabaseAvailable, authRedirectError, signOut } = useAuth();

  const lastShownAuthRedirectErrorRef = useRef<string | null>(null);

  const [activeContext, setActiveContext] = useState<ContextId>(() => {
    const stored = localStorage.getItem("curios.activeContext");
    return stored === "browser" || stored === "files" || stored === "notes" || stored === "system"
      ? (stored as ContextId)
      : "system";
  });
  const activeContextMeta = CONTEXTS.find((c) => c.id === activeContext)!;
  const [theme, setTheme] = useState<"dark" | "light">((localStorage.getItem("curios.theme") as "dark" | "light") || "dark");
  const isLight = theme === "light";
  const [curiosLogo, setCuriosLogo] = useState<string>(isLight ? curiosLogoWhiteUrl : curiosLogoDarkUrl);

  useEffect(() => {
    setCuriosLogo(isLight ? curiosLogoWhiteUrl : curiosLogoDarkUrl);
  }, [isLight]);

  // Keep a stable id for the logo message
  const logoMsgIdRef = useRef<string>(uid());
  // Keep a stable id for the initial assistant greeting message
  const greetingMsgIdRef = useRef<string>(uid());

  function renderHero() {
    return <CuriosChatHero logoUrl={curiosLogo} appName={APP_NAME} isLight={isLight} />;
  }

  function renderStepCard(opts: {
    step: string;
    title: string;
    description: string;
    typeText: string;
    hint?: React.ReactNode;
    delayMs: number;
  }) {
    return (
      <div className={["rounded-2xl border px-3 py-3", isLight ? "border-neutral-200 bg-white/70" : "border-neutral-800 bg-neutral-900/40"].join(" ")}>
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <div className={["pt-0.5 text-[11px] font-semibold tracking-[0.28em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
            {opts.step}
          </div>
          <div>
            <div className="text-sm font-semibold">{opts.title}</div>
            <div className={["mt-1 text-[13px] leading-6", isLight ? "text-neutral-700" : "text-neutral-300"].join(" ")}>
              {opts.description}
            </div>
            <TypeInstruction text={opts.typeText} isLight={isLight} delayMs={opts.delayMs} />
            {opts.hint ? (
              <div className={["mt-2 text-[12px] leading-5", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
                {opts.hint}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderSupportedProviders() {
    return (
      <div className={["rounded-2xl border px-3 py-3", isLight ? "border-neutral-200 bg-white/70" : "border-neutral-800 bg-neutral-900/40"].join(" ")}>
        <div className={["text-[11px] font-semibold uppercase tracking-[0.28em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
          Supported providers
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUPPORTED_PROVIDER_LABELS.map((provider) => (
            <span
              key={provider}
              className={[
                "rounded-full border px-2 py-1 text-[11px] font-semibold",
                isLight ? "border-neutral-300 bg-white text-neutral-700" : "border-neutral-700 bg-neutral-900 text-neutral-200",
              ].join(" ")}
            >
              {provider}
            </span>
          ))}
        </div>
      </div>
    );
  }

  function renderGreeting(opts: { loggedIn: boolean; userLabel?: string }) {
    if (opts.loggedIn) {
      return (
        <div className="space-y-3">
          <div>
            You are signed in
            {opts.userLabel ? (
              <>
                {" "}as <strong>{opts.userLabel}</strong>
              </>
            ) : null}
            .
          </div>
          <div className={["rounded-3xl border p-4", isLight ? "border-neutral-200 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "border-neutral-800 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"].join(" ")}>
            <div className={["text-xs font-semibold uppercase tracking-[0.28em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
              Next steps
            </div>
            <div className="mt-3 space-y-3">
              {renderStepCard({
                step: "01",
                title: "Change provider",
                description: "Connect your provider to start using Curios with your own API key.",
                typeText: "Change provider",
                hint: "Bring your own provider, then Curios can start working with your account.",
                delayMs: 180,
              })}
              {renderStepCard({
                step: "02",
                title: "Use apps",
                description: "Open the Browser app once your provider is connected.",
                typeText: "Use browser",
                hint: "You can also select Browser from the context menu.",
                delayMs: 320,
              })}
              {renderSupportedProviders()}
            </div>
          </div>
          <div>Once your provider is connected, you can start using Curios right away.</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className={isLight ? "text-neutral-700" : "text-neutral-300"}>
          <strong className={isLight ? "text-neutral-900" : "text-neutral-100"}>Welcome to {APP_NAME}.</strong> Here is how to get started.
        </div>
        <div className={["rounded-3xl border p-4", isLight ? "border-neutral-200 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "border-neutral-800 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"].join(" ")}>
          <div className={["text-xs font-semibold uppercase tracking-[0.28em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
            First steps
          </div>
          <div className="mt-3 space-y-3">
            {renderStepCard({
              step: "01",
              title: "Signup or Signin",
              description: "Create your account or sign into an existing one.",
              typeText: "Signup, Signin or Guest",
              hint: "Use Guest if you just want to explore before connecting a provider.",
              delayMs: 180,
            })}
            {renderStepCard({
              step: "02",
              title: "Change provider",
              description: "Set your AI provider so Curios can work with your own API key.",
              typeText: "Change provider",
              hint: "Bring your own provider and connect Curios to your setup.",
              delayMs: 320,
            })}
            {renderStepCard({
              step: "03",
              title: "Use apps",
              description: "Start using the Browser app after your provider is connected.",
              typeText: "Use browser",
              hint: "You can also select Browser in the context menu to launch it.",
              delayMs: 460,
            })}
            {renderSupportedProviders()}
          </div>
        </div>
        <div className={isLight ? "text-neutral-600" : "text-neutral-400"}>
          You can also continue as a guest if you just want to explore.
        </div>
      </div>
    );
  }

  function appendAssistantMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        text,
      },
    ]);
  }

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: logoMsgIdRef.current,
      role: "user",
      text: renderHero(),
      position: "center",
    },
    {
      id: greetingMsgIdRef.current,
      role: "assistant",
      text:
        supabaseAvailable && authLoading
          ? "Checking your session…"
          : renderGreeting({ loggedIn: Boolean(user), userLabel: user?.email ?? user?.id }),
    },
  ]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const {
    input,
    setInput,
    applyLocalContext,
    persistContextSelection,
    isSending,
    send,
    maskInput,
    sessionId,
    sessionLoading,
    sessionError,
    serverState,
    providerConfigured,
    selectedProvider,
    historyLoading,
    historyError,
    hasMoreBefore,
    loadingOlder,
    loadOlderHistory,
    resetSession,
    effectiveUser,
    effectiveUserLabel,
  } = useCuriosChatController({
    apiBase: API_BASE,
    activeContext,
    setActiveContext,
    supabaseAvailable,
    authLoading,
    user: user ? { id: user.id, email: user.email } : null,
    session: session ? { access_token: session.access_token } : null,
    setMessages,
    staticIds: { logo: logoMsgIdRef.current, greeting: greetingMsgIdRef.current },
    scrollerRef,
  });

  useEffect(() => {
    if (!authRedirectError) return;

    const fingerprint = `${authRedirectError.error}:${authRedirectError.errorCode ?? ""}:${authRedirectError.errorDescription ?? ""}`;
    if (lastShownAuthRedirectErrorRef.current === fingerprint) return;
    lastShownAuthRedirectErrorRef.current = fingerprint;

    const description = (authRedirectError.errorDescription || "").trim() || "Email link is invalid or has expired.";
    const code = (authRedirectError.errorCode || "").trim();
    const detailsLine = code ? `\n\nCode: ${code}` : "";

    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        text: `Account confirmation failed.\n\n${description}${detailsLine}`,
      },
    ]);
  }, [authRedirectError]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const ui: Ui = {
    app: isLight ? "bg-white text-neutral-900" : "bg-neutral-950 text-neutral-100",
    border: isLight ? "border-neutral-200" : "border-neutral-800",
    panel: isLight ? "bg-white" : "bg-neutral-950",
    card: isLight ? "bg-neutral-100" : "bg-neutral-900",
    hoverPanel: isLight ? "hover:bg-neutral-100" : "hover:bg-neutral-900",
    hoverSoft: isLight ? "hover:bg-neutral-100" : "hover:bg-neutral-900/60",
    topbarBg: isLight ? "bg-white/80" : "bg-neutral-950/80",
    assistantBubble: isLight
      ? "border border-neutral-200 bg-neutral-100 text-neutral-900"
      : "border border-neutral-800 bg-neutral-900 text-neutral-100",
    userBubble: "bg-neutral-100 text-neutral-950",
    badgeEnabled: isLight ? "bg-neutral-200 text-neutral-800" : "bg-neutral-800 text-neutral-200",
    badgeDisabled: isLight
      ? "bg-neutral-100 text-neutral-500 border border-neutral-200"
      : "bg-neutral-900 text-neutral-500 border border-neutral-800",
    sendBtn: isLight ? "bg-neutral-900 text-neutral-100" : "bg-neutral-100 text-neutral-900",
  };

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerHeight, setComposerHeight] = useState(0);

  const [introActive, setIntroActive] = useState(false);
  const introStartedRef = useRef(false);
  const suppressAutoScrollRef = useRef(true);

  useEffect(() => {
    if (introStartedRef.current) return;
    if (historyLoading) return;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const logoIndex = messages.findIndex((m) => m.id === logoMsgIdRef.current);
    const nextMsg = logoIndex >= 0 ? messages[logoIndex + 1] : null;
    if (!nextMsg) {
      suppressAutoScrollRef.current = false;
      return;
    }

    introStartedRef.current = true;
    setIntroActive(true);

    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function escapeForAttrSelector(value: string) {
      const cssAny = (window as any)?.CSS;
      if (cssAny && typeof cssAny.escape === "function") return cssAny.escape(value);
      return value.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");
    }

    // 1) Ensure we start at the very top (logo)
    requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTop = 0;
    });

    // 2) Then scroll to the first message below the logo.
    const scrollDelayMs = prefersReduced ? 0 : 650;
    const finishDelayMs = prefersReduced ? 0 : 1400;

    const t1 = window.setTimeout(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const selector = `[data-curios-msg-id="${escapeForAttrSelector(nextMsg.id)}"]`;
      const target = el.querySelector(selector) as HTMLElement | null;
      if (!target) return;
      target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    }, scrollDelayMs);

    const t2 = window.setTimeout(() => {
      setIntroActive(false);
      suppressAutoScrollRef.current = false;
    }, finishDelayMs);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLoading, messages]);

  useEffect(() => {
    if (suppressAutoScrollRef.current) return;
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
    localStorage.setItem("curios.activeContext", activeContext);
  }, [activeContext]);

  useEffect(() => {
    if (supabaseAvailable && authLoading) return;
    const loggedIn = Boolean(effectiveUser);
    const userLabel = effectiveUserLabel;

    setMessages((prev) =>
      prev.map((m) => (m.id === greetingMsgIdRef.current ? { ...m, text: renderGreeting({ loggedIn, userLabel }) } : m))
    );
  }, [supabaseAvailable, authLoading, effectiveUser, effectiveUserLabel]);

  function onSignOut() {
    signOut();
    resetSession();
  }

  useEffect(() => {
    setMessages((prev) => prev.map((m) => (m.id === logoMsgIdRef.current ? { ...m, text: renderHero() } : m)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curiosLogo, isLight]);

  function handleSelectContext(nextContext: ContextId) {
    if (nextContext !== "browser") {
      persistContextSelection(nextContext);
      return;
    }

    const isGuest = effectiveUser?.id === "guest-user";
    const isSignedIn = Boolean(effectiveUser && !isGuest);

    if (!isSignedIn) {
      applyLocalContext("system");
      appendAssistantMessage("Please sign in first before using the Browser app.");
      return;
    }

    if (!providerConfigured || serverState === "NO_PROVIDER" || serverState === "PROVIDER_SETUP") {
      applyLocalContext("system");
      appendAssistantMessage(
        "Before using the Browser app, please configure a provider. Type <strong>Change provider</strong> and set your own <strong>OpenAI API key</strong> or a <strong>Custom endpoint</strong>."
      );
      return;
    }

    if (selectedProvider === "ollama") {
      applyLocalContext("system");
      appendAssistantMessage(
        "The Browser app can’t run with <strong>Local Ollama</strong>.<br />To use Browser, type <strong>Change provider</strong> and switch to your own <strong>OpenAI API key</strong> or a <strong>Custom endpoint</strong>."
      );
      return;
    }

    persistContextSelection("browser");
  }

  return (
    <div className={`h-screen overflow-hidden ${ui.app}`}>
      <div className="flex h-full">
        <CuriosChatSidebar
          ui={ui}
          activeContextMeta={activeContextMeta}
          activeContext={activeContext}
          onSelectContext={handleSelectContext}
          onReset={resetSession}
          sessionId={sessionId}
          isLight={isLight}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CuriosChatHeader
            ui={ui}
            isLight={isLight}
            activeContext={activeContext}
            activeContextMeta={activeContextMeta}
            systemContextHelp={SYSTEM_CONTEXT_HELP}
            serverState={serverState}
            selectedProvider={selectedProvider}
            providerConfigured={providerConfigured}
            supabaseAvailable={supabaseAvailable}
            authLoading={authLoading}
            effectiveUser={effectiveUser}
            onSignOut={onSignOut}
            onToggleTheme={() => setTheme(isLight ? "dark" : "light")}
            onReset={resetSession}
            onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          />

          <CuriosChatMain
            ui={ui}
            messages={messages}
            introLogoId={logoMsgIdRef.current}
            introActive={introActive}
            sessionError={sessionError}
            historyError={historyError}
            hasMoreBefore={hasMoreBefore}
            loadingOlder={loadingOlder}
            loadOlderHistory={loadOlderHistory}
            isSending={isSending}
            isLight={isLight}
            composerHeight={composerHeight}
            scrollerRef={scrollerRef}
            bottomRef={bottomRef}
            onMaybeLoadOlder={() => {
              const el = scrollerRef.current;
              if (!el) return;
              if (el.scrollTop > 120) return;
              if (!hasMoreBefore) return;
              if (loadingOlder) return;
              loadOlderHistory();
            }}
          />

          <CuriosChatComposer
            ui={ui}
            input={input}
            onChangeInput={setInput}
            onSend={send}
            maskInput={maskInput}
            sessionLoading={sessionLoading}
            historyLoading={historyLoading}
            isSending={isSending}
            sessionId={sessionId}
            composerRef={composerRef}
          />
        </div>
      </div>

      <CuriosChatMobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        ui={ui}
        activeContextMeta={activeContextMeta}
        activeContext={activeContext}
        onSelectContext={handleSelectContext}
        onReset={resetSession}
        sessionId={sessionId}
        isLight={isLight}
      />
    </div>
  );
}
