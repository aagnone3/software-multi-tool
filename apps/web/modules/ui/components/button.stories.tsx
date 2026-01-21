import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta = {
	title: "UI/Button",
	component: Button,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"primary",
				"error",
				"outline",
				"secondary",
				"light",
				"ghost",
				"link",
			],
		},
		size: {
			control: "select",
			options: ["sm", "md", "lg", "icon"],
		},
		loading: {
			control: "boolean",
		},
		disabled: {
			control: "boolean",
		},
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "Button",
	},
};

export const Primary: Story = {
	args: {
		variant: "primary",
		children: "Primary",
	},
};

export const Secondary: Story = {
	args: {
		variant: "secondary",
		children: "Secondary",
	},
};

export const Outline: Story = {
	args: {
		variant: "outline",
		children: "Outline",
	},
};

export const Ghost: Story = {
	args: {
		variant: "ghost",
		children: "Ghost",
	},
};

export const Link: Story = {
	args: {
		variant: "link",
		children: "Link",
	},
};

export const ErrorVariant: Story = {
	args: {
		variant: "error",
		children: "Error",
	},
};

export const Light: Story = {
	args: {
		variant: "light",
		children: "Light",
	},
};

export const Loading: Story = {
	args: {
		variant: "primary",
		children: "Loading",
		loading: true,
	},
};

export const Disabled: Story = {
	args: {
		variant: "primary",
		children: "Disabled",
		disabled: true,
	},
};

export const Small: Story = {
	args: {
		size: "sm",
		children: "Small",
	},
};

export const Large: Story = {
	args: {
		size: "lg",
		children: "Large",
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-col gap-4">
			<Button variant="primary">Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="link">Link</Button>
			<Button variant="error">Error</Button>
			<Button variant="light">Light</Button>
		</div>
	),
};

export const AllSizes: Story = {
	render: () => (
		<div className="flex items-center gap-4">
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
		</div>
	),
};
