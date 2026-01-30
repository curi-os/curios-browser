import React from "react";
import type { ContextId, Ui } from "./types";
import { CONTEXTS } from "./contexts";

export default function ContextList({
  activeContext,
  onSelect,
  ui,
}: {
  activeContext: ContextId;
  onSelect: (id: ContextId) => void;
  ui: Ui;
}) {
  return (
    <nav className="p-2">
      <div className="px-2 pb-2 pt-3 text-[11px] uppercase tracking-wider text-neutral-500">
        Contexts
      </div>
      <div className="space-y-1">
        {CONTEXTS.map((c) => {
          const active = c.id === activeContext;
          return (
            <button
              key={c.id}
              onClick={() => c.enabled && onSelect(c.id)}
              disabled={!c.enabled}
              className={[
                "w-full rounded-xl px-3 py-3 text-left transition",
                active ? `border ${ui.border} ${ui.card}` : `border border-transparent ${ui.hoverSoft}`,
                !c.enabled ? "opacity-40 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{c.label}</div>
                <span className={["rounded-full px-2 py-0.5 text-[10px]", c.enabled ? ui.badgeEnabled : ui.badgeDisabled].join(" ")}>
                  {c.enabled ? (active ? "Active" : "Available") : "Coming soon"}
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-500">{c.description}</div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
