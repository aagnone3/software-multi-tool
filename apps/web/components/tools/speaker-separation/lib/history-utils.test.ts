import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/utils", () => ({
	formatDuration: vi.fn((seconds: number) => `${seconds}s`),
}));

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

function makeJob(
	overrides: Partial<SpeakerSeparationJob> = {},
): SpeakerSeparationJob {
	return {
		id: "job-1",
		toolSlug: "speaker-separation",
		status: "COMPLETED",
		input: {},
		output: null,
		error: null,
		createdAt: new Date("2024-01-01"),
		completedAt: new Date("2024-01-01T00:01:00"),
		startedAt: new Date("2024-01-01T00:00:00"),
		...overrides,
	};
}

describe("getFilename", () => {
	it("returns audioMetadata filename first", () => {
		const job = makeJob({
			audioMetadata: { filename: "top.mp3", mimeType: "audio/mp3" },
		});
		expect(getFilename(job)).toBe("top.mp3");
	});

	it("falls back to input.audioFile.filename", () => {
		const job = makeJob({
			input: {
				audioFile: { filename: "audio.wav", mimeType: "audio/wav" },
			},
		});
		expect(getFilename(job)).toBe("audio.wav");
	});

	it("returns Unknown when no filename available", () => {
		expect(getFilename(makeJob())).toBe("Unknown");
	});
});

describe("getDuration", () => {
	it("returns output duration first", () => {
		const job = makeJob({
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

	it("returns null when no duration", () => {
		expect(getDuration(makeJob())).toBeNull();
	});
});

describe("getSpeakerCount", () => {
	it("returns speakerCount from output", () => {
		const job = makeJob({
			output: {
				duration: 60,
				speakerCount: 3,
				speakers: [],
				segments: [],
				transcript: "",
			},
		});
		expect(getSpeakerCount(job)).toBe(3);
	});

	it("returns null when no output", () => {
		expect(getSpeakerCount(makeJob())).toBeNull();
	});
});

describe("formatDuration", () => {
	it("returns dash for null", () => {
		expect(formatDuration(null)).toBe("-");
	});

	it("calls formatDurationBase for valid seconds", () => {
		expect(formatDuration(90)).toBe("90s");
	});
});

describe("formatProcessingDuration", () => {
	it("returns dash when startedAt is missing", () => {
		expect(formatProcessingDuration(null, new Date())).toBe("-");
	});

	it("returns dash when completedAt is missing", () => {
		expect(formatProcessingDuration(new Date(), null)).toBe("-");
	});

	it("formats seconds", () => {
		const start = new Date("2024-01-01T00:00:00");
		const end = new Date("2024-01-01T00:00:45");
		expect(formatProcessingDuration(start, end)).toBe("45s");
	});

	it("formats minutes and seconds", () => {
		const start = new Date("2024-01-01T00:00:00");
		const end = new Date("2024-01-01T00:01:30");
		expect(formatProcessingDuration(start, end)).toBe("1m 30s");
	});
});

describe("filterJobsBySearch", () => {
	const jobs = [
		makeJob({
			audioMetadata: { filename: "recording.mp3", mimeType: "audio/mp3" },
		}),
		makeJob({
			audioMetadata: { filename: "interview.wav", mimeType: "audio/wav" },
		}),
	];

	it("returns all for empty search", () => {
		expect(filterJobsBySearch(jobs, "")).toHaveLength(2);
	});

	it("filters by filename", () => {
		expect(filterJobsBySearch(jobs, "interview")).toHaveLength(1);
	});
});

describe("filterJobsByStatus", () => {
	const jobs = [
		makeJob({ status: "COMPLETED" }),
		makeJob({ status: "FAILED" }),
	];

	it("returns all for empty status", () => {
		expect(filterJobsByStatus(jobs, "")).toHaveLength(2);
	});

	it("filters by status", () => {
		expect(filterJobsByStatus(jobs, "FAILED")).toHaveLength(1);
	});
});

describe("paginateJobs", () => {
	it("returns correct page slice", () => {
		const items = [1, 2, 3, 4, 5];
		expect(paginateJobs(items, 2, 2)).toEqual([3, 4]);
	});
});

describe("statusConfig", () => {
	it("has entries for all statuses", () => {
		const statuses = [
			"PENDING",
			"PROCESSING",
			"COMPLETED",
			"FAILED",
			"CANCELLED",
		] as const;
		for (const status of statuses) {
			expect(statusConfig[status]).toBeDefined();
		}
	});
});
