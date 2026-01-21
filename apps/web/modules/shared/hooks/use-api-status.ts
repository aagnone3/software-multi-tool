"use client";

import { isPreviewEnvironment } from "@repo/utils/lib/api-url";
import { type ApiErrorCode, classifyError } from "@shared/lib/api-error-utils";
import { useQuery } from "@tanstack/react-query";

interface ApiStatusResult {
	isAvailable: boolean;
	isChecking: boolean;
	errorCode: ApiErrorCode | undefined;
	isPreview: boolean;
}

/**
 * Hook to check API availability status.
 * Used to determine if the API is ready in preview environments.
 */
export function useApiStatus(): ApiStatusResult {
	const isPreview = isPreviewEnvironment();

	const query = useQuery({
		queryKey: ["api-health"],
		queryFn: async () => {
			// Simple health check to the proxy
			const response = await fetch("/api/proxy/health", {
				method: "GET",
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw { status: response.status, ...data };
			}

			return { available: true };
		},
		// Only run in preview environments
		enabled: isPreview,
		// Retry more aggressively in preview (API may be initializing)
		retry: isPreview ? 3 : 1,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		// Refetch periodically to detect when API becomes available
		refetchInterval: isPreview ? 30000 : false,
		// Stale time is long since we refetch on interval
		staleTime: 25000,
	});

	const errorCode = query.error ? classifyError(query.error) : undefined;
	const isApiUnavailable =
		errorCode === "API_NOT_CONFIGURED" || errorCode === "API_UNREACHABLE";

	return {
		isAvailable: isPreview ? !query.isError && !isApiUnavailable : true,
		isChecking: query.isLoading,
		errorCode,
		isPreview,
	};
}
