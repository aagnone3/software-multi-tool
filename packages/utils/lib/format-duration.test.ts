import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
	it("formats seconds only", () => {
		expect(formatDuration(0)).toBe("0:00");
		expect(formatDuration(5)).toBe("0:05");
		expect(formatDuration(59)).toBe("0:59");
	});

	it("formats minutes and seconds", () => {
		expect(formatDuration(60)).toBe("1:00");
		expect(formatDuration(65)).toBe("1:05");
		expect(formatDuration(125)).toBe("2:05");
		expect(formatDuration(599)).toBe("9:59");
		expect(formatDuration(3599)).toBe("59:59");
	});

	it("formats hours, minutes, and seconds", () => {
		expect(formatDuration(3600)).toBe("1:00:00");
		expect(formatDuration(3661)).toBe("1:01:01");
		expect(formatDuration(7325)).toBe("2:02:05");
		expect(formatDuration(86399)).toBe("23:59:59");
	});

	it("handles fractional seconds by flooring", () => {
		expect(formatDuration(65.9)).toBe("1:05");
		expect(formatDuration(65.1)).toBe("1:05");
	});
});
