import React from "react";

import { getProviderLabel } from "../../../../utils/getProviderLabel";
import { getSessionStateLabel } from "../../../../utils/getSessionStateLabel";
import type { ContextId, ContextItem, Ui } from "../../shared/types";

export default function CuriosChatHeader(props: {
  ui: Ui;
  isLight: boolean;
  activeContext: ContextId;
  activeContextMeta: ContextItem;
  systemContextHelp: string;
  serverState: string | null;
  selectedProvider: string | null;
  providerConfigured: boolean;
  supabaseAvailable: boolean;
  authLoading: boolean;
  effectiveUser: { id: string; email?: string } | null;
  onSignOut: () => void;
  onToggleTheme: () => void;
  onReset: () => void;
  onOpenMobileMenu: () => void;
}) {
  const {
    ui,
    isLight,
    activeContext,
    activeContextMeta,
    systemContextHelp,
    serverState,
    selectedProvider,
    providerConfigured,
    supabaseAvailable,
    authLoading,
    effectiveUser,
    onSignOut,
    onToggleTheme,
    onReset,
    onOpenMobileMenu,
  } = props;

  const ActiveContextIcon = activeContextMeta.icon;

  return (
    <header className={`sticky top-0 z-10 border-b ${ui.border} ${ui.topbarBg} backdrop-blur`}>
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <button
          className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel} md:hidden`}
          onClick={onOpenMobileMenu}
        >
          Menu
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              isLight ? "bg-neutral-200" : "bg-neutral-800",
            ].join(" ")}
            aria-hidden
          >
            <ActiveContextIcon className={"h-5 w-5"} aria-hidden />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex min-w-0 items-center gap-1">
              <div className="truncate text-sm font-semibold">{activeContextMeta.label}</div>
              {activeContext === "system" && (
                <button
                  type="button"
                  className={`shrink-0 rounded-full border ${ui.border} px-2 py-0.5 text-[11px] leading-none text-neutral-500 ${ui.hoverPanel}`}
                  title={systemContextHelp}
                  aria-label="What is the System context?"
                >
                  ?
                </button>
              )}
            </div>
            <div className="truncate text-xs text-neutral-400">
              state: {getSessionStateLabel(serverState)}
              {selectedProvider ? (
                <>
                  <br />provider: {getProviderLabel(selectedProvider)}
                </>
              ) : null}
              {!providerConfigured ? (
                <>
                  <br />provider configured: no
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {supabaseAvailable && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-neutral-500">
                {authLoading ? "auth…" : effectiveUser ? `Signed in: ${effectiveUser.email ?? effectiveUser.id}` : "Guest"}
              </span>
              {effectiveUser && (
                <button
                  className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel}`}
                  onClick={onSignOut}
                  title="Sign out"
                >
                  Sign out
                </button>
              )}
            </div>
          )}

          <button
            className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel}`}
            onClick={onToggleTheme}
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
            onClick={onReset}
            title="Restart local session"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
