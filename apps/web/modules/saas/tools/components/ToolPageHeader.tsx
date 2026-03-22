import type { ToolConfig } from "@repo/config/types";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { ArrowLeftIcon, CoinsIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ToolPageHeaderProps {
	tool: ToolConfig;
}

export function ToolPageHeader({ tool }: ToolPageHeaderProps) {
	return (
		<div className="mb-6">
			<div className="mb-3">
				<Link href="/app/tools">
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
					>
						<ArrowLeftIcon className="size-4" />
						All Tools
					</Button>
				</Link>
			</div>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1">
					<h1 className="text-2xl font-bold tracking-tight">
						{tool.name}
					</h1>
					<p className="mt-1 text-muted-foreground">
						{tool.description}
					</p>
				</div>
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
			</div>
		</div>
	);
}
