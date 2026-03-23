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
}) {
  const { text, isLight, delayMs = 0, tooltip, tooltipAriaLabel } = props;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const typeWidth = `${Math.max(text.length, 1)}ch`;
  const typeAnimationStyle = {
    maxWidth: typeWidth,
    "--curios-type-width": typeWidth,
    animation: `curios-type-reveal ${Math.max(text.length * 28, 420)}ms steps(${Math.max(text.length, 1)}, end) ${delayMs}ms both`,
  } as React.CSSProperties & { "--curios-type-width": string };

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

  const showHelp = Boolean(tooltip);

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
        <span className="curios-type-mask" style={typeAnimationStyle}>
          <span className="inline-block whitespace-nowrap">{text}</span>
        </span>
        <span aria-hidden="true" className="curios-type-caret opacity-40">
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
}) {
  const { examples, isLight } = props;
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");
  const selectionActiveRef = useRef(false);

  useEffect(() => {
    function handleSelectionChange() {
      const selection = typeof window !== "undefined" && typeof window.getSelection === "function" ? window.getSelection() : null;
      selectionActiveRef.current = Boolean(selection && !selection.isCollapsed);
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  useEffect(() => {
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
    let cancelled = false;

    function schedule(nextDelay: number) {
      timeoutId = window.setTimeout(tick, nextDelay);
    }

    function tick() {
      if (cancelled) return;

      if (selectionActiveRef.current) {
        schedule(120);
        return;
      }

      const current = examples[exampleIndex] ?? "";

      if (direction === "typing") {
        charIndex += 1;
        setActiveIndex(exampleIndex);
        setVisibleText(current.slice(0, charIndex));

        if (charIndex >= current.length) {
          direction = "deleting";
          schedule(1600);
          return;
        }

        schedule(28);
        return;
      }

      charIndex -= 1;
      setVisibleText(current.slice(0, Math.max(0, charIndex)));

      if (charIndex <= 0) {
        direction = "typing";
        exampleIndex = (exampleIndex + 1) % examples.length;
        setActiveIndex(exampleIndex);
        schedule(240);
        return;
      }

      schedule(18);
    }

    setVisibleText("");
    schedule(260);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [examples]);

  return (
    <div className={["mt-2 rounded-2xl border px-3 py-2.5", isLight ? "border-neutral-300 bg-neutral-50/80" : "border-neutral-700 bg-neutral-900/70"].join(" ")}>
      <div className={["text-[11px] font-semibold uppercase tracking-[0.24em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
        Try asking
      </div>
      <div className={["mt-2 flex min-h-[2.6rem] items-start gap-2 font-mono text-[12px] sm:text-[13px]", isLight ? "text-neutral-700" : "text-neutral-200"].join(" ")}>
        <span className="text-curios-accent">&gt;</span>
        <span className="min-w-0 flex-1 break-words">
          {visibleText || examples[activeIndex] || "\u00A0"}
          <span aria-hidden="true" className="ml-0.5 inline-block opacity-40">|</span>
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
  delayMs?: number;
  isLight: boolean;
  footer?: React.ReactNode;
}) {
  const { step, title, description, typeText, typeTooltip, delayMs = 0, isLight, footer } = props;

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

  if (loggedIn) {
    return (
      <div className="space-y-2.5 select-text">
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
            />

            <WelcomeStepCard
              step="02"
              title="Use apps"
              description="Open the Browser app once your provider is connected."
              typeText="Use browser"
              delayMs={320}
              isLight={isLight}
            />

            <div className="lg:col-span-2">
              <WelcomeStepCard
                step="03"
                title="What you can do"
                description="Talk with your browser. You can ask Curios to compare websites, inspect pages, and analyze content in real time, a smart browser for you."
                isLight={isLight}
                footer={<RotatingPromptExamples examples={EXAMPLE_PROMPTS} isLight={isLight} />}
              />
            </div>
          </div>
        </div>

        <div>Once your provider is connected, you can start using Curios right away.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 select-text">
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
          />

          <WelcomeStepCard
            step="03"
            title="Use apps"
            description="Start using the Browser app."
            typeText="Use browser"
            delayMs={460}
            isLight={isLight}
          />

          <div className="lg:col-span-3">
            <WelcomeStepCard
              step="04"
              title="What you can do"
              description="Talk with your browser. You can ask Curios to compare websites, inspect pages, and analyze content in real time - a smart browser for you."
              isLight={isLight}
              footer={<RotatingPromptExamples examples={EXAMPLE_PROMPTS} isLight={isLight} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
