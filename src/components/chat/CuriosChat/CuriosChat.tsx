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
import CuriosChatHero from "./CuriosChatHero";
import CuriosChatSidebar from "./CuriosChatSidebar";
import CuriosChatHeader from "./CuriosChatHeader";
import CuriosChatMain from "./CuriosChatMain";
import CuriosChatComposer from "./CuriosChatComposer";
import CuriosChatMobileSidebar from "./CuriosChatMobileSidebar";

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

  function renderGreeting(opts: { loggedIn: boolean; userLabel?: string }) {
    if (opts.loggedIn) {
      return (
        <>
          You are signed in
          {opts.userLabel ? (
            <>
              {" "}as <strong>{opts.userLabel}</strong>
            </>
          ) : null}
          . What can I do for you?
        </>
      );
    }

    return (
      <>
        Welcome to {APP_NAME}. Do you want to <strong>Signup, Signin in or continue as a guest?</strong>
      </>
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
