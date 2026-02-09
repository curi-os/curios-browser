import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import type { Ui } from "./types";

export default function MessageBubble({
  role,
  text,
  ui,
  position,
  messageType = "text",
}: {
  role: "user" | "assistant" | "system";
  text: React.ReactNode | string;
  ui: Ui;
  position?: "center" | "left" | "right";
  messageType?: "text" | "secret";
}) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const isSecret = messageType === "secret";

  const safeHtml = useMemo(() => {
    if (isSecret) return null;
    if (typeof text !== "string") return null;
    return DOMPurify.sanitize(text, { USE_PROFILES: { html: true } });
  }, [isSecret, text]);

  // For secret content, intentionally render a fixed mask (do not leak length).
  const finalText: React.ReactNode | string = isSecret ? "••••••" : text;

  const renderedText: React.ReactNode =
    safeHtml != null ? <div dangerouslySetInnerHTML={{ __html: safeHtml }} /> : <>{finalText}</>;

  if (position === "center" || isSystem) {
    return (
      <div className="flex justify-center">
        <div className={isSystem ? "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-xs text-neutral-500" : undefined}>
          {renderedText}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser ? ui.userBubble : ui.assistantBubble,
        ].join(" ")}
      >
        {renderedText}
      </div>
    </div>
  );
}
