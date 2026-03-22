"use client";

import { useEffect, useState } from "react";

/**
 * Debounces a value by the given delay (ms).
 * Returns the debounced value that only updates after the delay has passed
 * without the source value changing.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
	const [debounced, setDebounced] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(timer);
	}, [value, delayMs]);

	return debounced;
}
