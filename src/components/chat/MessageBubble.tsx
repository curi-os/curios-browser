import React from "react";
import type { Ui } from "./types";

export default function MessageBubble({
  role,
  text,
  ui,
  position,
  messageType = "text",
}: {
  role: "user" | "assistant";
  text: React.ReactNode | string;
  ui: Ui;
  position?: "center" | "left" | "right";
  messageType?: "text" | "secret";
}) {
  const isUser = role === "user";
  const isSecret = messageType === "secret";
  const getTextLength = (node: React.ReactNode | string): number => {
    if (node == null || typeof node === "boolean") return 0;
    if (typeof node === "string") return node.length;
    if (typeof node === "number") return String(node).length;
    if (Array.isArray(node)) return node.reduce((sum, child) => sum + getTextLength(child), 0);
    if (React.isValidElement<{ children?: React.ReactNode }>(node)) return getTextLength(node.props.children);
    return 0;
  };

  const textWithType = isSecret ? "&bull;".repeat(getTextLength(text)) : text;
  const finalText = typeof textWithType === "string" ? <div dangerouslySetInnerHTML={{ __html: textWithType }} /> : textWithType

  if (position === "center") {
    return (
      <div className="flex justify-center">
        <div>
          {finalText}
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
        {finalText}
      </div>
    </div>
  );
}
