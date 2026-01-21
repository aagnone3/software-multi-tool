/**
 * Multi-tenant file upload path conventions.
 *
 * This module provides enforced path conventions for file uploads in a multi-tenant environment.
 * All paths follow a consistent structure to ensure proper isolation between organizations and users.
 *
 * ## Path Conventions
 *
 * | Upload Type         | Path Pattern                                    | Example                                        |
 * | ------------------- | ----------------------------------------------- | ---------------------------------------------- |
 * | Organization-level  | `organizations/{orgId}/{type}`                  | `organizations/abc123/logo.png`                |
 * | User-scoped (in org)| `organizations/{orgId}/users/{userId}/{type}`   | `organizations/abc123/users/user456/avatar.png`|
 * | System-level        | `system/{type}`                                 | `system/assets/default-avatar.png`             |
 *
 * @module @repo/storage/paths
 */

// ============================================================================
// Error types
// ============================================================================

/**
 * Error codes for path validation failures.
 */
export type PathErrorCode =
	| "INVALID_ORG_ID"
	| "INVALID_USER_ID"
	| "INVALID_FILE_TYPE"
	| "INVALID_SYSTEM_PATH";

/**
 * Error thrown when path validation fails.
 */
export class PathValidationError extends Error {
	readonly code: PathErrorCode;
	readonly details?: Record<string, unknown>;

	constructor(
		code: PathErrorCode,
		message: string,
		details?: Record<string, unknown>,
	) {
		super(message);
		this.name = "PathValidationError";
		this.code = code;
		this.details = details;
	}
}

// ============================================================================
// Validation helpers
// ============================================================================

/**
 * UUID v4 pattern for validating IDs.
 * Allows both lowercase and uppercase hex characters.
 */
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID.
 * Returns true for valid UUIDs, false otherwise.
 */
function isValidUuid(id: string): boolean {
	return UUID_PATTERN.test(id);
}

/**
 * Validate that a file type string is safe (no path traversal, etc.).
 * Allows alphanumeric characters, hyphens, underscores, and a single dot for extension.
 */
function isValidFileType(fileType: string): boolean {
	// Must not be empty
	if (!fileType || fileType.length === 0) {
		return false;
	}

	// Must not contain path traversal characters
	if (fileType.includes("..") || fileType.includes("/")) {
		return false;
	}

	// Allow alphanumeric, hyphens, underscores, and a single dot for extension
	// Examples: "avatar.png", "logo.png", "profile-photo.jpg"
	const SAFE_FILE_TYPE_PATTERN =
		/^[a-zA-Z0-9][a-zA-Z0-9_-]*(\.[a-zA-Z0-9]+)?$/;
	return SAFE_FILE_TYPE_PATTERN.test(fileType);
}

/**
 * Validate that a system path type is safe.
 * More restrictive than file types - only specific allowed values.
 */
function isValidSystemPathType(pathType: string): boolean {
	// Must not be empty
	if (!pathType || pathType.length === 0) {
		return false;
	}

	// Must not contain path traversal characters
	if (pathType.includes("..")) {
		return false;
	}

	// Allow alphanumeric, hyphens, underscores, and forward slashes for subdirectories
	// Examples: "assets/default-avatar.png", "templates/email-header.png"
	const SAFE_SYSTEM_PATH_PATTERN =
		/^[a-zA-Z0-9][a-zA-Z0-9_/-]*(\.[a-zA-Z0-9]+)?$/;
	return SAFE_SYSTEM_PATH_PATTERN.test(pathType);
}

// ============================================================================
// Path builder types
// ============================================================================

/**
 * Options for building organization-level paths.
 */
export interface OrgPathOptions {
	/**
	 * The organization ID (must be a valid UUID).
	 */
	organizationId: string;

	/**
	 * The file type/name (e.g., "logo.png").
	 * Must be alphanumeric with optional hyphens, underscores, and extension.
	 */
	fileType: string;
}

/**
 * Options for building user-scoped paths within an organization.
 */
export interface UserPathOptions {
	/**
	 * The organization ID (must be a valid UUID).
	 */
	organizationId: string;

	/**
	 * The user ID (must be a valid UUID).
	 */
	userId: string;

	/**
	 * The file type/name (e.g., "avatar.png").
	 * Must be alphanumeric with optional hyphens, underscores, and extension.
	 */
	fileType: string;
}

/**
 * Options for building system-level paths.
 */
export interface SystemPathOptions {
	/**
	 * The path type (e.g., "assets/default-avatar.png").
	 * Can include subdirectories using forward slashes.
	 */
	pathType: string;
}

// ============================================================================
// Path builders
// ============================================================================

/**
 * Build a path for organization-level files.
 *
 * @param options - Options containing organizationId and fileType
 * @returns The constructed path
 * @throws {PathValidationError} If organizationId or fileType is invalid
 *
 * @example
 * ```typescript
 * const path = buildOrgPath({
 *   organizationId: "abc123-uuid-here",
 *   fileType: "logo.png"
 * });
 * // Returns: "organizations/abc123-uuid-here/logo.png"
 * ```
 */
export function buildOrgPath(options: OrgPathOptions): string {
	const { organizationId, fileType } = options;

	if (!organizationId || !isValidUuid(organizationId)) {
		throw new PathValidationError(
			"INVALID_ORG_ID",
			"Organization ID must be a valid UUID",
			{ provided: organizationId },
		);
	}

	if (!isValidFileType(fileType)) {
		throw new PathValidationError(
			"INVALID_FILE_TYPE",
			"File type must be alphanumeric with optional hyphens, underscores, and extension",
			{ provided: fileType },
		);
	}

	return `organizations/${organizationId}/${fileType}`;
}

/**
 * Build a path for user-scoped files within an organization.
 *
 * This is the preferred path pattern for user-specific files like avatars,
 * as it maintains multi-tenant isolation by including the organization context.
 *
 * @param options - Options containing organizationId, userId, and fileType
 * @returns The constructed path
 * @throws {PathValidationError} If organizationId, userId, or fileType is invalid
 *
 * @example
 * ```typescript
 * const path = buildUserPath({
 *   organizationId: "org-uuid-here",
 *   userId: "user-uuid-here",
 *   fileType: "avatar.png"
 * });
 * // Returns: "organizations/org-uuid-here/users/user-uuid-here/avatar.png"
 * ```
 */
export function buildUserPath(options: UserPathOptions): string {
	const { organizationId, userId, fileType } = options;

	if (!organizationId || !isValidUuid(organizationId)) {
		throw new PathValidationError(
			"INVALID_ORG_ID",
			"Organization ID must be a valid UUID",
			{ provided: organizationId },
		);
	}

	if (!userId || !isValidUuid(userId)) {
		throw new PathValidationError(
			"INVALID_USER_ID",
			"User ID must be a valid UUID",
			{ provided: userId },
		);
	}

	if (!isValidFileType(fileType)) {
		throw new PathValidationError(
			"INVALID_FILE_TYPE",
			"File type must be alphanumeric with optional hyphens, underscores, and extension",
			{ provided: fileType },
		);
	}

	return `organizations/${organizationId}/users/${userId}/${fileType}`;
}

/**
 * Build a path for system-level files (admin only).
 *
 * System paths are for shared assets that don't belong to any organization,
 * such as default avatars, email templates, etc.
 *
 * @param options - Options containing pathType
 * @returns The constructed path
 * @throws {PathValidationError} If pathType is invalid
 *
 * @example
 * ```typescript
 * const path = buildSystemPath({
 *   pathType: "assets/default-avatar.png"
 * });
 * // Returns: "system/assets/default-avatar.png"
 * ```
 */
export function buildSystemPath(options: SystemPathOptions): string {
	const { pathType } = options;

	if (!isValidSystemPathType(pathType)) {
		throw new PathValidationError(
			"INVALID_SYSTEM_PATH",
			"System path type must be alphanumeric with optional hyphens, underscores, slashes, and extension",
			{ provided: pathType },
		);
	}

	return `system/${pathType}`;
}

// ============================================================================
// Path parsing utilities
// ============================================================================

/**
 * Parsed components from a storage path.
 */
export type ParsedPath =
	| {
			type: "organization";
			organizationId: string;
			fileType: string;
	  }
	| {
			type: "user";
			organizationId: string;
			userId: string;
			fileType: string;
	  }
	| {
			type: "system";
			pathType: string;
	  }
	| {
			type: "legacy";
			rawPath: string;
	  };

/**
 * Parse a storage path to extract its components.
 *
 * This is useful for migration scripts and debugging.
 *
 * @param path - The storage path to parse
 * @returns Parsed path components
 *
 * @example
 * ```typescript
 * const parsed = parsePath("organizations/abc123/users/user456/avatar.png");
 * // Returns: { type: "user", organizationId: "abc123", userId: "user456", fileType: "avatar.png" }
 *
 * const legacy = parsePath("users/user123/avatar.png");
 * // Returns: { type: "legacy", rawPath: "users/user123/avatar.png" }
 * ```
 */
export function parsePath(path: string): ParsedPath {
	// System paths: system/{pathType}
	if (path.startsWith("system/")) {
		return {
			type: "system",
			pathType: path.slice("system/".length),
		};
	}

	// Organization paths: organizations/{orgId}/...
	if (path.startsWith("organizations/")) {
		const withoutPrefix = path.slice("organizations/".length);
		const parts = withoutPrefix.split("/");

		if (parts.length < 2) {
			return { type: "legacy", rawPath: path };
		}

		const organizationId = parts[0];

		// User paths: organizations/{orgId}/users/{userId}/{fileType}
		if (parts[1] === "users" && parts.length >= 4) {
			const userId = parts[2];
			const fileType = parts.slice(3).join("/");
			return {
				type: "user",
				organizationId,
				userId,
				fileType,
			};
		}

		// Organization paths: organizations/{orgId}/{fileType}
		const fileType = parts.slice(1).join("/");
		return {
			type: "organization",
			organizationId,
			fileType,
		};
	}

	// Legacy paths (e.g., users/{userId}/avatar.png)
	return { type: "legacy", rawPath: path };
}

/**
 * Check if a path follows the legacy format that needs migration.
 *
 * Legacy paths are those that don't follow the new multi-tenant conventions:
 * - `users/{userId}/...` (should be `organizations/{orgId}/users/{userId}/...`)
 *
 * @param path - The storage path to check
 * @returns True if the path is a legacy path that needs migration
 */
export function isLegacyPath(path: string): boolean {
	const parsed = parsePath(path);
	return parsed.type === "legacy";
}

/**
 * Check if a path follows the new multi-tenant conventions.
 *
 * @param path - The storage path to check
 * @returns True if the path follows the new conventions
 */
export function isMultiTenantPath(path: string): boolean {
	const parsed = parsePath(path);
	return (
		parsed.type === "organization" ||
		parsed.type === "user" ||
		parsed.type === "system"
	);
}
