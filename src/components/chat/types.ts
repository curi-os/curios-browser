import type { ReactNode } from "react";

export type Msg = {
  id: string;
  role: "user" | "assistant";
  text: ReactNode | string;
  position?: "center" | "left" | "right";
  messageType?: "text" | "secret";
};

export type ChatResponse = {
  sessionId: string;
  state: string;
  chatType: "text" | "secret";
  reply: string;
};

export type ContextId = "system" | "browser" | "files" | "notes";

export type ContextItem = {
  id: ContextId;
  label: string;
  description: string;
  enabled: boolean;
};

export type Ui = {
  app: string;
  border: string;
  panel: string;
  card: string;
  hoverPanel: string;
  hoverSoft: string;
  topbarBg: string;
  assistantBubble: string;
  userBubble: string;
  badgeEnabled: string;
  badgeDisabled: string;
  sendBtn: string;
};
