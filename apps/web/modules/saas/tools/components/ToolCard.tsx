import type { ToolConfig } from "@repo/config/types";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/tooltip";
import { cn } from "@ui/lib";
import {
	BookmarkIcon,
	CheckCircle2Icon,
	ClipboardListIcon,
	ClockIcon,
	CoinsIcon,
	FileTextIcon,
	ImageMinusIcon,
	MessageSquareTextIcon,
	NewspaperIcon,
	ReceiptIcon,
	StarIcon,
	UsersIcon,
	WalletIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface ToolCardProps {
	tool: ToolConfig;
	/** Whether this tool is coming soon (disabled but visible) */
	isComingSoon?: boolean;
	/** Whether the current user has recently used this tool */
	isRecentlyUsed?: boolean;
	/** ISO date string for when the user last used this tool */
	lastUsedAt?: string | null;
	/** Whether the current user has favorited this tool */
	isFavorite?: boolean;
	/** Callback when the user toggles favorite status */
	onToggleFavorite?: (slug: string) => void;
	/** User's rating for this tool (1-5), if any */
	userRating?: number | null;
}

function formatLastUsed(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) {
		return "just now";
	}
	if (diffMins < 60) {
		return `${diffMins}m ago`;
	}
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}
	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

function getToolIcon(iconName: string) {
	const icons: Record<string, React.ComponentType<{ className?: string }>> = {
		"image-minus": ImageMinusIcon,
		users: UsersIcon,
		newspaper: NewspaperIcon,
		receipt: ReceiptIcon,
		"file-text": FileTextIcon,
		"message-square-text": MessageSquareTextIcon,
		wallet: WalletIcon,
		"clipboard-list": ClipboardListIcon,
	};

	return icons[iconName] || WrenchIcon;
}

export function ToolCard({
	tool,
	isComingSoon = false,
	isRecentlyUsed = false,
	lastUsedAt = null,
	isFavorite = false,
	onToggleFavorite,
	userRating = null,
}: ToolCardProps) {
	const Icon = getToolIcon(tool.icon);

	if (isComingSoon) {
		return (
			<Card
				className={cn(
					"group flex h-full flex-col transition-all",
					"opacity-60 grayscale hover:opacity-70",
				)}
			>
				<CardHeader className="flex-1">
					<div className="mb-2 flex items-center gap-2">
						<div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
							<Icon className="size-6" />
						</div>
						<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
							<ClockIcon className="size-3" />
							Coming Soon
						</span>
					</div>
					<CardTitle className="text-lg text-muted-foreground">
						{tool.name}
					</CardTitle>
					<CardDescription>{tool.description}</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					{tool.creditCost > 0 && (
						<div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
							<CoinsIcon className="size-3.5" />
							<span>
								{tool.creditCost}{" "}
								{tool.creditCost === 1 ? "credit" : "credits"}{" "}
								per use
							</span>
						</div>
					)}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="w-full cursor-not-allowed"
									variant="outline"
									disabled
								>
									Coming Soon
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>This tool is coming soon</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="group flex h-full flex-col transition-all hover:border-primary/50 hover:shadow-md">
			<CardHeader className="flex-1">
				<div className="mb-2 flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Icon className="size-6" />
						</div>
						{isRecentlyUsed && (
							<span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
								<CheckCircle2Icon className="size-3" />
								{lastUsedAt
									? formatLastUsed(lastUsedAt)
									: "Used"}
							</span>
						)}
					</div>
					{onToggleFavorite && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className={cn(
											"size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
											isFavorite &&
												"opacity-100 text-amber-500",
										)}
										onClick={(e) => {
											e.preventDefault();
											onToggleFavorite(tool.slug);
										}}
										aria-label={
											isFavorite
												? "Remove from favorites"
												: "Add to favorites"
										}
									>
										<BookmarkIcon
											className={cn(
												"size-4",
												isFavorite && "fill-amber-500",
											)}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{isFavorite
										? "Remove from favorites"
										: "Save to favorites"}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
				<CardTitle className="text-lg">{tool.name}</CardTitle>
				<CardDescription>{tool.description}</CardDescription>
			</CardHeader>
			<CardContent className="pt-0">
				{tool.creditCost > 0 && (
					<div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
						<CoinsIcon className="size-3.5 text-primary/70" />
						<span>
							{tool.creditCost}{" "}
							{tool.creditCost === 1 ? "credit" : "credits"} per
							use
						</span>
					</div>
				)}
				{userRating && (
					<div
						className="mb-3 flex items-center gap-1"
						role="img"
						aria-label={`Your rating: ${userRating} stars`}
					>
						{[1, 2, 3, 4, 5].map((star) => (
							<StarIcon
								key={star}
								className={cn(
									"size-3.5",
									star <= userRating
										? "fill-amber-400 text-amber-400"
										: "fill-transparent text-muted-foreground/30",
								)}
							/>
						))}
						<span className="ml-1 text-xs text-muted-foreground">
							{userRating}/5
						</span>
					</div>
				)}
				<Link href={`/app/tools/${tool.slug}`}>
					<Button className="w-full" variant="outline">
						Open Tool
					</Button>
				</Link>
			</CardContent>
		</Card>
	);
}
