#!/usr/bin/env node

/**
 * Neon Management API Client
 *
 * Provides functions to interact with the Neon Management API
 * for branch management and database credential retrieval.
 *
 * API Documentation: https://api-docs.neon.tech/reference/getting-started
 */

const API_BASE_URL = "https://console.neon.tech/api/v2";

/**
 * @typedef {Object} NeonClientConfig
 * @property {string} apiKey - Neon API key
 * @property {string} projectId - Neon project ID (e.g., 'aged-forest-12345678')
 */

/**
 * @typedef {Object} NeonBranch
 * @property {string} id - Branch ID (e.g., 'br-abc123')
 * @property {string} name - Branch name (e.g., 'preview/feat/my-feature')
 * @property {string} project_id - Project ID
 * @property {string} parent_id - Parent branch ID
 * @property {string} current_state - Branch state ('init', 'ready')
 * @property {string} [pending_state] - Next anticipated state
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} BranchCredentials
 * @property {string} poolerUrl - Pooled connection URL (for app runtime)
 * @property {string} directUrl - Direct connection URL (for migrations)
 */

/**
 * Create a Neon Management API client
 *
 * @param {NeonClientConfig} config - Client configuration
 * @returns {Object} Client with API methods
 */
export function createNeonClient(config) {
	const { apiKey, projectId } = config;

	if (!apiKey) {
		throw new Error(
			"NEON_API_KEY is required. Get it from Neon Console → Account → API Keys.",
		);
	}

	if (!projectId) {
		throw new Error(
			"NEON_PROJECT_ID is required. This is your project ID (e.g., 'aged-forest-12345678').",
		);
	}

	/**
	 * Retry a function with exponential backoff for transient errors
	 */
	async function withRetry(fn, retryOptions = {}) {
		const {
			maxRetries = 3,
			initialDelay = 1000,
			maxDelay = 10000,
		} = retryOptions;

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
					`  [Neon] Retry ${attempt}/${maxRetries} after error: ${error.message}`,
				);
				await sleep(delay);
				delay = Math.min(delay * 2, maxDelay);
			}
		}

		throw lastError;
	}

	/**
	 * Make an API request to Neon Management API
	 */
	async function request(path, options = {}) {
		return withRetry(async () => {
			const url = `${API_BASE_URL}${path}`;

			const response = await fetch(url, {
				...options,
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					...options.headers,
				},
			});

			if (!response.ok) {
				let errorMessage = `Neon API error: ${response.status} ${response.statusText}`;
				try {
					const body = await response.json();
					if (body.message) {
						errorMessage = `Neon API error: ${body.message}`;
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

	return {
		/**
		 * List all branches for the project
		 * @returns {Promise<NeonBranch[]>}
		 */
		async listBranches() {
			const result = await request(`/projects/${projectId}/branches`);
			return result.branches || [];
		},

		/**
		 * Find a branch by name. Neon's Vercel integration names preview branches
		 * as 'preview/{gitBranch}', so we search for that pattern.
		 * @param {string} gitBranch - Git branch name
		 * @returns {Promise<NeonBranch | null>}
		 */
		async findBranchByName(gitBranch) {
			const branchName = `preview/${gitBranch}`;
			const result = await request(
				`/projects/${projectId}/branches?search=${encodeURIComponent(branchName)}`,
			);
			const branches = result.branches || [];
			// Exact match on name since search is a partial match
			return branches.find((b) => b.name === branchName) || null;
		},

		/**
		 * Get database connection credentials for a branch.
		 * Uses the connection_uri API endpoint for both pooled and direct URLs.
		 * @param {NeonBranch} branch - Branch object
		 * @returns {Promise<BranchCredentials>}
		 */
		async getBranchCredentials(branch) {
			if (!this.isBranchReady(branch)) {
				throw new Error(
					`Branch "${branch.name}" is not ready. State: ${branch.current_state}`,
				);
			}

			// Get the default role and database for this branch
			const [rolesResult, databasesResult] = await Promise.all([
				request(`/projects/${projectId}/branches/${branch.id}/roles`),
				request(
					`/projects/${projectId}/branches/${branch.id}/databases`,
				),
			]);

			const roles = rolesResult.roles || [];
			const databases = databasesResult.databases || [];

			// Use the owner role (typically 'neondb_owner') and default database ('neondb')
			const role = roles.find((r) => r.name !== "web_access") || roles[0];
			const database = databases[0];

			if (!role || !database) {
				throw new Error(
					`Branch "${branch.name}" has no roles or databases configured`,
				);
			}

			const roleName = role.name;
			const dbName = database.name;

			// Fetch pooled and direct connection URIs
			const [pooledResult, directResult] = await Promise.all([
				request(
					`/projects/${projectId}/connection_uri?branch_id=${branch.id}&role_name=${encodeURIComponent(roleName)}&database_name=${encodeURIComponent(dbName)}&pooled=true`,
				),
				request(
					`/projects/${projectId}/connection_uri?branch_id=${branch.id}&role_name=${encodeURIComponent(roleName)}&database_name=${encodeURIComponent(dbName)}&pooled=false`,
				),
			]);

			return {
				poolerUrl: pooledResult.uri,
				directUrl: directResult.uri,
			};
		},

		/**
		 * Check if a branch is ready for database connections.
		 * @param {NeonBranch} branch - Branch object
		 * @returns {boolean}
		 */
		isBranchReady(branch) {
			return branch.current_state === "ready";
		},

		/**
		 * Wait for a branch to become ready
		 * @param {string} gitBranch - Git branch name
		 * @param {Object} [options] - Wait options
		 * @param {number} [options.timeoutMs=600000] - Timeout in milliseconds (default 10 minutes)
		 * @param {number} [options.initialDelay=5000] - Initial delay in ms
		 * @param {number} [options.maxDelay=30000] - Maximum delay in ms
		 * @param {number} [options.backoffFactor=1.5] - Backoff multiplier
		 * @returns {Promise<NeonBranch>}
		 */
		async waitForBranch(gitBranch, options = {}) {
			const {
				timeoutMs = 600000,
				initialDelay = 5000,
				maxDelay = 30000,
				backoffFactor = 1.5,
			} = options;

			const startTime = Date.now();
			let delay = initialDelay;
			let attempt = 0;

			while (Date.now() - startTime < timeoutMs) {
				attempt++;
				const branch = await this.findBranchByName(gitBranch);

				const elapsed = Math.round((Date.now() - startTime) / 1000);
				const remaining = Math.round(
					(timeoutMs - (Date.now() - startTime)) / 1000,
				);

				if (!branch) {
					console.log(
						`[Neon] Attempt ${attempt}: Branch not found (${elapsed}s elapsed, ${remaining}s remaining)`,
					);
				} else if (this.isBranchReady(branch)) {
					console.log(
						`[Neon] Branch "preview/${gitBranch}" is ready (state: ${branch.current_state})`,
					);
					return branch;
				} else {
					console.log(
						`[Neon] Attempt ${attempt}: State "${branch.current_state}" (${elapsed}s elapsed, ${remaining}s remaining)`,
					);
				}

				await sleep(delay);
				delay = Math.min(delay * backoffFactor, maxDelay);
			}

			throw new Error(
				`Timeout waiting for Neon branch "preview/${gitBranch}" to become ready`,
			);
		},
	};
}

/**
 * Create a Neon client from environment variables
 * @returns {ReturnType<typeof createNeonClient>}
 */
export function createNeonClientFromEnv() {
	const apiKey = process.env.NEON_API_KEY;
	const projectId = process.env.NEON_PROJECT_ID;

	return createNeonClient({ apiKey, projectId });
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
