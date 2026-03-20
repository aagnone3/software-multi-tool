import { describe, expect, it } from "vitest";
import { cn, ENTITY_COLORS } from "./index";

describe("cn", () => {
	it("merges class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar");
	});

	it("deduplicates conflicting Tailwind classes (twMerge)", () => {
		expect(cn("p-4", "p-8")).toBe("p-8");
	});

	it("handles conditional classes", () => {
		expect(cn("base", false && "skipped", "appended")).toBe(
			"base appended",
		);
	});

	it("handles undefined and null gracefully", () => {
		expect(cn(undefined, null, "valid")).toBe("valid");
	});

	it("returns empty string for no arguments", () => {
		expect(cn()).toBe("");
	});
});

describe("ENTITY_COLORS", () => {
	it("has at least 4 entries", () => {
		expect(ENTITY_COLORS.length).toBeGreaterThanOrEqual(4);
	});

	it("each entry has bg, text, bar, and border properties", () => {
		for (const scheme of ENTITY_COLORS) {
			expect(typeof scheme.bg).toBe("string");
			expect(typeof scheme.text).toBe("string");
			expect(typeof scheme.bar).toBe("string");
			expect(typeof scheme.border).toBe("string");
		}
	});

	it("all entries are non-empty strings", () => {
		for (const scheme of ENTITY_COLORS) {
			expect(scheme.bg.length).toBeGreaterThan(0);
			expect(scheme.text.length).toBeGreaterThan(0);
			expect(scheme.bar.length).toBeGreaterThan(0);
			expect(scheme.border.length).toBeGreaterThan(0);
		}
	});
});
