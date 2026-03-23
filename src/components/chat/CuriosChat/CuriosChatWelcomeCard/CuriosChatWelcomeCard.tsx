import React, { useEffect, useState } from "react";

function TypeInstruction(props: {
  text: string;
  isLight: boolean;
  delayMs?: number;
}) {
  const { text, isLight, delayMs = 0 } = props;
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
        "mt-1.5 inline-flex max-w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 font-mono text-[11px]",
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

function WelcomeStepCard(props: {
  step: string;
  title: string;
  description: string;
  typeText: string;
  delayMs: number;
  isLight: boolean;
}) {
  const { step, title, description, typeText, delayMs, isLight } = props;

  return (
    <div className={["h-full rounded-2xl border px-3 py-2.5", isLight ? "border-neutral-200 bg-white/70" : "border-neutral-800 bg-neutral-900/40"].join(" ")}>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className={["pt-0.5 text-[11px] font-semibold tracking-[0.28em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
          {step}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className={["mt-1 text-[13px] leading-5", isLight ? "text-neutral-700" : "text-neutral-300"].join(" ")}>
            {description}
          </div>
          <TypeInstruction text={typeText} isLight={isLight} delayMs={delayMs} />
        </div>
      </div>
    </div>
  );
}

function SupportedProvidersCard(props: {
  supportedProviders: readonly string[];
  isLight: boolean;
}) {
  const { supportedProviders, isLight } = props;

  return (
    <div className={["h-full rounded-2xl border px-3 py-2.5", isLight ? "border-neutral-200 bg-white/70" : "border-neutral-800 bg-neutral-900/40"].join(" ")}>
      <div className={["text-[11px] font-semibold uppercase tracking-[0.28em]", isLight ? "text-neutral-500" : "text-neutral-400"].join(" ")}>
        Supported providers
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
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
      <div className="space-y-2.5">
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
              <SupportedProvidersCard supportedProviders={supportedProviders} isLight={isLight} />
            </div>
          </div>
        </div>

        <div>Once your provider is connected, you can start using Curios right away.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={isLight ? "text-neutral-700" : "text-neutral-300"}>
        <strong className={isLight ? "text-neutral-900" : "text-neutral-100"}>Welcome to {appName}.</strong> Here is how to get started.
      </div>

      <div className={["rounded-3xl border p-3 sm:p-4", isLight ? "border-neutral-200 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "border-neutral-800 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"].join(" ")}>
        <div className="grid gap-2.5 lg:grid-cols-3">
          <WelcomeStepCard
            step="01"
            title="Signup or Signin"
            description="Create your account or sign into an existing one."
            typeText="Signup, Signin or Guest"
            delayMs={180}
            isLight={isLight}
          />

          <WelcomeStepCard
            step="02"
            title="Change provider"
            description="Set your AI provider so Curios can work with your own API key."
            typeText="Change provider"
            delayMs={320}
            isLight={isLight}
          />

          <WelcomeStepCard
            step="03"
            title="Use apps"
            description="Start using the Browser app after your provider is connected."
            typeText="Use browser"
            delayMs={460}
            isLight={isLight}
          />

          <div className="lg:col-span-3">
            <SupportedProvidersCard supportedProviders={supportedProviders} isLight={isLight} />
          </div>
        </div>
      </div>

      <div className={isLight ? "text-neutral-600" : "text-neutral-400"}>
        You can also continue as a guest if you just want to explore.
      </div>
    </div>
  );
}
