"use client";

import type { ToolConfig } from "@repo/config/types";
import { Button } from "@ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/tooltip";
import { cn } from "@ui/lib";
import {
	CheckIcon,
	ChevronRightIcon,
	CoinsIcon,
	Share2Icon,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useState } from "react";
import { ToolFeedbackButton } from "./ToolFeedbackButton";

interface ToolPageHeaderProps {
	tool: ToolConfig;
}

export function ToolPageHeader({ tool }: ToolPageHeaderProps) {
	const [copied, setCopied] = useState(false);

	const handleShare = useCallback(async () => {
		try {
			const url = window.location.href;
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// fallback: do nothing
		}
	}, []);

	return (
		<div className="mb-6">
			{/* Breadcrumb */}
			<nav
				aria-label="Breadcrumb"
				className="mb-3 flex items-center gap-1 text-sm text-muted-foreground"
			>
				<Link
					href="/app"
					className="hover:text-foreground transition-colors"
				>
					Dashboard
				</Link>
				<ChevronRightIcon className="size-3.5" />
				<Link
					href="/app/tools"
					className="hover:text-foreground transition-colors"
				>
					Tools
				</Link>
				<ChevronRightIcon className="size-3.5" />
				<span className="text-foreground font-medium">{tool.name}</span>
			</nav>

			<div className="flex items-start justify-between gap-4">
				<div className="flex-1">
					<h1 className="text-2xl font-bold tracking-tight">
						{tool.name}
					</h1>
					<p className="mt-1 text-muted-foreground">
						{tool.description}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{tool.creditCost > 0 && (
						<span
							className={cn(
								"inline-flex shrink-0 items-center gap-1.5 rounded-full",
								"bg-primary/10 px-3 py-1 text-sm font-medium text-primary",
							)}
						>
							<CoinsIcon className="size-3.5 text-primary/70" />
							{tool.creditCost}{" "}
							{tool.creditCost === 1 ? "credit" : "credits"} / use
						</span>
					)}
					<ToolFeedbackButton toolSlug={tool.slug} />
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-muted-foreground hover:text-foreground"
									aria-label="Copy link to this tool"
									onClick={handleShare}
								>
									{copied ? (
										<CheckIcon className="size-4 text-green-500" />
									) : (
										<Share2Icon className="size-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{copied ? "Link copied!" : "Copy link"}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		</div>
	);
}
