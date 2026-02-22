import React from "react";
import curiosLogoWhiteUrl from "../../images/curios-logo-white.png";
import type { ContextItem } from "./types";
import { BookOpen } from "lucide-react";

export default function SidebarHeader({
  onReset,
  onClose,
  activeContext,
  isLight,
}: {
  onReset: () => void;
  onClose?: () => void;
  activeContext: ContextItem;
  isLight: boolean;
}) {
  const borderClass = isLight ? "border-neutral-200" : "border-neutral-800";
  const logoBgClass = isLight ? "bg-neutral-200" : "bg-neutral-800";
  const buttonClass = [
    "rounded-lg border px-3 py-1.5 text-xs",
    isLight
      ? "border-neutral-200 hover:bg-neutral-100 text-neutral-800"
      : "border-neutral-800 hover:bg-neutral-900 text-neutral-200",
  ].join(" ");

  return (
    <div className={`border-b ${borderClass} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <img
              className={`h-10 w-10 rounded-2xl ${logoBgClass}`}
              src={curiosLogoWhiteUrl}
              alt="CuriOS logo"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">CuriOS</div>
            <div className="text-xs text-neutral-400"></div>
          <div className="text-xs text-neutral-500">Conversational OS</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className={buttonClass}
            >
              Close
            </button>
          )}
          <a
            href="https://github.com/curi-os/docs"
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1.5 ${buttonClass}`}
            title="Open docs"
            aria-label="Open docs"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Docs
          </a>
        </div>
      </div>

      <div className="mt-3 text-xs text-neutral-300">
        Context: You are now on{" "}
        <span className="inline-flex items-center gap-1.5 text-neutral-500 dark:text-neutral-300">
          {activeContext.label}
        </span>
        .

        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {activeContext.description}
        </div>
      </div>
    </div>
  );
}
