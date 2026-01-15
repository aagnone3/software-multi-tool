import { config } from "@repo/config";

/**
 * Formats a tool slug into a human-readable display name.
 * First checks the tools registry for a configured name,
 * then falls back to converting the slug to title case.
 */
export function formatToolName(toolSlug: string | null): string {
	if (!toolSlug) {
		return "-";
	}

	// Check if tool exists in registry
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);
	if (tool) {
		return tool.name;
	}

	// Fallback: convert slug to title case
	return toolSlug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}
