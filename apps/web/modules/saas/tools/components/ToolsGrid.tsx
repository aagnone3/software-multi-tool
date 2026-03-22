"use client";

import { useRecentJobs } from "@saas/start/hooks/use-recent-jobs";
import { getVisibleTools } from "@saas/tools/lib/tool-flags";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { SearchIcon, WrenchIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { ToolCard } from "./ToolCard";

type SortOption =
	| "default"
	| "recently-used"
	| "name-asc"
	| "credits-asc"
	| "credits-desc";

export function ToolsGrid() {
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("default");
	const allTools = useMemo(() => getVisibleTools(), []);
	const { recentToolSlugs } = useRecentJobs(20);
	const recentToolSet = useMemo(
		() => new Set(recentToolSlugs),
		[recentToolSlugs],
	);

	const filteredTools = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		let result = q
			? allTools.filter(
					(tool) =>
						tool.name.toLowerCase().includes(q) ||
						tool.description.toLowerCase().includes(q),
				)
			: [...allTools];

		if (sortBy === "recently-used") {
			// Tools the user has used come first (in recency order), then the rest
			const usedTools = recentToolSlugs
				.map((slug) => result.find((t) => t.slug === slug))
				.filter(Boolean) as typeof result;
			const unusedTools = result.filter(
				(t) => !recentToolSet.has(t.slug),
			);
			result = [...usedTools, ...unusedTools];
		} else if (sortBy === "name-asc") {
			result = result.sort((a, b) => a.name.localeCompare(b.name));
		} else if (sortBy === "credits-asc") {
			result = result.sort((a, b) => a.creditCost - b.creditCost);
		} else if (sortBy === "credits-desc") {
			result = result.sort((a, b) => b.creditCost - a.creditCost);
		}

		return result;
	}, [allTools, searchQuery, sortBy, recentToolSlugs, recentToolSet]);

	const showControls = allTools.length > 4;

	return (
		<div className="space-y-6">
			{showControls && (
				<div className="flex flex-wrap items-center gap-3">
					<div className="relative max-w-sm flex-1">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
						<Input
							type="search"
							placeholder="Search tools…"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
							aria-label="Search tools"
						/>
					</div>
					<Select
						value={sortBy}
						onValueChange={(v) => setSortBy(v as SortOption)}
					>
						<SelectTrigger className="w-44" aria-label="Sort tools">
							<SelectValue placeholder="Sort by…" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="default">
								Default order
							</SelectItem>
							{recentToolSlugs.length > 0 && (
								<SelectItem value="recently-used">
									Recently used
								</SelectItem>
							)}
							<SelectItem value="name-asc">Name (A–Z)</SelectItem>
							<SelectItem value="credits-asc">
								Credits (low → high)
							</SelectItem>
							<SelectItem value="credits-desc">
								Credits (high → low)
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			)}

			{filteredTools.length > 0 ? (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{filteredTools.map((tool) => (
						<ToolCard
							key={tool.slug}
							tool={tool}
							isComingSoon={tool.isComingSoon}
							isRecentlyUsed={recentToolSet.has(tool.slug)}
						/>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
						<WrenchIcon className="size-8 text-muted-foreground" />
					</div>
					<h3 className="font-semibold text-foreground">
						No tools found
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Try a different search term.
					</p>
				</div>
			)}
		</div>
	);
}
