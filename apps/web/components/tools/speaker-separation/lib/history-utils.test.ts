import { describe, expect, it } from "vitest";
import {
	filterJobsBySearch,
	filterJobsByStatus,
	formatDuration,
	formatProcessingDuration,
	getDuration,
	getFilename,
	getSpeakerCount,
	paginateJobs,
	type SpeakerSeparationJob,
	statusConfig,
} from "./history-utils";

// Helper to create mock jobs
function createMockJob(
	overrides: Partial<SpeakerSeparationJob> = {},
): SpeakerSeparationJob {
	return {
		id: "test-job-id",
		toolSlug: "speaker-separation",
		status: "COMPLETED",
		input: {},
		output: null,
		error: null,
		createdAt: new Date("2025-01-15T10:00:00Z"),
		completedAt: new Date("2025-01-15T10:05:00Z"),
		...overrides,
	};
}

describe("history-utils", () => {
	describe("getFilename", () => {
		it("returns filename from audioMetadata", () => {
			const job = createMockJob({
				audioMetadata: {
					filename: "from-metadata.mp3",
					mimeType: "audio/mp3",
				},
			});
			expect(getFilename(job)).toBe("from-metadata.mp3");
		});

		it("returns filename from input.audioMetadata as fallback", () => {
			const job = createMockJob({
				input: {
					audioMetadata: {
						filename: "from-input-metadata.wav",
						mimeType: "audio/wav",
					},
				},
			});
			expect(getFilename(job)).toBe("from-input-metadata.wav");
		});

		it("returns filename from input.audioFile as fallback", () => {
			const job = createMockJob({
				input: {
					audioFile: {
						filename: "from-audio-file.m4a",
						mimeType: "audio/m4a",
					},
				},
			});
			expect(getFilename(job)).toBe("from-audio-file.m4a");
		});

		it("returns Unknown when no filename source exists", () => {
			const job = createMockJob();
			expect(getFilename(job)).toBe("Unknown");
		});

		it("prioritizes audioMetadata over input sources", () => {
			const job = createMockJob({
				audioMetadata: {
					filename: "priority-file.mp3",
					mimeType: "audio/mp3",
				},
				input: {
					audioFile: {
						filename: "should-not-use.wav",
						mimeType: "audio/wav",
					},
					audioMetadata: {
						filename: "also-should-not-use.mp3",
						mimeType: "audio/mp3",
					},
				},
			});
			expect(getFilename(job)).toBe("priority-file.mp3");
		});
	});

	describe("getDuration", () => {
		it("returns duration from output", () => {
			const job = createMockJob({
				output: {
					duration: 120,
					speakerCount: 2,
					speakers: [],
					segments: [],
					transcript: "",
				},
			});
			expect(getDuration(job)).toBe(120);
		});

		it("returns duration from audioMetadata as fallback", () => {
			const job = createMockJob({
				audioMetadata: {
					filename: "test.mp3",
					mimeType: "audio/mp3",
					duration: 90,
				},
			});
			expect(getDuration(job)).toBe(90);
		});

		it("returns duration from input.audioMetadata as fallback", () => {
			const job = createMockJob({
				input: {
					audioMetadata: {
						filename: "test.mp3",
						mimeType: "audio/mp3",
						duration: 60,
					},
				},
			});
			expect(getDuration(job)).toBe(60);
		});

		it("returns duration from input.audioFile as fallback", () => {
			const job = createMockJob({
				input: {
					audioFile: {
						filename: "test.mp3",
						mimeType: "audio/mp3",
						duration: 45,
					},
				},
			});
			expect(getDuration(job)).toBe(45);
		});

		it("returns null when no duration source exists", () => {
			const job = createMockJob();
			expect(getDuration(job)).toBeNull();
		});

		it("prioritizes output duration over metadata", () => {
			const job = createMockJob({
				output: {
					duration: 100,
					speakerCount: 2,
					speakers: [],
					segments: [],
					transcript: "",
				},
				audioMetadata: {
					filename: "test.mp3",
					mimeType: "audio/mp3",
					duration: 50,
				},
			});
			expect(getDuration(job)).toBe(100);
		});
	});

	describe("getSpeakerCount", () => {
		it("returns speaker count from output", () => {
			const job = createMockJob({
				output: {
					duration: 100,
					speakerCount: 3,
					speakers: [],
					segments: [],
					transcript: "",
				},
			});
			expect(getSpeakerCount(job)).toBe(3);
		});

		it("returns null when no output exists", () => {
			const job = createMockJob();
			expect(getSpeakerCount(job)).toBeNull();
		});
	});

	describe("formatDuration", () => {
		it("formats seconds less than a minute", () => {
			expect(formatDuration(45)).toBe("0:45");
		});

		it("formats exactly one minute", () => {
			expect(formatDuration(60)).toBe("1:00");
		});

		it("formats minutes and seconds", () => {
			expect(formatDuration(125)).toBe("2:05");
		});

		it("formats hours, minutes, and seconds", () => {
			expect(formatDuration(3661)).toBe("1:01:01");
		});

		it("formats exactly one hour", () => {
			expect(formatDuration(3600)).toBe("1:00:00");
		});

		it("returns dash for null", () => {
			expect(formatDuration(null)).toBe("-");
		});

		it("returns dash for undefined", () => {
			expect(formatDuration(undefined)).toBe("-");
		});

		it("handles zero seconds", () => {
			expect(formatDuration(0)).toBe("0:00");
		});

		it("pads seconds with leading zero", () => {
			expect(formatDuration(5)).toBe("0:05");
		});

		it("pads minutes with leading zero when hours present", () => {
			expect(formatDuration(3665)).toBe("1:01:05");
		});
	});

	describe("formatProcessingDuration", () => {
		it("formats duration in seconds", () => {
			const start = new Date("2025-01-15T10:00:00Z");
			const end = new Date("2025-01-15T10:00:30Z");
			expect(formatProcessingDuration(start, end)).toBe("30s");
		});

		it("formats duration in minutes and seconds", () => {
			const start = new Date("2025-01-15T10:00:00Z");
			const end = new Date("2025-01-15T10:02:15Z");
			expect(formatProcessingDuration(start, end)).toBe("2m 15s");
		});

		it("returns dash when startedAt is null", () => {
			const end = new Date("2025-01-15T10:00:30Z");
			expect(formatProcessingDuration(null, end)).toBe("-");
		});

		it("returns dash when completedAt is null", () => {
			const start = new Date("2025-01-15T10:00:00Z");
			expect(formatProcessingDuration(start, null)).toBe("-");
		});

		it("returns dash when both are null", () => {
			expect(formatProcessingDuration(null, null)).toBe("-");
		});

		it("returns dash when both are undefined", () => {
			expect(formatProcessingDuration(undefined, undefined)).toBe("-");
		});

		it("handles exact minute boundaries", () => {
			const start = new Date("2025-01-15T10:00:00Z");
			const end = new Date("2025-01-15T10:01:00Z");
			expect(formatProcessingDuration(start, end)).toBe("1m 0s");
		});
	});

	describe("filterJobsBySearch", () => {
		const jobs: SpeakerSeparationJob[] = [
			createMockJob({
				id: "1",
				audioMetadata: {
					filename: "meeting-notes.mp3",
					mimeType: "audio/mp3",
				},
			}),
			createMockJob({
				id: "2",
				audioMetadata: {
					filename: "interview.wav",
					mimeType: "audio/wav",
				},
			}),
			createMockJob({
				id: "3",
				audioMetadata: {
					filename: "conference-call.m4a",
					mimeType: "audio/m4a",
				},
			}),
		];

		it("returns all jobs when search term is empty", () => {
			const result = filterJobsBySearch(jobs, "");
			expect(result).toHaveLength(3);
		});

		it("filters jobs by filename", () => {
			const result = filterJobsBySearch(jobs, "meeting");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("1");
		});

		it("is case insensitive", () => {
			const result = filterJobsBySearch(jobs, "MEETING");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("1");
		});

		it("returns empty array when no matches", () => {
			const result = filterJobsBySearch(jobs, "nonexistent");
			expect(result).toHaveLength(0);
		});

		it("matches partial filenames", () => {
			const result = filterJobsBySearch(jobs, "call");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("3");
		});
	});

	describe("filterJobsByStatus", () => {
		const jobs: SpeakerSeparationJob[] = [
			createMockJob({ id: "1", status: "COMPLETED" }),
			createMockJob({ id: "2", status: "PENDING" }),
			createMockJob({ id: "3", status: "FAILED" }),
			createMockJob({ id: "4", status: "COMPLETED" }),
		];

		it("returns all jobs when status is empty", () => {
			const result = filterJobsByStatus(jobs, "");
			expect(result).toHaveLength(4);
		});

		it("filters by COMPLETED status", () => {
			const result = filterJobsByStatus(jobs, "COMPLETED");
			expect(result).toHaveLength(2);
			expect(result.map((j) => j.id)).toEqual(["1", "4"]);
		});

		it("filters by PENDING status", () => {
			const result = filterJobsByStatus(jobs, "PENDING");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("2");
		});

		it("filters by FAILED status", () => {
			const result = filterJobsByStatus(jobs, "FAILED");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("3");
		});
	});

	describe("paginateJobs", () => {
		const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

		it("returns first page correctly", () => {
			const result = paginateJobs(items, 1, 3);
			expect(result).toEqual([1, 2, 3]);
		});

		it("returns second page correctly", () => {
			const result = paginateJobs(items, 2, 3);
			expect(result).toEqual([4, 5, 6]);
		});

		it("returns partial last page", () => {
			const result = paginateJobs(items, 4, 3);
			expect(result).toEqual([10]);
		});

		it("returns empty array for page beyond data", () => {
			const result = paginateJobs(items, 5, 3);
			expect(result).toEqual([]);
		});

		it("handles page size larger than data", () => {
			const result = paginateJobs(items, 1, 20);
			expect(result).toEqual(items);
		});

		it("handles empty array", () => {
			const result = paginateJobs([], 1, 10);
			expect(result).toEqual([]);
		});
	});

	describe("statusConfig", () => {
		it("has all job statuses configured", () => {
			expect(statusConfig.PENDING).toBeDefined();
			expect(statusConfig.PROCESSING).toBeDefined();
			expect(statusConfig.COMPLETED).toBeDefined();
			expect(statusConfig.FAILED).toBeDefined();
			expect(statusConfig.CANCELLED).toBeDefined();
		});

		it("PENDING has warning variant", () => {
			expect(statusConfig.PENDING.label).toBe("Pending");
			expect(statusConfig.PENDING.variant).toBe("warning");
		});

		it("COMPLETED has success variant", () => {
			expect(statusConfig.COMPLETED.label).toBe("Completed");
			expect(statusConfig.COMPLETED.variant).toBe("success");
		});

		it("FAILED has error variant", () => {
			expect(statusConfig.FAILED.label).toBe("Failed");
			expect(statusConfig.FAILED.variant).toBe("error");
		});
	});
});
