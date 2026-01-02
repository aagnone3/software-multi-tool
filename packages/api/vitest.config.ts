import baseConfig from "../../tooling/test/vitest.node";

function withCoverageOverrides(config: Record<string, any>) {
	config.test = {
		...(config.test ?? {}),
		coverage: {
			...(config.test?.coverage ?? {}),
			include: ["lib/**/*.ts"],
			exclude: [
				...(config.test?.coverage?.exclude ?? []),
				"modules/**",
				"orpc/**",
				"index.ts",
			],
		},
	};
	if (Array.isArray(config.projects)) {
		config.projects = config.projects.map((project) => ({
			...project,
			test: {
				...project.test,
				coverage: {
					...(project.test?.coverage ?? {}),
					include: ["lib/**/*.ts"],
					exclude: [
						...(project.test?.coverage?.exclude ?? []),
						"modules/**",
						"orpc/**",
						"index.ts",
					],
				},
			},
		}));
	}
	return config;
}

export default withCoverageOverrides({ ...baseConfig });
