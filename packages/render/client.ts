import type {
	DeployResponse,
	EnvVarInput,
	ListDeploysFilters,
	ListServicesFilters,
	PaginatedResponse,
	RenderClientConfig,
	RenderDeploy,
	RenderEnvVar,
	RenderError,
	RenderErrorCode,
	RenderService,
	ServiceResponse,
	TriggerDeployOptions,
} from "./types";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BASE_URL = "https://api.render.com/v1";
const DEFAULT_TIMEOUT = 30000;

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Error thrown when a Render API operation fails.
 */
export class RenderApiError extends Error implements RenderError {
	readonly code: RenderErrorCode;
	readonly status?: number;
	readonly details?: Record<string, unknown>;

	constructor(error: RenderError) {
		super(error.message);
		this.name = "RenderApiError";
		this.code = error.code;
		this.status = error.status;
		this.details = error.details;
	}
}

// ============================================================================
// Render API Client
// ============================================================================

/**
 * Typed client for interacting with the Render API.
 *
 * @example
 * ```typescript
 * const client = createRenderClient({
 *   apiKey: process.env.RENDER_API_KEY!
 * });
 *
 * // List all services
 * const services = await client.listServices();
 *
 * // Trigger a deploy
 * const deploy = await client.triggerDeploy("srv-xxx");
 *
 * // Set an environment variable
 * await client.setEnvVar("srv-xxx", { key: "API_URL", value: "https://api.example.com" });
 * ```
 */
export interface RenderClient {
	// ============================================================================
	// Service Operations
	// ============================================================================

	/**
	 * List services matching the provided filters.
	 *
	 * @param filters - Optional filters to narrow results
	 * @returns Paginated list of services
	 */
	listServices(
		filters?: ListServicesFilters,
	): Promise<PaginatedResponse<RenderService>>;

	/**
	 * Get details for a specific service.
	 *
	 * @param serviceId - The service ID
	 * @returns Service details
	 */
	getService(serviceId: string): Promise<RenderService>;

	// ============================================================================
	// Deploy Operations
	// ============================================================================

	/**
	 * List deploys for a service.
	 *
	 * @param serviceId - The service ID
	 * @param filters - Optional pagination filters
	 * @returns Paginated list of deploys
	 */
	listDeploys(
		serviceId: string,
		filters?: ListDeploysFilters,
	): Promise<PaginatedResponse<RenderDeploy>>;

	/**
	 * Get details for a specific deploy.
	 *
	 * @param serviceId - The service ID
	 * @param deployId - The deploy ID
	 * @returns Deploy details
	 */
	getDeploy(serviceId: string, deployId: string): Promise<RenderDeploy>;

	/**
	 * Trigger a new deploy for a service.
	 *
	 * @param serviceId - The service ID
	 * @param options - Deploy options
	 * @returns The created deploy
	 */
	triggerDeploy(
		serviceId: string,
		options?: TriggerDeployOptions,
	): Promise<RenderDeploy>;

	/**
	 * Cancel a running deploy.
	 *
	 * @param serviceId - The service ID
	 * @param deployId - The deploy ID
	 * @returns The cancelled deploy
	 */
	cancelDeploy(serviceId: string, deployId: string): Promise<RenderDeploy>;

	// ============================================================================
	// Environment Variable Operations
	// ============================================================================

	/**
	 * List environment variables for a service.
	 *
	 * @param serviceId - The service ID
	 * @returns List of environment variables
	 */
	listEnvVars(serviceId: string): Promise<RenderEnvVar[]>;

	/**
	 * Get a specific environment variable.
	 *
	 * @param serviceId - The service ID
	 * @param key - The environment variable key
	 * @returns The environment variable
	 */
	getEnvVar(serviceId: string, key: string): Promise<RenderEnvVar>;

	/**
	 * Set (create or update) an environment variable.
	 *
	 * @param serviceId - The service ID
	 * @param envVar - The environment variable to set
	 */
	setEnvVar(serviceId: string, envVar: EnvVarInput): Promise<void>;

	/**
	 * Delete an environment variable.
	 *
	 * @param serviceId - The service ID
	 * @param key - The environment variable key to delete
	 */
	deleteEnvVar(serviceId: string, key: string): Promise<void>;

	/**
	 * Update multiple environment variables at once.
	 * This replaces all environment variables for the service.
	 *
	 * @param serviceId - The service ID
	 * @param envVars - The environment variables to set
	 */
	setEnvVars(serviceId: string, envVars: EnvVarInput[]): Promise<void>;
}

// ============================================================================
// Internal Implementation
// ============================================================================

class RenderClientImpl implements RenderClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly timeout: number;

	constructor(config: RenderClientConfig) {
		this.apiKey = config.apiKey;
		this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
		this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
	}

	// ============================================================================
	// Service Operations
	// ============================================================================

	async listServices(
		filters?: ListServicesFilters,
	): Promise<PaginatedResponse<RenderService>> {
		const params = new URLSearchParams();

		if (filters?.name) {
			params.set("name", filters.name);
		}
		if (filters?.type) {
			const types = Array.isArray(filters.type)
				? filters.type
				: [filters.type];
			for (const t of types) {
				params.append("type", t);
			}
		}
		if (filters?.env) {
			const envs = Array.isArray(filters.env)
				? filters.env
				: [filters.env];
			for (const e of envs) {
				params.append("env", e);
			}
		}
		if (filters?.region) {
			params.set("region", filters.region);
		}
		if (filters?.suspended) {
			params.set("suspended", filters.suspended);
		}
		if (filters?.ownerId) {
			params.set("ownerId", filters.ownerId);
		}
		if (filters?.cursor) {
			params.set("cursor", filters.cursor);
		}
		if (filters?.limit) {
			params.set("limit", String(filters.limit));
		}

		const queryString = params.toString();
		const url = queryString ? `/services?${queryString}` : "/services";
		const response = await this.request<ServiceResponse[]>(url);

		// The API returns an array of { service: RenderService } objects
		const items = response.map((r) => r.service);

		// Extract cursor from Link header if present (handled in request method)
		return { items };
	}

	async getService(serviceId: string): Promise<RenderService> {
		const response = await this.request<ServiceResponse>(
			`/services/${serviceId}`,
		);
		return response.service;
	}

	// ============================================================================
	// Deploy Operations
	// ============================================================================

	async listDeploys(
		serviceId: string,
		filters?: ListDeploysFilters,
	): Promise<PaginatedResponse<RenderDeploy>> {
		const params = new URLSearchParams();

		if (filters?.cursor) {
			params.set("cursor", filters.cursor);
		}
		if (filters?.limit) {
			params.set("limit", String(filters.limit));
		}

		const queryString = params.toString();
		const url = queryString
			? `/services/${serviceId}/deploys?${queryString}`
			: `/services/${serviceId}/deploys`;
		const response = await this.request<DeployResponse[]>(url);

		const items = response.map((r) => r.deploy);
		return { items };
	}

	async getDeploy(
		serviceId: string,
		deployId: string,
	): Promise<RenderDeploy> {
		const response = await this.request<DeployResponse>(
			`/services/${serviceId}/deploys/${deployId}`,
		);
		return response.deploy;
	}

	async triggerDeploy(
		serviceId: string,
		options?: TriggerDeployOptions,
	): Promise<RenderDeploy> {
		const body = options?.clearCache ? { clearCache: "clear" } : {};
		const response = await this.request<DeployResponse>(
			`/services/${serviceId}/deploys`,
			{
				method: "POST",
				body: JSON.stringify(body),
			},
		);
		return response.deploy;
	}

	async cancelDeploy(
		serviceId: string,
		deployId: string,
	): Promise<RenderDeploy> {
		const response = await this.request<DeployResponse>(
			`/services/${serviceId}/deploys/${deployId}/cancel`,
			{ method: "POST" },
		);
		return response.deploy;
	}

	// ============================================================================
	// Environment Variable Operations
	// ============================================================================

	async listEnvVars(serviceId: string): Promise<RenderEnvVar[]> {
		const response = await this.request<Array<{ envVar: RenderEnvVar }>>(
			`/services/${serviceId}/env-vars`,
		);
		return response.map((r) => r.envVar);
	}

	async getEnvVar(serviceId: string, key: string): Promise<RenderEnvVar> {
		const response = await this.request<{ envVar: RenderEnvVar }>(
			`/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
		);
		return response.envVar;
	}

	async setEnvVar(serviceId: string, envVar: EnvVarInput): Promise<void> {
		await this.request(
			`/services/${serviceId}/env-vars/${encodeURIComponent(envVar.key)}`,
			{
				method: "PUT",
				body: JSON.stringify({ value: envVar.value }),
			},
		);
	}

	async deleteEnvVar(serviceId: string, key: string): Promise<void> {
		await this.request(
			`/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
			{ method: "DELETE" },
		);
	}

	async setEnvVars(serviceId: string, envVars: EnvVarInput[]): Promise<void> {
		await this.request(`/services/${serviceId}/env-vars`, {
			method: "PUT",
			body: JSON.stringify(envVars),
		});
	}

	// ============================================================================
	// Internal HTTP Methods
	// ============================================================================

	private async request<T>(
		path: string,
		options: RequestInit = {},
	): Promise<T> {
		const url = `${this.baseUrl}${path}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal,
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
					Accept: "application/json",
					...options.headers,
				},
			});

			if (!response.ok) {
				throw await this.handleErrorResponse(response);
			}

			// Handle empty responses (204 No Content)
			if (response.status === 204) {
				return undefined as T;
			}

			const text = await response.text();
			if (!text) {
				return undefined as T;
			}

			return JSON.parse(text) as T;
		} catch (error) {
			if (error instanceof RenderApiError) {
				throw error;
			}

			if (error instanceof Error) {
				if (error.name === "AbortError") {
					throw new RenderApiError({
						code: "network_error",
						message: `Request timed out after ${this.timeout}ms`,
					});
				}

				throw new RenderApiError({
					code: "network_error",
					message: error.message,
				});
			}

			throw new RenderApiError({
				code: "network_error",
				message: "An unknown error occurred",
			});
		} finally {
			clearTimeout(timeoutId);
		}
	}

	private async handleErrorResponse(
		response: Response,
	): Promise<RenderApiError> {
		const status = response.status;
		let message = `HTTP ${status}`;
		let details: Record<string, unknown> | undefined;

		try {
			const body = await response.json();
			message = body.message || body.error || message;
			details = body;
		} catch {
			// Ignore JSON parse errors
		}

		let code: RenderErrorCode;
		switch (status) {
			case 401:
				code = "unauthorized";
				message = message || "Invalid API key";
				break;
			case 403:
				code = "forbidden";
				message = message || "Access denied";
				break;
			case 404:
				code = "not_found";
				message = message || "Resource not found";
				break;
			case 429:
				code = "rate_limited";
				message = message || "Rate limit exceeded";
				break;
			case 422:
			case 400:
				code = "validation_error";
				break;
			default:
				code = status >= 500 ? "server_error" : "validation_error";
		}

		return new RenderApiError({ code, message, status, details });
	}
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a Render API client.
 *
 * @param config - Client configuration
 * @returns A configured Render API client
 *
 * @example
 * ```typescript
 * const client = createRenderClient({
 *   apiKey: process.env.RENDER_API_KEY!
 * });
 *
 * // List all web services
 * const services = await client.listServices({ type: "web_service" });
 *
 * // Get service details
 * const service = await client.getService("srv-xxx");
 *
 * // Trigger a deploy
 * const deploy = await client.triggerDeploy("srv-xxx");
 *
 * // Manage environment variables
 * await client.setEnvVar("srv-xxx", { key: "API_KEY", value: "secret" });
 * const envVars = await client.listEnvVars("srv-xxx");
 * ```
 */
export function createRenderClient(config: RenderClientConfig): RenderClient {
	if (!config.apiKey) {
		throw new Error("Render API key is required");
	}

	return new RenderClientImpl(config);
}

/**
 * Create a Render API client from environment variables.
 *
 * Uses `RENDER_API_KEY` from the environment.
 *
 * @returns A configured Render API client
 * @throws If RENDER_API_KEY is not set
 *
 * @example
 * ```typescript
 * const client = createRenderClientFromEnv();
 * const services = await client.listServices();
 * ```
 */
export function createRenderClientFromEnv(): RenderClient {
	const apiKey = process.env.RENDER_API_KEY;
	if (!apiKey) {
		throw new Error(
			"RENDER_API_KEY environment variable is required. " +
				"Get your API key from the Render Dashboard > Account Settings > API Keys.",
		);
	}

	return createRenderClient({ apiKey });
}
