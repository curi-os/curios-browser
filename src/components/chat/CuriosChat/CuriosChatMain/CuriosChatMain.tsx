import React from "react";

import MessageBubble from "../../MessageBubble";
import type { Msg, Ui } from "../../shared/types";

export default function CuriosChatMain(props: {
  ui: Ui;
  messages: Msg[];
  sessionError: string | null;
  historyError: string | null;
  hasMoreBefore: boolean;
  loadingOlder: boolean;
  loadOlderHistory: () => void;
  isSending: boolean;
  isLight: boolean;
  composerHeight: number;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onMaybeLoadOlder: () => void;
}) {
  const {
    ui,
    messages,
    sessionError,
    historyError,
    hasMoreBefore,
    loadingOlder,
    loadOlderHistory,
    isSending,
    isLight,
    composerHeight,
    scrollerRef,
    bottomRef,
    onMaybeLoadOlder,
  } = props;

  return (
    <main
      className="mx-auto min-h-0 w-full max-w-4xl flex-1 overflow-y-auto px-4 pt-6"
      style={{ paddingBottom: composerHeight + 16 }}
      ref={scrollerRef}
      onScroll={onMaybeLoadOlder}
    >
      <div className="space-y-4">
        {sessionError && (
          <MessageBubble
            role="assistant"
            text={
              "Failed to load session from the server. You can still try chatting, but state may be inconsistent.\n\n" +
              `Details: ${sessionError}`
            }
            ui={ui}
          />
        )}

        {historyError && (
          <MessageBubble
            role="assistant"
            text={
              "Failed to load message history. You can still chat, but previous messages may be missing.\n\n" +
              `Details: ${historyError}`
            }
            ui={ui}
          />
        )}

        {hasMoreBefore && (
          <div className="flex justify-center">
            <button
              className={`rounded-lg border ${ui.border} px-3 py-1.5 text-xs ${ui.hoverPanel} disabled:opacity-50`}
              onClick={loadOlderHistory}
              disabled={loadingOlder}
              title="Load older messages"
            >
              {loadingOlder ? "Loading…" : "Load older"}
            </button>
          </div>
        )}

        {messages.map((m) => {
          return (
            <div key={m.id} data-curios-msg-id={m.id}>
              <MessageBubble role={m.role} text={m.text} ui={ui} position={m.position} messageType={m.messageType} />
            </div>
          );
        })}

        {isSending && (
          <div className="flex justify-start">
            <div
              className={`max-w-[85%] rounded-2xl border ${ui.border} ${ui.card} px-4 py-3 text-sm ${
                isLight ? "text-neutral-800" : "text-neutral-200"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
                thinking…
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ scrollMarginBottom: composerHeight + 16 }} />
      </div>
    </main>
  );
}
