"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tool-ratings";

export interface ToolRatings {
	[toolSlug: string]: number; // 1-5
}

function readRatings(): ToolRatings {
	if (typeof window === "undefined") {
		return {};
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as ToolRatings) : {};
	} catch {
		return {};
	}
}

function writeRatings(ratings: ToolRatings): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
	} catch {
		// ignore storage errors
	}
}

export function useToolRatings() {
	const [ratings, setRatings] = useState<ToolRatings>({});

	useEffect(() => {
		setRatings(readRatings());
	}, []);

	const rateToolFn = useCallback((toolSlug: string, rating: number) => {
		setRatings((prev) => {
			const next = { ...prev, [toolSlug]: rating };
			writeRatings(next);
			return next;
		});
	}, []);

	const getRating = useCallback(
		(toolSlug: string): number | null => {
			return ratings[toolSlug] ?? null;
		},
		[ratings],
	);

	return { ratings, rateTool: rateToolFn, getRating };
}
