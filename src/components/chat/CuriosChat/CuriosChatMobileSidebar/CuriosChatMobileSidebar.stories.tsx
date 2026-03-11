import type { Meta, StoryObj } from "@storybook/react-webpack5";

import { fn } from "storybook/test";

import CuriosChatMobileSidebar from "./CuriosChatMobileSidebar";
import { CONTEXTS } from "../../shared/contexts";
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
  title: "Chat/CuriosChatMobileSidebar",
  component: CuriosChatMobileSidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    open: true,
    onClose: fn(),
    ui: uiDark,
    activeContextMeta: CONTEXTS[0]!,
    activeContext: "system",
    onSelectContext: fn(),
    onReset: fn(),
    sessionId: "sess_123",
    isLight: false,
  },
  argTypes: {
    ui: { control: false },
    activeContextMeta: { control: false },
    onClose: { control: false },
    onSelectContext: { control: false },
    onReset: { control: false },
  },
} satisfies Meta<typeof CuriosChatMobileSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
  args: {
    open: false,
  },
};
