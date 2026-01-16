#!/usr/bin/env node

/**
 * Preview Environment Sync
 *
 * Orchestrates environment variable synchronization across
 * Supabase, Vercel, and Render preview environments.
 *
 * Usage:
 *   pnpm --filter @repo/scripts preview-sync wait --pr <number> [--branch <name>]
 *   pnpm --filter @repo/scripts preview-sync sync --pr <number> [--branch <name>]
 *   pnpm --filter @repo/scripts preview-sync run --pr <number> [--branch <name>] [--sha <commit>]
 *
 * Required environment variables:
 *   SUPABASE_ACCESS_TOKEN - Supabase Management API token
 *   SUPABASE_PROJECT_REF  - Supabase project reference
 *   RENDER_API_KEY        - Render API key
 *   VERCEL_TOKEN          - Vercel API token
 *   VERCEL_PROJECT        - Vercel project ID
 *   VERCEL_SCOPE          - Vercel team/scope ID
 *
 * Optional environment variables (for GitHub Check integration):
 *   GITHUB_TOKEN          - GitHub API token (for creating/updating checks)
 *   GITHUB_REPOSITORY     - GitHub repository (owner/repo format)
 */

import { createSupabaseClientFromEnv } from "../supabase/api-client.mjs";
import {
	createGitHubCheck,
	getRenderDashboardUrl,
	isGitHubCheckEnabled,
	updateGitHubCheck,
} from "./github-checks.mjs";

// ============================================================================
// Configuration
// ============================================================================

const RENDER_API_BASE = "https://api.render.com/v1";
const VERCEL_API_BASE = "https://api.vercel.com";
const RENDER_SERVICE_PREFIX = "software-multi-tool-pr-";

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
		timeout: 600, // 10 minutes default for Render/Vercel
		supabaseTimeout: 900, // 15 minutes for Supabase (takes longer to provision)
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
			case "--supabase-timeout":
				args.supabaseTimeout = Number.parseInt(argv[++i], 10);
				break;
		}
	}

	return args;
}

function redactUrl(url) {
	if (!url) {
		return url;
	}
	return url.replace(/:([^:@]+)@/, ":****@");
}

/**
 * Retry a function with exponential backoff for transient errors
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>}
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

			// Check if error is retryable (network errors, 429, 5xx)
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
// Render API Functions
// ============================================================================

async function renderRequest(path, options = {}) {
	const apiKey = process.env.RENDER_API_KEY;
	if (!apiKey) {
		throw new Error("RENDER_API_KEY environment variable is required");
	}

	return withRetry(async () => {
		const url = `${RENDER_API_BASE}${path}`;
		const response = await fetch(url, {
			...options,
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		if (!response.ok) {
			let errorMessage = `Render API error: ${response.status} ${response.statusText}`;
			try {
				const body = await response.json();
				if (body.message) {
					errorMessage = `Render API error: ${body.message}`;
				}
			} catch {
				// Ignore JSON parse errors
			}
			throw new Error(errorMessage);
		}

		if (response.status === 204) {
			return null;
		}

		return response.json();
	});
}

async function findRenderPreviewService(prNumber) {
	const serviceName = `${RENDER_SERVICE_PREFIX}${prNumber}`;

	// First, try the name filter (exact match)
	let services = await renderRequest(
		`/services?name=${encodeURIComponent(serviceName)}`,
	);

	if (services && services.length > 0) {
		return services[0]?.service || null;
	}

	// If name filter doesn't work, list all services and filter manually
	// This handles cases where the API name filter is case-sensitive or partial
	console.log(
		"[Render] Name filter returned no results, listing all services...",
	);
	services = await renderRequest("/services?limit=100");

	if (!services || services.length === 0) {
		return null;
	}

	// Find by exact name match or by slug (URL pattern)
	for (const item of services) {
		const service = item?.service;
		if (!service) {
			continue;
		}

		// Match by name
		if (service.name === serviceName) {
			return service;
		}

		// Match by slug (the URL identifier)
		if (service.slug === serviceName) {
			return service;
		}

		// Match by URL pattern in serviceDetails
		if (service.serviceDetails?.url?.includes(serviceName)) {
			return service;
		}
	}

	return null;
}

async function getRenderServiceUrl(service) {
	if (!service) {
		return null;
	}

	// For web services, the URL is in the service details
	if (service.serviceDetails?.url) {
		return service.serviceDetails.url;
	}

	// Construct URL from service slug (fallback)
	if (service.slug) {
		return `https://${service.slug}.onrender.com`;
	}

	// Last resort: try service name
	if (service.name) {
		return `https://${service.name}.onrender.com`;
	}

	return null;
}

async function setRenderEnvVar(serviceId, key, value) {
	await renderRequest(
		`/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
		{
			method: "PUT",
			body: JSON.stringify({ value }),
		},
	);
}

async function listRenderEnvVars(serviceId) {
	const response = await renderRequest(`/services/${serviceId}/env-vars`);
	if (!response || !Array.isArray(response)) {
		return [];
	}
	return response.map((r) => r.envVar);
}

async function triggerRenderDeploy(serviceId) {
	const response = await renderRequest(`/services/${serviceId}/deploys`, {
		method: "POST",
		body: JSON.stringify({}),
	});
	return response?.deploy || null;
}

async function waitForRenderPreview(prNumber, options = {}) {
	const {
		timeoutMs = 600000, // 10 minutes default
		initialDelay = 5000,
		maxDelay = 30000,
		backoffFactor = 1.5,
	} = options;

	const startTime = Date.now();
	let delay = initialDelay;
	let attempt = 0;

	while (Date.now() - startTime < timeoutMs) {
		attempt++;
		const service = await findRenderPreviewService(prNumber);

		if (service) {
			const url = await getRenderServiceUrl(service);
			if (url) {
				console.log(`[Render] Preview service found: ${url}`);
				return { service, url };
			}
		}

		const elapsed = Math.round((Date.now() - startTime) / 1000);
		const remaining = Math.round(
			(timeoutMs - (Date.now() - startTime)) / 1000,
		);
		console.log(
			`[Render] Attempt ${attempt}: Preview service not found (${elapsed}s elapsed, ${remaining}s remaining)`,
		);

		await sleep(delay);
		delay = Math.min(delay * backoffFactor, maxDelay);
	}

	throw new Error(
		`Timeout waiting for Render preview service for PR #${prNumber}`,
	);
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

async function findVercelPreviewDeployment(prNumber) {
	const projectId = process.env.VERCEL_PROJECT;
	if (!projectId) {
		throw new Error("VERCEL_PROJECT environment variable is required");
	}

	// List recent deployments and find one for this PR
	const response = await vercelRequest(
		"/v6/deployments",
		{},
		{
			projectId,
			limit: "50",
			state: "READY",
		},
	);

	// Find deployment with PR metadata or matching branch pattern
	for (const deployment of response.deployments || []) {
		// Check if deployment has PR number in meta
		if (deployment.meta?.githubPrId === String(prNumber)) {
			return deployment;
		}

		// Check if deployment URL contains PR reference
		if (deployment.url?.includes(`-pr-${prNumber}-`)) {
			return deployment;
		}
	}

	return null;
}

async function waitForVercelPreview(prNumber, options = {}) {
	const {
		timeoutMs = 600000, // 10 minutes default
		initialDelay = 5000,
		maxDelay = 30000,
		backoffFactor = 1.5,
	} = options;

	const startTime = Date.now();
	let delay = initialDelay;
	let attempt = 0;

	while (Date.now() - startTime < timeoutMs) {
		attempt++;
		const deployment = await findVercelPreviewDeployment(prNumber);

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

	// First, check if the env var exists and its current value
	const envVars = await vercelRequest(`/v10/projects/${projectId}/env`);

	// When gitBranch is specified, look for a branch-specific env var
	// Otherwise look for a global env var (no gitBranch)
	const existing = envVars.envs?.find((e) => {
		if (e.key !== key) {
			return false;
		}
		if (!e.target.includes(target)) {
			return false;
		}
		if (gitBranch) {
			// Looking for branch-specific: must match the branch
			return e.gitBranch === gitBranch;
		}
		// Looking for global: must not have a gitBranch
		return !e.gitBranch;
	});

	const branchLabel = gitBranch ? ` (branch: ${gitBranch})` : "";

	if (existing) {
		// Check if value is unchanged (Vercel returns decrypted values for comparison)
		if (existing.value === value) {
			console.log(
				`[Vercel] ${target} env var unchanged: ${key}${branchLabel}`,
			);
			return false;
		}
		// Update existing
		await vercelRequest(`/v10/projects/${projectId}/env/${existing.id}`, {
			method: "PATCH",
			body: JSON.stringify({ value }),
		});
		console.log(`[Vercel] Updated ${target} env var: ${key}${branchLabel}`);
		return true;
	}

	// Create new - include gitBranch if specified
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
	console.log(`Timeout (Render/Vercel): ${args.timeout} seconds`);
	console.log(`Timeout (Supabase): ${args.supabaseTimeout} seconds\n`);

	const waitOptions = {
		timeoutMs: args.timeout * 1000, // Convert seconds to milliseconds
		initialDelay: 5000,
		maxDelay: 30000,
		backoffFactor: 1.5,
	};

	// Supabase gets a longer timeout since branch provisioning takes longer
	const supabaseWaitOptions = {
		...waitOptions,
		timeoutMs: args.supabaseTimeout * 1000,
	};

	// Wait for all three services in parallel
	console.log("Starting parallel wait for all services...\n");

	const results = await Promise.allSettled([
		(async () => {
			if (!args.branch) {
				console.log("[Supabase] Skipping - no branch name provided");
				return { skipped: true };
			}
			const supabase = createSupabaseClientFromEnv();
			const branch = await supabase.waitForBranch(
				args.branch,
				supabaseWaitOptions,
			);
			const credentials = await supabase.getBranchCredentials(branch);
			return { branch, credentials };
		})(),
		waitForVercelPreview(args.prNumber, waitOptions),
		waitForRenderPreview(args.prNumber, waitOptions),
	]);

	console.log(`\n${"=".repeat(60)}`);
	console.log("WAIT RESULTS");
	console.log(`${"=".repeat(60)}\n`);

	const [supabaseResult, vercelResult, renderResult] = results;

	const output = {
		supabase:
			supabaseResult.status === "fulfilled"
				? supabaseResult.value
				: { error: supabaseResult.reason?.message },
		vercel:
			vercelResult.status === "fulfilled"
				? vercelResult.value
				: { error: vercelResult.reason?.message },
		render:
			renderResult.status === "fulfilled"
				? renderResult.value
				: { error: renderResult.reason?.message },
	};

	console.log(
		"Supabase:",
		output.supabase.skipped
			? "SKIPPED"
			: output.supabase.error
				? `ERROR: ${output.supabase.error}`
				: "READY",
	);
	console.log(
		"Vercel:",
		output.vercel.error
			? `ERROR: ${output.vercel.error}`
			: `READY - ${output.vercel.url}`,
	);
	console.log(
		"Render:",
		output.render.error
			? `ERROR: ${output.render.error}`
			: `READY - ${output.render.url}`,
	);

	// Supabase failure is non-fatal - we can still sync Vercel/Render URLs
	// Database credentials will be missing, but at least CORS and API URLs get synced
	const supabaseFailed = supabaseResult.status === "rejected";
	if (supabaseFailed) {
		console.log(
			"\n[WARNING] Supabase branch not ready - database credentials will NOT be synced",
		);
		console.log(
			"[WARNING] Re-run this workflow manually once Supabase branch is ready",
		);
	}

	// Critical failures: Render and Vercel must be ready for any sync to work
	const criticalFailed = [vercelResult, renderResult].filter(
		(r) => r.status === "rejected",
	);
	if (criticalFailed.length > 0) {
		throw new Error(
			`${criticalFailed.length} critical service(s) failed to become ready (Render/Vercel required)`,
		);
	}

	return output;
}

async function syncCommand(args) {
	console.log(`\n${"=".repeat(60)}`);
	console.log("SYNCING ENVIRONMENT VARIABLES");
	console.log(`${"=".repeat(60)}\n`);

	// First wait for all services
	const services = await waitCommand(args);

	console.log(`\n${"=".repeat(60)}`);
	console.log("UPDATING ENVIRONMENT VARIABLES");
	console.log(`${"=".repeat(60)}\n`);

	const renderServiceId = services.render?.service?.id;
	const vercelUrl = services.vercel?.url;
	const renderUrl = services.render?.url;
	const supabaseCredentials = services.supabase?.credentials;

	let renderEnvChanged = false;
	let vercelEnvChanged = false;

	// Fetch Render env vars once for all checks
	let currentRenderValues = {};
	if (renderServiceId) {
		const currentEnvVars = await listRenderEnvVars(renderServiceId);
		currentRenderValues = Object.fromEntries(
			currentEnvVars.map((e) => [e.key, e.value]),
		);
	}

	// Update Render with Supabase credentials
	// Note: We update both the standard Prisma variable names (DATABASE_URL, DIRECT_URL)
	// AND the Vercel-style names (POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING) for compatibility.
	if (renderServiceId && supabaseCredentials) {
		console.log("\n[Render] Updating database credentials...");

		// Update DATABASE_URL (standard Prisma variable name)
		if (
			currentRenderValues.DATABASE_URL !== supabaseCredentials.poolerUrl
		) {
			await setRenderEnvVar(
				renderServiceId,
				"DATABASE_URL",
				supabaseCredentials.poolerUrl,
			);
			console.log(
				`  - DATABASE_URL: ${redactUrl(supabaseCredentials.poolerUrl)}`,
			);
			renderEnvChanged = true;
		} else {
			console.log("  - DATABASE_URL: (unchanged)");
		}

		// Update DIRECT_URL (standard Prisma variable name for migrations)
		if (currentRenderValues.DIRECT_URL !== supabaseCredentials.directUrl) {
			await setRenderEnvVar(
				renderServiceId,
				"DIRECT_URL",
				supabaseCredentials.directUrl,
			);
			console.log(
				`  - DIRECT_URL: ${redactUrl(supabaseCredentials.directUrl)}`,
			);
			renderEnvChanged = true;
		} else {
			console.log("  - DIRECT_URL: (unchanged)");
		}

		// Also update POSTGRES_PRISMA_URL for backward compatibility
		if (
			currentRenderValues.POSTGRES_PRISMA_URL !==
			supabaseCredentials.poolerUrl
		) {
			await setRenderEnvVar(
				renderServiceId,
				"POSTGRES_PRISMA_URL",
				supabaseCredentials.poolerUrl,
			);
			console.log(
				`  - POSTGRES_PRISMA_URL: ${redactUrl(supabaseCredentials.poolerUrl)}`,
			);
			renderEnvChanged = true;
		} else {
			console.log("  - POSTGRES_PRISMA_URL: (unchanged)");
		}

		// Also update POSTGRES_URL_NON_POOLING for backward compatibility
		if (
			currentRenderValues.POSTGRES_URL_NON_POOLING !==
			supabaseCredentials.directUrl
		) {
			await setRenderEnvVar(
				renderServiceId,
				"POSTGRES_URL_NON_POOLING",
				supabaseCredentials.directUrl,
			);
			console.log(
				`  - POSTGRES_URL_NON_POOLING: ${redactUrl(supabaseCredentials.directUrl)}`,
			);
			renderEnvChanged = true;
		} else {
			console.log("  - POSTGRES_URL_NON_POOLING: (unchanged)");
		}
	}

	// Update Render with Vercel URL for CORS
	if (renderServiceId && vercelUrl) {
		console.log("\n[Render] Updating CORS origin...");

		if (currentRenderValues.CORS_ORIGIN !== vercelUrl) {
			await setRenderEnvVar(renderServiceId, "CORS_ORIGIN", vercelUrl);
			console.log(`  - CORS_ORIGIN: ${vercelUrl}`);
			renderEnvChanged = true;
		} else {
			console.log("  - CORS_ORIGIN: (unchanged)");
		}
	}

	// Update Vercel with Render URL - set as branch-specific so each PR preview
	// gets its own Render URL (otherwise PRs would overwrite each other's values)
	if (renderUrl && args.branch) {
		console.log("\n[Vercel] Updating API server URL (branch-specific)...");
		vercelEnvChanged = await setVercelEnvVar(
			"NEXT_PUBLIC_API_SERVER_URL",
			renderUrl,
			"preview",
			args.branch, // Branch-specific env var
		);
		if (vercelEnvChanged) {
			console.log(
				`  - NEXT_PUBLIC_API_SERVER_URL: ${renderUrl} (branch: ${args.branch})`,
			);
		}
	} else if (renderUrl) {
		// Fallback to global preview if no branch specified (shouldn't happen in normal flow)
		console.log(
			"\n[Vercel] Updating API server URL (global preview - no branch specified)...",
		);
		vercelEnvChanged = await setVercelEnvVar(
			"NEXT_PUBLIC_API_SERVER_URL",
			renderUrl,
			"preview",
		);
		if (vercelEnvChanged) {
			console.log(`  - NEXT_PUBLIC_API_SERVER_URL: ${renderUrl}`);
		}
	}

	// Trigger redeploys if env vars changed
	console.log(`\n${"=".repeat(60)}`);
	console.log("TRIGGERING REDEPLOYS");
	console.log(`${"=".repeat(60)}\n`);

	if (renderEnvChanged && renderServiceId) {
		console.log("[Render] Env vars changed, triggering redeploy...");
		const deploy = await triggerRenderDeploy(renderServiceId);
		console.log(`  - Deploy triggered: ${deploy?.id || "unknown"}`);
	} else {
		console.log("[Render] No env var changes, skipping redeploy");
	}

	if (vercelEnvChanged) {
		console.log(
			"[Vercel] Note: Vercel will use updated env vars on next deployment",
		);
	}

	console.log(`\n${"=".repeat(60)}`);
	console.log("SYNC COMPLETE");
	console.log(`${"=".repeat(60)}\n`);

	return services;
}

async function runCommand(args) {
	let checkRunId = null;

	// Create GitHub Check if enabled (requires sha)
	if (isGitHubCheckEnabled() && args.sha) {
		console.log(`\n${"=".repeat(60)}`);
		console.log("CREATING GITHUB CHECK");
		console.log(`${"=".repeat(60)}\n`);

		try {
			const result = await createGitHubCheck(args.sha, "in_progress", {
				summary:
					"Render preview deployment is being synchronized with other preview services.",
			});
			checkRunId = result.id;
		} catch (error) {
			console.log(
				`[GitHub] Warning: Failed to create check run: ${error.message}`,
			);
			// Continue even if check creation fails - don't block the sync
		}
	} else if (!args.sha) {
		console.log(
			"[GitHub] Skipping check creation - no commit SHA provided (use --sha)",
		);
	} else {
		console.log(
			"[GitHub] Skipping check creation - GITHUB_TOKEN or GITHUB_REPOSITORY not set",
		);
	}

	let renderService = null;
	let renderUrl = null;

	try {
		// Run the sync command (which includes waiting for services)
		const services = await syncCommand(args);

		// Capture Render service info for check update
		renderService = services?.render?.service;
		renderUrl = services?.render?.url;

		// Update GitHub Check to success if we have one
		if (checkRunId && isGitHubCheckEnabled()) {
			try {
				await updateGitHubCheck(checkRunId, "completed", {
					conclusion: "success",
					detailsUrl:
						renderUrl || getRenderDashboardUrl(renderService),
					summary: "Render preview deployment is ready!",
					text: renderUrl
						? `Preview URL: ${renderUrl}`
						: "Preview environment synchronized successfully.",
				});
			} catch (error) {
				console.log(
					`[GitHub] Warning: Failed to update check run: ${error.message}`,
				);
			}
		}
	} catch (error) {
		// Update GitHub Check to failure if we have one
		if (checkRunId && isGitHubCheckEnabled()) {
			try {
				await updateGitHubCheck(checkRunId, "completed", {
					conclusion: "failure",
					detailsUrl: getRenderDashboardUrl(renderService),
					summary: "Render preview deployment failed",
					text: `Error: ${error.message}`,
				});
			} catch (updateError) {
				console.log(
					`[GitHub] Warning: Failed to update check run: ${updateError.message}`,
				);
			}
		}

		// Re-throw the original error
		throw error;
	}
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
