import { describe, expect, it } from "vitest";
import {
	getActivePathFromUrlParam,
	getContentStructure,
	getLocalizedDocumentWithFallback,
	slugifyHeadline,
} from "./content";

describe("slugifyHeadline", () => {
	it("lowercases and hyphenates", () => {
		expect(slugifyHeadline("Hello World")).toBe("hello-world");
	});

	it("removes special characters", () => {
		expect(slugifyHeadline("What is it? Really!")).toBe(
			"what-is-it-really",
		);
	});

	it("trims and handles extra spaces", () => {
		expect(slugifyHeadline("  some title  ")).toBe("some-title");
	});
});

describe("getActivePathFromUrlParam", () => {
	it("returns string as-is", () => {
		expect(getActivePathFromUrlParam("docs/intro")).toBe("docs/intro");
	});

	it("joins array with slash", () => {
		expect(getActivePathFromUrlParam(["docs", "intro"])).toBe("docs/intro");
	});

	it("returns empty string for empty string input", () => {
		expect(getActivePathFromUrlParam("")).toBe("");
	});
});

describe("getLocalizedDocumentWithFallback", () => {
	const docs = [
		{ path: "docs/intro", locale: "en" },
		{ path: "docs/intro", locale: "fr" },
		{ path: "docs/other", locale: "en" },
	];

	it("returns preferred locale first", () => {
		const result = getLocalizedDocumentWithFallback(
			docs,
			"docs/intro",
			"fr",
		);
		expect(result.locale).toBe("fr");
	});

	it("falls back when locale not present for path", () => {
		const result = getLocalizedDocumentWithFallback(
			docs,
			"docs/other",
			"fr",
		);
		expect(result.locale).toBe("en");
	});

	it("returns undefined when path not found", () => {
		const result = getLocalizedDocumentWithFallback(
			docs,
			"docs/missing",
			"en",
		);
		expect(result).toBeUndefined();
	});
});

describe("getContentStructure", () => {
	const docs = [
		{ path: "intro", locale: "en", title: "Introduction" },
		{ path: "guide/start", locale: "en", title: "Getting Started" },
		{ path: "guide/advanced", locale: "en", title: "Advanced" },
	];

	it("builds a flat page entry", () => {
		const result = getContentStructure({ documents: docs, meta: [] });
		const intro = result.find((item) => item.path === "intro");
		expect(intro).toBeDefined();
		expect(intro?.label).toBe("Introduction");
		expect(intro?.isPage).toBe(true);
		expect(intro?.children).toHaveLength(0);
	});

	it("nests children under parent section", () => {
		const result = getContentStructure({ documents: docs, meta: [] });
		const guide = result.find((item) => item.path === "guide");
		expect(guide).toBeDefined();
		expect(guide?.children).toHaveLength(2);
		expect(guide?.children.map((c) => c.path)).toContain("guide/start");
		expect(guide?.children.map((c) => c.path)).toContain("guide/advanced");
	});

	it("uses meta label when available", () => {
		const result = getContentStructure({
			documents: docs,
			meta: [{ path: "", locale: "en", data: { intro: "Custom Label" } }],
		});
		const intro = result.find((item) => item.path === "intro");
		expect(intro?.label).toBe("Custom Label");
	});

	it("returns empty array for empty documents", () => {
		const result = getContentStructure({ documents: [], meta: [] });
		expect(result).toEqual([]);
	});
});
