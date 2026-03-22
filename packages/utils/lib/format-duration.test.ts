import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
	it("formats 0 seconds as 0:00", () => {
		expect(formatDuration(0)).toBe("0:00");
	});

	it("formats seconds under 1 minute", () => {
		expect(formatDuration(5)).toBe("0:05");
		expect(formatDuration(59)).toBe("0:59");
	});

	it("formats exactly 1 minute", () => {
		expect(formatDuration(60)).toBe("1:00");
	});

	it("formats minutes and seconds", () => {
		expect(formatDuration(65)).toBe("1:05");
		expect(formatDuration(125)).toBe("2:05");
	});

	it("formats exactly 1 hour", () => {
		expect(formatDuration(3600)).toBe("1:00:00");
	});

	it("formats hours, minutes, and seconds", () => {
		expect(formatDuration(3661)).toBe("1:01:01");
	});

	it("pads minutes and seconds with leading zeros in HH:MM:SS", () => {
		expect(formatDuration(3601)).toBe("1:00:01");
		expect(formatDuration(3660)).toBe("1:01:00");
	});

	it("floors fractional seconds", () => {
		expect(formatDuration(65.9)).toBe("1:05");
	});
});
