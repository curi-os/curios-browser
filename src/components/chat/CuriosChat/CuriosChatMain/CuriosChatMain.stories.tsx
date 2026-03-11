import type { Meta, StoryObj } from "@storybook/react-webpack5";

import CuriosChatMain from "./CuriosChatMain";
import type { Msg, Ui } from "../../shared/types";

const uiDark: Ui = {
  app: "bg-neutral-950 text-neutral-100",
  border: "border-neutral-800",
  panel: "bg-neutral-950",
  card: "bg-neutral-900",
  hoverPanel: "hover:bg-neutral-900",
  hoverSoft: "hover:bg-neutral-900/60",
  topbarBg: "bg-neutral-950/80",
  assistantBubble: "border border-neutral-800 bg-neutral-900 text-neutral-100",
  userBubble: "bg-neutral-100 text-neutral-950",
  badgeEnabled: "bg-neutral-800 text-neutral-200",
  badgeDisabled: "bg-neutral-900 text-neutral-500 border border-neutral-800",
  sendBtn: "bg-neutral-100 text-neutral-900",
};

const sampleMessages: Msg[] = [
  { id: "1", role: "assistant", text: "Hello!" },
  { id: "2", role: "user", text: "Hi there" },
  { id: "3", role: "assistant", text: "How can I help?" },
];

const meta = {
  title: "Chat/CuriosChatMain",
  component: CuriosChatMain,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    ui: uiDark,
    messages: sampleMessages,
    sessionError: null,
    historyError: null,
    hasMoreBefore: false,
    loadingOlder: false,
    loadOlderHistory: () => {},
    isSending: false,
    isLight: false,
    composerHeight: 0,
    scrollerRef: { current: null },
    bottomRef: { current: null },
    onMaybeLoadOlder: () => {},
  },
  argTypes: {
    ui: { control: false },
    messages: { control: false },
    scrollerRef: { control: false },
    bottomRef: { control: false },
    onMaybeLoadOlder: { control: false },
    loadOlderHistory: { control: false },
  },
} satisfies Meta<typeof CuriosChatMain>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sending: Story = {
  args: {
    isSending: true,
  },
};

export const WithErrors: Story = {
  args: {
    sessionError: "Network error",
    historyError: "Timeout",
  },
};
