import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import type { Ui } from "./types";
import { getProviderLabel } from "./utils";

function prettifyProviderLine(text: string) {
  // Replace raw provider identifiers in common settings-style lines.
  // Examples:
  // - "Selected Provider: azure_openai" -> "Selected Provider: Azure OpenAI"
  // - "Selected provider: openai" -> "Selected provider: OpenAI"
  // - "Provider: mistral" -> "Provider: Mistral"
  const patterns: RegExp[] = [
    /^\s*(Selected\s+Provider\s*:\s*)([A-Za-z0-9._-]+)\s*$/gim,
    /^\s*(Provider\s*:\s*)([A-Za-z0-9._-]+)\s*$/gim,
  ];

  let next = text;
  for (const re of patterns) {
    next = next.replace(re, (_m, prefix: string, providerId: string) => {
      const friendly = getProviderLabel(providerId);
      return `${prefix}${friendly || providerId}`;
    });
  }
  return next;
}

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

  const normalizedText = useMemo(() => {
    if (isSecret) return text;
    if (typeof text !== "string") return text;
    return prettifyProviderLine(text);
  }, [isSecret, text]);

  const safeHtml = useMemo(() => {
    if (isSecret) return null;
    if (typeof normalizedText !== "string") return null;
    return DOMPurify.sanitize(normalizedText, { USE_PROFILES: { html: true } });
  }, [isSecret, normalizedText]);

  // For secret content, intentionally render a fixed mask (do not leak length).
  const finalText: React.ReactNode | string = isSecret ? "••••••" : normalizedText;

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
