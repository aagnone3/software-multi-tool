"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useJobsList } from "@tools/hooks/use-job-polling";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	PartyPopperIcon,
	RocketIcon,
	SparklesIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "first-job-celebration-shown";

interface FirstJobCelebrationModalProps {
	className?: string;
}

/**
 * Shown once after a user completes their very first job.
 * Peak-satisfaction moment — ideal for upgrade nudge.
 */
export function FirstJobCelebrationModal({
	className: _className,
}: FirstJobCelebrationModalProps) {
	const { activeOrganization } = useActiveOrganization();
	const { jobs: allJobs } = useJobsList();
	const jobs = allJobs.filter((j) => j.status === "COMPLETED");
	const [open, setOpen] = useState(false);
	const { track } = useProductAnalytics();
	const { balance } = useCreditsBalance();

	const billingHref = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	useEffect(() => {
		// Only fire for the very first completed job
		if (jobs.length !== 1) {
			return;
		}
		const alreadyShown = localStorage.getItem(STORAGE_KEY);
		if (alreadyShown === "true") {
			return;
		}
		// Small delay so the job result is visible before the modal pops
		const timer = setTimeout(() => {
			setOpen(true);
			track({ name: "first_job_celebration_shown", props: {} });
		}, 1500);
		return () => clearTimeout(timer);
	}, [jobs.length]);

	const handleClose = (cta?: "upgrade" | "dismiss") => {
		localStorage.setItem(STORAGE_KEY, "true");
		if (cta) {
			track({
				name: "first_job_celebration_cta_clicked",
				props: { cta },
			});
		}
		setOpen(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				if (!v) {
					handleClose("dismiss");
				}
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="text-center items-center">
					<div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<PartyPopperIcon className="size-8 text-primary" />
					</div>
					<DialogTitle className="text-xl">
						You just saved real time! 🎉
					</DialogTitle>
					<DialogDescription className="mt-1 text-center">
						Your first AI job is complete. That's the kind of
						efficiency that pays for itself.
					</DialogDescription>
				</DialogHeader>

				<div className="my-2 grid grid-cols-3 gap-3 text-center">
					<div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
						<SparklesIcon className="size-5 text-primary" />
						<p className="text-xs font-medium">AI-powered</p>
						<p className="text-xs text-muted-foreground">
							analysis
						</p>
					</div>
					<div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
						<ZapIcon className="size-5 text-amber-500" />
						<p className="text-xs font-medium">Seconds</p>
						<p className="text-xs text-muted-foreground">
							not hours
						</p>
					</div>
					<div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
						<RocketIcon className="size-5 text-green-500" />
						<p className="text-xs font-medium">7 more tools</p>
						<p className="text-xs text-muted-foreground">
							to explore
						</p>
					</div>
				</div>

				<p className="text-center text-sm text-muted-foreground">
					Upgrade to Pro for 500 credits/month — run unlimited
					analyses without worrying about running out.
				</p>

				<DialogFooter className="flex-col gap-2 sm:flex-col">
					<Button
						asChild
						className="w-full"
						onClick={() => handleClose("upgrade")}
					>
						<Link href={billingHref}>
							<SparklesIcon className="mr-2 size-4" />
							Upgrade to Pro — $29/mo
						</Link>
					</Button>
					<Button
						variant="ghost"
						className="w-full"
						onClick={() => handleClose("dismiss")}
					>
						{balance?.remaining != null
							? `Keep exploring (${balance.remaining} credit${balance.remaining === 1 ? "" : "s"} left)`
							: "Keep exploring for now"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
