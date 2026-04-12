"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "recently-viewed-tools";
const MAX_ITEMS = 5;

export interface RecentlyViewedTool {
	slug: string;
	viewedAt: string; // ISO timestamp
}

function loadFromStorage(): RecentlyViewedTool[] {
	if (typeof window === "undefined") { return []; }
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as RecentlyViewedTool[]) : [];
	} catch {
		return [];
	}
}

function saveToStorage(items: RecentlyViewedTool[]): void {
	if (typeof window === "undefined") { return; }
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch {
		// ignore quota errors
	}
}

export function useRecentlyViewedTools() {
	const [recentTools, setRecentTools] = useState<RecentlyViewedTool[]>([]);

	useEffect(() => {
		setRecentTools(loadFromStorage());
	}, []);

	const recordView = useCallback((slug: string) => {
		setRecentTools((prev) => {
			const filtered = prev.filter((t) => t.slug !== slug);
			const updated = [
				{ slug, viewedAt: new Date().toISOString() },
				...filtered,
			].slice(0, MAX_ITEMS);
			saveToStorage(updated);
			return updated;
		});
	}, []);

	return { recentTools, recordView };
}
