#!/usr/bin/env node

/**
 * Supabase Management API Client
 *
 * Provides functions to interact with the Supabase Management API
 * for branch management and database credential retrieval.
 *
 * API Documentation: https://supabase.com/docs/reference/api
 */

const API_BASE_URL = "https://api.supabase.com/v1";

/**
 * @typedef {Object} SupabaseClientConfig
 * @property {string} accessToken - Supabase access token
 * @property {string} projectRef - Supabase project reference ID
 */

/**
 * @typedef {Object} SupabaseBranch
 * @property {string} id - Branch ID
 * @property {string} name - Branch name (git branch name)
 * @property {string} project_ref - Project reference
 * @property {string} git_branch - Git branch name
 * @property {string} status - Branch status (e.g., "ACTIVE_HEALTHY", "COMING_UP")
 * @property {string} [db_host] - Database host (when ready)
 * @property {number} [db_port] - Database port (when ready)
 * @property {string} [db_user] - Database user (when ready)
 * @property {string} [db_pass] - Database password (when ready)
 * @property {string} [postgres_version] - PostgreSQL version
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} BranchCredentials
 * @property {string} poolerUrl - Pooled connection URL (for app runtime)
 * @property {string} directUrl - Direct connection URL (for migrations)
 */

/**
 * Create a Supabase Management API client
 *
 * @param {SupabaseClientConfig} config - Client configuration
 * @returns {Object} Client with API methods
 */
export function createSupabaseClient(config) {
	const { accessToken, projectRef } = config;

	if (!accessToken) {
		throw new Error(
			"SUPABASE_ACCESS_TOKEN is required. Get it from Supabase Dashboard → Account → Access Tokens.",
		);
	}

	if (!projectRef) {
		throw new Error(
			"SUPABASE_PROJECT_REF is required. This is your project reference ID (e.g., 'rhcyfnrwgavrtxkiwzyv').",
		);
	}

	/**
	 * Retry a function with exponential backoff for transient errors
	 * @param {Function} fn - Async function to retry
	 * @param {Object} retryOptions - Retry options
	 * @returns {Promise<any>}
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
					`  [Supabase] Retry ${attempt}/${maxRetries} after error: ${error.message}`,
				);
				await sleep(delay);
				delay = Math.min(delay * 2, maxDelay);
			}
		}

		throw lastError;
	}

	/**
	 * Make an API request to Supabase Management API
	 * @param {string} path - API path
	 * @param {RequestInit} [options] - Fetch options
	 * @returns {Promise<any>}
	 */
	async function request(path, options = {}) {
		return withRetry(async () => {
			const url = `${API_BASE_URL}${path}`;

			const response = await fetch(url, {
				...options,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
					...options.headers,
				},
			});

			if (!response.ok) {
				let errorMessage = `Supabase API error: ${response.status} ${response.statusText}`;
				try {
					const body = await response.json();
					if (body.message) {
						errorMessage = `Supabase API error: ${body.message}`;
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

	// Cache for parent project details
	let cachedProject = null;

	return {
		/**
		 * Get the parent project details including region
		 * @returns {Promise<Object>} Project details with region field
		 */
		async getProject() {
			if (!cachedProject) {
				cachedProject = await request(`/projects/${projectRef}`);
			}
			return cachedProject;
		},

		/**
		 * List all branches for the project
		 * @returns {Promise<SupabaseBranch[]>}
		 */
		async listBranches() {
			return request(`/projects/${projectRef}/branches`);
		},

		/**
		 * Get a specific branch by ID with full configuration including database credentials.
		 * Note: The /branches/{id} endpoint returns db_host, db_pass, db_port, db_user
		 * while the /projects/{ref}/branches endpoint only returns basic info.
		 * @param {string} branchId - Branch ID
		 * @returns {Promise<SupabaseBranch>}
		 */
		async getBranch(branchId) {
			// Use /branches/{id} endpoint to get full configuration including db credentials
			return request(`/branches/${branchId}`);
		},

		/**
		 * Find a branch by git branch name and fetch its full configuration.
		 * This first lists branches to find the ID, then fetches full details
		 * including database credentials from the /branches/{id} endpoint.
		 * @param {string} gitBranch - Git branch name (e.g., "chore/pra-99-supabase-branching")
		 * @returns {Promise<SupabaseBranch | null>}
		 */
		async findBranchByGitBranch(gitBranch) {
			const branches = await this.listBranches();
			const branch = branches.find((b) => b.git_branch === gitBranch);
			if (!branch) {
				return null;
			}
			// Fetch full branch config including database credentials
			return this.getBranch(branch.id);
		},

		/**
		 * Get the pooler configuration for a project (or branch)
		 * Returns the connection string directly from the Supabase API
		 * @param {string} ref - Project or branch reference ID
		 * @returns {Promise<Object[]>} Pooler config including connectionString
		 */
		async getPoolerConfig(ref) {
			return request(`/projects/${ref}/config/database/pooler`);
		},

		/**
		 * Get database credentials for a branch
		 * Fetches the pooler URL directly from Supabase API instead of constructing it
		 * @param {SupabaseBranch} branch - Branch object with database info
		 * @returns {Promise<BranchCredentials>}
		 */
		async getBranchCredentials(branch) {
			if (!branch.db_host || !branch.db_pass) {
				throw new Error(
					`Branch "${branch.name}" is not ready. Status: ${branch.status}`,
				);
			}

			const dbHost = branch.db_host;
			const dbPort = branch.db_port || 5432;
			const dbUser = branch.db_user || "postgres";
			const dbPass = branch.db_pass;
			const dbName = "postgres";

			// Direct connection (for migrations)
			// Uses the branch's direct database host
			const directUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPass)}@${dbHost}:${dbPort}/${dbName}`;

			// Pooler connection (for app runtime)
			// Fetch the pooler config from Supabase API to get the correct connection string
			// The API returns the properly formatted URL with the correct regional host
			const branchRef = branch.ref || branch.project_ref;
			let poolerUrl;

			try {
				const poolerConfigs = await this.getPoolerConfig(branchRef);
				// Find the transaction mode pooler (port 6543) or fall back to first available
				const transactionPooler = poolerConfigs.find(
					(p) => p.pool_mode === "transaction" || p.db_port === 6543,
				);
				const poolerConfig = transactionPooler || poolerConfigs[0];

				if (poolerConfig?.db_host) {
					// Use the regional pooler host from the API response
					// but construct the URL ourselves with the correct BRANCH ref in the username
					// (The API's connectionString might have the parent's ref, not the branch's)
					const poolerHost = poolerConfig.db_host;
					const poolerPort = poolerConfig.db_port || 6543;
					poolerUrl = `postgresql://${dbUser}.${branchRef}:${encodeURIComponent(dbPass)}@${poolerHost}:${poolerPort}/${dbName}?pgbouncer=true`;
					console.log(
						`  [Supabase] Using pooler host from API: ${poolerHost}:${poolerPort}`,
					);
				}
			} catch (error) {
				console.log(
					`  [Supabase] Could not fetch pooler config for branch ${branchRef}: ${error.message}`,
				);
			}

			// Fallback: construct URL using parent project's region if API call fails
			if (!poolerUrl) {
				const project = await this.getProject();
				const region = project.region;
				console.log(
					`  [Supabase] Constructing pooler URL using region: ${region}`,
				);
				const poolerHost = `aws-0-${region}.pooler.supabase.com`;
				const poolerPort = 6543;
				poolerUrl = `postgresql://${dbUser}.${branchRef}:${encodeURIComponent(dbPass)}@${poolerHost}:${poolerPort}/${dbName}?pgbouncer=true`;
			}

			return { poolerUrl, directUrl };
		},

		/**
		 * Check if a branch is ready for database connections.
		 * A branch is ready when it has database credentials (db_host and db_pass),
		 * regardless of the exact status string. This handles cases where the status
		 * is "FUNCTIONS_DEPLOYED" (edge functions deployed) but database is ready.
		 * @param {SupabaseBranch} branch - Branch object
		 * @returns {boolean}
		 */
		isBranchReady(branch) {
			// Primary check: database credentials must be present
			const hasCredentials = !!branch.db_host && !!branch.db_pass;

			// Known ready statuses (may expand as Supabase adds new statuses)
			const readyStatuses = ["ACTIVE_HEALTHY", "FUNCTIONS_DEPLOYED"];
			const hasReadyStatus = readyStatuses.includes(branch.status);

			return hasCredentials && hasReadyStatus;
		},

		/**
		 * Wait for a branch to become ready
		 * @param {string} gitBranch - Git branch name
		 * @param {Object} [options] - Wait options
		 * @param {number} [options.timeoutMs=600000] - Timeout in milliseconds (default 10 minutes)
		 * @param {number} [options.initialDelay=5000] - Initial delay in ms
		 * @param {number} [options.maxDelay=30000] - Maximum delay in ms
		 * @param {number} [options.backoffFactor=1.5] - Backoff multiplier
		 * @returns {Promise<SupabaseBranch>}
		 */
		async waitForBranch(gitBranch, options = {}) {
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
				const branch = await this.findBranchByGitBranch(gitBranch);

				const elapsed = Math.round((Date.now() - startTime) / 1000);
				const remaining = Math.round(
					(timeoutMs - (Date.now() - startTime)) / 1000,
				);

				if (!branch) {
					console.log(
						`[Supabase] Attempt ${attempt}: Branch not found (${elapsed}s elapsed, ${remaining}s remaining)`,
					);
				} else if (this.isBranchReady(branch)) {
					console.log(
						`[Supabase] Branch "${gitBranch}" is ready (status: ${branch.status})`,
					);
					return branch;
				} else {
					console.log(
						`[Supabase] Attempt ${attempt}: Status "${branch.status}" (${elapsed}s elapsed, ${remaining}s remaining)`,
					);
				}

				await sleep(delay);
				delay = Math.min(delay * backoffFactor, maxDelay);
			}

			throw new Error(
				`Timeout waiting for Supabase branch "${gitBranch}" to become ready`,
			);
		},
	};
}

/**
 * Create a Supabase client from environment variables
 * @returns {ReturnType<typeof createSupabaseClient>}
 */
export function createSupabaseClientFromEnv() {
	const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
	const projectRef = process.env.SUPABASE_PROJECT_REF;

	return createSupabaseClient({ accessToken, projectRef });
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
