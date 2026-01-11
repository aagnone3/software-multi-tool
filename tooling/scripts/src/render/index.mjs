/**
 * Render CLI helpers
 *
 * Provides command-line operations for managing Render services,
 * deploys, and environment variables.
 *
 * Usage: pnpm --filter @repo/scripts render <resource> <action> [options]
 */

/**
 * @typedef {{ apiKey: string }} RenderConfig
 * @typedef {{ config?: RenderConfig, flags: Record<string, string>, positionals: string[] }} CommandContext
 */

const BASE_URL = "https://api.render.com/v1";

/** @type {Record<string, (ctx: CommandContext) => Promise<void>>} */
const commands = {
	help: handleHelp,
	"services:list": handleServicesList,
	"services:get": handleServicesGet,
	"deploys:list": handleDeploysList,
	"deploys:get": handleDeploysGet,
	"deploys:trigger": handleDeploysTrigger,
	"deploys:cancel": handleDeploysCancel,
	"env:list": handleEnvList,
	"env:get": handleEnvGet,
	"env:set": handleEnvSet,
	"env:delete": handleEnvDelete,
};

async function main() {
	try {
		const { flags, positionals } = parseArgs(process.argv.slice(2));
		const commandParts = positionals.length > 0 ? positionals : ["help"];
		const resource = commandParts[0];
		const action = commandParts[1];
		const commandKey = action
			? `${resource}:${action}`
			: (resource ?? "help");
		const handler = commands[commandKey.toLowerCase()] ?? commands.help;

		const consumedSegments = commandKey.split(":").length;
		const remainingPositionals =
			handler === commands.help
				? []
				: commandParts.slice(consumedSegments);

		if (handler === commands.help) {
			await handler({ flags, positionals: remainingPositionals });
			return;
		}

		const config = getConfig();
		await handler({ config, flags, positionals: remainingPositionals });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`\u001b[31m[render]\u001b[0m ${message}`);
		process.exitCode = 1;
	}
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
	const flags = /** @type {Record<string, string>} */ ({});
	const positionals = [];

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg.startsWith("--")) {
			const withoutPrefix = arg.slice(2);
			if (withoutPrefix.length === 0) {
				continue;
			}

			const [rawKey, explicitValue] = withoutPrefix.split("=", 2);
			const key = rawKey.toLowerCase();

			if (explicitValue !== undefined) {
				flags[key] = explicitValue;
				continue;
			}

			const next = argv[index + 1];
			if (next && !next.startsWith("-")) {
				flags[key] = next;
				index += 1;
			} else {
				flags[key] = "true";
			}
		} else {
			positionals.push(arg);
		}
	}

	return { flags, positionals };
}

/**
 * @returns {RenderConfig}
 */
function getConfig() {
	const apiKey = process.env.RENDER_API_KEY;
	if (!apiKey) {
		throw new Error(
			"Missing RENDER_API_KEY in environment. Add it to .env.local to use the Render CLI helpers.",
		);
	}
	return { apiKey };
}

/**
 * @param {RenderConfig} config
 * @param {string} path
 * @param {RequestInit} [options]
 */
async function apiRequest(config, path, options = {}) {
	const url = `${BASE_URL}${path}`;
	const response = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${config.apiKey}`,
			"Content-Type": "application/json",
			Accept: "application/json",
			...options.headers,
		},
	});

	if (!response.ok) {
		let message = `HTTP ${response.status}`;
		try {
			const body = await response.json();
			message = body.message || body.error || message;
		} catch {
			// Ignore JSON parse errors
		}
		throw new Error(message);
	}

	if (response.status === 204) {
		return undefined;
	}

	const text = await response.text();
	if (!text) {
		return undefined;
	}

	return JSON.parse(text);
}

async function handleHelp() {
	console.log(`Render CLI helpers

Usage:
  pnpm --filter @repo/scripts render <resource> <action> [options]

Resources & actions:
  services list [--name <text>] [--type <type>]     List services (filter by name or type).
  services get --service <id>                        Get service details.

  deploys list --service <id>                        List deploys for a service.
  deploys get --service <id> --deploy <id>           Get deploy details.
  deploys trigger --service <id> [--clear-cache]     Trigger a new deploy.
  deploys cancel --service <id> --deploy <id>        Cancel a running deploy.

  env list --service <id>                            List environment variables.
  env get --service <id> --key <name>                Get an environment variable.
  env set --service <id> --key <name> --value <val>  Set an environment variable.
  env delete --service <id> --key <name>             Delete an environment variable.

Service types: web_service, private_service, background_worker, static_site, cron_job

Examples:
  pnpm --filter @repo/scripts render services list
  pnpm --filter @repo/scripts render services list --type web_service
  pnpm --filter @repo/scripts render services get --service srv-xxx
  pnpm --filter @repo/scripts render deploys trigger --service srv-xxx
  pnpm --filter @repo/scripts render deploys trigger --service srv-xxx --clear-cache
  pnpm --filter @repo/scripts render env list --service srv-xxx
  pnpm --filter @repo/scripts render env set --service srv-xxx --key API_URL --value https://api.example.com
`);
}

// ============================================================================
// Service Commands
// ============================================================================

/** @param {CommandContext} context */
async function handleServicesList(context) {
	const { config, flags } = context;
	const params = new URLSearchParams();

	if (flags.name) {
		params.set("name", flags.name);
	}
	if (flags.type) {
		params.set("type", flags.type);
	}
	if (flags.limit) {
		params.set("limit", flags.limit);
	}

	const queryString = params.toString();
	const path = queryString ? `/services?${queryString}` : "/services";
	const response = await apiRequest(config, path);

	if (!response || response.length === 0) {
		console.log("No services found.");
		return;
	}

	console.log("ID\tTYPE\tNAME\tSTATUS");
	console.log("--\t----\t----\t------");
	for (const item of response) {
		const service = item.service;
		const suspended =
			service.suspended === "suspended" ? " (suspended)" : "";
		console.log(
			`${service.id}\t${service.type}\t${service.name}${suspended}`,
		);
	}
}

/** @param {CommandContext} context */
async function handleServicesGet(context) {
	const { config, flags } = context;
	const serviceId = requireFlag(flags, "service");

	const response = await apiRequest(config, `/services/${serviceId}`);
	const service = response.service;

	console.log(`Service: ${service.name}`);
	console.log(`ID: ${service.id}`);
	console.log(`Type: ${service.type}`);
	console.log(`Environment: ${service.env}`);
	console.log(`Branch: ${service.branch}`);
	console.log(`Auto Deploy: ${service.autoDeploy}`);
	console.log(`Suspended: ${service.suspended}`);
	console.log(`Dashboard: ${service.dashboardUrl}`);

	if (service.serviceDetails?.url) {
		console.log(`URL: ${service.serviceDetails.url}`);
	}
	if (service.serviceDetails?.region) {
		console.log(`Region: ${service.serviceDetails.region}`);
	}
	if (service.serviceDetails?.plan) {
		console.log(`Plan: ${service.serviceDetails.plan}`);
	}
}

// ============================================================================
// Deploy Commands
// ============================================================================

/** @param {CommandContext} context */
async function handleDeploysList(context) {
	const { config, flags } = context;
	const serviceId = requireFlag(flags, "service");

	const response = await apiRequest(config, `/services/${serviceId}/deploys`);

	if (!response || response.length === 0) {
		console.log("No deploys found.");
		return;
	}

	console.log("ID\tSTATUS\tTRIGGER\tCREATED");
	console.log("--\t------\t-------\t-------");
	for (const item of response) {
		const deploy = item.deploy;
		const created = new Date(deploy.createdAt).toLocaleString();
		console.log(
			`${deploy.id}\t${deploy.status}\t${deploy.trigger}\t${created}`,
		);
	}
}

/** @param {CommandContext} context */
async function handleDeploysGet(context) {
	const { config, flags } = context;
	const serviceId = requireFlag(flags, "service");
	const deployId = requireFlag(flags, "deploy");

	const response = await apiRequest(
		config,
		`/services/${serviceId}/deploys/${deployId}`,
	);
	const deploy = response.deploy;

	console.log(`Deploy ID: ${deploy.id}`);
	console.log(`Status: ${deploy.status}`);
	console.log(`Trigger: ${deploy.trigger}`);
	console.log(`Created: ${new Date(deploy.createdAt).toLocaleString()}`);
	if (deploy.finishedAt) {
		console.log(
			`Finished: ${new Date(deploy.finishedAt).toLocaleString()}`,
		);
	}
	if (deploy.commit) {
		console.log(`Commit: ${deploy.commit.id}`);
		console.log(`Message: ${deploy.commit.message}`);
	}
}

/** @param {CommandContext} context */
async function handleDeploysTrigger(context) {
	const { config, flags } = context;
	const serviceId = requireFlag(flags, "service");
	const clearCache = Object.hasOwn(flags, "clear-cache");

	const body = clearCache ? { clearCache: "clear" } : {};
	const response = await apiRequest(
		config,
		`/services/${serviceId}/deploys`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
	const deploy = response.deploy;

	console.log(`Triggered deploy ${deploy.id}`);
	console.log(`Status: ${deploy.status}`);
	console.log(`Trigger: ${deploy.trigger}`);
	if (clearCache) {
		console.log("Cache: cleared");
	}
}

/** @param {CommandContext} context */
async function handleDeploysCancel(context) {
	const { config, flags } = context;
	const serviceId = requireFlag(flags, "service");
	const deployId = requireFlag(flags, "deploy");

	const response = await apiRequest(
		config,
		`/services/${serviceId}/deploys/${deployId}/cancel`,
		{ method: "POST" },
	);
	const deploy = response.deploy;

	console.log(`Cancelled deploy ${deploy.id}`);
	console.log(`Status: ${deploy.status}`);
}

// ============================================================================
// Environment Variable Commands
// ============================================================================

/** @param {CommandContext} context */
async function handleEnvList(context) {
	const { config, flags } = context;
	const serviceId = requireFlag(flags, "service");

	const response = await apiRequest(
		config,
		`/services/${serviceId}/env-vars`,
	);

	if (!response || response.length === 0) {
		console.log("No environment variables found.");
		return;
	}

	console.log("KEY\tVALUE");
	console.log("---\t-----");
	for (const item of response) {
		const envVar = item.envVar;
		const value = envVar.value ?? "[secret]";
		const displayValue =
			value.length > 50 ? `${value.slice(0, 47)}...` : value;
		console.log(`${envVar.key}\t${displayValue}`);
	}
}

/** @param {CommandContext} context */
async function handleEnvGet(context) {
	const { config, flags } = context;
	const serviceId = requireFlag(flags, "service");
	const key = requireFlag(flags, "key");

	const response = await apiRequest(
		config,
		`/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
	);
	const envVar = response.envVar;

	console.log(`Key: ${envVar.key}`);
	console.log(`Value: ${envVar.value ?? "[secret]"}`);
}

/** @param {CommandContext} context */
async function handleEnvSet(context) {
	const { config, flags } = context;
	const serviceId = requireFlag(flags, "service");
	const key = requireFlag(flags, "key");
	const value = requireFlag(flags, "value");

	await apiRequest(
		config,
		`/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
		{
			method: "PUT",
			body: JSON.stringify({ value }),
		},
	);

	console.log(`Set environment variable "${key}" on service ${serviceId}`);
}

/** @param {CommandContext} context */
async function handleEnvDelete(context) {
	const { config, flags } = context;
	const serviceId = requireFlag(flags, "service");
	const key = requireFlag(flags, "key");

	await apiRequest(
		config,
		`/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
		{ method: "DELETE" },
	);

	console.log(
		`Deleted environment variable "${key}" from service ${serviceId}`,
	);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * @param {Record<string, string>} flags
 * @param {string} key
 */
function requireFlag(flags, key) {
	const value = flags[key.toLowerCase()];
	if (!value) {
		throw new Error(`Missing required flag "--${key}".`);
	}
	return value;
}

void main();
