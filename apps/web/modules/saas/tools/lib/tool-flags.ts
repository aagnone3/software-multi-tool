import { config } from "@repo/config";
import type { ToolConfig } from "@repo/config/types";

/**
 * Parses the ENABLED_TOOLS environment variable.
 *
 * Format: Comma-separated list of tool slugs.
 * Example: "bg-remover,news-analyzer,invoice-processor"
 *
 * Edge cases handled:
 * - Empty/undefined: All tools are considered enabled (backwards compatibility)
 * - Whitespace: Trimmed from around slugs
 * - Empty strings after split: Filtered out
 *
 * @returns Array of enabled tool slugs, or null if env var is not set
 */
export function parseEnabledToolsEnv(): string[] | null {
	const envValue = process.env.NEXT_PUBLIC_ENABLED_TOOLS;

	// If env var is not set or empty, return null (meaning all tools enabled)
	if (!envValue || envValue.trim() === "") {
		return null;
	}

	// Parse comma-separated list, trim whitespace, filter empty strings
	return envValue
		.split(",")
		.map((slug) => slug.trim())
		.filter((slug) => slug.length > 0);
}

/**
 * Checks if a specific tool is enabled based on the ENABLED_TOOLS env var.
 *
 * Behavior:
 * - If ENABLED_TOOLS is not set: All tools with `enabled: true` in config are enabled
 * - If ENABLED_TOOLS is set: Only explicitly listed tools are enabled (allowlist)
 *
 * A tool must ALSO have `enabled: true` in the config to be considered enabled.
 *
 * @param slug - The tool slug to check
 * @returns true if the tool is enabled, false otherwise
 */
export function isToolEnabled(slug: string): boolean {
	// First check if the tool exists and is enabled in config
	const tool = config.tools.registry.find((t) => t.slug === slug);
	if (!tool || !tool.enabled) {
		return false;
	}

	// Parse the env var
	const enabledSlugs = parseEnabledToolsEnv();

	// If env var is not set, all tools with enabled: true are enabled
	if (enabledSlugs === null) {
		return true;
	}

	// Check if the tool is in the allowlist
	return enabledSlugs.includes(slug);
}

/**
 * Tool data with enabled status for UI rendering.
 */
export interface ToolWithStatus extends ToolConfig {
	/** Whether this tool is fully enabled (can be used) */
	isEnabled: boolean;
	/** Whether this tool should show "Coming Soon" styling */
	isComingSoon: boolean;
}

/**
 * Gets all tools from the registry with their enabled status.
 *
 * This is the single source of truth for tool availability.
 * All UI surfaces should consume this data.
 *
 * @returns Array of all tools with enabled status
 */
export function getToolsWithStatus(): ToolWithStatus[] {
	const enabledSlugs = parseEnabledToolsEnv();

	return config.tools.registry.map((tool) => {
		// Tool must have enabled: true in config
		const configEnabled = tool.enabled;

		// If env var is not set, all config-enabled tools are enabled
		// If env var is set, only tools in the allowlist are enabled
		const envEnabled =
			enabledSlugs === null || enabledSlugs.includes(tool.slug);

		// A tool is fully enabled only if both conditions are met
		const isEnabled = configEnabled && envEnabled;

		// A tool is "coming soon" if it's in the config but not enabled
		// (either due to config.enabled: false or not in the env allowlist)
		const isComingSoon = configEnabled && !envEnabled;

		return {
			...tool,
			isEnabled,
			isComingSoon,
		};
	});
}

/**
 * Gets only the fully enabled tools.
 *
 * Use this when you only want to show enabled tools (e.g., in the command palette).
 *
 * @returns Array of enabled tools with status
 */
export function getEnabledTools(): ToolWithStatus[] {
	return getToolsWithStatus().filter((tool) => tool.isEnabled);
}

/**
 * Gets tools that should be visible in the UI (enabled + coming soon).
 *
 * Use this when you want to show all tools but with different styling
 * for coming soon vs enabled.
 *
 * @returns Array of visible tools (enabled or coming soon)
 */
export function getVisibleTools(): ToolWithStatus[] {
	return getToolsWithStatus().filter(
		(tool) => tool.isEnabled || tool.isComingSoon,
	);
}
