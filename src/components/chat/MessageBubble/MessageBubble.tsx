import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import type { Ui } from "../shared/types";
import { getProviderLabel } from "../../../utils/getProviderLabel";

const CHAT_HTML_ALLOWED_TAGS = ["a", "b", "br", "code", "strong"];
const CHAT_HTML_ALLOWED_ATTR = ["href", "target", "rel"];

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

function sanitizeChatHtml(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: CHAT_HTML_ALLOWED_TAGS,
    ALLOWED_ATTR: CHAT_HTML_ALLOWED_ATTR,
  });
}

function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?(strong|b|code|a)[^>]*>/gi, "")
      .trim();
  }

  const normalized = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li|pre|blockquote|h[1-6])>/gi, "\n")
    .replace(/<(div|p|pre|blockquote|h[1-6])[^>]*>/gi, "")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n");

  const container = document.createElement("div");
  container.innerHTML = normalized;

  return (container.textContent ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function copyPlainText(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy command failed");
  }
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
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const normalizedText = useMemo(() => {
    if (isSecret) return text;
    if (typeof text !== "string") return text;
    return isUser ? text : prettifyProviderLine(text);
  }, [isSecret, isUser, text]);

  // Only assistant/system strings are authored as rich text; user input should stay literal.
  const canRenderHtml = !isSecret && !isUser && typeof normalizedText === "string";

  const safeHtml = useMemo(() => {
    if (!canRenderHtml) return null;
    return sanitizeChatHtml(normalizedText);
  }, [canRenderHtml, normalizedText]);

  // For secret content, intentionally render a fixed mask (do not leak length).
  const finalText: React.ReactNode | string = isSecret ? "••••••" : normalizedText;

  const plainTextForCopy = useMemo(() => {
    if (isSecret) return null;
    if (safeHtml != null) return htmlToPlainText(safeHtml);
    if (typeof finalText === "string") return finalText.trim();
    return null;
  }, [finalText, isSecret, safeHtml]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  async function handleCopy() {
    if (!plainTextForCopy) return;

    try {
      await copyPlainText(plainTextForCopy);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const showCopyButton = Boolean(plainTextForCopy);
  const renderedText: React.ReactNode =
    safeHtml != null ? (
      <div
        className="select-text break-words whitespace-pre-wrap [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.95em]"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    ) : (
      <div className="select-text break-words whitespace-pre-wrap">{finalText}</div>
    );

  const bubbleBody = (
    <>
      {showCopyButton ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-current/15 px-2 py-1 text-[11px] font-medium opacity-70 transition hover:opacity-100"
            title="Copy plain text"
            aria-label="Copy plain text"
          >
            {copyState === "copied" ? "Copied" : copyState === "error" ? "Retry copy" : "Copy"}
          </button>
        </div>
      ) : null}
      {renderedText}
    </>
  );

  if (position === "center" || isSystem) {
    return (
      <div className="flex justify-center">
        <div className={isSystem ? "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-xs text-neutral-500" : undefined}>
          {bubbleBody}
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
        {bubbleBody}
      </div>
    </div>
  );
}
