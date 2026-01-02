import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type WorkspaceResolution = { workspaces: string[]; global: boolean };

const MARKER_FILES = ["pnpm-workspace.yaml", "turbo.json"];

const REPO_ROOT =
	locateRepoRoot(process.env.INIT_CWD) ??
	locateRepoRoot(process.cwd()) ??
	locateRepoRoot(path.join(__dirname, "..", "..", "..", "..")) ??
	path.resolve(path.join(__dirname, "..", "..", "..", ".."));

const GLOBAL_FILES = new Set([
	"biome.json",
	"package.json",
	"pnpm-lock.yaml",
	"pnpm-workspace.yaml",
	"turbo.json",
	"vitest.config.ts",
	".pre-commit-config.yaml",
	"tsconfig.json",
]);

const GLOBAL_PREFIXES = ["tests/", "tooling/test/"];
const WORKSPACE_ROOTS = new Set(["apps", "packages", "tooling", "config"]);

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

function classifyFile(relativeFile: string): WorkspaceResolution {
	const normalized = normalizeFilePath(relativeFile);
	if (!normalized) {
		return { workspaces: [], global: false };
	}

	if (GLOBAL_FILES.has(normalized)) {
		return { workspaces: [], global: true };
	}

	for (const prefix of GLOBAL_PREFIXES) {
		if (normalized.startsWith(prefix)) {
			return { workspaces: [], global: true };
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
	return workspaces.map((workspace) => `--filter=${workspace}...`);
}

function runTests(filters: string[], global: boolean) {
	const baseArgs = [
		"exec",
		"dotenv",
		"-c",
		"--",
		"turbo",
		"run",
		"test",
		"--concurrency=1",
	];
	const args = global ? baseArgs : [...baseArgs, ...filters];

	if (global) {
		console.log(
			"[pre-commit] Running full test suite sequentially (equivalent to `pnpm test -- --runInBand`).",
		);
	} else {
		console.log(
			`[pre-commit] Running tests sequentially for workspaces: ${filters
				.map((filter) =>
					filter.replace(/^--filter=/, "").replace(/\.\.\.$/, ""),
				)
				.join(", ")}`,
		);
	}

	const child = spawnSync("pnpm", args, {
		cwd: REPO_ROOT,
		stdio: "inherit",
	});

	if (typeof child.status === "number") {
		process.exitCode = child.status;
		return;
	}

	if (child.error) {
		console.error("[pre-commit] Failed to execute pnpm test:", child.error);
		process.exitCode = 1;
		return;
	}

	if (child.signal) {
		console.error(
			`[pre-commit] pnpm test terminated by signal ${child.signal}`,
		);
		process.exitCode = 1;
	}
}

export function main(argv: string[]) {
	const { global, workspaces } = resolveImpactedWorkspaces(argv);

	if (global) {
		runTests([], true);
		return;
	}

	if (workspaces.length === 0) {
		console.log(
			"[pre-commit] No impacted workspaces detected. Skipping tests.",
		);
		return;
	}

	const filters = buildTurboFilters(workspaces);
	runTests(filters, false);
}

const modulePathArg = process.argv[1];
if (
	typeof modulePathArg === "string" &&
	import.meta.url === pathToFileURL(modulePathArg).href
) {
	main(process.argv.slice(2));
}
