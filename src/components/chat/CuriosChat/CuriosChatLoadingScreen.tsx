import React from "react";

import CuriosChatHero from "./CuriosChatHero";
import type { Ui } from "../shared/types";

export default function CuriosChatLoadingScreen(props: {
  ui: Ui;
  isLight: boolean;
  logoUrl: string;
  appName: string;
  statusText: string;
}) {
  const { ui, isLight, logoUrl, appName, statusText } = props;

  return (
    <div className={`min-h-screen ${ui.app}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col justify-center px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[760px]">
          <CuriosChatHero logoUrl={logoUrl} appName={appName} isLight={isLight} compact />

          <div className="mt-6 text-center">
            <div
              className={[
                "text-[11px] font-semibold uppercase tracking-[0.32em]",
                isLight ? "text-neutral-500" : "text-neutral-400",
              ].join(" ")}
            >
              Starting Up
            </div>

            <div className="mt-3 text-2xl font-semibold sm:text-3xl">Preparing your workspace</div>

            <div className={["mx-auto mt-3 max-w-[520px] text-sm leading-6", isLight ? "text-neutral-600" : "text-neutral-300"].join(" ")}>
              {statusText}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
            <div
              className={[
                "rounded-3xl border p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
                isLight ? "border-neutral-200 bg-white/90" : "border-neutral-800 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
              ].join(" ")}
            >
              <div className="space-y-3 animate-pulse">
                <div className={`h-3 w-28 rounded-full ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                <div className={`h-12 w-[82%] rounded-2xl ${isLight ? "bg-neutral-100" : "bg-neutral-900"}`} />
                <div className="flex justify-end">
                  <div className={`h-16 w-[68%] rounded-2xl ${isLight ? "bg-neutral-100" : "bg-neutral-900"}`} />
                </div>
                <div className={`h-14 w-[76%] rounded-2xl ${isLight ? "bg-neutral-100" : "bg-neutral-900"}`} />
              </div>
            </div>

            <div
              className={[
                "rounded-3xl border p-4",
                isLight ? "border-neutral-200 bg-white/75" : "border-neutral-800 bg-neutral-950/80",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                <span className={["text-xs font-medium", isLight ? "text-neutral-600" : "text-neutral-300"].join(" ")}>
                  Syncing session and loading history
                </span>
              </div>

              <div className="mt-4 space-y-2.5 animate-pulse">
                <div className={`h-3 w-full rounded-full ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                <div className={`h-3 w-[86%] rounded-full ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                <div className={`h-3 w-[72%] rounded-full ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
