import type { SpeakerSeparationOutput } from "@repo/api/modules/speaker-separation/types";
import { formatDuration as formatDurationBase } from "@repo/utils";

export type JobStatus =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

/**
 * Audio metadata stored with the job.
 */
export interface AudioMetadata {
	filename: string;
	mimeType: string;
	duration?: number;
	size?: number;
}

/**
 * Speaker separation job record from the API.
 */
export interface SpeakerSeparationJob {
	id: string;
	toolSlug: string;
	status: JobStatus;
	input: {
		audioFile?: {
			filename: string;
			mimeType: string;
			duration?: number;
		};
		audioFileUrl?: string;
		audioMetadata?: AudioMetadata;
	};
	output: SpeakerSeparationOutput | null;
	error: string | null;
	createdAt: Date;
	completedAt: Date | null;
	startedAt?: Date | null;
	audioFileUrl?: string | null;
	audioMetadata?: AudioMetadata | null;
	user?: {
		id: string;
		name: string | null;
		email: string;
	} | null;
}

/**
 * Extracts the filename from job input or metadata.
 */
export function getFilename(job: SpeakerSeparationJob): string {
	return (
		job.audioMetadata?.filename ??
		job.input.audioMetadata?.filename ??
		job.input.audioFile?.filename ??
		"Unknown"
	);
}

/**
 * Extracts duration from job output or metadata.
 */
export function getDuration(job: SpeakerSeparationJob): number | null {
	return (
		job.output?.duration ??
		job.audioMetadata?.duration ??
		job.input.audioMetadata?.duration ??
		job.input.audioFile?.duration ??
		null
	);
}

/**
 * Gets speaker count from job output.
 */
export function getSpeakerCount(job: SpeakerSeparationJob): number | null {
	return job.output?.speakerCount ?? null;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS.
 * Returns "-" for null/undefined values.
 */
export function formatDuration(seconds: number | null | undefined): string {
	if (seconds == null) return "-";
	return formatDurationBase(seconds);
}

/**
 * Format processing duration between start and completion.
 */
export function formatProcessingDuration(
	startedAt: Date | null | undefined,
	completedAt: Date | null | undefined,
): string {
	if (!startedAt || !completedAt) return "-";
	const durationMs =
		new Date(completedAt).getTime() - new Date(startedAt).getTime();
	const seconds = Math.floor(durationMs / 1000);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Filters jobs by search term (filename).
 */
export function filterJobsBySearch(
	jobs: SpeakerSeparationJob[],
	searchTerm: string,
): SpeakerSeparationJob[] {
	if (!searchTerm) return jobs;

	const search = searchTerm.toLowerCase();
	return jobs.filter((job) => {
		const filename = getFilename(job).toLowerCase();
		return filename.includes(search);
	});
}

/**
 * Filters jobs by status.
 */
export function filterJobsByStatus(
	jobs: SpeakerSeparationJob[],
	status: JobStatus | "",
): SpeakerSeparationJob[] {
	if (!status) return jobs;
	return jobs.filter((job) => job.status === status);
}

/**
 * Paginates an array.
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
 * Status configuration for display.
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
