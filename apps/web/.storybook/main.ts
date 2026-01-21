import type { StorybookConfig } from "@storybook/react-vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
	stories: [
		"../modules/ui/components/**/*.stories.@(js|jsx|ts|tsx)",
		"../modules/shared/components/**/*.stories.@(js|jsx|ts|tsx)",
	],
	addons: [
		"@storybook/addon-essentials",
		"@storybook/addon-a11y",
		"@storybook/addon-themes",
		"@storybook/addon-interactions",
		"@storybook/addon-links",
	],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	docs: { autodocs: "tag" },
	staticDirs: ["../public"],
	typescript: {
		reactDocgen: "react-docgen",
	},
	viteFinal: async (config) => {
		config.plugins = config.plugins || [];
		config.plugins.push(tsconfigPaths());
		return config;
	},
};

export default config;
