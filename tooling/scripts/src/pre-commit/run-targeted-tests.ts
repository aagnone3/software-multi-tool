import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type WorkspaceResolution = { workspaces: string[]; global: boolean };

type WorkspaceTestCommand = {
	command: string;
	args: string[];
	description: string;
};

type RootPackageJsonImpact = {
	workspaces: string[];
	global: boolean;
	reason:
		| "non-package-json"
		| "package-json-read-failed"
		| "package-json-global"
		| "package-json-scripts-only";
};

const MARKER_FILES = ["pnpm-workspace.yaml", "turbo.json"];

const REPO_ROOT =
	locateRepoRoot(process.env.INIT_CWD) ??
	locateRepoRoot(process.cwd()) ??
	locateRepoRoot(path.join(__dirname, "..", "..", "..", "..")) ??
	path.resolve(path.join(__dirname, "..", "..", "..", ".."));

const GLOBAL_FILES = new Set([
	"biome.json",
	"pnpm-lock.yaml",
	"pnpm-workspace.yaml",
	"turbo.json",
	"vitest.config.ts",
	".pre-commit-config.yaml",
	"tsconfig.json",
]);

const GLOBAL_PREFIXES = ["tests/", "tooling/test/"];
const NO_TEST_PREFIXES = ["apps/web/.env.local.example"];
const WORKSPACE_ROOTS = new Set(["apps", "packages", "tooling", "config"]);
const WORKSPACE_PATH_OVERRIDES: Array<{ prefix: string; workspace: string }> = [
	{
		prefix: "packages/database/scripts/",
		workspace: "@repo/scripts",
	},
];
const ROOT_PACKAGE_JSON_SCOPED_SCRIPT_PATTERNS = [
	"@repo/scripts",
	"./tooling/scripts/",
	"tooling/scripts/",
];
const ROOT_PACKAGE_JSON_ALLOWED_TOP_LEVEL_KEYS = new Set([
	"scripts",
	"engines",
]);

const packageCache = new Map<string, string | null>();

const toPosix = (value: string) => value.replace(/\\/g, "/");

function locateRepoRoot(start: string | undefined): string | null {
	if (!start) {
		return null;
	}

	let current = path.resolve(start);
	while (true) {
		for (const marker of MARKER_FILES) {
			if (fs.existsSync(path.join(current, marker))) {
				return current;
			}
		}

		const parent = path.dirname(current);
		if (parent === current) {
			return null;
		}
		current = parent;
	}
}

function readPackageName(directory: string): string | null {
	if (packageCache.has(directory)) {
		return packageCache.get(directory) ?? null;
	}

	const packageJsonPath = path.join(directory, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		packageCache.set(directory, null);
		return null;
	}

	try {
		const contents = fs.readFileSync(packageJsonPath, "utf8");
		const parsed = JSON.parse(contents);
		const name = typeof parsed?.name === "string" ? parsed.name.trim() : "";
		if (name.length > 0) {
			packageCache.set(directory, name);
			return name;
		}
	} catch (error) {
		console.warn(
			`[pre-commit] Failed to parse ${path.relative(
				REPO_ROOT,
				packageJsonPath,
			)}:`,
			error,
		);
	}

	packageCache.set(directory, null);
	return null;
}

function normalizeFilePath(file: string): string | null {
	if (!file || file.startsWith("--")) {
		return null;
	}

	const absolute = path.isAbsolute(file) ? file : path.join(REPO_ROOT, file);
	const relative = path.relative(REPO_ROOT, absolute);
	if (relative.startsWith("..")) {
		return null;
	}

	const normalized = toPosix(relative);
	return normalized === "." ? null : normalized;
}

function findWorkspaceName(absoluteFilePath: string): string | null {
	const stat = tryStat(absoluteFilePath);
	let current = stat?.isDirectory()
		? absoluteFilePath
		: path.dirname(absoluteFilePath);

	while (true) {
		if (current === REPO_ROOT) {
			return null;
		}

		const packageName = readPackageName(current);
		if (packageName) {
			return packageName;
		}

		const parent = path.dirname(current);
		if (parent === current) {
			return null;
		}
		current = parent;
	}
}

function tryStat(target: string) {
	try {
		return fs.statSync(target);
	} catch {
		return undefined;
	}
}

function getIndentDepth(indent: string): number {
	let depth = 0;
	let pendingSpaces = 0;

	for (const char of indent) {
		if (char === "\t") {
			depth += 1;
			pendingSpaces = 0;
			continue;
		}

		if (char === " ") {
			pendingSpaces += 1;
			if (pendingSpaces === 2) {
				depth += 1;
				pendingSpaces = 0;
			}
		}
	}

	return depth;
}

function extractChangedTopLevelPackageJsonKeys(diffText: string): string[] {
	const changedKeys = new Set<string>();
	let activeTopLevelKey: string | null = null;

	for (const line of diffText.split("\n")) {
		if (
			line.startsWith("diff --git") ||
			line.startsWith("index ") ||
			line.startsWith("---") ||
			line.startsWith("+++") ||
			line.startsWith("@@")
		) {
			continue;
		}

		const prefix = line[0];
		if (!["+", "-", " "].includes(prefix)) {
			continue;
		}

		const content = line.slice(1);
		const keyMatch = content.match(/^(\s*)"([^"]+)":/);
		if (keyMatch) {
			const keyDepth = getIndentDepth(keyMatch[1]);
			if (keyDepth === 1) {
				activeTopLevelKey = keyMatch[2];
				if (prefix !== " ") {
					changedKeys.add(keyMatch[2]);
				}
				continue;
			}
		}

		if (prefix !== " " && activeTopLevelKey) {
			changedKeys.add(activeTopLevelKey);
		}
	}

	return Array.from(changedKeys).sort();
}

export function resolveRootPackageJsonImpact(
	diffText: string,
): RootPackageJsonImpact {
	if (!diffText.trim()) {
		return {
			global: true,
			workspaces: [],
			reason: "package-json-read-failed",
		};
	}

	const changedTopLevelKeys = extractChangedTopLevelPackageJsonKeys(diffText);
	if (
		changedTopLevelKeys.length === 0 ||
		changedTopLevelKeys.some(
			(key) => !ROOT_PACKAGE_JSON_ALLOWED_TOP_LEVEL_KEYS.has(key),
		)
	) {
		return { global: true, workspaces: [], reason: "package-json-global" };
	}

	try {
		const packageJsonPath = path.join(REPO_ROOT, "package.json");
		const parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
			scripts?: Record<string, string>;
		};
		const scripts = parsed.scripts ?? {};
		const changedScriptNames = Array.from(
			diffText.matchAll(/^[+-]\s+"([^"]+)":\s*".*"/gm),
		)
			.map((match) => match[1])
			.filter(
				(name) =>
					name !== "scripts" &&
					name !== "engines" &&
					Object.hasOwn(scripts, name),
			);

		if (
			changedScriptNames.length === 0 ||
			changedScriptNames.every((name) => {
				const script = scripts[name];
				return (
					typeof script === "string" &&
					ROOT_PACKAGE_JSON_SCOPED_SCRIPT_PATTERNS.some((pattern) =>
						script.includes(pattern),
					)
				);
			})
		) {
			return {
				global: false,
				workspaces: ["@repo/scripts"],
				reason: "package-json-scripts-only",
			};
		}
	} catch {
		return {
			global: true,
			workspaces: [],
			reason: "package-json-read-failed",
		};
	}

	return { global: true, workspaces: [], reason: "package-json-global" };
}

function classifyRootPackageJson(): WorkspaceResolution {
	const diff = spawnSync("git", ["diff", "--cached", "--", "package.json"], {
		cwd: REPO_ROOT,
		encoding: "utf8",
	});

	if (diff.status !== 0 || typeof diff.stdout !== "string") {
		return { workspaces: [], global: true };
	}

	const impact = resolveRootPackageJsonImpact(diff.stdout);
	return { workspaces: impact.workspaces, global: impact.global };
}

function classifyFile(relativeFile: string): WorkspaceResolution {
	const normalized = normalizeFilePath(relativeFile);
	if (!normalized) {
		return { workspaces: [], global: false };
	}

	if (normalized === "package.json") {
		return classifyRootPackageJson();
	}

	if (GLOBAL_FILES.has(normalized)) {
		return { workspaces: [], global: true };
	}

	for (const prefix of GLOBAL_PREFIXES) {
		if (normalized.startsWith(prefix)) {
			return { workspaces: [], global: true };
		}
	}

	for (const prefix of NO_TEST_PREFIXES) {
		if (normalized.startsWith(prefix)) {
			return { workspaces: [], global: false };
		}
	}

	for (const override of WORKSPACE_PATH_OVERRIDES) {
		if (normalized.startsWith(override.prefix)) {
			return { workspaces: [override.workspace], global: false };
		}
	}

	const segments = normalized.split("/");
	const topLevel = segments[0];

	if (!topLevel || !WORKSPACE_ROOTS.has(topLevel)) {
		return { workspaces: [], global: false };
	}

	const workspaceName = findWorkspaceName(path.join(REPO_ROOT, normalized));
	if (!workspaceName) {
		return { workspaces: [], global: true };
	}

	return { workspaces: [workspaceName], global: false };
}

export function resolveImpactedWorkspaces(files: string[]) {
	const workspaces = new Set<string>();
	let global = false;

	for (const file of files) {
		const result = classifyFile(file);
		if (result.global) {
			global = true;
			break;
		}

		for (const workspace of result.workspaces) {
			workspaces.add(workspace);
		}
	}

	return {
		global,
		workspaces: Array.from(workspaces).sort(),
	};
}

export function buildTurboFilters(workspaces: string[]): string[] {
	return workspaces.map((workspace) => `--filter=${workspace}`);
}

export function shouldPrepareDatabase(
	global: boolean,
	workspaces: string[],
): boolean {
	return global || workspaces.includes("@repo/database");
}

function prepareDatabaseIfNeeded(global: boolean, workspaces: string[]) {
	if (!shouldPrepareDatabase(global, workspaces)) {
		return true;
	}

	console.log(
		"[pre-commit] Preparing Prisma client for @repo/database before tests...",
	);
	const child = spawnSync(
		"pnpm",
		["--filter", "@repo/database", "generate"],
		{
			cwd: REPO_ROOT,
			stdio: "inherit",
		},
	);

	if (typeof child.status === "number") {
		if (child.status === 0) {
			return true;
		}
		process.exitCode = child.status;
		return false;
	}

	if (child.error) {
		console.error(
			"[pre-commit] Failed to generate Prisma client for @repo/database:",
			child.error,
		);
		process.exitCode = 1;
		return false;
	}

	if (child.signal) {
		console.error(
			`[pre-commit] Prisma client generation terminated by signal ${child.signal}`,
		);
		process.exitCode = 1;
		return false;
	}

	return false;
}

function collectDatabaseUnitTestTargets(files: string[]): string[] {
	const databaseFiles = files
		.map((file) => normalizeFilePath(file))
		.filter(
			(file): file is string =>
				typeof file === "string" &&
				file.startsWith("packages/database/"),
		);

	if (databaseFiles.length === 0) {
		return [];
	}

	if (
		databaseFiles.some(
			(file) =>
				!file.startsWith("packages/database/tests/") ||
				file.endsWith(".integration.test.ts"),
		)
	) {
		return [];
	}

	const targets = new Set<string>();

	for (const file of databaseFiles) {
		const relative = file.replace(/^packages\/database\//, "");
		if (relative.endsWith(".test.ts")) {
			targets.add(relative);
			continue;
		}

		if (relative.endsWith(".ts")) {
			const siblingTest = relative.replace(/\.ts$/, ".test.ts");
			if (
				fs.existsSync(
					path.join(REPO_ROOT, "packages/database", siblingTest),
				)
			) {
				targets.add(siblingTest);
			}
		}
	}

	return Array.from(targets).sort();
}

export function resolveWorkspaceTestCommand(
	workspace: string,
	files: string[],
): WorkspaceTestCommand {
	if (workspace === "@repo/database") {
		const unitTargets = collectDatabaseUnitTestTargets(files);
		if (unitTargets.length > 0) {
			return {
				command: "pnpm",
				args: [
					"--filter",
					"@repo/database",
					"exec",
					"vitest",
					"run",
					"--config",
					"./vitest.config.ts",
					...unitTargets,
				],
				description: `pnpm --filter @repo/database exec vitest run --config ./vitest.config.ts ${unitTargets.join(" ")}`,
			};
		}
	}

	return {
		command: "pnpm",
		args: ["--filter", workspace, "test"],
		description: `pnpm --filter ${workspace} test`,
	};
}

function runTests(
	files: string[],
	filters: string[],
	global: boolean,
	workspaces: string[],
) {
	if (!prepareDatabaseIfNeeded(global, workspaces)) {
		return;
	}

	if (global) {
		console.log(
			"[pre-commit] Running full test suite sequentially (equivalent to `pnpm test -- --runInBand`).",
		);

		const child = spawnSync(
			"pnpm",
			[
				"exec",
				"dotenv",
				"-c",
				"-e",
				"apps/web/.env.local",
				"--",
				"turbo",
				"run",
				"test",
				"--concurrency=1",
			],
			{
				cwd: REPO_ROOT,
				stdio: "inherit",
			},
		);

		if (typeof child.status === "number") {
			process.exitCode = child.status;
			return;
		}

		if (child.error) {
			console.error(
				"[pre-commit] Failed to execute pnpm test:",
				child.error,
			);
			process.exitCode = 1;
			return;
		}

		if (child.signal) {
			console.error(
				`[pre-commit] pnpm test terminated by signal ${child.signal}`,
			);
			process.exitCode = 1;
		}

		return;
	}

	console.log(
		`[pre-commit] Running tests for workspaces: ${filters
			.map((filter) => filter.replace(/^--filter=/, ""))
			.join(", ")}`,
	);

	for (const workspace of workspaces) {
		const testCommand = resolveWorkspaceTestCommand(workspace, files);
		console.log(`[pre-commit] Executing ${testCommand.description}`);
		const child = spawnSync(testCommand.command, testCommand.args, {
			cwd: REPO_ROOT,
			stdio: "inherit",
		});

		if (typeof child.status === "number") {
			if (child.status !== 0) {
				process.exitCode = child.status;
			}
			if (child.status === 0) {
				continue;
			}
			return;
		}

		if (child.error) {
			console.error(
				`[pre-commit] Failed to execute pnpm test for ${workspace}:`,
				child.error,
			);
			process.exitCode = 1;
			return;
		}

		if (child.signal) {
			console.error(
				`[pre-commit] pnpm test for ${workspace} terminated by signal ${child.signal}`,
			);
			process.exitCode = 1;
			return;
		}
	}
}

export function main(argv: string[]) {
	const { global, workspaces } = resolveImpactedWorkspaces(argv);

	if (global) {
		runTests(argv, [], true, workspaces);
		return;
	}

	if (workspaces.length === 0) {
		console.log(
			"[pre-commit] No impacted workspaces detected. Skipping tests.",
		);
		return;
	}

	const filters = buildTurboFilters(workspaces);
	runTests(argv, filters, false, workspaces);
}

const modulePathArg = process.argv[1];
if (
	typeof modulePathArg === "string" &&
	import.meta.url === pathToFileURL(modulePathArg).href
) {
	main(process.argv.slice(2));
}
