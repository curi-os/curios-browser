import type { Meta, StoryObj } from "@storybook/react-webpack5";

import { fn } from "storybook/test";

import CuriosChatComposer from "./CuriosChatComposer";
import type { Ui } from "../../shared/types";

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

const meta = {
  title: "Chat/CuriosChatComposer",
  component: CuriosChatComposer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    ui: uiDark,
    input: "Hello there",
    onChangeInput: fn(),
    onSend: fn(),
    maskInput: false,
    sessionLoading: false,
    historyLoading: false,
    isSending: false,
    sessionId: "sess_123",
    composerRef: { current: null },
    layout: "docked",
  },
  argTypes: {
    ui: { control: false },
    composerRef: { control: false },
    onChangeInput: { control: false },
    onSend: { control: false },
  },
} satisfies Meta<typeof CuriosChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MaskedInput: Story = {
  args: {
    maskInput: true,
    input: "super secret",
  },
};

export const Inline: Story = {
  parameters: {
    layout: "centered",
  },
  args: {
    layout: "inline",
    showSessionId: false,
    input: "",
  },
};
