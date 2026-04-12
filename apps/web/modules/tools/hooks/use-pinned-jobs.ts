"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pinned-jobs";
const MAX_PINNED = 20;

interface PinnedJob {
	id: string;
	toolSlug: string;
	toolName: string;
	pinnedAt: string; // ISO string
	note?: string;
}

function loadPinnedJobs(): PinnedJob[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) { return []; }
		return JSON.parse(raw) as PinnedJob[];
	} catch {
		return [];
	}
}

function savePinnedJobs(jobs: PinnedJob[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
	} catch {
		// ignore
	}
}

export function usePinnedJobs() {
	const [pinnedJobs, setPinnedJobs] = useState<PinnedJob[]>([]);

	useEffect(() => {
		setPinnedJobs(loadPinnedJobs());
	}, []);

	const pinJob = useCallback((job: Omit<PinnedJob, "pinnedAt">) => {
		setPinnedJobs((prev) => {
			if (prev.some((p) => p.id === job.id)) { return prev; }
			const updated = [
				{ ...job, pinnedAt: new Date().toISOString() },
				...prev,
			].slice(0, MAX_PINNED);
			savePinnedJobs(updated);
			return updated;
		});
	}, []);

	const unpinJob = useCallback((jobId: string) => {
		setPinnedJobs((prev) => {
			const updated = prev.filter((p) => p.id !== jobId);
			savePinnedJobs(updated);
			return updated;
		});
	}, []);

	const isPinned = useCallback(
		(jobId: string) => pinnedJobs.some((p) => p.id === jobId),
		[pinnedJobs],
	);

	const updateNote = useCallback((jobId: string, note: string) => {
		setPinnedJobs((prev) => {
			const updated = prev.map((p) =>
				p.id === jobId ? { ...p, note } : p,
			);
			savePinnedJobs(updated);
			return updated;
		});
	}, []);

	return { pinnedJobs, pinJob, unpinJob, isPinned, updateNote };
}
