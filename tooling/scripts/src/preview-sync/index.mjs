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
 *   pnpm --filter @repo/scripts preview-sync run --pr <number> [--branch <name>]
 *
 * Required environment variables:
 *   SUPABASE_ACCESS_TOKEN - Supabase Management API token
 *   SUPABASE_PROJECT_REF  - Supabase project reference
 *   RENDER_API_KEY        - Render API key
 *   VERCEL_TOKEN          - Vercel API token
 *   VERCEL_PROJECT        - Vercel project ID
 *   VERCEL_SCOPE          - Vercel team/scope ID
 */

import { createSupabaseClientFromEnv } from "../supabase/api-client.mjs";

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
		timeout: 600, // 10 minutes default
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
			case "--timeout":
				args.timeout = Number.parseInt(argv[++i], 10);
				break;
		}
	}

	return args;
}

function redactUrl(url) {
	if (!url) return url;
	return url.replace(/:([^:@]+)@/, ":****@");
}

// ============================================================================
// Render API Functions
// ============================================================================

async function renderRequest(path, options = {}) {
	const apiKey = process.env.RENDER_API_KEY;
	if (!apiKey) {
		throw new Error("RENDER_API_KEY environment variable is required");
	}

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
}

async function findRenderPreviewService(prNumber) {
	const serviceName = `${RENDER_SERVICE_PREFIX}${prNumber}`;
	const services = await renderRequest(`/services?name=${serviceName}`);

	if (!services || services.length === 0) {
		return null;
	}

	// Services are returned as { service: {...} } objects
	return services[0]?.service || null;
}

async function getRenderServiceUrl(service) {
	if (!service) return null;

	// For web services, the URL is in the service details
	if (service.serviceDetails?.url) {
		return service.serviceDetails.url;
	}

	// Construct URL from service name
	return `https://${service.slug}.onrender.com`;
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
		maxAttempts = 60,
		initialDelay = 5000,
		maxDelay = 30000,
		backoffFactor = 1.5,
	} = options;

	let delay = initialDelay;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const service = await findRenderPreviewService(prNumber);

		if (service) {
			const url = await getRenderServiceUrl(service);
			console.log(`[Render] Preview service found: ${url}`);
			return { service, url };
		}

		console.log(
			`[Render] Attempt ${attempt}/${maxAttempts}: Preview service not found, waiting ${delay}ms...`,
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
		maxAttempts = 60,
		initialDelay = 5000,
		maxDelay = 30000,
		backoffFactor = 1.5,
	} = options;

	let delay = initialDelay;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const deployment = await findVercelPreviewDeployment(prNumber);

		if (deployment && deployment.state === "READY") {
			const url = `https://${deployment.url}`;
			console.log(`[Vercel] Preview deployment found: ${url}`);
			return { deployment, url };
		}

		const status = deployment ? deployment.state : "not found";
		console.log(
			`[Vercel] Attempt ${attempt}/${maxAttempts}: Deployment status is "${status}", waiting ${delay}ms...`,
		);

		await sleep(delay);
		delay = Math.min(delay * backoffFactor, maxDelay);
	}

	throw new Error(
		`Timeout waiting for Vercel preview deployment for PR #${prNumber}`,
	);
}

async function setVercelEnvVar(key, value, target = "preview") {
	const projectId = process.env.VERCEL_PROJECT;
	if (!projectId) {
		throw new Error("VERCEL_PROJECT environment variable is required");
	}

	// First, check if the env var exists
	const envVars = await vercelRequest(`/v10/projects/${projectId}/env`);
	const existing = envVars.envs?.find(
		(e) => e.key === key && e.target.includes(target) && !e.gitBranch,
	);

	if (existing) {
		// Update existing
		await vercelRequest(`/v10/projects/${projectId}/env/${existing.id}`, {
			method: "PATCH",
			body: JSON.stringify({ value }),
		});
		console.log(`[Vercel] Updated ${target} env var: ${key}`);
	} else {
		// Create new
		await vercelRequest(`/v10/projects/${projectId}/env`, {
			method: "POST",
			body: JSON.stringify({
				key,
				value,
				target: [target],
				type: target === "development" ? "plain" : "encrypted",
			}),
		});
		console.log(`[Vercel] Created ${target} env var: ${key}`);
	}
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
	console.log(`Timeout: ${args.timeout} seconds\n`);

	const waitOptions = {
		maxAttempts: Math.ceil(args.timeout / 10),
		initialDelay: 5000,
		maxDelay: 30000,
		backoffFactor: 1.5,
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
				waitOptions,
			);
			const credentials = supabase.getBranchCredentials(branch);
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

	// Check for any failures
	const failed = results.filter((r) => r.status === "rejected");
	if (failed.length > 0) {
		throw new Error(`${failed.length} service(s) failed to become ready`);
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

	// Update Render with Supabase credentials
	if (renderServiceId && supabaseCredentials) {
		console.log("\n[Render] Updating database credentials...");

		// Get current env vars to check for changes
		const currentEnvVars = await listRenderEnvVars(renderServiceId);
		const currentValues = Object.fromEntries(
			currentEnvVars.map((e) => [e.key, e.value]),
		);

		// Check and update POSTGRES_PRISMA_URL
		if (
			currentValues.POSTGRES_PRISMA_URL !== supabaseCredentials.poolerUrl
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

		// Check and update POSTGRES_URL_NON_POOLING
		if (
			currentValues.POSTGRES_URL_NON_POOLING !==
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

		const currentEnvVars = await listRenderEnvVars(renderServiceId);
		const currentCors = currentEnvVars.find(
			(e) => e.key === "CORS_ORIGIN",
		)?.value;

		if (currentCors !== vercelUrl) {
			await setRenderEnvVar(renderServiceId, "CORS_ORIGIN", vercelUrl);
			console.log(`  - CORS_ORIGIN: ${vercelUrl}`);
			renderEnvChanged = true;
		} else {
			console.log("  - CORS_ORIGIN: (unchanged)");
		}
	}

	// Update Vercel with Render URL
	if (renderUrl) {
		console.log("\n[Vercel] Updating API server URL...");
		await setVercelEnvVar(
			"NEXT_PUBLIC_API_SERVER_URL",
			renderUrl,
			"preview",
		);
		console.log(`  - NEXT_PUBLIC_API_SERVER_URL: ${renderUrl}`);
		vercelEnvChanged = true;
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

	if (!args.prNumber) {
		console.error("Error: --pr <number> is required");
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
