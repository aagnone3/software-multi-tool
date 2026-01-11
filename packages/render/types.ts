// ============================================================================
// Render API Types
// Based on https://api-docs.render.com/reference/introduction
// ============================================================================

// ============================================================================
// Service Types
// ============================================================================

/**
 * Service types supported by Render.
 */
export type ServiceType =
	| "web_service"
	| "private_service"
	| "background_worker"
	| "static_site"
	| "cron_job";

/**
 * Possible states for a Render service.
 */
export type ServiceStatus =
	| "created"
	| "building"
	| "deploying"
	| "running"
	| "deactivated"
	| "suspended";

/**
 * Service runtime environment.
 */
export type ServiceEnv = "docker" | "elixir" | "go" | "node" | "python" | "ruby" | "rust" | "static";

/**
 * Represents a Render service.
 */
export interface RenderService {
	/**
	 * Unique service identifier.
	 */
	id: string;

	/**
	 * Auto-deploy status (on/off).
	 */
	autoDeploy: "yes" | "no";

	/**
	 * Git branch for deployments.
	 */
	branch: string;

	/**
	 * Build filter pattern.
	 */
	buildFilter?: {
		paths: string[];
		ignoredPaths: string[];
	};

	/**
	 * When the service was created.
	 */
	createdAt: string;

	/**
	 * Dashboard URL for this service.
	 */
	dashboardUrl: string;

	/**
	 * Runtime environment type.
	 */
	env: ServiceEnv;

	/**
	 * Environment ID.
	 */
	envId?: string;

	/**
	 * Image path (for Docker services).
	 */
	imagePath?: string;

	/**
	 * Service name.
	 */
	name: string;

	/**
	 * Whether notifications are enabled.
	 */
	notifyOnFail: "default" | "notify" | "ignore";

	/**
	 * Owner ID (user or team).
	 */
	ownerId: string;

	/**
	 * Repository URL.
	 */
	repo: string;

	/**
	 * Root directory in the repository.
	 */
	rootDir?: string;

	/**
	 * Service slug (URL-friendly name).
	 */
	slug: string;

	/**
	 * Whether the service is suspended.
	 */
	suspended: "suspended" | "not_suspended";

	/**
	 * Whether the service can be resumed after suspension.
	 */
	suspenders?: string[];

	/**
	 * Service type.
	 */
	type: ServiceType;

	/**
	 * When the service was last updated.
	 */
	updatedAt: string;

	/**
	 * Service details specific to the service type.
	 */
	serviceDetails?: ServiceDetails;
}

/**
 * Service-type-specific details.
 */
export interface ServiceDetails {
	/**
	 * Build command.
	 */
	buildCommand?: string;

	/**
	 * Disk storage configuration.
	 */
	disk?: {
		id: string;
		name: string;
		sizeGB: number;
		mountPath: string;
	};

	/**
	 * Docker configuration.
	 */
	dockerCommand?: string;
	dockerContext?: string;
	dockerfilePath?: string;

	/**
	 * Health check path.
	 */
	healthCheckPath?: string;

	/**
	 * Number of instances.
	 */
	numInstances?: number;

	/**
	 * Open ports configuration (internal services).
	 */
	openPorts?: Array<{
		port: number;
		protocol: "TCP" | "UDP";
	}>;

	/**
	 * Parent server ID.
	 */
	parentServer?: {
		id: string;
		name: string;
	};

	/**
	 * Instance plan type.
	 */
	plan?: string;

	/**
	 * Pull request previews enabled.
	 */
	previews?: {
		generation: "on" | "off" | "manual";
	};

	/**
	 * Publish path for static sites.
	 */
	publishPath?: string;

	/**
	 * Region for the service.
	 */
	region?: string;

	/**
	 * Schedule for cron jobs.
	 */
	schedule?: string;

	/**
	 * Start command.
	 */
	startCommand?: string;

	/**
	 * Service URL.
	 */
	url?: string;
}

// ============================================================================
// Deploy Types
// ============================================================================

/**
 * Possible deploy statuses.
 */
export type DeployStatus =
	| "created"
	| "build_in_progress"
	| "update_in_progress"
	| "live"
	| "deactivated"
	| "build_failed"
	| "update_failed"
	| "canceled"
	| "pre_deploy_in_progress"
	| "pre_deploy_failed";

/**
 * Trigger that initiated the deploy.
 */
export type DeployTrigger =
	| "api"
	| "deploy_hook"
	| "git_push"
	| "manual"
	| "new_commit"
	| "rollback"
	| "resume"
	| "auto_deploy"
	| "sync";

/**
 * Represents a Render deploy.
 */
export interface RenderDeploy {
	/**
	 * Unique deploy identifier.
	 */
	id: string;

	/**
	 * Commit information.
	 */
	commit?: {
		id: string;
		message: string;
		createdAt: string;
	};

	/**
	 * When the deploy was created.
	 */
	createdAt: string;

	/**
	 * When the deploy finished (if completed).
	 */
	finishedAt?: string;

	/**
	 * Image URL (for Docker deploys).
	 */
	image?: {
		ref: string;
		sha: string;
	};

	/**
	 * Deploy status.
	 */
	status: DeployStatus;

	/**
	 * What triggered this deploy.
	 */
	trigger: DeployTrigger;

	/**
	 * When the deploy was last updated.
	 */
	updatedAt: string;
}

// ============================================================================
// Environment Variable Types
// ============================================================================

/**
 * Represents an environment variable on a Render service.
 */
export interface RenderEnvVar {
	/**
	 * Environment variable key/name.
	 */
	key: string;

	/**
	 * Environment variable value.
	 * May be undefined if the value is secret and not returned.
	 */
	value?: string;
}

/**
 * Input for creating or updating an environment variable.
 */
export interface EnvVarInput {
	/**
	 * Environment variable key/name.
	 */
	key: string;

	/**
	 * Environment variable value.
	 */
	value: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Paginated list response from Render API.
 */
export interface PaginatedResponse<T> {
	/**
	 * Items in the current page.
	 */
	items: T[];

	/**
	 * Cursor for the next page, if available.
	 */
	cursor?: string;
}

/**
 * Response wrapper for a single service.
 */
export interface ServiceResponse {
	service: RenderService;
}

/**
 * Response wrapper for a single deploy.
 */
export interface DeployResponse {
	deploy: RenderDeploy;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes returned by the Render API.
 */
export type RenderErrorCode =
	| "unauthorized"
	| "forbidden"
	| "not_found"
	| "rate_limited"
	| "server_error"
	| "validation_error"
	| "network_error";

/**
 * Error thrown by Render API operations.
 */
export interface RenderError {
	/**
	 * Error code for programmatic handling.
	 */
	code: RenderErrorCode;

	/**
	 * Human-readable error message.
	 */
	message: string;

	/**
	 * HTTP status code.
	 */
	status?: number;

	/**
	 * Additional error details from the API.
	 */
	details?: Record<string, unknown>;
}

// ============================================================================
// Client Configuration Types
// ============================================================================

/**
 * Configuration for creating a Render API client.
 */
export interface RenderClientConfig {
	/**
	 * Render API key.
	 * Can be obtained from the Render Dashboard > Account Settings > API Keys.
	 */
	apiKey: string;

	/**
	 * Base URL for the Render API.
	 * @default "https://api.render.com/v1"
	 */
	baseUrl?: string;

	/**
	 * Request timeout in milliseconds.
	 * @default 30000
	 */
	timeout?: number;
}

// ============================================================================
// Query/Filter Types
// ============================================================================

/**
 * Filters for listing services.
 */
export interface ListServicesFilters {
	/**
	 * Filter by service name.
	 */
	name?: string;

	/**
	 * Filter by service type.
	 */
	type?: ServiceType | ServiceType[];

	/**
	 * Filter by environment.
	 */
	env?: ServiceEnv | ServiceEnv[];

	/**
	 * Filter by region.
	 */
	region?: string;

	/**
	 * Filter by suspended status.
	 */
	suspended?: "suspended" | "not_suspended";

	/**
	 * Owner ID to filter by.
	 */
	ownerId?: string;

	/**
	 * Cursor for pagination.
	 */
	cursor?: string;

	/**
	 * Number of results per page.
	 * @default 20
	 */
	limit?: number;
}

/**
 * Filters for listing deploys.
 */
export interface ListDeploysFilters {
	/**
	 * Cursor for pagination.
	 */
	cursor?: string;

	/**
	 * Number of results per page.
	 * @default 20
	 */
	limit?: number;
}

/**
 * Options for triggering a deploy.
 */
export interface TriggerDeployOptions {
	/**
	 * Whether to clear the build cache before building.
	 * @default false
	 */
	clearCache?: boolean;
}
