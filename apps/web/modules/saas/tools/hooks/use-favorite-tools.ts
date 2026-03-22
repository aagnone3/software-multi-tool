"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "smt:favorite-tools";

function readFavorites(): Set<string> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return new Set();
		}
		return new Set(JSON.parse(raw) as string[]);
	} catch {
		return new Set();
	}
}

function writeFavorites(favorites: Set<string>) {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(Array.from(favorites)),
		);
	} catch {
		// storage unavailable — ignore silently
	}
}

export function useFavoriteTools() {
	const [favorites, setFavorites] = useState<Set<string>>(new Set());

	useEffect(() => {
		setFavorites(readFavorites());
	}, []);

	const toggleFavorite = useCallback((slug: string) => {
		setFavorites((prev) => {
			const next = new Set(prev);
			if (next.has(slug)) {
				next.delete(slug);
			} else {
				next.add(slug);
			}
			writeFavorites(next);
			return next;
		});
	}, []);

	const isFavorite = useCallback(
		(slug: string) => favorites.has(slug),
		[favorites],
	);

	return { favorites, isFavorite, toggleFavorite };
}
