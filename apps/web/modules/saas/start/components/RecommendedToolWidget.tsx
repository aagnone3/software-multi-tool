"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useTools } from "@saas/tools/hooks/use-tools";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	ChevronRightIcon,
	ClipboardListIcon,
	FileTextIcon,
	ImageMinusIcon,
	LightbulbIcon,
	MessageSquareTextIcon,
	NewspaperIcon,
	ReceiptIcon,
	RefreshCwIcon,
	UsersIcon,
	WalletIcon,
	WrenchIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface RecommendedToolWidgetProps {
	className?: string;
}

const STORAGE_KEY = "recommended-tool-index";

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

export function RecommendedToolWidget({
	className,
}: RecommendedToolWidgetProps) {
	const { enabledTools } = useTools();
	const { activeOrganization } = useActiveOrganization();
	const [currentIndex, setCurrentIndex] = useState<number | null>(null);
	const [isClient, setIsClient] = useState(false);

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	// Initialize from localStorage on mount
	useEffect(() => {
		setIsClient(true);
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored !== null) {
			const storedIndex = Number.parseInt(stored, 10);
			// Ensure stored index is valid
			if (storedIndex >= 0 && storedIndex < enabledTools.length) {
				setCurrentIndex(storedIndex);
			} else {
				setCurrentIndex(0);
			}
		} else {
			setCurrentIndex(0);
		}
	}, [enabledTools.length]);

	const rotateToNext = useCallback(() => {
		if (enabledTools.length === 0) {
			return;
		}

		const nextIndex =
			currentIndex === null
				? 0
				: (currentIndex + 1) % enabledTools.length;
		setCurrentIndex(nextIndex);
		localStorage.setItem(STORAGE_KEY, String(nextIndex));
	}, [currentIndex, enabledTools.length]);

	// Loading state (before client-side hydration)
	if (!isClient || currentIndex === null) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<LightbulbIcon className="size-5" />
						Recommended
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-9 w-full" />
				</CardContent>
			</Card>
		);
	}

	// No tools available
	if (enabledTools.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<LightbulbIcon className="size-5" />
						Recommended
					</CardTitle>
					<CardDescription>Discover new tools</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-4 text-center">
						<WrenchIcon className="size-10 text-muted-foreground/40 mb-3" />
						<p className="text-sm text-muted-foreground">
							No tools available yet
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const currentTool = enabledTools[currentIndex];
	const Icon = getToolIcon(currentTool.icon);

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<LightbulbIcon className="size-5" />
							Recommended
						</CardTitle>
						<CardDescription>Try something new</CardDescription>
					</div>
					<div className="flex gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={rotateToNext}
							aria-label="Show another tool"
						>
							<RefreshCwIcon className="size-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={rotateToNext}
							aria-label="Dismiss suggestion"
						>
							<XIcon className="size-3.5" />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-start gap-3">
					<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
						<Icon className="size-6" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="font-semibold truncate">
							{currentTool.name}
						</p>
						<p className="text-sm text-muted-foreground line-clamp-2">
							{currentTool.description}
						</p>
					</div>
				</div>

				<Button className="w-full" asChild>
					<Link
						href={`${basePath}/tools/${currentTool.slug}`}
						onClick={rotateToNext}
					>
						Try it
						<ChevronRightIcon className="size-4 ml-1" />
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
