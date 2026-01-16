"use client";

import { useMemo } from "react";
import {
	getEnabledTools,
	getToolsWithStatus,
	getVisibleTools,
	isToolEnabled,
	type ToolWithStatus,
} from "../lib/tool-flags";

/**
 * Return type for the useTools hook.
 */
export interface UseToolsResult {
	/**
	 * All tools from the registry with their enabled/coming soon status.
	 */
	tools: ToolWithStatus[];

	/**
	 * Only the fully enabled tools (can be used).
	 */
	enabledTools: ToolWithStatus[];

	/**
	 * Tools that should be visible in the UI (enabled or coming soon).
	 */
	visibleTools: ToolWithStatus[];

	/**
	 * Check if a specific tool is enabled by slug.
	 */
	isToolEnabled: (slug: string) => boolean;
}

/**
 * Hook providing a single source of truth for tool availability.
 *
 * All UI surfaces should use this hook to determine which tools
 * to display and how to style them.
 *
 * Example usage:
 * ```tsx
 * const { tools, enabledTools, isToolEnabled } = useTools();
 *
 * // Show all tools with conditional styling
 * tools.map(tool => (
 *   <ToolCard
 *     key={tool.slug}
 *     tool={tool}
 *     isComingSoon={tool.isComingSoon}
 *   />
 * ));
 *
 * // Check specific tool
 * if (isToolEnabled('news-analyzer')) {
 *   // Navigate to tool
 * }
 * ```
 */
export function useTools(): UseToolsResult {
	return useMemo(() => {
		const tools = getToolsWithStatus();
		const enabledTools = getEnabledTools();
		const visibleTools = getVisibleTools();

		return {
			tools,
			enabledTools,
			visibleTools,
			isToolEnabled,
		};
	}, []);
}

export type { ToolWithStatus };
