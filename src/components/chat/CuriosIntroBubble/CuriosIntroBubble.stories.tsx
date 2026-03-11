import type { Meta, StoryObj } from '@storybook/react-webpack5';

import CuriosIntroBubble from './CuriosIntroBubble';

const meta = {
  title: 'Chat/CuriosIntroBubble',
  component: CuriosIntroBubble,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    isLight: false,
  },
} satisfies Meta<typeof CuriosIntroBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dark: Story = {};

export const Light: Story = {
  args: {
    isLight: true,
  },
};
