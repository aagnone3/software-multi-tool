"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "job-tags";

type JobTagsMap = Record<string, string[]>; // jobId → string[]

function loadTags(): JobTagsMap {
	if (typeof window === "undefined") {
		return {};
	}
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
	} catch {
		return {};
	}
}

function saveTags(map: JobTagsMap) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function useJobTags(jobId: string) {
	const [allTags, setAllTags] = useState<JobTagsMap>({});

	useEffect(() => {
		setAllTags(loadTags());
	}, []);

	const tags: string[] = allTags[jobId] ?? [];

	const addTag = useCallback(
		(tag: string) => {
			const trimmed = tag.trim();
			if (!trimmed) {
				return;
			}
			setAllTags((prev) => {
				const existing = prev[jobId] ?? [];
				if (existing.includes(trimmed)) {
					return prev;
				}
				const next = { ...prev, [jobId]: [...existing, trimmed] };
				saveTags(next);
				return next;
			});
		},
		[jobId],
	);

	const removeTag = useCallback(
		(tag: string) => {
			setAllTags((prev) => {
				const existing = prev[jobId] ?? [];
				const next = {
					...prev,
					[jobId]: existing.filter((t) => t !== tag),
				};
				saveTags(next);
				return next;
			});
		},
		[jobId],
	);

	return { tags, addTag, removeTag };
}
