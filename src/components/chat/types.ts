import type { ReactNode } from "react";

export type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  // Display content (may be masked for secret messages).
  text: ReactNode | string;
  // Raw content returned by the backend (kept in-memory; UI should hide secrets).
  rawText?: string;
  createdAt?: string;
  position?: "center" | "left" | "right";
  messageType?: "text" | "secret";
};

export type ServerMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  dataInputType: "text" | "secret";
};

export type MessagesResponse = {
  messages: ServerMessage[];
  pageInfo: {
    oldestCursor: string | null;
    newestCursor: string | null;
    hasMoreBefore: boolean;
  };
};

export type ChatResponse = {
  sessionId: string;
  state: string;
  chatType: "text" | "secret";
  reply: string;
};

export type SessionResponse = {
  ok: boolean;
  sessionId: string;
  state: string;
  chatType: "text" | "secret";
  user: null | {
    userId: string;
    email?: string;
  };
  providerConfigured: boolean;
  selectedProvider: string | null;
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
