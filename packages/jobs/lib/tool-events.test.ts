import { describe, expect, it } from "vitest";
import { isKnownToolSlug, TOOL_JOB_EVENTS } from "./tool-events";

describe("TOOL_JOB_EVENTS", () => {
	it("covers every tool slug with a uniquely-named event", () => {
		const events = Object.values(TOOL_JOB_EVENTS);
		expect(new Set(events).size).toBe(events.length);
		for (const name of events) {
			expect(name).toMatch(/^jobs\/[a-z-]+\.requested$/);
		}
	});

	it("includes the eight currently-shipped tool slugs", () => {
		expect(Object.keys(TOOL_JOB_EVENTS).sort()).toEqual(
			[
				"contract-analyzer",
				"expense-categorizer",
				"feedback-analyzer",
				"gdpr-exporter",
				"invoice-processor",
				"meeting-summarizer",
				"news-analyzer",
				"speaker-separation",
			].sort(),
		);
	});
});

describe("isKnownToolSlug", () => {
	it("returns true for registered slugs", () => {
		expect(isKnownToolSlug("news-analyzer")).toBe(true);
		expect(isKnownToolSlug("gdpr-exporter")).toBe(true);
	});

	it("returns false for unknown slugs", () => {
		expect(isKnownToolSlug("unknown-tool")).toBe(false);
		expect(isKnownToolSlug("")).toBe(false);
	});
});
