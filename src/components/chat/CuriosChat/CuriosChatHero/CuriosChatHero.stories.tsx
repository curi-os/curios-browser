import type { Meta, StoryObj } from "@storybook/react-webpack5";

import CuriosChatHero from "./CuriosChatHero";
import curiosLogoDarkUrl from "../../../../images/curios-logo-dark.png";
import curiosLogoWhiteUrl from "../../../../images/curios-logo-white.png";
import { APP_NAME } from "../../../../branding";

const meta = {
  title: "Chat/CuriosChatHero",
  component: CuriosChatHero,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    appName: APP_NAME,
    isLight: false,
    logoUrl: curiosLogoDarkUrl,
  },
} satisfies Meta<typeof CuriosChatHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dark: Story = {};

export const Light: Story = {
  args: {
    isLight: true,
    logoUrl: curiosLogoWhiteUrl,
  },
};
