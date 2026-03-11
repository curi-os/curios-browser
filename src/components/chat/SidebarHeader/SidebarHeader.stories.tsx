import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { fn } from 'storybook/test';

import SidebarHeader from './SidebarHeader';
import { CONTEXTS } from '../shared/contexts';

const meta = {
  title: 'Chat/SidebarHeader',
  component: SidebarHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    onReset: fn(),
    activeContext: CONTEXTS[0]!,
    isLight: false,
  },
} satisfies Meta<typeof SidebarHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MobileWithClose: Story = {
  args: {
    onClose: fn(),
  },
};

export const Light: Story = {
  args: {
    isLight: true,
  },
};
