import type { Meta, StoryObj } from "@storybook/react-webpack5";

import { fn } from "storybook/test";

import CuriosChatHeader from "./CuriosChatHeader";
import { CONTEXTS } from "../../shared/contexts";
import type { Ui } from "../../shared/types";
import { SYSTEM_CONTEXT_HELP } from "../../../../config/curiosChat";

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
  title: "Chat/CuriosChatHeader",
  component: CuriosChatHeader,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    ui: uiDark,
    isLight: false,
    activeContext: "system",
    activeContextMeta: CONTEXTS[0]!,
    systemContextHelp: SYSTEM_CONTEXT_HELP,
    serverState: "ready",
    providerConfigured: true,
    selectedProvider: "openai",
    supabaseAvailable: true,
    authLoading: false,
    effectiveUser: { id: "user-123", email: "user@example.com" },
    onSignOut: fn(),
    onToggleTheme: fn(),
    onReset: fn(),
    onOpenMobileMenu: fn(),
  },
  argTypes: {
    ui: { control: false },
    activeContextMeta: { control: false },
  },
} satisfies Meta<typeof CuriosChatHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Guest: Story = {
  args: {
    effectiveUser: null,
  },
};

export const NoProviderConfigured: Story = {
  args: {
    providerConfigured: false,
    selectedProvider: null,
  },
};
