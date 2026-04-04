"use client";

import { config } from "@repo/config";
import { useJobsList } from "@tools/hooks/use-job-polling";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

type JobStatus =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

/**
 * Invisible client component dropped into the saas layout that polls for
 * active jobs (PENDING / PROCESSING) and fires a sonner toast when any job
 * transitions to COMPLETED or FAILED.
 */
export function JobCompletionNotifier() {
	// Only poll when there are active jobs (avoid needless requests when idle)
	const { jobs } = useJobsList(undefined, 20);

	// Map of job id → last-known status to detect transitions
	const prevStatusRef = useRef<Map<string, JobStatus>>(new Map());

	useEffect(() => {
		if (!jobs.length) {
			return;
		}

		const prev = prevStatusRef.current;

		for (const job of jobs) {
			const jobStatus = job.status as JobStatus;
			const previousStatus = prev.get(job.id);

			// Detect completion transitions (only fire once per transition)
			if (
				previousStatus &&
				previousStatus !== jobStatus &&
				(jobStatus === "COMPLETED" || jobStatus === "FAILED")
			) {
				const toolName =
					config.tools.registry.find((t) => t.slug === job.toolSlug)
						?.name ?? job.toolSlug;

				if (jobStatus === "COMPLETED") {
					toast.success(`${toolName} job complete`, {
						description: "Your results are ready to view.",
						icon: (
							<CheckCircle2Icon className="size-4 text-green-500" />
						),
						action: {
							label: "View",
							onClick: () => {
								window.location.href = `/app/jobs/${job.id}`;
							},
						},
					});
				} else {
					toast.error(`${toolName} job failed`, {
						description:
							"Something went wrong. Try running it again.",
						icon: <XCircleIcon className="size-4 text-red-500" />,
						action: {
							label: "Retry",
							onClick: () => {
								window.location.href = `/app/tools/${job.toolSlug}`;
							},
						},
					});
				}
			}

			// Update tracked status
			prev.set(job.id, jobStatus);
		}

		// Clean up jobs we no longer see (keep map bounded)
		const liveIds = new Set(jobs.map((j) => j.id));
		for (const id of Array.from(prev.keys())) {
			if (!liveIds.has(id)) {
				prev.delete(id);
			}
		}
	}, [jobs]);

	// Invisible; just manages side-effects
	return null;
}
