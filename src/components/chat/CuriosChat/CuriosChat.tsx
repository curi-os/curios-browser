import React, { useCallback, useEffect, useRef, useState } from "react";
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
import CuriosChatWelcomeCard from "./CuriosChatWelcomeCard";
import CuriosChatIntroScreen from "./CuriosChatIntroScreen";
import CuriosChatLoadingScreen from "./CuriosChatLoadingScreen";
import CuriosChatSidebar from "./CuriosChatSidebar";
import CuriosChatHeader from "./CuriosChatHeader";
import CuriosChatMain from "./CuriosChatMain";
import CuriosChatComposer from "./CuriosChatComposer";
import CuriosChatMobileSidebar from "./CuriosChatMobileSidebar";

const TOP_HISTORY_LOAD_THRESHOLD_PX = 120;
const STICK_TO_BOTTOM_THRESHOLD_PX = 120;

function hasActiveSelectionWithin(container: HTMLElement | null): boolean {
  if (!container || typeof window === "undefined" || typeof window.getSelection !== "function") return false;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return false;

  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;

  return Boolean((anchorNode && container.contains(anchorNode)) || (focusNode && container.contains(focusNode)));
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

  const renderGreeting = useCallback(
    (opts: { loggedIn: boolean; userLabel?: string }) => (
      <CuriosChatWelcomeCard
        appName={APP_NAME}
        isLight={isLight}
        loggedIn={opts.loggedIn}
        userLabel={opts.userLabel}
        supportedProviders={SUPPORTED_PROVIDER_LABELS}
      />
    ),
    [isLight]
  );

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
    initialLoadComplete,
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

  function isStaticIntroMessage(id: string) {
    return id === logoMsgIdRef.current || id === greetingMsgIdRef.current;
  }

  const conversationMessages = messages.filter((m) => !isStaticIntroMessage(m.id));
  const conversationMessageCount = conversationMessages.length;
  const firstConversationMessageId = conversationMessageCount > 0 ? conversationMessages[0].id : null;
  const lastConversationMessageId = conversationMessageCount > 0 ? conversationMessages[conversationMessageCount - 1].id : null;
  const showIntroScreen = conversationMessageCount === 0;
  const showStartupLoadingScreen = (supabaseAvailable && authLoading) || !initialLoadComplete;
  const previousConversationSnapshotRef = useRef<{ count: number; firstId: string | null; lastId: string | null }>({
    count: 0,
    firstId: null,
    lastId: null,
  });
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    const previousSnapshot = previousConversationSnapshotRef.current;

    if (showIntroScreen) {
      previousConversationSnapshotRef.current = {
        count: conversationMessageCount,
        firstId: firstConversationMessageId,
        lastId: lastConversationMessageId,
      };
      shouldStickToBottomRef.current = true;
      return;
    }

    const didLeaveIntro = previousSnapshot.count === 0 && conversationMessageCount > 0;
    const didPrependOlderMessages =
      previousSnapshot.count > 0 &&
      conversationMessageCount > previousSnapshot.count &&
      previousSnapshot.firstId !== firstConversationMessageId &&
      previousSnapshot.lastId === lastConversationMessageId;
    const didAppendLatestMessage =
      conversationMessageCount > 0 && lastConversationMessageId !== previousSnapshot.lastId && !didPrependOlderMessages;

    if (hasActiveSelectionWithin(scrollerRef.current)) {
      previousConversationSnapshotRef.current = {
        count: conversationMessageCount,
        firstId: firstConversationMessageId,
        lastId: lastConversationMessageId,
      };
      return;
    }

    const el = bottomRef.current as unknown as { scrollIntoView?: (opts?: any) => void } | null;
    if ((didLeaveIntro || (didAppendLatestMessage && shouldStickToBottomRef.current)) && el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: didLeaveIntro ? "auto" : "smooth", block: "end" });
      shouldStickToBottomRef.current = true;
    }

    previousConversationSnapshotRef.current = {
      count: conversationMessageCount,
      firstId: firstConversationMessageId,
      lastId: lastConversationMessageId,
    };
  }, [showIntroScreen, conversationMessageCount, firstConversationMessageId, lastConversationMessageId]);

  useEffect(() => {
    function measure() {
      const h = composerRef.current?.offsetHeight || 0;
      setComposerHeight(h);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [showIntroScreen]);

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
  }, [supabaseAvailable, authLoading, effectiveUser, effectiveUserLabel, renderGreeting]);

  function onSignOut() {
    signOut();
    resetSession();
  }

  function renderIntroToolbar() {
    return (
      <>
        {supabaseAvailable ? (
          <span className="hidden text-xs text-neutral-500 sm:inline">
            {authLoading ? "auth…" : effectiveUser ? `Signed in: ${effectiveUser.email ?? effectiveUser.id}` : "Guest"}
          </span>
        ) : null}

        {supabaseAvailable && effectiveUser ? (
          <button
            className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel}`}
            onClick={onSignOut}
            title="Sign out"
          >
            Sign out
          </button>
        ) : null}

        <button
          className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel}`}
          onClick={() => setTheme(isLight ? "dark" : "light")}
          title="Toggle light/dark mode"
          aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
        >
          {isLight ? (
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
      </>
    );
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

  const handleMaybeLoadOlder = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (hasActiveSelectionWithin(el)) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom <= STICK_TO_BOTTOM_THRESHOLD_PX;

    if (el.scrollTop > TOP_HISTORY_LOAD_THRESHOLD_PX) return;
    if (!hasMoreBefore) return;
    if (loadingOlder) return;
    loadOlderHistory();
  }, [hasMoreBefore, loadingOlder, loadOlderHistory]);

  if (showStartupLoadingScreen) {
    return (
      <CuriosChatLoadingScreen
        ui={ui}
        isLight={isLight}
        logoUrl={curiosLogo}
        appName={APP_NAME}
        statusText={
          supabaseAvailable && authLoading
            ? "Checking your sign-in state and preparing the right chat view…"
            : "Restoring your latest session…"
        }
      />
    );
  }

  if (showIntroScreen) {
    return (
      <CuriosChatIntroScreen
        ui={ui}
        isLight={isLight}
        logoUrl={curiosLogo}
        appName={APP_NAME}
        sessionError={sessionError}
        historyError={historyError}
        toolbar={renderIntroToolbar()}
        welcomeContent={renderGreeting({ loggedIn: Boolean(effectiveUser), userLabel: effectiveUserLabel })}
        composer={
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
            layout="inline"
            showSessionId={false}
          />
        }
      />
    );
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
            messages={conversationMessages}
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
            onMaybeLoadOlder={handleMaybeLoadOlder}
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
