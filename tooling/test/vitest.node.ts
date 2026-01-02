import baseConfig from "./vitest.workspace";

const { projects: _projects, ...sharedConfig } = baseConfig;

export default {
	...sharedConfig,
	test: {
		...sharedConfig.test,
		environment: "node" as const,
	},
};
