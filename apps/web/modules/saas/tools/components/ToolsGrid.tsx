"use client";

import { getVisibleTools } from "@saas/tools/lib/tool-flags";
import { Input } from "@ui/components/input";
import { SearchIcon, WrenchIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { ToolCard } from "./ToolCard";

export function ToolsGrid() {
	const [searchQuery, setSearchQuery] = useState("");
	const allTools = useMemo(() => getVisibleTools(), []);

	const filteredTools = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return allTools;
		return allTools.filter(
			(tool) =>
				tool.name.toLowerCase().includes(q) ||
				tool.description.toLowerCase().includes(q),
		);
	}, [allTools, searchQuery]);

	return (
		<div className="space-y-6">
			{allTools.length > 4 && (
				<div className="relative max-w-sm">
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
			)}

			{filteredTools.length > 0 ? (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{filteredTools.map((tool) => (
						<ToolCard
							key={tool.slug}
							tool={tool}
							isComingSoon={tool.isComingSoon}
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
