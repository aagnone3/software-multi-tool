"use client";

import { useCallback, useEffect, useState } from "react";

export interface ToolCollection {
	id: string;
	name: string;
	description: string;
	toolSlugs: string[];
	createdAt: number;
	updatedAt: number;
}

const STORAGE_KEY = "tool-collections";

function loadCollections(): ToolCollection[] {
	if (typeof window === "undefined") {
		return [];
	}
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
	} catch {
		return [];
	}
}

function saveCollections(collections: ToolCollection[]): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

function generateId(): string {
	return `collection-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useToolCollections() {
	const [collections, setCollections] = useState<ToolCollection[]>([]);

	useEffect(() => {
		setCollections(loadCollections());
	}, []);

	const createCollection = useCallback(
		(name: string, description: string, toolSlugs: string[] = []) => {
			const now = Date.now();
			const newCollection: ToolCollection = {
				id: generateId(),
				name: name.trim(),
				description: description.trim(),
				toolSlugs,
				createdAt: now,
				updatedAt: now,
			};
			setCollections((prev) => {
				const updated = [...prev, newCollection];
				saveCollections(updated);
				return updated;
			});
			return newCollection;
		},
		[],
	);

	const updateCollection = useCallback(
		(
			id: string,
			updates: Partial<
				Pick<ToolCollection, "name" | "description" | "toolSlugs">
			>,
		) => {
			setCollections((prev) => {
				const updated = prev.map((c) =>
					c.id === id
						? { ...c, ...updates, updatedAt: Date.now() }
						: c,
				);
				saveCollections(updated);
				return updated;
			});
		},
		[],
	);

	const deleteCollection = useCallback((id: string) => {
		setCollections((prev) => {
			const updated = prev.filter((c) => c.id !== id);
			saveCollections(updated);
			return updated;
		});
	}, []);

	const addToolToCollection = useCallback(
		(collectionId: string, toolSlug: string) => {
			setCollections((prev) => {
				const updated = prev.map((c) =>
					c.id === collectionId && !c.toolSlugs.includes(toolSlug)
						? {
								...c,
								toolSlugs: [...c.toolSlugs, toolSlug],
								updatedAt: Date.now(),
							}
						: c,
				);
				saveCollections(updated);
				return updated;
			});
		},
		[],
	);

	const removeToolFromCollection = useCallback(
		(collectionId: string, toolSlug: string) => {
			setCollections((prev) => {
				const updated = prev.map((c) =>
					c.id === collectionId
						? {
								...c,
								toolSlugs: c.toolSlugs.filter(
									(s) => s !== toolSlug,
								),
								updatedAt: Date.now(),
							}
						: c,
				);
				saveCollections(updated);
				return updated;
			});
		},
		[],
	);

	const getCollectionsForTool = useCallback(
		(toolSlug: string) => {
			return collections.filter((c) => c.toolSlugs.includes(toolSlug));
		},
		[collections],
	);

	return {
		collections,
		createCollection,
		updateCollection,
		deleteCollection,
		addToolToCollection,
		removeToolFromCollection,
		getCollectionsForTool,
	};
}
