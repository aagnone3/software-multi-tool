"use client";

import { useRecentJobs } from "@saas/start/hooks/use-recent-jobs";
import { useFavoriteTools } from "@saas/tools/hooks/use-favorite-tools";
import { getVisibleTools } from "@saas/tools/lib/tool-flags";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { cn } from "@ui/lib";
import { ClockIcon, SearchIcon, WrenchIcon, XIcon } from "lucide-react";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { ToolCard } from "./ToolCard";

const RECENT_SEARCHES_KEY = "tools-grid-recent-searches";
const MAX_RECENT_SEARCHES = 5;

function useRecentSearches() {
	const [recentSearches, setRecentSearches] = useState<string[]>(() => {
		try {
			const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
			return stored ? (JSON.parse(stored) as string[]) : [];
		} catch {
			return [];
		}
	});

	const addSearch = useCallback((query: string) => {
		const q = query.trim();
		if (!q) {
			return;
		}
		setRecentSearches((prev) => {
			const deduplicated = [q, ...prev.filter((s) => s !== q)].slice(
				0,
				MAX_RECENT_SEARCHES,
			);
			try {
				localStorage.setItem(
					RECENT_SEARCHES_KEY,
					JSON.stringify(deduplicated),
				);
			} catch {
				// ignore
			}
			return deduplicated;
		});
	}, []);

	const removeSearch = useCallback((query: string) => {
		setRecentSearches((prev) => {
			const updated = prev.filter((s) => s !== query);
			try {
				localStorage.setItem(
					RECENT_SEARCHES_KEY,
					JSON.stringify(updated),
				);
			} catch {
				// ignore
			}
			return updated;
		});
	}, []);

	return { recentSearches, addSearch, removeSearch };
}

type SortOption =
	| "default"
	| "favorites"
	| "recently-used"
	| "name-asc"
	| "credits-asc"
	| "credits-desc";

/** Maps a tool slug to its category label. Extend as new tools are added. */
const TOOL_CATEGORIES: Record<string, string> = {
	"bg-remover": "Image & Media",
	"speaker-separation": "Audio",
	"news-analyzer": "Analytics",
	"invoice-processor": "Finance",
	"contract-analyzer": "Document",
	"feedback-analyzer": "Analytics",
	"expense-categorizer": "Finance",
	"meeting-summarizer": "Productivity",
	"diagram-editor": "Productivity",
};

function getCategory(slug: string): string {
	return TOOL_CATEGORIES[slug] ?? "Other";
}

export function ToolsGrid() {
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("default");
	const [activeCategory, setActiveCategory] = useState<string>("All");
	const [showRecentSearches, setShowRecentSearches] = useState(false);
	const searchRef = useRef<HTMLDivElement>(null);
	const { recentSearches, addSearch, removeSearch } = useRecentSearches();
	const allTools = useMemo(() => getVisibleTools(), []);
	const { recentToolSlugs, recentToolsMap } = useRecentJobs(20);
	const recentToolSet = useMemo(
		() => new Set(recentToolSlugs),
		[recentToolSlugs],
	);
	const { favorites, isFavorite, toggleFavorite } = useFavoriteTools();

	/** Sorted, deduplicated list of available categories */
	const categories = useMemo(() => {
		const cats = new Set(allTools.map((t) => getCategory(t.slug)));
		return ["All", ...Array.from(cats).sort()];
	}, [allTools]);

	const filteredTools = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		let result = allTools.filter((tool) => {
			const matchesSearch =
				!q ||
				tool.name.toLowerCase().includes(q) ||
				tool.description.toLowerCase().includes(q);
			const matchesCategory =
				activeCategory === "All" ||
				getCategory(tool.slug) === activeCategory;
			return matchesSearch && matchesCategory;
		});

		if (sortBy === "favorites") {
			result = [
				...result.filter((t) => favorites.has(t.slug)),
				...result.filter((t) => !favorites.has(t.slug)),
			];
		} else if (sortBy === "recently-used") {
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
	}, [
		allTools,
		searchQuery,
		sortBy,
		recentToolSlugs,
		recentToolSet,
		activeCategory,
		favorites,
	]);

	// Close recent searches dropdown on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				searchRef.current &&
				!searchRef.current.contains(e.target as Node)
			) {
				setShowRecentSearches(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	const handleSearchChange = useCallback(
		(value: string) => {
			setSearchQuery(value);
			if (!value.trim()) {
				setShowRecentSearches(recentSearches.length > 0);
			}
		},
		[recentSearches.length],
	);

	const handleSearchBlur = useCallback(() => {
		// Save non-empty queries when user leaves the field
		if (searchQuery.trim()) {
			addSearch(searchQuery);
		}
	}, [searchQuery, addSearch]);

	const applyRecentSearch = useCallback((query: string) => {
		setSearchQuery(query);
		setShowRecentSearches(false);
	}, []);

	const showControls = allTools.length > 4;
	const showCategories = categories.length > 2;

	return (
		<div className="space-y-6">
			{showControls && (
				<div className="flex flex-wrap items-center gap-3">
					<div ref={searchRef} className="relative max-w-sm flex-1">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
						<Input
							type="search"
							placeholder="Search tools…"
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							onFocus={() =>
								setShowRecentSearches(
									recentSearches.length > 0 &&
										!searchQuery.trim(),
								)
							}
							onBlur={handleSearchBlur}
							className="pl-9"
							aria-label="Search tools"
							aria-autocomplete="list"
							aria-expanded={showRecentSearches}
						/>
						{showRecentSearches && (
							<div
								className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
								role="listbox"
								aria-label="Recent searches"
							>
								<p className="px-3 py-1.5 text-xs text-muted-foreground font-medium">
									Recent searches
								</p>
								{recentSearches.map((s) => (
									<div
										key={s}
										className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer"
										role="option"
										aria-selected={false}
										tabIndex={0}
										onMouseDown={(e) => {
											e.preventDefault();
											applyRecentSearch(s);
										}}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" ||
												e.key === " "
											) {
												applyRecentSearch(s);
											}
										}}
									>
										<ClockIcon className="size-3.5 text-muted-foreground shrink-0" />
										<span className="flex-1 truncate">
											{s}
										</span>
										<button
											type="button"
											aria-label={`Remove "${s}" from recent searches`}
											className="text-muted-foreground hover:text-foreground"
											onMouseDown={(e) => {
												e.stopPropagation();
												e.preventDefault();
												removeSearch(s);
											}}
										>
											<XIcon className="size-3.5" />
										</button>
									</div>
								))}
							</div>
						)}
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
							{favorites.size > 0 && (
								<SelectItem value="favorites">
									Favorites first
								</SelectItem>
							)}
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

			{showCategories && (
				<fieldset
					className="flex flex-wrap gap-2 border-none p-0 m-0"
					aria-label="Filter by category"
				>
					<legend className="sr-only">Filter by category</legend>
					{categories.map((cat) => (
						<Button
							key={cat}
							variant={
								activeCategory === cat ? "primary" : "outline"
							}
							size="sm"
							onClick={() => setActiveCategory(cat)}
							className={cn(
								"rounded-full",
								activeCategory === cat && "shadow-sm",
							)}
							aria-pressed={activeCategory === cat}
						>
							{cat}
						</Button>
					))}
				</fieldset>
			)}

			{filteredTools.length > 0 ? (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{filteredTools.map((tool) => (
						<ToolCard
							key={tool.slug}
							tool={tool}
							isComingSoon={tool.isComingSoon}
							isRecentlyUsed={recentToolSet.has(tool.slug)}
							lastUsedAt={
								recentToolsMap.get(tool.slug)?.completedAt ??
								recentToolsMap.get(tool.slug)?.createdAt ??
								null
							}
							isFavorite={isFavorite(tool.slug)}
							onToggleFavorite={toggleFavorite}
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
						{searchQuery
							? "Try a different search term or category."
							: "No tools available in this category."}
					</p>
					{activeCategory !== "All" && (
						<Button
							variant="outline"
							size="sm"
							className="mt-4"
							onClick={() => setActiveCategory("All")}
						>
							Show all tools
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
