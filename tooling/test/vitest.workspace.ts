import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getWorkspaceCoverageThresholds } from "./coverage-thresholds";

const workspaceRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"..",
);
const workspaceDir = path.dirname(
	process.env.npm_package_json ?? path.join(workspaceRoot, "package.json"),
);

type Alias = { find: string | RegExp; replacement: string };

const tsconfigAliasEntries: Alias[] = collectTsconfigAliases([
	path.join(workspaceRoot, "tsconfig.json"),
	...findTsconfigFiles(path.join(workspaceRoot, "apps")),
	...findTsconfigFiles(path.join(workspaceRoot, "packages")),
	...findTsconfigFiles(path.join(workspaceRoot, "tooling")),
]);
const setupFiles = [
	path.join(workspaceRoot, "tests/setup/environment.ts"),
	path.join(workspaceRoot, "tests/setup/react.ts"),
].map(toPosix);

const metricsDir = path.join(workspaceDir, "coverage");
const jsonReporterFile = path.join(metricsDir, "vitest-results.json");

try {
	fs.mkdirSync(metricsDir, { recursive: true });
} catch (error) {
	console.warn(
		`[vitest.workspace] Failed to ensure metrics directory at ${metricsDir}: ${error}`,
	);
}

const coverageEnabled = process.env.VITEST_COVERAGE === "1";
const shouldEnforceCoverage =
	coverageEnabled && process.env.VITEST_ENFORCE_THRESHOLDS !== "0";
const workspaceRelativeDir =
	toPosix(path.relative(workspaceRoot, workspaceDir)) || ".";
const coverageThresholds = getWorkspaceCoverageThresholds(workspaceRelativeDir);

type CoverageConfig = {
	enabled: boolean;
	provider: "v8";
	reporter: string[];
	thresholds?: ReturnType<typeof getWorkspaceCoverageThresholds>;
};

type WorkspaceTestConfig = {
	globals: boolean;
	setupFiles: string[];
	environment: "jsdom" | "node";
	include: string[];
	passWithNoTests?: boolean;
	reporters: (string | [string, Record<string, unknown>])[];
	coverage: CoverageConfig;
	name?: string;
};

type WorkspaceConfig = {
	root: string;
	resolve: { alias: Alias[] };
	test: WorkspaceTestConfig;
	projects?: WorkspaceConfig[];
};

const projectTestDefaults: WorkspaceTestConfig = {
	globals: true,
	setupFiles,
	environment: "jsdom",
	include: [
		"**/*.test.{ts,tsx}",
		"**/*.test.ts",
		"**/*.vitest.{ts,tsx}",
		"**/*.vitest.ts",
	],
	reporters: ["default", ["json", { outputFile: jsonReporterFile }]],
	coverage: {
		enabled: coverageEnabled,
		provider: "v8",
		reporter: ["text", "json-summary", "lcov"],
		thresholds: shouldEnforceCoverage ? coverageThresholds : undefined,
	},
};

const shared: WorkspaceConfig = {
	root: workspaceDir,
	resolve: { alias: tsconfigAliasEntries },
	test: {
		...projectTestDefaults,
		passWithNoTests: true,
	},
};

const projects: WorkspaceConfig[] = [
	createProjectConfig("jsdom", { environment: "jsdom" }),
	createProjectConfig("node", {
		environment: "node",
		include: ["**/*.node.test.{ts,tsx}", "**/*.node.test.ts"],
	}),
];

const config = {
	...shared,
	projects,
} satisfies WorkspaceConfig;

export default config;

type TestOverrides = {
	environment: WorkspaceTestConfig["environment"];
	include?: WorkspaceTestConfig["include"];
};

function createProjectConfig(
	name: string,
	config: TestOverrides,
): WorkspaceConfig {
	return {
		...shared,
		test: {
			...projectTestDefaults,
			...config,
			name,
		},
	};
}

function collectTsconfigAliases(tsconfigPaths: string[]): Alias[] {
	const aliases: Alias[] = [];
	for (const configPath of tsconfigPaths) {
		const aliasEntries = readTsconfigAliases(configPath);
		for (const alias of aliasEntries) {
			if (
				alias &&
				!aliases.some(
					(existing) =>
						getAliasKey(existing.find) === getAliasKey(alias.find),
				)
			) {
				aliases.push(alias);
			}
		}
	}
	return aliases;
}

function readTsconfigAliases(configPath: string): Alias[] {
	const config = safeReadJson(configPath);
	if (!config) {
		return [];
	}

	const compilerOptions = config.compilerOptions ?? {};
	const paths = compilerOptions.paths ?? {};
	const baseUrl = compilerOptions.baseUrl ?? ".";
	const directory = path.dirname(configPath);

	return Object.entries(paths).flatMap(([pattern, targets]) => {
		const entries = (
			Array.isArray(targets) ? targets : [targets]
		) as string[];
		return entries
			.map((target) =>
				createAliasEntry(pattern, target, directory, baseUrl),
			)
			.filter((alias): alias is Alias => Boolean(alias));
	});
}

function safeReadJson(filePath: string) {
	try {
		const raw = fs.readFileSync(filePath, "utf8");
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function createAliasEntry(
	pattern: string,
	target: string,
	configDir: string,
	baseUrl: string,
): Alias | undefined {
	const hasWildcard = pattern.endsWith("/*");
	const find = hasWildcard ? pattern.slice(0, -1) : pattern;

	const normalizedTarget = target.replace(/\/\*$/, "");
	const absoluteTarget = path.resolve(configDir, baseUrl, normalizedTarget);
	const replacement = ensureTrailingSlashIfNeeded(
		toPosix(absoluteTarget),
		hasWildcard,
	);

	if (!find || !replacement) {
		return undefined;
	}

	return { find, replacement };
}

function ensureTrailingSlashIfNeeded(
	value: string,
	requireSlash: boolean,
): string {
	if (requireSlash && !value.endsWith("/")) {
		return `${value}/`;
	}
	return value;
}

function toPosix(value: string): string {
	return value.split(path.sep).join(path.posix.sep);
}

function getAliasKey(find: Alias["find"]): string {
	return typeof find === "string" ? find : find.toString();
}

function findTsconfigFiles(root: string, depth = 2): string[] {
	if (depth < 0) {
		return [];
	}

	try {
		const stats = fs.statSync(root);
		if (!stats.isDirectory()) {
			return [];
		}
	} catch {
		return [];
	}

	const results: string[] = [];
	const candidate = path.join(root, "tsconfig.json");
	if (fs.existsSync(candidate)) {
		results.push(candidate);
	}

	if (depth === 0) {
		return results;
	}

	for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
		if (!entry.isDirectory()) {
			continue;
		}

		if (entry.name === "node_modules" || entry.name.startsWith(".")) {
			continue;
		}

		results.push(
			...findTsconfigFiles(path.join(root, entry.name), depth - 1),
		);
	}

	return results;
}
