import baseConfig from "../../tooling/test/vitest.node";

function withCoverageOverrides(config: Record<string, any>) {
	config.test = {
		...(config.test ?? {}),
		coverage: {
			...(config.test?.coverage ?? {}),
			include: ["lib/**/*.ts"],
			exclude: [
				...(config.test?.coverage?.exclude ?? []),
				"auth.ts",
				"client.ts",
				"index.ts",
				"plugins/**",
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
						"auth.ts",
						"client.ts",
						"index.ts",
						"plugins/**",
					],
				},
			},
		}));
	}

	return config;
}

export default withCoverageOverrides({ ...baseConfig });
