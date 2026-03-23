import React, { useEffect, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "See cheapest flights on Google Flights from NYC to London in the next 3 months",
  "Latest news on nytimes.com",
  "How can we improve trycurios.com",
  "Compare the homepage of apple.com and microsoft.com and summarize the differences",
  "What is the price of the item in this page and is it available in other stores?",
  "Go to AllRecipes and find a cookie recipe with more than 4.5 stars and at least 1000 reviews",
] as const;

function TypeInstruction(props: {
  text: string;
  isLight: boolean;
  delayMs?: number;
  tooltip?: React.ReactNode;
  tooltipAriaLabel?: string;
  animate?: boolean;
}) {
  const { text, isLight, delayMs = 0, tooltip, tooltipAriaLabel, animate = true } = props;
  const [visibleText, setVisibleText] = useState("");
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!tooltipOpen) return;

    function onDocumentClick(e: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(e.target as Node)) return;
      setTooltipOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setTooltipOpen(false);
    }

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [tooltipOpen]);

  useEffect(() => {
    if (!animate) {
      setVisibleText(text);
      return;
    }

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
  }, [animate, text, delayMs]);

  const complete = visibleText.length >= text.length;
  const showHelp = Boolean(tooltip) && complete;

  return (
    <div ref={rootRef} className="relative mt-1.5 inline-flex max-w-full items-center gap-2">
      <div
        className={[
          "inline-flex max-w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 font-mono text-[11px]",
          isLight ? "border-neutral-300 bg-neutral-50 text-neutral-700" : "border-neutral-700 bg-neutral-900 text-neutral-200",
        ].join(" ")}
      >
        <span className="text-curios-accent">&gt;</span>
        <span className={["font-semibold uppercase tracking-[0.2em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
          Type
        </span>
        <span className="whitespace-nowrap">{visibleText || "\u00A0"}</span>
        <span aria-hidden="true" className={complete ? "opacity-40" : "animate-pulse"}>
          |
        </span>
      </div>

      {showHelp && (
        <button
          type="button"
          aria-label={tooltipAriaLabel ?? "Show supported providers"}
          className={[
            "inline-flex h-6 w-6 flex-none items-center justify-center rounded-md border transition",
            isLight
              ? "border-neutral-300 bg-white/70 text-neutral-700 hover:bg-neutral-100"
              : "border-neutral-700 bg-neutral-950/60 text-neutral-200 hover:bg-neutral-900",
          ].join(" ")}
          onClick={() => setTooltipOpen((v) => !v)}
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}

      {showHelp && tooltipOpen && (
        <div
          role="tooltip"
          className={[
            "absolute left-0 top-full z-20 mt-2 w-max max-w-[260px] rounded-2xl border p-2",
            isLight ? "border-neutral-200 bg-white" : "border-neutral-800 bg-neutral-950",
          ].join(" ")}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

function RotatingPromptExamples(props: {
  examples: readonly string[];
  isLight: boolean;
  animate?: boolean;
}) {
  const { examples, isLight, animate = true } = props;
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    if (!animate) {
      setVisibleText(examples[activeIndex] ?? examples[0] ?? "");
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setVisibleText(examples[0] ?? "");
      return;
    }

    let exampleIndex = 0;
    let charIndex = 0;
    let direction: "typing" | "deleting" = "typing";
    let timeoutId: number | null = null;

    function tick() {
      const current = examples[exampleIndex] ?? "";

      if (direction === "typing") {
        charIndex += 1;
        setActiveIndex(exampleIndex);
        setVisibleText(current.slice(0, charIndex));

        if (charIndex >= current.length) {
          direction = "deleting";
          timeoutId = window.setTimeout(tick, 1400);
          return;
        }

        timeoutId = window.setTimeout(tick, 28);
        return;
      }

      charIndex -= 1;
      setVisibleText(current.slice(0, Math.max(0, charIndex)));

      if (charIndex <= 0) {
        direction = "typing";
        exampleIndex = (exampleIndex + 1) % examples.length;
        setActiveIndex(exampleIndex);
        timeoutId = window.setTimeout(tick, 220);
        return;
      }

      timeoutId = window.setTimeout(tick, 18);
    }

    setVisibleText("");
    timeoutId = window.setTimeout(tick, 240);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeIndex, animate, examples]);

  return (
    <div className={["mt-2 rounded-2xl border px-3 py-2.5", isLight ? "border-neutral-300 bg-neutral-50/80" : "border-neutral-700 bg-neutral-900/70"].join(" ")}>
      <div className={["text-[11px] font-semibold uppercase tracking-[0.24em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
        Try asking
      </div>
      <div className={["mt-2 flex items-start gap-2 font-mono text-[12px] sm:text-[13px]", isLight ? "text-neutral-700" : "text-neutral-200"].join(" ")}>
        <span className="text-curios-accent">&gt;</span>
        <span className="min-w-0 flex-1 break-words">
          {visibleText || examples[activeIndex] || "\u00A0"}
          <span aria-hidden="true" className={animate ? "ml-0.5 inline-block animate-pulse opacity-70" : "ml-0.5 inline-block opacity-40"}>|</span>
        </span>
      </div>
    </div>
  );
}

function ProviderPills(props: {
  supportedProviders: readonly string[];
  isLight: boolean;
  compact?: boolean;
}) {
  const { supportedProviders, isLight, compact } = props;

  return (
    <div className={[compact ? "" : "mt-2", "flex flex-wrap gap-1"].join(" ")}>
      {supportedProviders.map((provider) => (
        <span
          key={provider}
          className={[
            "rounded-full border px-2 py-1 text-[10px] font-semibold sm:text-[11px]",
            isLight ? "border-neutral-300 bg-white text-neutral-700" : "border-neutral-700 bg-neutral-900 text-neutral-200",
          ].join(" ")}
        >
          {provider}
        </span>
      ))}
    </div>
  );
}

function WelcomeStepCard(props: {
  step: string;
  title: string;
  description: string;
  typeText?: string;
  typeTooltip?: React.ReactNode;
  delayMs: number;
  isLight: boolean;
  footer?: React.ReactNode;
  animate?: boolean;
}) {
  const { step, title, description, typeText, typeTooltip, delayMs, isLight, footer, animate = true } = props;

  return (
    <div className={["h-full rounded-2xl border px-3 py-2.5", isLight ? "border-neutral-200 bg-white/70" : "border-neutral-800 bg-neutral-900/40"].join(" ")}>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className={["pt-0.5 text-[11px] font-semibold tracking-[0.28em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
          {step}
        </div>
        <div>
          <div className="select-text text-sm font-semibold">{title}</div>
          <div className={["mt-1 select-text text-[13px] leading-5", isLight ? "text-neutral-700" : "text-neutral-300"].join(" ")}>
            {description}
          </div>
          {typeText && (
            <TypeInstruction
              text={typeText}
              isLight={isLight}
              delayMs={delayMs}
              tooltip={typeTooltip}
              tooltipAriaLabel={typeTooltip ? "Supported providers" : undefined}
              animate={animate}
            />
          )}
          {footer}
        </div>
      </div>
    </div>
  );
}

export default function CuriosChatWelcomeCard(props: {
  appName: string;
  isLight: boolean;
  loggedIn: boolean;
  userLabel?: string;
  supportedProviders: readonly string[];
}) {
  const { appName, isLight, loggedIn, userLabel, supportedProviders } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [selectionActive, setSelectionActive] = useState(false);

  useEffect(() => {
    function updateSelectionState() {
      const root = rootRef.current;
      const selection = typeof window !== "undefined" && typeof window.getSelection === "function" ? window.getSelection() : null;
      if (!root || !selection || selection.isCollapsed) {
        setSelectionActive(false);
        return;
      }

      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      const isInsideSelection =
        Boolean(anchorNode && root.contains(anchorNode)) || Boolean(focusNode && root.contains(focusNode));

      setSelectionActive(isInsideSelection);
    }

    document.addEventListener("selectionchange", updateSelectionState);
    document.addEventListener("pointerup", updateSelectionState);

    return () => {
      document.removeEventListener("selectionchange", updateSelectionState);
      document.removeEventListener("pointerup", updateSelectionState);
    };
  }, []);

  if (loggedIn) {
    return (
      <div ref={rootRef} className="space-y-2.5 select-text">
        <div>
          You are signed in
          {userLabel ? (
            <>
              {" "}as <strong>{userLabel}</strong>
            </>
          ) : null}
          .
        </div>

        <div className={["rounded-3xl border p-3 sm:p-4", isLight ? "border-neutral-200 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "border-neutral-800 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"].join(" ")}>
          <div className="grid gap-2.5 lg:grid-cols-2">
            <WelcomeStepCard
              step="01"
              title="Change provider"
              description="Connect your provider to start using Curios with your own API key."
              typeText="Change provider"
              typeTooltip={
                <div>
                  <div
                    className={[
                      "text-[11px] font-semibold uppercase tracking-[0.24em]",
                      isLight ? "text-neutral-500" : "text-neutral-400",
                    ].join(" ")}
                  >
                    Supported providers
                  </div>
                  <div className="mt-2">
                    <ProviderPills supportedProviders={supportedProviders} isLight={isLight} compact />
                  </div>
                </div>
              }
              delayMs={180}
              isLight={isLight}
              animate={!selectionActive}
            />

            <WelcomeStepCard
              step="02"
              title="Use apps"
              description="Open the Browser app once your provider is connected."
              typeText="Use browser"
              delayMs={320}
              isLight={isLight}
              animate={!selectionActive}
            />

            <div className="lg:col-span-2">
              <WelcomeStepCard
                step="03"
                title="What you can do"
                description="Talk with your browser. You can ask Curios to compare websites, inspect pages, and analyze content in real time, a smart browser for you."
                delayMs={460}
                isLight={isLight}
                animate={!selectionActive}
                footer={<RotatingPromptExamples examples={EXAMPLE_PROMPTS} isLight={isLight} animate={!selectionActive} />}
              />
            </div>
          </div>
        </div>

        <div>Once your provider is connected, you can start using Curios right away.</div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="space-y-3 select-text">
      <div className={isLight ? "text-neutral-700" : "text-neutral-300"}>
        <strong className={isLight ? "text-neutral-900" : "text-neutral-100"}>Welcome to {appName}.</strong> Here is how to get started.
      </div>

      <div className={["rounded-3xl p-3 sm:p-4", isLight ? "border-neutral-200 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "border-neutral-800 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"].join(" ")}>
        <div className="grid gap-2.5 lg:grid-cols-3">
          <WelcomeStepCard
            step="01"
            title="Signup or Signin"
            description="Create your account or signin."
            typeText="Signup, Signin or Guest"
            delayMs={180}
            isLight={isLight}
            animate={!selectionActive}
          />

          <WelcomeStepCard
            step="02"
            title="Setup AI provider"
            description="Set your AI provider and use your API key."
            typeText="Change provider"
            typeTooltip={
              <div>
                <div
                  className={[
                    "text-[11px] font-semibold uppercase tracking-[0.24em]",
                    isLight ? "text-neutral-500" : "text-neutral-400",
                  ].join(" ")}
                >
                  Supported providers
                </div>
                <div className="mt-2">
                  <ProviderPills supportedProviders={supportedProviders} isLight={isLight} compact />
                </div>
              </div>
            }
            delayMs={320}
            isLight={isLight}
            animate={!selectionActive}
          />

          <WelcomeStepCard
            step="03"
            title="Use apps"
            description="Start using the Browser app."
            typeText="Use browser"
            delayMs={460}
            isLight={isLight}
            animate={!selectionActive}
          />

          <div className="lg:col-span-3">
            <WelcomeStepCard
              step="04"
              title="What you can do"
              description="Talk with your browser. You can ask Curios to compare websites, inspect pages, and analyze content in real time - a smart browser for you."
              delayMs={600}
              isLight={isLight}
              animate={!selectionActive}
              footer={<RotatingPromptExamples examples={EXAMPLE_PROMPTS} isLight={isLight} animate={!selectionActive} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
