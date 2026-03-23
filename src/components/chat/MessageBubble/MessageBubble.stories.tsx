import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MessageBubble from './MessageBubble';
import type { Ui } from '../shared/types';

const uiDark: Ui = {
  app: 'bg-neutral-950 text-neutral-100',
  border: 'border-neutral-800',
  panel: 'bg-neutral-950',
  card: 'bg-neutral-900',
  hoverPanel: 'hover:bg-neutral-900',
  hoverSoft: 'hover:bg-neutral-900/60',
  topbarBg: 'bg-neutral-950/80',
  assistantBubble: 'border border-neutral-800 bg-neutral-900 text-neutral-100',
  userBubble: 'bg-neutral-100 text-neutral-950',
  badgeEnabled: 'bg-neutral-800 text-neutral-200',
  badgeDisabled: 'bg-neutral-900 text-neutral-500 border border-neutral-800',
  sendBtn: 'bg-neutral-100 text-neutral-900',
};

const meta = {
  title: 'Chat/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    ui: uiDark,
    role: 'assistant',
    text: 'Hello! This is an assistant message.',
  },
  argTypes: {
    ui: { control: false },
    text: { control: 'text' },
  },
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Assistant: Story = {};

export const User: Story = {
  args: {
    role: 'user',
    text: 'This is a user message.',
  },
};

export const SystemCentered: Story = {
  args: {
    role: 'system',
    text: 'System notice: something happened.',
  },
};

export const Secret: Story = {
  args: {
    role: 'user',
    text: 'super secret value',
    messageType: 'secret',
  },
};

export const AssistantHtml: Story = {
  args: {
    role: 'assistant',
    text: 'Try <strong>Change provider</strong><br />Then open <code>Use Browser app</code>.',
  },
};

export const UserHtmlLiteral: Story = {
  args: {
    role: 'user',
    text: '<div class=\"example\">literal html should stay visible</div>',
  },
};
