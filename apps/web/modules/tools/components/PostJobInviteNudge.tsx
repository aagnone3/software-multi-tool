"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useJobsList } from "@tools/hooks/use-job-polling";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { UsersIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface PostJobInviteNudgeProps {
	className?: string;
}

const STORAGE_KEY = "invite-nudge-dismissed";
// Show after this many completed jobs
const JOB_COUNT_THRESHOLD = 3;

/**
 * Shown after a user has completed several jobs — when they've experienced
 * real value — nudging them to invite teammates to the workspace.
 * Dismissed globally in localStorage to avoid repeat noise.
 */
export function PostJobInviteNudge({ className }: PostJobInviteNudgeProps) {
	const { activeOrganization } = useActiveOrganization();
	const { jobs } = useJobsList(undefined, 20);
	const { track } = useProductAnalytics();
	const [show, setShow] = useState(false);

	const completedJobCount = (jobs ?? []).filter(
		(j) => j.status === "COMPLETED",
	).length;

	const invitePath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/members`
		: "/app/settings";

	useEffect(() => {
		if (completedJobCount < JOB_COUNT_THRESHOLD) return;
		const dismissed = localStorage.getItem(STORAGE_KEY);
		if (dismissed === "true") return;
		// Show with a slight delay so it doesn't compete with other nudges
		const timer = setTimeout(() => {
			setShow(true);
			track({
				name: "invite_nudge_shown",
				props: {
					completed_job_count: completedJobCount,
					source: "post_job",
				},
			});
		}, 2000);
		return () => clearTimeout(timer);
	}, [completedJobCount, track]);

	const handleDismiss = () => {
		localStorage.setItem(STORAGE_KEY, "true");
		setShow(false);
	};

	if (!show) return null;

	return (
		<aside
			className={cn(
				"relative mt-4 rounded-lg border border-violet-500/20 bg-violet-50/50 p-4 dark:bg-violet-950/20",
				className,
			)}
			aria-label="Invite teammates prompt"
		>
			<button
				type="button"
				onClick={handleDismiss}
				className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
				aria-label="Dismiss"
			>
				<XIcon className="size-4" />
			</button>

			<div className="flex items-start gap-3 pr-6">
				<div className="flex size-8 flex-none items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
					<UsersIcon className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-sm">
						Bring your team on board
					</p>
					<p className="mt-0.5 text-muted-foreground text-sm">
						You've run {completedJobCount} jobs — imagine what your
						whole team could do. Invite colleagues to collaborate.
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<Link
							href={invitePath}
							onClick={() =>
								track({
									name: "invite_cta_clicked",
									props: {
										completed_job_count: completedJobCount,
										source: "post_job",
									},
								})
							}
						>
							<Button size="sm" className="gap-1.5">
								<UsersIcon className="size-3.5" />
								Invite teammates
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</aside>
	);
}
