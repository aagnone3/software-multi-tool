"use client";

import { usePinnedJobs } from "@tools/hooks/use-pinned-jobs";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { BookmarkIcon, ExternalLinkIcon, PinIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

function formatPinnedAt(iso: string): string {
	const date = new Date(iso);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 60) return minutes <= 1 ? "just now" : `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export function PinnedJobsWidget() {
	const { pinnedJobs, unpinJob } = usePinnedJobs();

	if (pinnedJobs.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<PinIcon className="h-4 w-4" />
						Pinned Outputs
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground text-sm">
						<BookmarkIcon className="h-6 w-6 opacity-40" />
						<p>No pinned outputs yet.</p>
						<p className="text-xs">
							Pin important job outputs from the Jobs page to keep
							them handy.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<PinIcon className="h-4 w-4" />
					Pinned Outputs
					<span className="ml-auto font-normal text-muted-foreground text-xs">
						{pinnedJobs.length} pinned
					</span>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="divide-y divide-border">
					{pinnedJobs.map((job) => (
						<li
							key={job.id}
							className="flex items-center gap-2 py-2"
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-1.5">
									<Link
										href={`/app/jobs/${job.id}`}
										className="truncate font-medium text-sm hover:underline"
									>
										{job.toolName}
									</Link>
									<ExternalLinkIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
								</div>
								{job.note && (
									<p className="truncate text-muted-foreground text-xs">
										{job.note}
									</p>
								)}
								<p className="text-muted-foreground text-xs">
									Pinned {formatPinnedAt(job.pinnedAt)}
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
								onClick={() => unpinJob(job.id)}
								title="Unpin"
							>
								<PinIcon className="h-3.5 w-3.5" />
							</Button>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
