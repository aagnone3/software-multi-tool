/**
 * GitHub Checks API Functions
 *
 * Creates and updates GitHub Check Runs for Render preview deployments.
 * This allows developers to see Render deployment status directly in PR checks.
 */

const GITHUB_API_BASE = "https://api.github.com";
const RENDER_CHECK_NAME = "Render Preview";

/**
 * Check if GitHub Check integration is enabled
 * @returns {boolean}
 */
export function isGitHubCheckEnabled() {
	return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY);
}

/**
 * Get the check name constant
 * @returns {string}
 */
export function getCheckName() {
	return RENDER_CHECK_NAME;
}

/**
 * Make a request to the GitHub API
 * @param {string} path - API path
 * @param {RequestInit} options - Fetch options
 * @param {typeof fetch} [fetchFn=fetch] - Fetch function (for testing)
 * @returns {Promise<any>}
 */
export async function githubRequest(path, options = {}, fetchFn = fetch) {
	const token = process.env.GITHUB_TOKEN;
	if (!token) {
		throw new Error("GITHUB_TOKEN environment variable is required");
	}

	const url = `${GITHUB_API_BASE}${path}`;
	const response = await fetchFn(url, {
		...options,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (!response.ok) {
		let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
		try {
			const body = await response.json();
			if (body.message) {
				errorMessage = `GitHub API error: ${body.message}`;
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

/**
 * Build the request body for a GitHub Check Run
 * @param {string} sha - Git commit SHA
 * @param {'queued'|'in_progress'|'completed'} status - Check status
 * @param {Object} options - Additional options
 * @param {'success'|'failure'|'cancelled'|'timed_out'} [options.conclusion] - Required when status is 'completed'
 * @param {string} [options.detailsUrl] - URL to link to
 * @param {string} [options.summary] - Summary text
 * @param {string} [options.text] - Detailed text
 * @returns {Object}
 */
export function buildCheckRunBody(sha, status, options = {}) {
	const body = {
		name: RENDER_CHECK_NAME,
		head_sha: sha,
		status,
		started_at: new Date().toISOString(),
	};

	if (options.detailsUrl) {
		body.details_url = options.detailsUrl;
	}

	if (status === "completed" && options.conclusion) {
		body.conclusion = options.conclusion;
		body.completed_at = new Date().toISOString();
	}

	if (options.summary || options.text) {
		body.output = {
			title: RENDER_CHECK_NAME,
			summary: options.summary || "",
			text: options.text || "",
		};
	}

	return body;
}

/**
 * Build the update body for an existing GitHub Check Run
 * @param {'queued'|'in_progress'|'completed'} status - Check status
 * @param {Object} options - Additional options
 * @param {'success'|'failure'|'cancelled'|'timed_out'} [options.conclusion] - Required when status is 'completed'
 * @param {string} [options.detailsUrl] - URL to link to
 * @param {string} [options.summary] - Summary text
 * @param {string} [options.text] - Detailed text
 * @returns {Object}
 */
export function buildCheckRunUpdateBody(status, options = {}) {
	const body = {
		status,
	};

	if (options.detailsUrl) {
		body.details_url = options.detailsUrl;
	}

	if (status === "completed" && options.conclusion) {
		body.conclusion = options.conclusion;
		body.completed_at = new Date().toISOString();
	}

	if (options.summary || options.text) {
		body.output = {
			title: RENDER_CHECK_NAME,
			summary: options.summary || "",
			text: options.text || "",
		};
	}

	return body;
}

/**
 * Create a GitHub Check Run for Render preview deployment
 * @param {string} sha - Git commit SHA
 * @param {'queued'|'in_progress'|'completed'} status - Check status
 * @param {Object} options - Additional options
 * @param {'success'|'failure'|'cancelled'|'timed_out'} [options.conclusion] - Required when status is 'completed'
 * @param {string} [options.detailsUrl] - URL to link to
 * @param {string} [options.summary] - Summary text
 * @param {string} [options.text] - Detailed text
 * @param {typeof fetch} [fetchFn=fetch] - Fetch function (for testing)
 * @returns {Promise<{id: number}>}
 */
export async function createGitHubCheck(
	sha,
	status,
	options = {},
	fetchFn = fetch,
) {
	const repo = process.env.GITHUB_REPOSITORY;
	if (!repo) {
		throw new Error("GITHUB_REPOSITORY environment variable is required");
	}

	const body = buildCheckRunBody(sha, status, options);

	const response = await githubRequest(
		`/repos/${repo}/check-runs`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
		fetchFn,
	);

	console.log(`[GitHub] Created check run: ${response.id} (${status})`);
	return { id: response.id };
}

/**
 * Update an existing GitHub Check Run
 * @param {number} checkRunId - The check run ID to update
 * @param {'queued'|'in_progress'|'completed'} status - Check status
 * @param {Object} options - Additional options
 * @param {'success'|'failure'|'cancelled'|'timed_out'} [options.conclusion] - Required when status is 'completed'
 * @param {string} [options.detailsUrl] - URL to link to
 * @param {string} [options.summary] - Summary text
 * @param {string} [options.text] - Detailed text
 * @param {typeof fetch} [fetchFn=fetch] - Fetch function (for testing)
 * @returns {Promise<void>}
 */
export async function updateGitHubCheck(
	checkRunId,
	status,
	options = {},
	fetchFn = fetch,
) {
	const repo = process.env.GITHUB_REPOSITORY;
	if (!repo) {
		throw new Error("GITHUB_REPOSITORY environment variable is required");
	}

	const body = buildCheckRunUpdateBody(status, options);

	await githubRequest(
		`/repos/${repo}/check-runs/${checkRunId}`,
		{
			method: "PATCH",
			body: JSON.stringify(body),
		},
		fetchFn,
	);

	console.log(`[GitHub] Updated check run: ${checkRunId} (${status})`);
}

/**
 * Get the Render dashboard URL for a service
 * @param {Object} service - Render service object
 * @returns {string}
 */
export function getRenderDashboardUrl(service) {
	if (service?.dashboardUrl) {
		return service.dashboardUrl;
	}
	if (service?.id) {
		return `https://dashboard.render.com/web/${service.id}`;
	}
	return "https://dashboard.render.com";
}
