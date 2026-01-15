import baseConfig from "../../tooling/test/vitest.workspace";

const coverageInclude = ["app/robots.ts", "app/api/proxy/**/*.ts"];
const coverageExclude = ["next.config.ts", "middleware.ts", "tests/**"];

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

function withHappyDomEnvironment(config: Record<string, any>) {
	const ensureHappyDom = (testConfig: Record<string, any> | undefined) => {
		if (!testConfig) {
			return testConfig;
		}

		if (testConfig.environment === "jsdom") {
			return {
				...testConfig,
				environment: "happy-dom" as const,
			};
		}

		return testConfig;
	};

	if (config.test) {
		config.test = ensureHappyDom(config.test);
	}

	if (Array.isArray(config.projects)) {
		config.projects = config.projects.map((project) => ({
			...project,
			test: ensureHappyDom(project.test),
		}));
	}

	return config;
}

export default withHappyDomEnvironment(
	withCoverageOverrides({ ...baseConfig }),
);
