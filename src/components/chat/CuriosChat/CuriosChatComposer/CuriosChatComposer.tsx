import React from "react";

import type { Ui } from "../../shared/types";
import type { CSSPropertiesWithWebkit } from "./CuriosChatComposer.styles";

export default function CuriosChatComposer(props: {
  ui: Ui;
  input: string;
  onChangeInput: (value: string) => void;
  onSend: () => void;
  maskInput: boolean;
  sessionLoading: boolean;
  historyLoading: boolean;
  isSending: boolean;
  sessionId: string;
  composerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const {
    ui,
    input,
    onChangeInput,
    onSend,
    maskInput,
    sessionLoading,
    historyLoading,
    isSending,
    sessionId,
    composerRef,
  } = props;

  return (
    <div ref={composerRef} className={`fixed inset-x-0 bottom-0 border-t ${ui.border} ${ui.topbarBg} backdrop-blur md:left-80`}>
      <div className="mx-auto w-full max-w-4xl px-4 py-4">
        <div className={`rounded-2xl border ${ui.border} ${ui.card} p-2`}>
          <textarea
            value={input}
            onChange={(e) => onChangeInput(e.target.value)}
            placeholder={sessionLoading || historyLoading ? "Loading your session…" : "Type in natural language…"}
            className="max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-500"
            rows={2}
            disabled={sessionLoading || historyLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            style={maskInput ? ({ WebkitTextSecurity: "disc" } as CSSPropertiesWithWebkit) : undefined}
          />
          <div className="flex items-center justify-between px-3 pb-1 pt-2">
            <div className="text-[11px] text-neutral-500">Enter to send · Shift+Enter for new line</div>
            <button
              onClick={onSend}
              disabled={sessionLoading || historyLoading || isSending || !input.trim()}
              className={`rounded-xl px-4 py-2 text-xs font-semibold ${ui.sendBtn} disabled:opacity-40`}
            >
              Send
            </button>
          </div>
        </div>

        <div className="mt-2 text-center text-[11px] text-neutral-600 md:hidden">
          Session: <span className="font-mono">{sessionId}</span>
        </div>
      </div>
    </div>
  );
}
