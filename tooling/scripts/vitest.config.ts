import baseConfig from "../test/vitest.node";

const coverageInclude = ["src/testing-metrics-helpers.ts"];
const coverageExclude = [
	"src/create-user.ts",
	"src/linear/**",
	"src/testing-metrics.ts",
];

function withCoverageOverrides(config: Record<string, any>) {
	config.test = {
		...(config.test ?? {}),
		coverage: {
			...(config.test?.coverage ?? {}),
			include: coverageInclude,
			exclude: [
				...(config.test?.coverage?.exclude ?? []),
				...coverageExclude,
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
					include: coverageInclude,
					exclude: [
						...(project.test?.coverage?.exclude ?? []),
						...coverageExclude,
					],
				},
			},
		}));
	}

	return config;
}

export default withCoverageOverrides({ ...baseConfig });
