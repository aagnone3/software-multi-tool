import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

type ParsedOptions = {
	appDir: string;
	environment: string;
	outputFile: string;
	project?: string;
	scope?: string;
	token?: string;
	yes: boolean;
	extraArgs: string[];
};

function readEnv(name: string): string | undefined {
	const value = process.env[name];
	if (value === undefined) {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length === 0 ? undefined : trimmed;
}

const DEFAULT_ENVIRONMENT =
	readEnv("VERCEL_ENVIRONMENT") ??
	readEnv("VERCEL_ENV") ??
	readEnv("NODE_ENV") ??
	"development";

const DEFAULT_APP_DIR = readEnv("VERCEL_APP_DIR") ?? "apps/web";
const DEFAULT_OUTPUT = ".env.local";

function parseArgs(argv: string[]): ParsedOptions {
	const options: ParsedOptions = {
		appDir: DEFAULT_APP_DIR,
		environment: DEFAULT_ENVIRONMENT,
		outputFile: DEFAULT_OUTPUT,
		project:
			readEnv("VERCEL_PROJECT") ??
			readEnv("VERCEL_PROJECT_ID") ??
			readEnv("NEXT_PUBLIC_VERCEL_PROJECT"),
		scope:
			readEnv("VERCEL_SCOPE") ??
			readEnv("VERCEL_ORG_ID") ??
			readEnv("VERCEL_TEAM") ??
			readEnv("VERCEL_TEAM_ID"),
		token: readEnv("VERCEL_TOKEN"),
		yes: true,
		extraArgs: [],
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		switch (arg) {
			case "--environment":
			case "-e": {
				const value = argv[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.environment = value;
				index += 1;
				break;
			}
			case "--output":
			case "-o": {
				const value = argv[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.outputFile = value;
				index += 1;
				break;
			}
			case "--project": {
				const value = argv[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.project = value;
				index += 1;
				break;
			}
			case "--scope": {
				const value = argv[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.scope = value;
				index += 1;
				break;
			}
			case "--token": {
				const value = argv[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.token = value;
				index += 1;
				break;
			}
			case "--app":
			case "--app-dir": {
				const value = argv[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.appDir = value;
				index += 1;
				break;
			}
			case "--no-yes": {
				options.yes = false;
				break;
			}
			case "--yes":
			case "-y": {
				options.yes = true;
				break;
			}
			default: {
				options.extraArgs.push(arg);
			}
		}
	}

	return options;
}

function ensurePnpmAvailable() {
	const result = spawnSync("pnpm", ["--version"], { stdio: "ignore" });
	if (result.status !== 0) {
		throw new Error(
			"pnpm is required to pull environment variables. Install pnpm and try again.",
		);
	}
}

function findWorkspaceRoot(): string {
	let directory = process.cwd();
	while (true) {
		if (
			existsSync(path.join(directory, "pnpm-workspace.yaml")) ||
			existsSync(path.join(directory, ".git"))
		) {
			return directory;
		}

		const parent = path.dirname(directory);
		if (parent === directory) {
			return process.cwd();
		}

		directory = parent;
	}
}

function ensureVercelLinked(
	options: ParsedOptions,
	projectRoot: string,
): boolean {
	const projectConfigPath = path.join(projectRoot, ".vercel", "project.json");
	if (existsSync(projectConfigPath)) {
		return true;
	}

	if (!options.project) {
		console.error(
			"[env:pull] Cannot link to Vercel project: VERCEL_PROJECT is not set.",
		);
		process.exitCode = 1;
		return false;
	}

	if (!options.scope) {
		console.error(
			"[env:pull] Cannot link to Vercel project: VERCEL_SCOPE is not set.",
		);
		process.exitCode = 1;
		return false;
	}

	console.log(
		`[env:pull] Linking workspace to Vercel project ${options.project} (scope: ${options.scope}).`,
	);

	const vercelLinkArgs = [
		"dlx",
		"vercel@latest",
		"link",
		"--yes",
		"--project",
		options.project,
		"--scope",
		options.scope,
	];

	if (options.token) {
		vercelLinkArgs.push("--token", options.token);
	}

	const result = spawnSync("pnpm", vercelLinkArgs, {
		stdio: "inherit",
		cwd: projectRoot,
	});

	if (result.status !== 0) {
		process.exitCode = result.status ?? 1;
		console.error("[env:pull] Failed to link workspace to Vercel project.");
		return false;
	}

	return true;
}

function run() {
	let options: ParsedOptions;

	try {
		options = parseArgs(process.argv.slice(2));
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Unknown argument parsing error.";
		console.error(`[env:pull] ${message}`);
		process.exitCode = 1;
		return;
	}

	ensurePnpmAvailable();

	const workspaceRoot = findWorkspaceRoot();

	const projectRoot = path.isAbsolute(options.appDir)
		? options.appDir
		: path.join(workspaceRoot, options.appDir);

	if (!existsSync(projectRoot)) {
		console.error(
			`[env:pull] The provided app directory "${options.appDir}" does not exist under ${workspaceRoot}.`,
		);
		process.exitCode = 1;
		return;
	}

	if (!ensureVercelLinked(options, projectRoot)) {
		return;
	}

	const resolvedOutputFile = path.isAbsolute(options.outputFile)
		? options.outputFile
		: path.join(projectRoot, options.outputFile);

	const vercelArgs = [
		"env",
		"pull",
		resolvedOutputFile,
		"--environment",
		options.environment,
	];

	if (options.token) {
		vercelArgs.push("--token", options.token);
	}

	if (options.yes) {
		vercelArgs.push("--yes");
	}

	vercelArgs.push(...options.extraArgs);

	console.log(
		`[env:pull] Downloading Vercel env vars to ${resolvedOutputFile} (environment: ${options.environment})`,
	);

	const result = spawnSync("pnpm", ["dlx", "vercel@latest", ...vercelArgs], {
		stdio: "inherit",
		cwd: projectRoot,
	});

	if (result.status !== 0) {
		process.exitCode = result.status ?? 1;
		console.error(
			"[env:pull] Failed to download environment variables from Vercel.",
		);
		return;
	}

	console.log("[env:pull] Environment variables pulled successfully.");
}

run();
