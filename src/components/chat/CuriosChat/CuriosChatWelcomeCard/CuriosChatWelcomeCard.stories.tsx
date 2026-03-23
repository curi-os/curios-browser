import type { Meta, StoryObj } from "@storybook/react-webpack5";

import CuriosChatWelcomeCard from "./CuriosChatWelcomeCard";
import { APP_NAME } from "../../../../branding";
import { SUPPORTED_PROVIDER_LABELS } from "../../../../utils/getProviderLabel";

const meta = {
  title: "Chat/CuriosChatWelcomeCard",
  component: CuriosChatWelcomeCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    appName: APP_NAME,
    isLight: false,
    loggedIn: false,
    userLabel: undefined,
    supportedProviders: SUPPORTED_PROVIDER_LABELS,
  },
  argTypes: {
    supportedProviders: { control: false },
  },
  decorators: [
    (Story, context) => (
      <div className={context.args.isLight ? "w-[720px] bg-white p-6 text-neutral-900" : "w-[720px] bg-neutral-950 p-6 text-neutral-100"}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CuriosChatWelcomeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOutDark: Story = {};

export const SignedOutLight: Story = {
  args: {
    isLight: true,
  },
};

export const SignedIn: Story = {
  args: {
    loggedIn: true,
    userLabel: "user@example.com",
  },
};
