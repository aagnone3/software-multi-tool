#!/usr/bin/env node

/**
 * Preview Environment Sync
 *
 * Orchestrates environment variable synchronization between
 * Neon and Vercel preview environments.
 *
 * Usage:
 *   pnpm --filter @repo/scripts preview-sync wait --pr <number> [--branch <name>]
 *   pnpm --filter @repo/scripts preview-sync sync --pr <number> [--branch <name>]
 *   pnpm --filter @repo/scripts preview-sync run --pr <number> [--branch <name>] [--sha <commit>]
 *
 * Required environment variables:
 *   NEON_API_KEY     - Neon Management API key
 *   NEON_PROJECT_ID  - Neon project ID
 *   VERCEL_TOKEN     - Vercel API token
 *   VERCEL_PROJECT   - Vercel project ID
 *   VERCEL_SCOPE     - Vercel team/scope ID
 */

import { createNeonClientFromEnv } from "../neon/api-client.mjs";

// ============================================================================
// Configuration
// ============================================================================

const VERCEL_API_BASE = "https://api.vercel.com";

// ============================================================================
// Utility Functions
// ============================================================================

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
	const args = {
		command: argv[0],
		prNumber: null,
		branch: null,
		sha: null,
		timeout: 600, // 10 minutes default for Vercel
		neonTimeout: 900, // 15 minutes for Neon (branch provisioning)
	};

	for (let i = 1; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case "--pr":
				args.prNumber = Number.parseInt(argv[++i], 10);
				break;
			case "--branch":
				args.branch = argv[++i];
				break;
			case "--sha":
				args.sha = argv[++i];
				break;
			case "--timeout":
				args.timeout = Number.parseInt(argv[++i], 10);
				break;
			case "--neon-timeout":
				args.neonTimeout = Number.parseInt(argv[++i], 10);
				break;
			// Legacy flag support during migration
			case "--supabase-timeout":
				args.neonTimeout = Number.parseInt(argv[++i], 10);
				break;
		}
	}

	return args;
}

/**
 * Retry a function with exponential backoff for transient errors
 */
async function withRetry(fn, options = {}) {
	const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;

	let lastError;
	let delay = initialDelay;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			const isRetryable =
				error.message?.includes("fetch failed") ||
				error.message?.includes("network") ||
				error.message?.includes("ECONNRESET") ||
				error.message?.includes("429") ||
				error.message?.includes("500") ||
				error.message?.includes("502") ||
				error.message?.includes("503") ||
				error.message?.includes("504");

			if (!isRetryable || attempt === maxRetries) {
				throw error;
			}

			console.log(
				`  Retry ${attempt}/${maxRetries} after error: ${error.message}`,
			);
			await sleep(delay);
			delay = Math.min(delay * 2, maxDelay);
		}
	}

	throw lastError;
}

// ============================================================================
// Vercel API Functions
// ============================================================================

async function vercelRequest(path, options = {}, query = {}) {
	const token = process.env.VERCEL_TOKEN;
	const scope = process.env.VERCEL_SCOPE;

	if (!token) {
		throw new Error("VERCEL_TOKEN environment variable is required");
	}

	return withRetry(async () => {
		const url = new URL(`${VERCEL_API_BASE}${path}`);
		if (scope) {
			url.searchParams.set("teamId", scope);
		}
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined) {
				url.searchParams.set(key, value);
			}
		}

		const response = await fetch(url, {
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		if (!response.ok) {
			let errorMessage = `Vercel API error: ${response.status} ${response.statusText}`;
			try {
				const body = await response.json();
				if (body.error?.message) {
					errorMessage = `Vercel API error: ${body.error.message}`;
				}
			} catch {
				// Ignore JSON parse errors
			}
			throw new Error(errorMessage);
		}

		return response.json();
	});
}

async function findVercelPreviewDeployment(prNumber, branch = null) {
	const projectId = process.env.VERCEL_PROJECT;
	if (!projectId) {
		throw new Error("VERCEL_PROJECT environment variable is required");
	}

	const response = await vercelRequest(
		"/v6/deployments",
		{},
		{
			projectId,
			limit: "50",
			state: "READY",
		},
	);

	for (const deployment of response.deployments || []) {
		if (deployment.meta?.githubPrId === String(prNumber)) {
			return deployment;
		}

		if (deployment.url?.includes(`-pr-${prNumber}-`)) {
			return deployment;
		}

		if (branch && deployment.meta?.githubCommitRef === branch) {
			return deployment;
		}
	}

	return null;
}

async function waitForVercelPreview(prNumber, options = {}) {
	const {
		timeoutMs = 600000,
		initialDelay = 5000,
		maxDelay = 30000,
		backoffFactor = 1.5,
		branch = null,
	} = options;

	const startTime = Date.now();
	let delay = initialDelay;
	let attempt = 0;

	while (Date.now() - startTime < timeoutMs) {
		attempt++;
		const deployment = await findVercelPreviewDeployment(prNumber, branch);

		if (deployment && deployment.state === "READY") {
			const url = `https://${deployment.url}`;
			console.log(`[Vercel] Preview deployment found: ${url}`);
			return { deployment, url };
		}

		const status = deployment ? deployment.state : "not found";
		const elapsed = Math.round((Date.now() - startTime) / 1000);
		const remaining = Math.round(
			(timeoutMs - (Date.now() - startTime)) / 1000,
		);
		console.log(
			`[Vercel] Attempt ${attempt}: Status "${status}" (${elapsed}s elapsed, ${remaining}s remaining)`,
		);

		await sleep(delay);
		delay = Math.min(delay * backoffFactor, maxDelay);
	}

	throw new Error(
		`Timeout waiting for Vercel preview deployment for PR #${prNumber}`,
	);
}

async function setVercelEnvVar(
	key,
	value,
	target = "preview",
	gitBranch = null,
) {
	const projectId = process.env.VERCEL_PROJECT;
	if (!projectId) {
		throw new Error("VERCEL_PROJECT environment variable is required");
	}

	const envVars = await vercelRequest(`/v10/projects/${projectId}/env`);

	const existing = envVars.envs?.find((e) => {
		if (e.key !== key) {
			return false;
		}
		if (!e.target.includes(target)) {
			return false;
		}
		if (gitBranch) {
			return e.gitBranch === gitBranch;
		}
		return !e.gitBranch;
	});

	const branchLabel = gitBranch ? ` (branch: ${gitBranch})` : "";

	if (existing) {
		if (existing.value === value) {
			console.log(
				`[Vercel] ${target} env var unchanged: ${key}${branchLabel}`,
			);
			return false;
		}
		await vercelRequest(`/v10/projects/${projectId}/env/${existing.id}`, {
			method: "PATCH",
			body: JSON.stringify({ value }),
		});
		console.log(`[Vercel] Updated ${target} env var: ${key}${branchLabel}`);
		return true;
	}

	const envVarPayload = {
		key,
		value,
		target: [target],
		type: target === "development" ? "plain" : "encrypted",
	};
	if (gitBranch) {
		envVarPayload.gitBranch = gitBranch;
	}

	await vercelRequest(`/v10/projects/${projectId}/env`, {
		method: "POST",
		body: JSON.stringify(envVarPayload),
	});
	console.log(`[Vercel] Created ${target} env var: ${key}${branchLabel}`);
	return true;
}

// ============================================================================
// Main Commands
// ============================================================================

async function waitCommand(args) {
	console.log(`\n${"=".repeat(60)}`);
	console.log("WAITING FOR PREVIEW ENVIRONMENTS");
	console.log(`${"=".repeat(60)}\n`);

	console.log(`PR Number: ${args.prNumber}`);
	console.log(`Git Branch: ${args.branch || "(will be determined from PR)"}`);
	console.log(`Timeout (Vercel): ${args.timeout} seconds`);
	console.log(`Timeout (Neon): ${args.neonTimeout} seconds\n`);

	const waitOptions = {
		timeoutMs: args.timeout * 1000,
		initialDelay: 5000,
		maxDelay: 30000,
		backoffFactor: 1.5,
	};

	const neonWaitOptions = {
		...waitOptions,
		timeoutMs: args.neonTimeout * 1000,
	};

	const vercelWaitOptions = {
		...waitOptions,
		branch: args.branch,
	};

	console.log("Starting parallel wait for all services...\n");

	const results = await Promise.allSettled([
		(async () => {
			if (!args.branch) {
				console.log("[Neon] Skipping - no branch name provided");
				return { skipped: true };
			}
			const neon = createNeonClientFromEnv();
			const branch = await neon.waitForBranch(
				args.branch,
				neonWaitOptions,
			);
			const credentials = await neon.getBranchCredentials(branch);
			return { branch, credentials };
		})(),
		waitForVercelPreview(args.prNumber, vercelWaitOptions),
	]);

	console.log(`\n${"=".repeat(60)}`);
	console.log("WAIT RESULTS");
	console.log(`${"=".repeat(60)}\n`);

	const [neonResult, vercelResult] = results;

	const output = {
		neon:
			neonResult.status === "fulfilled"
				? neonResult.value
				: { error: neonResult.reason?.message },
		vercel:
			vercelResult.status === "fulfilled"
				? vercelResult.value
				: { error: vercelResult.reason?.message },
	};

	console.log(
		"Neon:",
		output.neon.skipped
			? "SKIPPED"
			: output.neon.error
				? `ERROR: ${output.neon.error}`
				: "READY",
	);
	console.log(
		"Vercel:",
		output.vercel.error
			? `ERROR: ${output.vercel.error}`
			: `READY - ${output.vercel.url}`,
	);

	const neonFailed = neonResult.status === "rejected";
	if (neonFailed) {
		console.log(
			"\n[WARNING] Neon branch not ready - database credentials will NOT be synced",
		);
		console.log(
			"[WARNING] Re-run this workflow manually once Neon branch is ready",
		);
	}

	if (vercelResult.status === "rejected") {
		throw new Error("Vercel preview deployment failed to become ready");
	}

	return output;
}

async function syncCommand(args) {
	console.log(`\n${"=".repeat(60)}`);
	console.log("SYNCING ENVIRONMENT VARIABLES");
	console.log(`${"=".repeat(60)}\n`);

	const services = await waitCommand(args);

	console.log(`\n${"=".repeat(60)}`);
	console.log("UPDATING ENVIRONMENT VARIABLES");
	console.log(`${"=".repeat(60)}\n`);

	const neonCredentials = services.neon?.credentials;

	let vercelEnvChanged = false;

	// Sync Neon database credentials to Vercel (branch-specific)
	if (neonCredentials && args.branch) {
		console.log(
			"[Vercel] Updating Neon database credentials (branch-specific)...",
		);

		// DATABASE_URL (pooled connection for runtime)
		const databaseUrlChanged = await setVercelEnvVar(
			"DATABASE_URL",
			neonCredentials.poolerUrl,
			"preview",
			args.branch,
		);
		if (databaseUrlChanged) {
			vercelEnvChanged = true;
		}

		// DATABASE_URL_UNPOOLED (direct connection for migrations)
		const directUrlChanged = await setVercelEnvVar(
			"DATABASE_URL_UNPOOLED",
			neonCredentials.directUrl,
			"preview",
			args.branch,
		);
		if (directUrlChanged) {
			vercelEnvChanged = true;
		}
	}

	console.log(`\n${"=".repeat(60)}`);
	console.log("SYNC COMPLETE");
	console.log(`${"=".repeat(60)}\n`);

	if (vercelEnvChanged) {
		console.log(
			"[Vercel] Note: Vercel will use updated env vars on next deployment",
		);
	} else {
		console.log("[Vercel] No env var changes needed");
	}

	return services;
}

async function runCommand(args) {
	await syncCommand(args);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
	const argv = process.argv.slice(2);
	const args = parseArgs(argv);

	if (!args.command) {
		console.error(
			"Usage: preview-sync <command> --pr <number> [--branch <name>]",
		);
		console.error("Commands: wait, sync, run");
		process.exit(1);
	}

	if (
		!args.prNumber ||
		args.prNumber <= 0 ||
		!Number.isInteger(args.prNumber)
	) {
		console.error(
			"Error: --pr <number> is required and must be a positive integer",
		);
		process.exit(1);
	}

	try {
		switch (args.command) {
			case "wait":
				await waitCommand(args);
				break;
			case "sync":
				await syncCommand(args);
				break;
			case "run":
				await runCommand(args);
				break;
			default:
				console.error(`Unknown command: ${args.command}`);
				console.error("Commands: wait, sync, run");
				process.exit(1);
		}
	} catch (error) {
		console.error(`\nError: ${error.message}`);
		process.exit(1);
	}
}

main();
