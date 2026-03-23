import React from "react";
import { APP_TAGLINE } from "../../../branding";

export default function CuriosIntroBubble({ isLight, compact = false }: { isLight: boolean; compact?: boolean }) {
  const bubbleClass = isLight
    ? "border border-neutral-200 bg-neutral-100 text-neutral-900"
    : "border border-neutral-800 bg-neutral-900 text-neutral-100";

  return (
    <div className={compact ? "mx-auto mb-4 w-full max-w-md sm:mb-5 sm:max-w-lg" : "mx-auto mb-12 w-full max-w-xl"}>
      <div
        className={[
          compact ? "rounded-2xl px-3 py-2.5 text-[11px] leading-relaxed text-center sm:px-4 sm:py-3 sm:text-xs" : "rounded-2xl px-5 py-4 text-sm leading-relaxed text-center",
          bubbleClass,
        ].join(" ")}
      >
        <div className={isLight ? "text-neutral-700" : "text-neutral-500"}>{APP_TAGLINE}</div>
      </div>
    </div>
  );
}
