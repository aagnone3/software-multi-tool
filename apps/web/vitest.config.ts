import path from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "../../tooling/test/vitest.workspace";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Stubs for optional analytics packages that are not installed by default.
const optionalPackageAliases = [
	{
		find: "@vercel/analytics/react",
		replacement: path.join(
			__dirname,
			"tests/stubs/vercel-analytics-react.ts",
		),
	},
	{
		find: "@vercel/analytics",
		replacement: path.join(__dirname, "tests/stubs/vercel-analytics.ts"),
	},
	{
		find: "mixpanel-browser",
		replacement: path.join(__dirname, "tests/stubs/mixpanel-browser.ts"),
	},
	{
		find: "@next/third-parties/google",
		replacement: path.join(
			__dirname,
			"tests/stubs/next-third-parties-google.ts",
		),
	},
];

const coverageInclude = ["app/robots.ts"];
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

function withOptionalPackageAliases(config: Record<string, any>) {
	const existingAliases = config.resolve?.alias ?? [];
	config.resolve = {
		...(config.resolve ?? {}),
		alias: [...existingAliases, ...optionalPackageAliases],
	};

	if (Array.isArray(config.projects)) {
		config.projects = config.projects.map((project) => {
			const projectAliases = project.resolve?.alias ?? [];
			return {
				...project,
				resolve: {
					...(project.resolve ?? {}),
					alias: [...projectAliases, ...optionalPackageAliases],
				},
			};
		});
	}

	return config;
}

export default withOptionalPackageAliases(
	withHappyDomEnvironment(withCoverageOverrides({ ...baseConfig })),
);
