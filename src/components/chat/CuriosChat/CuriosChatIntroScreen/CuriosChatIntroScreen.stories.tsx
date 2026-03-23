import type { Meta, StoryObj } from "@storybook/react-webpack5";

import { fn } from "storybook/test";

import CuriosChatIntroScreen from "./CuriosChatIntroScreen";
import CuriosChatComposer from "../CuriosChatComposer";
import CuriosChatWelcomeCard from "../CuriosChatWelcomeCard";
import type { Ui } from "../../shared/types";
import curiosLogoDarkUrl from "../../../../images/curios-logo-dark.png";
import curiosLogoWhiteUrl from "../../../../images/curios-logo-white.png";
import { APP_NAME } from "../../../../branding";
import { SUPPORTED_PROVIDER_LABELS } from "../../../../utils/getProviderLabel";

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

const uiLight: Ui = {
  app: "bg-white text-neutral-900",
  border: "border-neutral-200",
  panel: "bg-white",
  card: "bg-neutral-100",
  hoverPanel: "hover:bg-neutral-100",
  hoverSoft: "hover:bg-neutral-100/60",
  topbarBg: "bg-white/80",
  assistantBubble: "border border-neutral-200 bg-neutral-100 text-neutral-900",
  userBubble: "bg-neutral-100 text-neutral-950",
  badgeEnabled: "bg-neutral-200 text-neutral-800",
  badgeDisabled: "bg-neutral-100 text-neutral-500 border border-neutral-200",
  sendBtn: "bg-neutral-900 text-neutral-100",
};

const meta = {
  title: "Chat/CuriosChatIntroScreen",
  component: CuriosChatIntroScreen,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    ui: uiDark,
    isLight: false,
    logoUrl: curiosLogoDarkUrl,
    appName: APP_NAME,
    sessionError: null,
    historyError: null,
    welcomeContent: (
      <CuriosChatWelcomeCard
        appName={APP_NAME}
        isLight={false}
        loggedIn={false}
        supportedProviders={SUPPORTED_PROVIDER_LABELS}
      />
    ),
    composer: (
      <CuriosChatComposer
        ui={uiDark}
        input=""
        onChangeInput={fn()}
        onSend={fn()}
        maskInput={false}
        sessionLoading={false}
        historyLoading={false}
        isSending={false}
        sessionId="sess_123"
        composerRef={{ current: null }}
        layout="inline"
        showSessionId={false}
      />
    ),
    toolbar: (
      <button className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-900">
        Theme
      </button>
    ),
  },
  argTypes: {
    ui: { control: false },
    welcomeContent: { control: false },
    composer: { control: false },
    toolbar: { control: false },
  },
} satisfies Meta<typeof CuriosChatIntroScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dark: Story = {};

export const Light: Story = {
  args: {
    ui: uiLight,
    isLight: true,
    logoUrl: curiosLogoWhiteUrl,
    welcomeContent: (
      <CuriosChatWelcomeCard
        appName={APP_NAME}
        isLight={true}
        loggedIn={false}
        supportedProviders={SUPPORTED_PROVIDER_LABELS}
      />
    ),
    composer: (
      <CuriosChatComposer
        ui={uiLight}
        input=""
        onChangeInput={fn()}
        onSend={fn()}
        maskInput={false}
        sessionLoading={false}
        historyLoading={false}
        isSending={false}
        sessionId="sess_123"
        composerRef={{ current: null }}
        layout="inline"
        showSessionId={false}
      />
    ),
    toolbar: (
      <button className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-100">
        Theme
      </button>
    ),
  },
};
