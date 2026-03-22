"use client";

import { useFavoriteTools } from "@saas/tools/hooks/use-favorite-tools";
import { useTools } from "@saas/tools/hooks/use-tools";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { cn } from "@ui/lib";
import { BookmarkIcon, ChevronRightIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface FavoriteToolsWidgetProps {
	className?: string;
}

export function FavoriteToolsWidget({ className }: FavoriteToolsWidgetProps) {
	const { favorites } = useFavoriteTools();
	const { enabledTools } = useTools();

	const favoriteTools = enabledTools.filter((tool) =>
		favorites.has(tool.slug),
	);

	if (favoriteTools.length === 0) {
		return (
			<Card className={className}>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2">
						<BookmarkIcon className="size-5" />
						Favorites
					</CardTitle>
					<CardDescription>Your bookmarked tools</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<StarIcon className="size-10 text-muted-foreground/40 mb-3" />
						<p className="text-sm font-medium">No favorites yet</p>
						<p className="text-xs text-muted-foreground mt-1">
							Bookmark tools from the tools page
						</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-3"
							asChild
						>
							<Link href="/app/tools">
								Browse tools
								<ChevronRightIcon className="size-4 ml-1" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn("", className)}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<BookmarkIcon className="size-5" />
					Favorites
				</CardTitle>
				<CardDescription>Your bookmarked tools</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				{favoriteTools.map((tool) => (
					<Link
						key={tool.slug}
						href={`/app/tools/${tool.slug}`}
						className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors group"
					>
						<span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
							{tool.name}
						</span>
						<ChevronRightIcon className="size-4 text-muted-foreground shrink-0 ml-2" />
					</Link>
				))}
			</CardContent>
		</Card>
	);
}
