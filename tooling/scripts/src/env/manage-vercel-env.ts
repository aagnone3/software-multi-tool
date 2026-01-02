import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

type DeploymentTarget = "development" | "preview" | "production";

type ParsedCommand = "list" | "set" | "unset";

type EnvRecord = {
	id: string;
	key: string;
	type: string;
	target: DeploymentTarget[];
	gitBranch?: string | null;
	createdAt: number;
	updatedAt: number;
	value?: string | null;
};

type ParsedOptions = {
	appDir: string;
	decrypt: boolean;
	environment: DeploymentTarget;
	format: "json" | "table";
	project?: string;
	scope?: string;
	token?: string;
	targets: DeploymentTarget[];
};

type CliArgs = {
	command: ParsedCommand;
	options: ParsedOptions;
	positional: string[];
};

const API_BASE_URL = "https://api.vercel.com";
const VALID_TARGETS: DeploymentTarget[] = [
	"development",
	"preview",
	"production",
];

function readEnv(name: string): string | undefined {
	const value = process.env[name];
	if (value === undefined) {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length === 0 ? undefined : trimmed;
}

function parseTarget(name: string): DeploymentTarget {
	const normalized = name.toLowerCase();
	if ((VALID_TARGETS as string[]).includes(normalized)) {
		return normalized as DeploymentTarget;
	}

	throw new Error(
		`Unsupported target "${name}". Valid targets: ${VALID_TARGETS.join(", ")}.`,
	);
}

function parseCommandLine(argv: string[]): CliArgs {
	if (argv.length === 0) {
		throw new Error(
			"Missing command. Supported commands: list, set, unset.",
		);
	}

	const [commandRaw, ...rest] = argv;
	const command = commandRaw as ParsedCommand;

	if (!["list", "set", "unset"].includes(command)) {
		throw new Error(
			`Unsupported command "${commandRaw}". Supported commands: list, set, unset.`,
		);
	}

	const defaultEnvironment =
		readEnv("VERCEL_ENVIRONMENT") ??
		readEnv("VERCEL_ENV") ??
		readEnv("NODE_ENV") ??
		"development";

	const options: ParsedOptions = {
		appDir: readEnv("VERCEL_APP_DIR") ?? "apps/web",
		decrypt: false,
		environment: parseTarget(defaultEnvironment),
		format: "table",
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
		targets: [],
	};

	const positional: string[] = [];

	for (let index = 0; index < rest.length; index += 1) {
		const arg = rest[index];
		switch (arg) {
			case "--": {
				const remaining = rest.slice(index + 1);
				positional.push(...remaining);
				index = rest.length;
				break;
			}
			case "--environment":
			case "-e": {
				const value = rest[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.environment = parseTarget(value);
				index += 1;
				break;
			}
			case "--project": {
				const value = rest[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.project = value;
				index += 1;
				break;
			}
			case "--scope":
			case "--team":
			case "--team-id": {
				const value = rest[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.scope = value;
				index += 1;
				break;
			}
			case "--token": {
				const value = rest[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.token = value;
				index += 1;
				break;
			}
			case "--app":
			case "--app-dir": {
				const value = rest[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.appDir = value;
				index += 1;
				break;
			}
			case "--target": {
				const value = rest[index + 1];
				if (!value) {
					throw new Error(`${arg} option requires a value.`);
				}
				options.targets.push(parseTarget(value));
				index += 1;
				break;
			}
			case "--all-targets": {
				options.targets = [...VALID_TARGETS];
				break;
			}
			case "--decrypt": {
				options.decrypt = true;
				break;
			}
			case "--json": {
				options.format = "json";
				break;
			}
			default: {
				if (arg.startsWith("-")) {
					throw new Error(`Unknown option "${arg}".`);
				}
				positional.push(arg);
			}
		}
	}

	if (options.targets.length === 0) {
		options.targets =
			command === "list" ? [...VALID_TARGETS] : [options.environment];
	}

	return { command, options, positional };
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

async function callVercelAPI<T>(
	method: string,
	pathname: string,
	options: ParsedOptions,
	body?: Record<string, unknown>,
	query?: Record<string, string | undefined>,
): Promise<T> {
	if (!options.project) {
		throw new Error(
			"Missing Vercel project identifier. Set VERCEL_PROJECT or use --project.",
		);
	}

	if (!options.token) {
		throw new Error(
			"Missing Vercel token. Set VERCEL_TOKEN or use --token.",
		);
	}

	const url = new URL(`${API_BASE_URL}${pathname}`);
	if (options.scope) {
		url.searchParams.set("teamId", options.scope);
	}

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined) {
				url.searchParams.set(key, value);
			}
		}
	}

	const response = await fetch(url, {
		method,
		headers: {
			Authorization: `Bearer ${options.token}`,
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!response.ok) {
		let details = "";
		try {
			const errorJson = (await response.json()) as {
				error?: { code?: string; message?: string };
				message?: string;
			};
			if (errorJson.error?.message) {
				details = errorJson.error.message;
			} else if (errorJson.message) {
				details = errorJson.message;
			}
		} catch {
			// ignore JSON parse errors, fall back to status text
		}

		const reason =
			details.length > 0
				? details
				: `${response.status} ${response.statusText}`;
		throw new Error(`Vercel API request failed: ${reason}`);
	}

	return (await response.json()) as T;
}

async function listEnvRecords(options: ParsedOptions): Promise<EnvRecord[]> {
	const project = encodeURIComponent(options.project ?? "");
	const response = await callVercelAPI<{ envs: EnvRecord[] }>(
		"GET",
		`/v10/projects/${project}/env`,
		options,
		undefined,
		options.decrypt ? { decrypt: "true" } : undefined,
	);

	return response.envs;
}

function ensureProjectDir(workspaceRoot: string, appDir: string): string {
	const projectRoot = path.isAbsolute(appDir)
		? appDir
		: path.join(workspaceRoot, appDir);

	if (!existsSync(projectRoot)) {
		throw new Error(
			`App directory "${appDir}" does not exist under workspace ${workspaceRoot}.`,
		);
	}

	const vercelDir = path.join(projectRoot, ".vercel");
	if (!existsSync(vercelDir)) {
		mkdirSync(vercelDir, { recursive: true });
	}

	return projectRoot;
}

async function handleList(options: ParsedOptions) {
	const records = await listEnvRecords(options);
	const targetsFilter = new Set(options.targets);

	const filtered = records.filter((record) =>
		record.target.some((target) => targetsFilter.has(target)),
	);

	if (options.format === "json") {
		console.log(
			JSON.stringify(
				filtered.map((record) => ({
					id: record.id,
					key: record.key,
					target: record.target,
					type: record.type,
					gitBranch: record.gitBranch ?? null,
					createdAt: record.createdAt,
					updatedAt: record.updatedAt,
					value: options.decrypt ? (record.value ?? null) : undefined,
				})),
				null,
				2,
			),
		);
		return;
	}

	if (filtered.length === 0) {
		console.log(
			"No environment variables defined for the selected target(s).",
		);
		return;
	}

	const header = ["Key", "Targets", "Type", "Git Branch", "Updated"];
	console.log(header.join("\t"));
	for (const record of filtered) {
		const line = [
			record.key,
			record.target.join(","),
			record.type,
			record.gitBranch ?? "",
			new Date(record.updatedAt).toISOString(),
		];
		console.log(line.join("\t"));
	}
}

function selectRecordsForTarget(
	records: EnvRecord[],
	key: string,
	target: DeploymentTarget,
): EnvRecord[] {
	return records.filter(
		(record) =>
			record.key === key &&
			record.target.includes(target) &&
			(record.gitBranch === null || record.gitBranch === undefined),
	);
}

async function upsertEnvValue(
	options: ParsedOptions,
	key: string,
	value: string,
	target: DeploymentTarget,
) {
	const records = await listEnvRecords(options);
	const targetRecords = selectRecordsForTarget(records, key, target);
	const project = encodeURIComponent(options.project ?? "");

	if (targetRecords.length === 0) {
		const type = target === "development" ? "plain" : "encrypted";
		await callVercelAPI("POST", `/v10/projects/${project}/env`, options, {
			key,
			target: [target],
			type,
			value,
		});
		console.log(`Created ${target} environment variable ${key}.`);
		return;
	}

	// Update the first record. Vercel stores one record per target when gitBranch is null.
	const record = targetRecords[0];
	await callVercelAPI(
		"PATCH",
		`/v10/projects/${project}/env/${encodeURIComponent(record.id)}`,
		options,
		{ value },
	);
	console.log(`Updated ${target} environment variable ${key}.`);
}

async function removeEnvValue(
	options: ParsedOptions,
	key: string,
	target: DeploymentTarget,
) {
	const records = await listEnvRecords(options);
	const targetRecords = selectRecordsForTarget(records, key, target);

	if (targetRecords.length === 0) {
		console.warn(
			`No environment variable "${key}" defined for ${target}. Skipping.`,
		);
		return;
	}

	const project = encodeURIComponent(options.project ?? "");
	for (const record of targetRecords) {
		await callVercelAPI(
			"DELETE",
			`/v10/projects/${project}/env/${encodeURIComponent(record.id)}`,
			options,
			undefined,
			{ target },
		);
	}

	console.log(`Removed ${target} environment variable ${key}.`);
}

async function run() {
	let parsed: CliArgs;

	try {
		parsed = parseCommandLine(process.argv.slice(2));
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Unknown command processing error.";
		console.error(`[env] ${message}`);
		process.exitCode = 1;
		return;
	}

	const workspaceRoot = findWorkspaceRoot();

	try {
		ensureProjectDir(workspaceRoot, parsed.options.appDir);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to resolve app directory.";
		console.error(`[env] ${message}`);
		process.exitCode = 1;
		return;
	}

	try {
		switch (parsed.command) {
			case "list": {
				await handleList(parsed.options);
				break;
			}
			case "set": {
				const [key, value] = parsed.positional;
				if (!key || !value) {
					throw new Error(
						"env set requires <key> <value>. Example: pnpm env:set API_KEY my-secret",
					);
				}

				for (const target of parsed.options.targets) {
					await upsertEnvValue(parsed.options, key, value, target);
				}
				break;
			}
			case "unset": {
				const [key] = parsed.positional;
				if (!key) {
					throw new Error(
						"env unset requires <key>. Example: pnpm env:unset API_KEY",
					);
				}

				for (const target of parsed.options.targets) {
					await removeEnvValue(parsed.options, key, target);
				}
				break;
			}
			default: {
				throw new Error(
					`Unhandled command ${parsed.command satisfies never}`,
				);
			}
		}
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Unknown error while executing command.";
		console.error(`[env] ${message}`);
		process.exitCode = 1;
	}
}

void run();
