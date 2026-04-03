"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { cn } from "@ui/lib";
import { StarIcon } from "lucide-react";
import React, { useState } from "react";
import { useToolRatings } from "../hooks/use-tool-ratings";

interface ToolRatingWidgetProps {
	toolSlug: string;
	className?: string;
	/** Show a label above the stars */
	showLabel?: boolean;
}

export function ToolRatingWidget({
	toolSlug,
	className,
	showLabel = true,
}: ToolRatingWidgetProps) {
	const { getRating, rateTool } = useToolRatings();
	const { track } = useProductAnalytics();
	const [hovered, setHovered] = useState<number | null>(null);

	const currentRating = getRating(toolSlug);
	const displayRating = hovered ?? currentRating ?? 0;

	return (
		<div className={cn("flex flex-col gap-1", className)}>
			{showLabel && (
				<p className="text-xs font-medium text-muted-foreground">
					{currentRating ? "Your rating" : "Rate this tool"}
				</p>
			)}
			<fieldset
				className="flex items-center gap-0.5 border-0 p-0 m-0"
				aria-label="Rate this tool"
				onMouseLeave={() => setHovered(null)}
			>
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						type="button"
						aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
						className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onMouseEnter={() => setHovered(star)}
						onClick={() => {
							rateTool(toolSlug, star);
							track({
								name: "tool_rated",
								props: { tool_slug: toolSlug, rating: star },
							});
						}}
					>
						<StarIcon
							className={cn(
								"size-5 transition-colors",
								star <= displayRating
									? "fill-amber-400 text-amber-400"
									: "fill-transparent text-muted-foreground/40",
							)}
						/>
					</button>
				))}
			</fieldset>
			{currentRating && (
				<p className="text-xs text-muted-foreground">
					You rated this {currentRating}/5
				</p>
			)}
		</div>
	);
}
