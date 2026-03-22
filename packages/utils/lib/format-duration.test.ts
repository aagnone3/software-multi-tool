import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
	it("formats zero seconds", () => {
		expect(formatDuration(0)).toBe("0:00");
	});

	it("formats seconds only (< 1 minute)", () => {
		expect(formatDuration(45)).toBe("0:45");
	});

	it("formats minutes and seconds", () => {
		expect(formatDuration(65)).toBe("1:05");
	});

	it("pads seconds with leading zero", () => {
		expect(formatDuration(62)).toBe("1:02");
	});

	it("formats exactly one hour", () => {
		expect(formatDuration(3600)).toBe("1:00:00");
	});

	it("formats hours, minutes, and seconds", () => {
		expect(formatDuration(3661)).toBe("1:01:01");
	});

	it("pads minutes and seconds with leading zeros in HH:MM:SS format", () => {
		expect(formatDuration(7200 + 5 * 60 + 3)).toBe("2:05:03");
	});

	it("formats 59 minutes 59 seconds without hours", () => {
		expect(formatDuration(3599)).toBe("59:59");
	});

	it("handles fractional seconds by flooring", () => {
		expect(formatDuration(65.9)).toBe("1:05");
	});
});
