import type { Meta, StoryObj } from '@storybook/react';
import { HelloWorld } from './HelloWorld';

const meta: Meta<typeof HelloWorld> = {
  title: 'Example/HelloWorld',
  component: HelloWorld,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'The message to display',
      defaultValue: 'Hello World',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'Hello World',
  },
};

export const CustomMessage: Story = {
  args: {
    message: 'Welcome to Storybook!',
  },
};

export const LongMessage: Story = {
  args: {
    message: 'This is a longer message to test the component',
  },
};