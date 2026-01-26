import type { Tool } from "@prisma/client";
import { db } from "../client";

/**
 * Tool configuration from config/index.ts used for sync
 */
export interface ToolConfig {
	slug: string;
	name: string;
	description: string;
	icon: string;
	creditCost: number;
	creditUnit?: string;
	enabled: boolean;
	public: boolean;
}

/**
 * Get a tool by its slug
 */
export async function getToolBySlug(slug: string): Promise<Tool | null> {
	return await db.tool.findUnique({
		where: { slug },
	});
}

/**
 * Get a tool by its ID
 */
export async function getToolById(id: string): Promise<Tool | null> {
	return await db.tool.findUnique({
		where: { id },
	});
}

/**
 * Get all tools
 */
export async function getAllTools(): Promise<Tool[]> {
	return await db.tool.findMany({
		orderBy: { name: "asc" },
	});
}

/**
 * Get all enabled tools
 */
export async function getEnabledTools(): Promise<Tool[]> {
	return await db.tool.findMany({
		where: { enabled: true },
		orderBy: { name: "asc" },
	});
}

/**
 * Get all public tools (accessible without authentication)
 */
export async function getPublicTools(): Promise<Tool[]> {
	return await db.tool.findMany({
		where: { public: true, enabled: true },
		orderBy: { name: "asc" },
	});
}

/**
 * Sync tools from config to database
 * Uses upsert to create or update tools based on slug
 *
 * @param tools - Array of tool configurations from config/index.ts
 * @returns Array of synced tools
 */
export async function syncToolsFromConfig(
	tools: ToolConfig[],
): Promise<Tool[]> {
	const results: Tool[] = [];

	for (const tool of tools) {
		const synced = await db.tool.upsert({
			where: { slug: tool.slug },
			create: {
				slug: tool.slug,
				name: tool.name,
				description: tool.description,
				icon: tool.icon,
				creditCost: tool.creditCost,
				creditUnit: tool.creditUnit ?? "request",
				enabled: tool.enabled,
				public: tool.public,
			},
			update: {
				name: tool.name,
				description: tool.description,
				icon: tool.icon,
				creditCost: tool.creditCost,
				creditUnit: tool.creditUnit ?? "request",
				enabled: tool.enabled,
				public: tool.public,
			},
		});
		results.push(synced);
	}

	return results;
}

/**
 * Update a tool's enabled status
 */
export async function setToolEnabled(
	slug: string,
	enabled: boolean,
): Promise<Tool> {
	return await db.tool.update({
		where: { slug },
		data: { enabled },
	});
}

/**
 * Get tool ID by slug (useful for populating FK relationships)
 */
export async function getToolIdBySlug(slug: string): Promise<string | null> {
	const tool = await db.tool.findUnique({
		where: { slug },
		select: { id: true },
	});
	return tool?.id ?? null;
}

/**
 * Batch lookup tool IDs by slugs
 * Returns a map of slug -> id
 */
export async function getToolIdsBySlug(
	slugs: string[],
): Promise<Map<string, string>> {
	const tools = await db.tool.findMany({
		where: { slug: { in: slugs } },
		select: { id: true, slug: true },
	});

	return new Map(tools.map((t) => [t.slug, t.id]));
}
