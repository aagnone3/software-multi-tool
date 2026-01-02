import baseConfig from "../../tooling/test/vitest.node";

const coverageInclude = ["lib/**/*.ts"];
const coverageExclude = ["index.ts"];

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
