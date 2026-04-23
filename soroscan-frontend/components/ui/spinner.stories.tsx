import type { Meta, StoryObj } from "@storybook/react"
import { Spinner } from "./spinner"

const meta = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "error"],
    },
    size: {
      control: "select",
      options: ["default", "mini", "large"],
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default",
    size: "default",
  },
}

export const Mini: Story = {
  args: {
    size: "mini",
  },
}

export const Large: Story = {
  args: {
    size: "large",
  },
}

export const Colors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Spinner variant="default" />
      <Spinner variant="success" />
      <Spinner variant="warning" />
      <Spinner variant="error" />
    </div>
  ),
}

export const CustomSize: Story = {
  args: {
    className: "size-16 border-4 text-purple-500",
  },
}