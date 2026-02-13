import type {
	ArticleMetadata,
	NewsAnalysisOutput,
} from "../news-analyzer-results";

export type JobStatus =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

export interface NewsAnalysisRecord {
	id: string;
	title: string | null;
	sourceUrl: string | null;
	sourceText: string | null;
	analysis: NewsAnalysisOutput & { articleMetadata?: ArticleMetadata };
	createdAt: Date;
}

export interface NewsAnalyzerJob {
	id: string;
	toolSlug: string;
	status: JobStatus;
	input: {
		articleUrl?: string;
		articleText?: string;
	};
	output: (NewsAnalysisOutput & { articleMetadata?: ArticleMetadata }) | null;
	error: string | null;
	createdAt: Date;
	completedAt: Date | null;
	startedAt?: Date | null;
	newsAnalysis?: NewsAnalysisRecord | null;
}

/**
 * Removes common site name suffixes from article titles
 * e.g., "Article Title | CNN" -> "Article Title"
 * e.g., "Article Title - The New York Times" -> "Article Title"
 */
export function cleanArticleTitle(title: string): string {
	// Common separators used by news sites to append their name
	const separators = [" | ", " - ", " – ", " — ", " · "];

	for (const sep of separators) {
		const lastIndex = title.lastIndexOf(sep);
		if (lastIndex > 0) {
			// Only remove if the suffix is relatively short (likely a site name)
			const suffix = title.slice(lastIndex + sep.length);
			if (suffix.length < 40) {
				return title.slice(0, lastIndex).trim();
			}
		}
	}

	return title;
}

/**
 * Extracts a display title from the job input
 * For URLs: shows hostname + truncated path
 * For text: shows first 50 characters
 */
export function getArticleTitle(input: NewsAnalyzerJob["input"]): string {
	if (input.articleUrl) {
		try {
			const url = new URL(input.articleUrl);
			const path = url.pathname.slice(0, 30);
			const suffix = url.pathname.length > 30 ? "..." : "";
			return url.hostname + path + suffix;
		} catch {
			const maxLen = 50;
			const suffix = input.articleUrl.length > maxLen ? "..." : "";
			return input.articleUrl.slice(0, maxLen) + suffix;
		}
	}
	if (input.articleText) {
		const maxLen = 50;
		const suffix = input.articleText.length > maxLen ? "..." : "";
		return input.articleText.slice(0, maxLen) + suffix;
	}
	return "Unknown";
}

/**
 * Formats duration between start and completion times
 */
export function formatDuration(
	startedAt: Date | null | undefined,
	completedAt: Date | null | undefined,
): string {
	if (!startedAt || !completedAt) {
		return "-";
	}
	const durationMs =
		new Date(completedAt).getTime() - new Date(startedAt).getTime();
	const seconds = Math.floor(durationMs / 1000);
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Filters jobs by search term
 */
export function filterJobsBySearch(
	jobs: NewsAnalyzerJob[],
	searchTerm: string,
): NewsAnalyzerJob[] {
	if (!searchTerm) {
		return jobs;
	}

	const search = searchTerm.toLowerCase();
	return jobs.filter((job) => {
		const title = getArticleTitle(job.input).toLowerCase();
		const url = job.input.articleUrl?.toLowerCase() ?? "";
		const text = job.input.articleText?.toLowerCase() ?? "";
		return (
			title.includes(search) ||
			url.includes(search) ||
			text.includes(search)
		);
	});
}

/**
 * Filters jobs by status
 */
export function filterJobsByStatus(
	jobs: NewsAnalyzerJob[],
	status: JobStatus | "",
): NewsAnalyzerJob[] {
	if (!status) {
		return jobs;
	}
	return jobs.filter((job) => job.status === status);
}

/**
 * Paginates an array
 */
export function paginateJobs<T>(
	items: T[],
	currentPage: number,
	itemsPerPage: number,
): T[] {
	const start = (currentPage - 1) * itemsPerPage;
	const end = start + itemsPerPage;
	return items.slice(start, end);
}

/**
 * Status configuration for display
 */
export const statusConfig: Record<
	JobStatus,
	{
		label: string;
		variant: "default" | "success" | "error" | "warning";
	}
> = {
	PENDING: { label: "Pending", variant: "warning" },
	PROCESSING: { label: "Processing", variant: "default" },
	COMPLETED: { label: "Completed", variant: "success" },
	FAILED: { label: "Failed", variant: "error" },
	CANCELLED: { label: "Cancelled", variant: "warning" },
};
