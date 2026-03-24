"use client";

import { config } from "@repo/config";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	ClipboardListIcon,
	CoinsIcon,
	FileTextIcon,
	ImageMinusIcon,
	MessageSquareTextIcon,
	NewspaperIcon,
	ReceiptIcon,
	UsersIcon,
	WalletIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";

// Tool category groups for related tool suggestions
const TOOL_CATEGORIES: Record<string, string[]> = {
	document: [
		"contract-analyzer",
		"invoice-processor",
		"expense-categorizer",
		"meeting-summarizer",
	],
	ai: [
		"news-analyzer",
		"feedback-analyzer",
		"contract-analyzer",
		"meeting-summarizer",
	],
	media: ["speaker-separation", "diagram-editor"],
	financial: ["invoice-processor", "expense-categorizer"],
};

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

function getRelatedSlugs(currentSlug: string, maxCount = 3): string[] {
	// Collect all categories the current tool belongs to
	const related = new Set<string>();
	for (const [, slugs] of Object.entries(TOOL_CATEGORIES)) {
		if (slugs.includes(currentSlug)) {
			for (const slug of slugs) {
				if (slug !== currentSlug) {
					related.add(slug);
				}
			}
		}
	}

	// Fallback: add any tool that's not the current one
	if (related.size === 0) {
		for (const tool of config.tools.registry) {
			if (tool.slug !== currentSlug && tool.enabled) {
				related.add(tool.slug);
			}
		}
	}

	return Array.from(related).slice(0, maxCount);
}

interface RelatedToolsWidgetProps {
	currentToolSlug: string;
	className?: string;
}

export function RelatedToolsWidget({
	currentToolSlug,
	className,
}: RelatedToolsWidgetProps) {
	const relatedSlugs = getRelatedSlugs(currentToolSlug);
	const relatedTools = relatedSlugs
		.map((slug) =>
			config.tools.registry.find((t) => t.slug === slug && t.enabled),
		)
		.filter(Boolean);

	if (relatedTools.length === 0) {
		return null;
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-medium">
					You might also like
				</CardTitle>
				<CardDescription>Other tools for similar tasks</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3 sm:grid-cols-3">
					{relatedTools.map((tool) => {
						if (!tool) return null;
						const Icon = getToolIcon(tool.icon);
						return (
							<Link
								key={tool.slug}
								href={`/app/tools/${tool.slug}`}
								className="group flex flex-col gap-2 rounded-lg border p-3 transition-all hover:border-primary/50 hover:bg-muted/50"
							>
								<div className="flex items-center gap-2">
									<div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
										<Icon className="size-4" />
									</div>
									<span className="text-sm font-medium group-hover:text-primary">
										{tool.name}
									</span>
								</div>
								<p className="line-clamp-2 text-xs text-muted-foreground">
									{tool.description}
								</p>
								{tool.creditCost > 0 && (
									<div className="flex items-center gap-1 text-xs text-muted-foreground">
										<CoinsIcon className="size-3" />
										<span>
											{tool.creditCost}{" "}
											{tool.creditCost === 1
												? "credit"
												: "credits"}
										</span>
									</div>
								)}
							</Link>
						);
					})}
				</div>
				<div className="mt-4 text-center">
					<Link href="/app/tools">
						<Button variant="ghost" size="sm">
							Browse all tools
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
