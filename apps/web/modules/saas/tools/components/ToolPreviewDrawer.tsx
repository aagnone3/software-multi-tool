"use client";

import { config } from "@repo/config";
import { useJobsList } from "@tools/hooks/use-job-polling";
import { Button } from "@ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@ui/components/sheet";
import { Skeleton } from "@ui/components/skeleton";
import {
	CheckCircle2Icon,
	ClockIcon,
	CoinsIcon,
	ExternalLinkIcon,
	GlobeIcon,
	LockIcon,
	SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface ToolPreviewDrawerProps {
	toolSlug: string | null;
	onClose: () => void;
}

function RecentRunsPreview({ toolSlug }: { toolSlug: string }) {
	const { jobs, isLoading } = useJobsList(toolSlug, 3);

	if (isLoading) {
		return (
			<div className="space-y-2">
				{[0, 1, 2].map((i) => (
					<Skeleton key={i} className="h-8 w-full" />
				))}
			</div>
		);
	}

	if (!jobs || jobs.length === 0) {
		return (
			<p className="text-sm text-muted-foreground italic">
				No runs yet — be the first!
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{jobs.map((job) => (
				<div
					key={job.id}
					className="flex items-center gap-2 rounded border px-3 py-2 text-sm"
				>
					{job.status === "COMPLETED" ? (
						<CheckCircle2Icon className="size-4 text-green-500 shrink-0" />
					) : (
						<ClockIcon className="size-4 text-yellow-500 shrink-0" />
					)}
					<span className="flex-1 capitalize text-muted-foreground">
						{job.status.toLowerCase()}
					</span>
					<Link
						href={`/app/jobs/${job.id}`}
						className="text-xs text-primary hover:underline"
					>
						View
					</Link>
				</div>
			))}
		</div>
	);
}

export function ToolPreviewDrawer({
	toolSlug,
	onClose,
}: ToolPreviewDrawerProps) {
	const tool = toolSlug
		? config.tools.registry.find((t) => t.slug === toolSlug)
		: null;

	return (
		<Sheet open={!!toolSlug} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
				{tool ? (
					<>
						<SheetHeader className="space-y-1">
							<div className="flex items-center gap-2">
								<SparklesIcon className="size-5 text-primary" />
								<SheetTitle>{tool.name}</SheetTitle>
							</div>
							<SheetDescription>
								{tool.description}
							</SheetDescription>
						</SheetHeader>

						<div className="mt-6 space-y-6">
							{/* Metadata badges */}
							<div className="flex flex-wrap gap-2">
								<span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
									<CoinsIcon className="size-3" />
									{tool.creditCost ?? 0} credits
								</span>
								<span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
									{tool.public ? (
										<>
											<GlobeIcon className="size-3" />
											Public
										</>
									) : (
										<>
											<LockIcon className="size-3" />
											Members only
										</>
									)}
								</span>
								{"comingSoon" in tool &&
									(tool as { comingSoon?: boolean })
										.comingSoon && (
										<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
											Coming Soon
										</span>
									)}
							</div>

							{/* Recent Runs */}
							<div>
								<h3 className="text-sm font-medium mb-2">
									Your Recent Runs
								</h3>
								<RecentRunsPreview toolSlug={tool.slug} />
							</div>

							{/* Actions */}
							<div className="flex gap-2">
								<Button asChild className="flex-1">
									<Link href={`/app/tools/${tool.slug}`}>
										Open Tool
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									size="icon"
									aria-label={`Open ${tool.name} in new tab`}
								>
									<Link
										href={`/app/tools/${tool.slug}`}
										target="_blank"
									>
										<ExternalLinkIcon className="size-4" />
									</Link>
								</Button>
							</div>
						</div>
					</>
				) : null}
			</SheetContent>
		</Sheet>
	);
}
