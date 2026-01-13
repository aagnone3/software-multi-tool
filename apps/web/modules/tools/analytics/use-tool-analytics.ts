"use client";

import { useAnalytics } from "@analytics";
import { useCallback, useRef } from "react";
import type {
	ToolAnalyticsEvent,
	ToolEventProperties,
	ToolEventPropertiesMap,
} from "./types";

const SESSION_ID_KEY = "tool_analytics_session_id";

/**
 * Get or create a session ID for anonymous tracking
 * Uses localStorage for persistence across page loads
 */
function getOrCreateSessionId(): string {
	if (typeof window === "undefined") {
		return "";
	}

	let sessionId = localStorage.getItem(SESSION_ID_KEY);

	if (!sessionId) {
		sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
		localStorage.setItem(SESSION_ID_KEY, sessionId);
	}

	return sessionId;
}

interface UseToolAnalyticsOptions {
	/** Tool slug/name for all events */
	toolName: string;
	/** Whether the user is authenticated */
	isAuthenticated?: boolean;
}

interface UseToolAnalyticsReturn {
	/** Track a tool analytics event */
	trackToolEvent: <E extends ToolAnalyticsEvent>(
		event: E,
		properties?: Omit<ToolEventPropertiesMap[E], keyof ToolEventProperties>,
	) => void;
	/** Track tool page view */
	trackToolViewed: (properties?: { referrer?: string }) => void;
	/** Track upload started */
	trackUploadStarted: (properties?: {
		fileType?: string;
		fileSize?: number;
	}) => void;
	/** Track processing started */
	trackProcessingStarted: (properties: {
		jobId: string;
		fromCache?: boolean;
	}) => void;
	/** Track processing completed */
	trackProcessingCompleted: (properties: {
		jobId: string;
		processingDurationMs: number;
		fromCache?: boolean;
	}) => void;
	/** Track processing failed */
	trackProcessingFailed: (properties: {
		jobId: string;
		errorType?: string;
		processingDurationMs?: number;
	}) => void;
	/** Track result downloaded */
	trackResultDownloaded: (properties: {
		jobId: string;
		downloadFormat?: string;
	}) => void;
	/** Session ID for the current user */
	sessionId: string;
}

/**
 * Hook for tracking tool usage analytics
 *
 * Provides a convenient interface for tracking tool-specific events
 * with consistent properties attached to all events.
 *
 * @example
 * ```tsx
 * function NewsAnalyzer() {
 *   const { trackToolViewed, trackProcessingStarted, trackProcessingCompleted } =
 *     useToolAnalytics({ toolName: "news-analyzer" });
 *
 *   useEffect(() => {
 *     trackToolViewed();
 *   }, [trackToolViewed]);
 *
 *   const handleSubmit = async (input) => {
 *     const startTime = Date.now();
 *     trackProcessingStarted({ jobId });
 *     // ... process
 *     trackProcessingCompleted({
 *       jobId,
 *       processingDurationMs: Date.now() - startTime
 *     });
 *   };
 * }
 * ```
 */
export function useToolAnalytics({
	toolName,
	isAuthenticated = false,
}: UseToolAnalyticsOptions): UseToolAnalyticsReturn {
	const { trackEvent } = useAnalytics();
	const sessionIdRef = useRef<string>("");

	// Lazily initialize session ID on first access
	const getSessionId = useCallback((): string => {
		if (!sessionIdRef.current) {
			sessionIdRef.current = getOrCreateSessionId();
		}
		return sessionIdRef.current;
	}, []);

	// Get common properties for all events
	const getBaseProperties = useCallback((): ToolEventProperties => {
		return {
			tool_name: toolName,
			session_id: getSessionId(),
			is_authenticated: isAuthenticated,
		};
	}, [toolName, isAuthenticated, getSessionId]);

	// Generic event tracker
	const trackToolEvent = useCallback(
		<E extends ToolAnalyticsEvent>(
			event: E,
			properties?: Omit<
				ToolEventPropertiesMap[E],
				keyof ToolEventProperties
			>,
		) => {
			trackEvent(event, {
				...getBaseProperties(),
				...properties,
			});
		},
		[trackEvent, getBaseProperties],
	);

	// Specific event trackers for better DX
	const trackToolViewed = useCallback(
		(properties?: { referrer?: string }) => {
			trackToolEvent("tool_viewed", {
				page_path:
					typeof window !== "undefined"
						? window.location.pathname
						: undefined,
				referrer: properties?.referrer,
			});
		},
		[trackToolEvent],
	);

	const trackUploadStarted = useCallback(
		(properties?: { fileType?: string; fileSize?: number }) => {
			trackToolEvent("tool_upload_started", {
				file_type: properties?.fileType,
				file_size: properties?.fileSize,
			});
		},
		[trackToolEvent],
	);

	const trackProcessingStarted = useCallback(
		(properties: { jobId: string; fromCache?: boolean }) => {
			trackToolEvent("tool_processing_started", {
				job_id: properties.jobId,
				from_cache: properties.fromCache,
			});
		},
		[trackToolEvent],
	);

	const trackProcessingCompleted = useCallback(
		(properties: {
			jobId: string;
			processingDurationMs: number;
			fromCache?: boolean;
		}) => {
			trackToolEvent("tool_processing_completed", {
				job_id: properties.jobId,
				processing_duration_ms: properties.processingDurationMs,
				from_cache: properties.fromCache,
			});
		},
		[trackToolEvent],
	);

	const trackProcessingFailed = useCallback(
		(properties: {
			jobId: string;
			errorType?: string;
			processingDurationMs?: number;
		}) => {
			trackToolEvent("tool_processing_failed", {
				job_id: properties.jobId,
				error_type: properties.errorType,
				processing_duration_ms: properties.processingDurationMs,
			});
		},
		[trackToolEvent],
	);

	const trackResultDownloaded = useCallback(
		(properties: { jobId: string; downloadFormat?: string }) => {
			trackToolEvent("tool_result_downloaded", {
				job_id: properties.jobId,
				download_format: properties.downloadFormat,
			});
		},
		[trackToolEvent],
	);

	return {
		trackToolEvent,
		trackToolViewed,
		trackUploadStarted,
		trackProcessingStarted,
		trackProcessingCompleted,
		trackProcessingFailed,
		trackResultDownloaded,
		sessionId: getSessionId(),
	};
}
